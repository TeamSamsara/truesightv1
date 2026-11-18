/**
 * rosterModel.js — canonical Roster data model
 * @version 1.0.0
 *
 * Defines the authoritative shape of a TrueSight Roster.
 * A Roster is a named team unit with assigned players and staff,
 * a game context, a schedule, and a Discord webhook channel.
 *
 * Member details (player/staff records) live in a Firestore
 * subcollection: rosters/{rosterId}/members
 * The roster document itself only tracks IDs for efficient reads.
 *
 * Events for a roster live in: rosters/{rosterId}/events
 *
 * Target path: src/shared/data/rosterModel.js
 */

//#region Constants

/**
 * Supported games. League of Legends is the only active game.
 * Extend this as new titles are added to the organization.
 */
export const ROSTER_GAME = {
  LOL: 'lol', // League of Legends
  // VALORANT: 'valorant',  — future
  // ROCKET_LEAGUE: 'rl',   — future
};

export const ROSTER_GAME_LABEL = {
  [ROSTER_GAME.LOL]: 'League of Legends',
};

/**
 * Roster status — lifecycle state of the roster.
 */
export const ROSTER_STATUS = {
  ACTIVE:   'active',   // Currently active and visible in operations
  ARCHIVED: 'archived', // Inactive, hidden from default views
};

/**
 * Preset roster colors for multi-roster calendar views.
 * Each roster gets one color that identifies it across the platform.
 */
export const ROSTER_COLOR = {
  BLUE:   '#5b9cf6',
  GREEN:  '#4ade80',
  PURPLE: '#a78bfa',
  GOLD:   '#f5c842',
  PINK:   '#f472b6',
  ORANGE: '#f59c42',
  TEAL:   '#2dd4bf',
  RED:    '#f25c5c',
};

//#endregion

//#region Member Status

/**
 * Player status within a roster.
 * Defines the player's role on the team — not their platform account type.
 */
export const ROSTER_MEMBER_STATUS = {
  STARTER:  'starter',  // Starting lineup
  SUB:      'sub',      // Substitute player
  TRIAL:    'trial',    // On trial, not yet confirmed
  INACTIVE: 'inactive', // Temporarily inactive, still on roster
};

export const ROSTER_MEMBER_STATUS_LABEL = {
  [ROSTER_MEMBER_STATUS.STARTER]:  'Starter',
  [ROSTER_MEMBER_STATUS.SUB]:      'Sub',
  [ROSTER_MEMBER_STATUS.TRIAL]:    'Trial',
  [ROSTER_MEMBER_STATUS.INACTIVE]: 'Inactive',
};

//#endregion

//#region Factory

/**
 * Creates a canonical Roster object.
 * Use this factory in services when constructing rosters
 * before writing to Firestore.
 *
 * @param {object} options
 * @returns {object}
 */
export function createRoster(options = {}) {
  return {

    // ── Core Identity ──────────────────────────────────

    /** Firestore document ID. Null until persisted. @type {string | null} */
    id: options.id ?? null,

    /** Roster display name. @type {string} */
    name: options.name ?? '',

    /** Game this roster competes in. @type {string} ROSTER_GAME */
    game: options.game ?? ROSTER_GAME.LOL,

    /**
     * Roster accent color — hex string from ROSTER_COLOR presets.
     * Used for calendar chips, roster cards, and multi-roster views.
     * @type {string}
     */
    color: options.color ?? ROSTER_COLOR.BLUE,

    /** Roster lifecycle status. @type {string} ROSTER_STATUS */
    status: options.status ?? ROSTER_STATUS.ACTIVE,

    // ── Manager ────────────────────────────────────────

    /**
     * User ID of the assigned roster manager.
     * Only one manager per roster. Set in Step 1 of roster creation.
     * @type {string | null}
     */
    managerId: options.managerId ?? null,

    /**
     * Denormalized manager display name for roster card without a join.
     * @type {string | null}
     */
    managerName: options.managerName ?? null,

    // ── Member IDs ─────────────────────────────────────
    // Full member records live in rosters/{rosterId}/members subcollection.
    // These arrays are for efficient ID lookups and count displays.

    /**
     * Array of userIds for assigned players.
     * @type {string[]}
     */
    playerIds: options.playerIds ?? [],

    /**
     * Array of userIds for assigned staff (excluding manager).
     * @type {string[]}
     */
    staffIds: options.staffIds ?? [],

    // ── Denormalized Stats ─────────────────────────────
    // Kept in sync by the service on member/event writes.
    // Used by roster cards and overview widgets without extra reads.

    /**
     * Current active player count.
     * @type {number}
     */
    playerCount: options.playerCount ?? 0,

    /**
     * Current active staff count (including manager).
     * @type {number}
     */
    staffCount: options.staffCount ?? 0,

    /**
     * Total scheduled event count for the current split.
     * @type {number}
     */
    eventCount: options.eventCount ?? 0,

    /**
     * Start time of the next upcoming event.
     * Null if no upcoming events scheduled.
     * @type {object | Date | null}  Firestore timestamp or JS Date
     */
    nextEventAt: options.nextEventAt ?? null,

    // ── Webhook ────────────────────────────────────────

    /**
     * Discord webhook URL for this roster's channel.
     * Null if not configured — set in Step 4 of roster creation.
     * Fires on: event created, cancelled, status changed,
     * availability request opened, confirmation request sent.
     * @type {string | null}
     */
    webhookUrl: options.webhookUrl ?? null,

    // ── Flags ──────────────────────────────────────────

    /**
     * Whether this roster has any unresolved flag items.
     * Set by the service when issues are detected
     * (e.g. missing availability, unconfirmed sessions).
     * Drives the flag indicator on the roster card.
     * @type {boolean}
     */
    hasFlaggedItems: options.hasFlaggedItems ?? false,

    // ── Meta ───────────────────────────────────────────

    /** Who created this roster. @type {{ userId: string, displayName: string } | null} */
    createdBy: options.createdBy ?? null,

    /** Firestore server timestamp — set on creation. @type {object | null} */
    createdAt: options.createdAt ?? null,

    /** Firestore server timestamp — updated on every write. @type {object | null} */
    updatedAt: options.updatedAt ?? null,

  };
}

//#endregion

//#region Helpers

/**
 * Returns the total member count for a roster (players + staff).
 * @param {object} roster
 * @returns {number}
 */
export function getRosterMemberCount(roster) {
  return (roster.playerCount ?? 0) + (roster.staffCount ?? 0);
}

/**
 * Returns true if the roster has no players assigned.
 * @param {object} roster
 * @returns {boolean}
 */
export function isRosterEmpty(roster) {
  return (roster.playerIds?.length ?? 0) === 0;
}

/**
 * Returns true if the roster is missing a webhook URL.
 * @param {object} roster
 * @returns {boolean}
 */
export function rosterHasWebhook(roster) {
  return !!roster.webhookUrl;
}

//#endregion