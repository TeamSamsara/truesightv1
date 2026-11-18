/**
 * memberModel.js — canonical Roster Member data model
 * @version 1.0.0
 *
 * Defines the shape of a member record within a roster.
 * Member records live in the Firestore subcollection:
 *   rosters/{rosterId}/members/{userId}
 *
 * Both players and staff are members — MEMBER_TYPE distinguishes them.
 * Player-specific fields (role, riotId, rosterStatus) are null for staff.
 * Staff-specific fields (rosterRole) are null for players.
 *
 * Platform-level user data (email, active, isFirstLogin etc.) lives in
 * the users collection. Member records only carry what's needed
 * for roster display and operations — no duplication beyond display names.
 *
 * Target path: src/shared/data/memberModel.js
 */

//#region Constants

/**
 * Member type — distinguishes players from staff within a roster.
 * Not the same as USER_TYPE from roles.js — this is roster-context only.
 */
export const MEMBER_TYPE = {
  PLAYER: 'player',
  STAFF:  'staff',
};

/**
 * Player role — League of Legends specific.
 * The position a player occupies on the roster.
 */
export const PLAYER_ROLE = {
  TOP:     'top',
  JUNGLE:  'jungle',
  MID:     'mid',
  ADC:     'adc',
  SUPPORT: 'support',
};

export const PLAYER_ROLE_LABEL = {
  [PLAYER_ROLE.TOP]:     'Top',
  [PLAYER_ROLE.JUNGLE]:  'Jungle',
  [PLAYER_ROLE.MID]:     'Mid',
  [PLAYER_ROLE.ADC]:     'ADC',
  [PLAYER_ROLE.SUPPORT]: 'Support',
};

/**
 * Player role colors — used for role pills and avatar borders.
 * Matches design tokens from the platform inventory.
 */
export const PLAYER_ROLE_COLOR = {
  [PLAYER_ROLE.TOP]:     '#f59c42',
  [PLAYER_ROLE.JUNGLE]:  '#4ade80',
  [PLAYER_ROLE.MID]:     '#a78bfa',
  [PLAYER_ROLE.ADC]:     '#f472b6',
  [PLAYER_ROLE.SUPPORT]: '#5b9cf6',
};

/**
 * Staff roster role — the role a staff member holds within this specific roster.
 * Distinct from their platform-level USER_ROLE — a staff member could be
 * Head Coach on one roster and Coach on another.
 */
export const STAFF_ROSTER_ROLE = {
  HEAD_COACH: 'head_coach',
  COACH:      'coach',
  MANAGER:    'manager',
  GENERAL_MANAGER: 'general_manager',
  ANALYST:    'analyst',
};

export const STAFF_ROSTER_ROLE_LABEL = {
  [STAFF_ROSTER_ROLE.HEAD_COACH]: 'Head Coach',
  [STAFF_ROSTER_ROLE.COACH]:      'Coach',
  [STAFF_ROSTER_ROLE.MANAGER]:    'Manager',
  [STAFF_ROSTER_ROLE.GENERAL_MANAGER]: 'General Manager',
  [STAFF_ROSTER_ROLE.ANALYST]:    'Analyst',
};

/**
 * Staff roster role colors — used for role badges in Members view.
 */
export const STAFF_ROSTER_ROLE_COLOR = {
  [STAFF_ROSTER_ROLE.HEAD_COACH]: '#f5c842',
  [STAFF_ROSTER_ROLE.COACH]:      '#f5c842',
  [STAFF_ROSTER_ROLE.MANAGER]:    '#5b9cf6',
  [STAFF_ROSTER_ROLE.GENERAL_MANAGER]: '#95EC5D',
  [STAFF_ROSTER_ROLE.ANALYST]:    '#a78bfa',
};

//#endregion

//#region Factory

/**
 * Creates a canonical Member record for a roster subcollection.
 * Use this factory in services when assigning members to a roster.
 *
 * @param {object} options
 * @returns {object}
 */
