/**
 * eventModel.js — canonical Event data model
 * @version 1.0.0
 *
 * Defines the authoritative shape of a TrueSight Event.
 * An Event is any scheduled activity on a roster calendar —
 * scrimmages, official matches, VOD reviews, or practice sessions.
 *
 * This model is the source of truth. Services read/write this shape
 * to Firestore. Features map this shape to component contracts
 * (e.g. CalendarEvent, FeedItem) before passing to UI components.
 *
 * "Session" is reserved exclusively for auth (login/logout tracking).
 * Never use "session" in a scheduling context — use "event".
 *
 * Target path: src/shared/data/eventModel.js
 */

//#region Event Type

/**
 * Event type — defines what kind of scheduled activity this is.
 * Drives form fields, display labels, calendar styling, and filter chips.
 */
export const EVENT_TYPE = {
  SCRIM:    'scrim',    // Practice match against another team
  MATCH:    'match',    // Official competitive match
  REVIEW:   'review',   // VOD review session
  PRACTICE: 'practice', // Internal practice
  OTHER:    'other',    // Catch-all for future types
};

/**
 * Human-readable labels for each event type.
 * Used by filter chips, type pills, and form selectors.
 */
export const EVENT_TYPE_LABEL = {
  [EVENT_TYPE.SCRIM]:    'Scrim',
  [EVENT_TYPE.MATCH]:    'Match',
  [EVENT_TYPE.REVIEW]:   'VOD Review',
  [EVENT_TYPE.PRACTICE]: 'Practice',
  [EVENT_TYPE.OTHER]:    'Other',
};

/**
 * Event types that require opponent fields.
 * REVIEW, PRACTICE, and OTHER have no opponent.
 */
export const EVENT_TYPES_WITH_OPPONENT = [
  EVENT_TYPE.SCRIM,
  EVENT_TYPE.MATCH,
];

//#endregion

//#region Event Status

/**
 * Event status — lifecycle state of the event.
 */
export const EVENT_STATUS = {
  UPCOMING:  'upcoming',   // Scheduled, not yet started
  CONFIRMED: 'confirmed',  // All players confirmed
  PENDING:   'pending',    // Waiting on confirmations
  CANCELLED: 'cancelled',  // Cancelled by staff
  COMPLETED: 'completed',  // Event has passed
};

/**
 * Human-readable labels for each event status.
 */
export const EVENT_STATUS_LABEL = {
  [EVENT_STATUS.UPCOMING]:  'Upcoming',
  [EVENT_STATUS.CONFIRMED]: 'Confirmed',
  [EVENT_STATUS.PENDING]:   'Pending',
  [EVENT_STATUS.CANCELLED]: 'Cancelled',
  [EVENT_STATUS.COMPLETED]: 'Completed',
};

//#endregion

//#region Match Format

/**
 * Match format — applies to EVENT_TYPE.MATCH only.
 * Defines the series length for official matches.
 */
export const MATCH_FORMAT = {
  BO1: 'bo1',
  BO3: 'bo3',
  BO5: 'bo5',
};

/**
 * Human-readable labels for match formats.
 */
export const MATCH_FORMAT_LABEL = {
  [MATCH_FORMAT.BO1]: 'Best of 1',
  [MATCH_FORMAT.BO3]: 'Best of 3',
  [MATCH_FORMAT.BO5]: 'Best of 5',
};

//#endregion

//#region Scrim Block

/**
 * Scrim block format — applies to EVENT_TYPE.SCRIM only.
 * Defines how many games are played in the scrim block.
 */
export const SCRIM_BLOCK = {
  BLOCK_1: 'block_1',
  BLOCK_2: 'block_2',
  BLOCK_3: 'block_3',
  BLOCK_4: 'block_4',
  BLOCK_5: 'block_5',
};

/**
 * Human-readable labels for scrim block formats.
 */
export const SCRIM_BLOCK_LABEL = {
  [SCRIM_BLOCK.BLOCK_1]: 'Block of 1',
  [SCRIM_BLOCK.BLOCK_2]: 'Block of 2',
  [SCRIM_BLOCK.BLOCK_3]: 'Block of 3',
  [SCRIM_BLOCK.BLOCK_4]: 'Block of 4',
  [SCRIM_BLOCK.BLOCK_5]: 'Block of 5',
};

//#endregion

//#region Draft Type (LoL-specific)

/**
 * Draft type — League of Legends specific.
 * Defines the drafting ruleset for the event.
 *
 * FEARLESS: Champions picked in a match are banned for subsequent
 *           matches in the same block. Forces wider champion pools.
 * STANDARD: No champion restrictions between matches.
 *
 * Only applies to EVENT_TYPE.SCRIM and EVENT_TYPE.MATCH.
 * Will not apply to non-LoL rosters when other games are added.
 */
export const DRAFT_TYPE = {
  FEARLESS: 'fearless',
  STANDARD: 'standard',
};

export const DRAFT_TYPE_LABEL = {
  [DRAFT_TYPE.FEARLESS]: 'Fearless Draft',
  [DRAFT_TYPE.STANDARD]: 'Standard Draft',
};

//#endregion

//#region Right of First Selection (LoL-specific)

/**
 * RFS holder — which side holds the Right of First Selection.
 * The RFS holder chooses between picking first or second.
 * The team that picks second then selects their side (blue or red).
 *
 * Only meaningful when rfsEnabled is true on the event.
 * Applies to EVENT_TYPE.SCRIM and EVENT_TYPE.MATCH only.
 */
export const RFS_HOLDER = {
  US:   'us',   // Our team holds RFS
  THEM: 'them', // Opponent holds RFS
};

export const RFS_HOLDER_LABEL = {
  [RFS_HOLDER.US]:   'Us',
  [RFS_HOLDER.THEM]: 'Them',
};

//#endregion

//#region Confirmation

/**
 * Per-player confirmation status for an event.
 */
export const EVENT_CONFIRMATION = {
  CONFIRMED: 'confirmed',
  DECLINED:  'declined',
};

//#endregion

//#region Factory

/**
 * Creates a canonical Event object.
 * Use this factory when constructing events in services before
 * writing to Firestore. Never construct event objects ad-hoc.
 *
 * @param {object} options
 * @returns {object}
 */
export function createEvent(options = {}) {
  return {

    // ── Core Identity ──────────────────────────────────

    /** Firestore document ID. Null until persisted. @type {string | null} */
    id: options.id ?? null,

    /** Event type. @type {string} EVENT_TYPE */
    type: options.type ?? EVENT_TYPE.SCRIM,

    /** Display name for the event. @type {string} */
    title: options.title ?? '',

    /** Roster this event belongs to. @type {string | null} */
    rosterId: options.rosterId ?? null,

    /** Denormalized roster name for display without a join. @type {string | null} */
    rosterName: options.rosterName ?? null,

    /** Roster color for multi-roster calendar views. Hex string. @type {string | null} */
    rosterColor: options.rosterColor ?? null,

    // ── Scheduling ─────────────────────────────────────

    /** Event start time. @type {object | Date | null} */
    startsAt: options.startsAt ?? null,

    /** Event end time. @type {object | Date | null} */
    endsAt: options.endsAt ?? null,

    /** Optional meet/lobby time before start. @type {object | Date | null} */
    meetAt: options.meetAt ?? null,

    /** IANA timezone string e.g. 'America/New_York'. @type {string | null} */
    timezone: options.timezone ?? null,

    // ── Opponent ───────────────────────────────────────
    // Only populated for SCRIM and MATCH. Always null for other types.

    /** Opponent team name. @type {string | null} */
    opponent: options.opponent ?? null,

    /** Opponent op.gg or profile URL. @type {string | null} */
    opponentUrl: options.opponentUrl ?? null,

    // ── Format ─────────────────────────────────────────
    // matchFormat applies to MATCH only.
    // scrimBlock applies to SCRIM only.
    // Both are null for all other types.

    /** Match series format. @type {string | null} MATCH_FORMAT */
    matchFormat: options.matchFormat ?? null,

    /** Scrim block size. @type {string | null} SCRIM_BLOCK */
    scrimBlock: options.scrimBlock ?? null,

    // ── Draft (LoL-specific) ───────────────────────────
    // Only applies to SCRIM and MATCH on LoL rosters.

    /** Draft ruleset. @type {string | null} DRAFT_TYPE */
    draftType: options.draftType ?? null,

    // ── Right of First Selection (LoL-specific) ────────
    // Only applies to SCRIM and MATCH on LoL rosters.

    /** Whether RFS is in effect for this event. @type {boolean} */
    rfsEnabled: options.rfsEnabled ?? false,

    /** Which team holds RFS. Null when rfsEnabled is false. @type {string | null} RFS_HOLDER */
    rfsHolder: options.rfsEnabled ? (options.rfsHolder ?? null) : null,

    // ── Status ─────────────────────────────────────────

    /** Lifecycle status. @type {string} EVENT_STATUS */
    status: options.status ?? EVENT_STATUS.UPCOMING,

    // ── Confirmations ──────────────────────────────────

    /**
     * Per-player confirmation map.
     * Keys are userIds, values are EVENT_CONFIRMATION strings.
     * @type {object}
     */
    confirmations: options.confirmations ?? {},

    // ── Meta ───────────────────────────────────────────

    /** Optional staff notes. @type {string | null} */
    notes: options.notes ?? null,

    /** Who created this event. @type {{ userId: string, displayName: string } | null} */
    createdBy: options.createdBy ?? null,

    /** Firestore server timestamp — set on write. @type {object | null} */
    createdAt: options.createdAt ?? null,

    /** Firestore server timestamp — updated on every write. @type {object | null} */
    updatedAt: options.updatedAt ?? null,

  };
}

//#endregion

//#region Helpers

/**
 * Returns true if this event type uses opponent fields.
 * @param {string} type - EVENT_TYPE
 * @returns {boolean}
 */
export function eventHasOpponent(type) {
  return EVENT_TYPES_WITH_OPPONENT.includes(type);
}

/**
 * Returns the confirmation count for an event.
 * @param {object} event
 * @returns {{ confirmed: number, declined: number, total: number }}
 */
export function getEventConfirmationCounts(event) {
  const entries   = Object.values(event.confirmations ?? {});
  const confirmed = entries.filter(v => v === EVENT_CONFIRMATION.CONFIRMED).length;
  const declined  = entries.filter(v => v === EVENT_CONFIRMATION.DECLINED).length;
  return { confirmed, declined, total: entries.length };
}

/**
 * Returns true if the event start time has passed.
 * @param {object} event
 * @returns {boolean}
 */
export function isEventPast(event) {
  if (!event.startsAt) return false;
  const start = event.startsAt?.toDate ? event.startsAt.toDate() : new Date(event.startsAt);
  return start < new Date();
}

//#endregion