export function createMember(options = {}) {
  const isPlayer = options.type === MEMBER_TYPE.PLAYER;
  const isStaff  = options.type === MEMBER_TYPE.STAFF;

  return {

    // ── Identity ───────────────────────────────────────

    /**
     * Firebase Auth UID — matches the users collection document ID.
     * Also used as the Firestore document ID for this member record.
     * @type {string}
     */
    userId: options.userId ?? null,

    /**
     * Member type — player or staff.
     * @type {string} MEMBER_TYPE
     */
    type: options.type ?? MEMBER_TYPE.PLAYER,

    /**
     * Denormalized display name from the users collection.
     * Kept in sync by the service on profile updates.
     * @type {string | null}
     */
    displayName: options.displayName ?? null,

    /**
     * Denormalized TrueSight ID for display in member rows.
     * @type {string | null}
     */
    trueSightId: options.trueSightId ?? null,

    /**
     * Denormalized Discord handle for staff rows.
     * @type {string | null}
     */
    discordHandle: options.discordHandle ?? null,

    // ── Player Fields ──────────────────────────────────
    // Only populated when type === MEMBER_TYPE.PLAYER.
    // Always null for staff members.

    /**
     * Riot Games ID e.g. "TroubledBoy#NA1"
     * LoL-specific — null for non-LoL rosters when added.
     * @type {string | null}
     */
    riotId: isPlayer ? (options.riotId ?? null) : null,

    /**
     * Player's position on the roster.
     * @type {string | null} PLAYER_ROLE
     */
    playerRole: isPlayer ? (options.playerRole ?? null) : null,

    /**
     * Player's status on this roster — starter, sub, trial, or inactive.
     * Imported from ROSTER_MEMBER_STATUS in rosterModel.js.
     * @type {string | null}
     */
    rosterStatus: isPlayer ? (options.rosterStatus ?? null) : null,

    // ── Staff Fields ───────────────────────────────────
    // Only populated when type === MEMBER_TYPE.STAFF.
    // Always null for players.

    /**
     * Staff member's role within this specific roster.
     * May differ from their platform-level USER_ROLE.
     * @type {string | null} STAFF_ROSTER_ROLE
     */
    rosterRole: isStaff ? (options.rosterRole ?? null) : null,

    // ── Meta ───────────────────────────────────────────

    /**
     * When this member was assigned to the roster.
     * @type {object | null} Firestore timestamp
     */
    joinedAt: options.joinedAt ?? null,

    /**
     * Who assigned this member to the roster.
     * @type {{ userId: string, displayName: string } | null}
     */
    assignedBy: options.assignedBy ?? null,

  };
}

//#endregion

//#region Helpers

/**
 * Returns true if the member is a player.
 * @param {object} member
 * @returns {boolean}
 */
export function memberIsPlayer(member) {
  return member.type === MEMBER_TYPE.PLAYER;
}

/**
 * Returns true if the member is a staff member.
 * @param {object} member
 * @returns {boolean}
 */
export function memberIsStaff(member) {
  return member.type === MEMBER_TYPE.STAFF;
}

/**
 * Returns the role color for a member.
 * Players → PLAYER_ROLE_COLOR, Staff → STAFF_ROSTER_ROLE_COLOR.
 * @param {object} member
 * @returns {string} hex color
 */
export function getMemberRoleColor(member) {
  if (memberIsPlayer(member)) {
    return PLAYER_ROLE_COLOR[member.playerRole] ?? '#8fa3b1';
  }
  return STAFF_ROSTER_ROLE_COLOR[member.rosterRole] ?? '#8fa3b1';
}

/**
 * Returns the initials for a member's avatar circle.
 * Uses displayName — falls back to trueSightId — falls back to '??'.
 * @param {object} member
 * @returns {string}
 */
export function getMemberInitials(member) {
  const name = member.displayName || member.trueSightId || '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return '??';
}

//#endregion