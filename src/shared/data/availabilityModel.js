/**
 * availabilityModel.js — canonical Availability data models
 * @version 1.0.0
 *
 * Defines all availability-related shapes in TrueSight.
 * There are two distinct availability concepts:
 *
 * 1. STANDING AVAILABILITY — a user's own availability entries.
 *    Free-form, not tied to any request. Set by players and staff
 *    from their profile or schedule. Used by the system to auto-check
 *    coverage when events are created.
 *    Firestore path: users/{uid}/availability/{entryId}
 *
 * 2. AVAILABILITY REQUESTS — manager sends a request to all roster
 *    players for a specific date range with a submission deadline.
 *    Players respond with a submission (their timesheet for that period).
 *    Firestore path: rosters/{rosterId}/availabilityRequests/{requestId}
 *    Submissions:    rosters/{rosterId}/availabilityRequests/{requestId}/submissions/{uid}
 *    Change requests: rosters/{rosterId}/availabilityRequests/{requestId}/changeRequests/{uid}
 *
 * Target path: src/shared/data/availabilityModel.js
 */

//#region Constants

/**
 * Availability entry mode — how the user set their availability.
 * Single date covers one specific day.
 * Date range covers a span of days, with per-day slots.
 */
export const AVAILABILITY_MODE = {
  SINGLE: 'single',
  RANGE:  'range',
};

/**
 * Availability request status — lifecycle of a manager's request.
 */
export const REQUEST_STATUS = {
  OPEN:   'open',   // Active — accepting submissions, deadline not passed
  CLOSED: 'closed', // Deadline passed — no more submissions accepted
};

/**
 * Submission status — state of a player's response to a request.
 */
export const SUBMISSION_STATUS = {
  SUBMITTED:      'submitted',       // Player has submitted their timesheet
  PARTIAL:        'partial',         // Submitted but has a pending change request
  NOT_SUBMITTED:  'not_submitted',   // No response yet
};

/**
 * Change request status — state of a player's change request.
 */
export const CHANGE_REQUEST_STATUS = {
  PENDING:  'pending',  // Submitted, awaiting manager review
  ACCEPTED: 'accepted', // Manager accepted the change
  REJECTED: 'rejected', // Manager rejected the change
};

/**
 * Timesheet scope — the date range scope for availability requests.
 * Drives the scope selector buttons in the timesheet view.
 */
export const TIMESHEET_SCOPE = {
  WEEK:   'week',   // 7-day window
  MONTH:  'month',  // Current calendar month
  SEASON: 'season', // Full competitive split
  CUSTOM: 'custom', // Free date range input
};

export const TIMESHEET_SCOPE_LABEL = {
  [TIMESHEET_SCOPE.WEEK]:   'Week',
  [TIMESHEET_SCOPE.MONTH]:  'Month',
  [TIMESHEET_SCOPE.SEASON]: 'Season',
  [TIMESHEET_SCOPE.CUSTOM]: 'Custom',
};

//#endregion

//#region Slot Factory

/**
 * Creates a single time slot within a day.
 * A day can have multiple slots (e.g. 10am-12pm and 6pm-10pm).
 *
 * Times are stored as strings in 'HH:mm' 24-hour format
 * for simple comparison and display without timezone complexity.
 * Timezone context comes from the user's profile setting.
 *
 * @param {object} options
 * @returns {object}
 */
export function createSlot(options = {}) {
  return {
    /**
     * Start time in 'HH:mm' format e.g. '18:00'
     * @type {string | null}
     */
    from: options.from ?? null,

    /**
     * End time in 'HH:mm' format e.g. '22:00'
     * @type {string | null}
     */
    until: options.until ?? null,
  };
}

//#endregion

//#region Standing Availability Entry Factory

/**
 * Creates a standing availability entry — a user's own availability
 * saved independently of any request.
 *
 * For SINGLE mode: one date, slots[] applies to that date.
 * For RANGE mode: fromDate to toDate, days[] holds per-day slot arrays.
 *
 * @param {object} options
 * @returns {object}
 */
export function createAvailabilityEntry(options = {}) {
  return {

    /** Firestore document ID. Null until persisted. @type {string | null} */
    id: options.id ?? null,

    /** Entry mode — single date or date range. @type {string} AVAILABILITY_MODE */
    mode: options.mode ?? AVAILABILITY_MODE.SINGLE,

    // ── Single date mode ───────────────────────────────

    /**
     * The date for single mode. ISO string 'YYYY-MM-DD'.
     * Null for range mode.
     * @type {string | null}
     */
    date: options.date ?? null,

    /**
     * Time slots for single mode.
     * @type {object[]} createSlot[]
     */
    slots: options.slots ?? [],

    // ── Date range mode ────────────────────────────────

    /**
     * Range start date. ISO string 'YYYY-MM-DD'.
     * Null for single mode.
     * @type {string | null}
     */
    fromDate: options.fromDate ?? null,

    /**
     * Range end date. ISO string 'YYYY-MM-DD'.
     * Null for single mode.
     * @type {string | null}
     */
    toDate: options.toDate ?? null,

    /**
     * Per-day slot arrays for range mode.
     * Keys are ISO date strings 'YYYY-MM-DD'.
     * Empty array for a day means the user is off that day.
     * @type {object}  { [date: string]: createSlot[] }
     */
    days: options.days ?? {},

    // ── Meta ───────────────────────────────────────────

    /** Firestore server timestamp — set on creation. @type {object | null} */
    createdAt: options.createdAt ?? null,

    /** Firestore server timestamp — updated on every write. @type {object | null} */
    updatedAt: options.updatedAt ?? null,

  };
}

//#endregion

//#region Availability Request Factory

/**
 * Creates an availability request sent by a manager to all roster players.
 * Stored at: rosters/{rosterId}/availabilityRequests/{requestId}
 *
 * @param {object} options
 * @returns {object}
 */
export function createAvailabilityRequest(options = {}) {
  return {

    /** Firestore document ID. Null until persisted. @type {string | null} */
    id: options.id ?? null,

    /** Roster this request belongs to. @type {string | null} */
    rosterId: options.rosterId ?? null,

    /** Request status. @type {string} REQUEST_STATUS */
    status: options.status ?? REQUEST_STATUS.OPEN,

    /** Timesheet scope. @type {string} TIMESHEET_SCOPE */
    scope: options.scope ?? TIMESHEET_SCOPE.WEEK,

    /**
     * Date range start. ISO string 'YYYY-MM-DD'.
     * @type {string | null}
     */
    fromDate: options.fromDate ?? null,

    /**
     * Date range end. ISO string 'YYYY-MM-DD'.
     * @type {string | null}
     */
    toDate: options.toDate ?? null,

    /**
     * Submission deadline. Firestore timestamp.
     * After this time, status flips to CLOSED automatically.
     * @type {object | null}
     */
    deadline: options.deadline ?? null,

    /**
     * UserIds of players who have submitted.
     * Used for quick count display without reading subcollection.
     * @type {string[]}
     */
    submittedBy: options.submittedBy ?? [],

    /**
     * UserIds of players with pending change requests.
     * @type {string[]}
     */
    changeRequestedBy: options.changeRequestedBy ?? [],

    /** Who sent this request. @type {{ userId: string, displayName: string } | null} */
    createdBy: options.createdBy ?? null,

    /** Firestore server timestamp. @type {object | null} */
    createdAt: options.createdAt ?? null,

  };
}

//#endregion

//#region Submission Factory

/**
 * Creates an availability submission — a player's timesheet response
 * to an availability request.
 * Stored at: rosters/{rosterId}/availabilityRequests/{requestId}/submissions/{uid}
 *
 * @param {object} options
 * @returns {object}
 */
export function createAvailabilitySubmission(options = {}) {
  return {

    /** The player's userId — also the Firestore document ID. @type {string | null} */
    userId: options.userId ?? null,

    /** Submission status. @type {string} SUBMISSION_STATUS */
    status: options.status ?? SUBMISSION_STATUS.NOT_SUBMITTED,

    /**
     * Per-day slot arrays for the requested date range.
     * Keys are ISO date strings 'YYYY-MM-DD'.
     * Empty array for a day means the player is off/unavailable.
     * @type {object}  { [date: string]: createSlot[] }
     */
    days: options.days ?? {},

    /** Firestore server timestamp — when player submitted. @type {object | null} */
    submittedAt: options.submittedAt ?? null,

    /** Firestore server timestamp — updated on change request resolution. @type {object | null} */
    updatedAt: options.updatedAt ?? null,

  };
}

//#endregion

//#region Change Request Factory

/**
 * Creates a change request — a player's request to amend
 * their submitted availability for a specific day.
 * Stored at: rosters/{rosterId}/availabilityRequests/{requestId}/changeRequests/{uid}
 *
 * @param {object} options
 * @returns {object}
 */
export function createChangeRequest(options = {}) {
  return {

    /** The player's userId — also the Firestore document ID. @type {string | null} */
    userId: options.userId ?? null,

    /** Denormalized player name for manager view. @type {string | null} */
    displayName: options.displayName ?? null,

    /**
     * The date being changed. ISO string 'YYYY-MM-DD'.
     * @type {string | null}
     */
    date: options.date ?? null,

    /**
     * The player's updated time slots for that day.
     * @type {object[]} createSlot[]
     */
    newSlots: options.newSlots ?? [],

    /**
     * Reason for the change — required from the player.
     * @type {string}
     */
    reason: options.reason ?? '',

    /** Change request status. @type {string} CHANGE_REQUEST_STATUS */
    status: options.status ?? CHANGE_REQUEST_STATUS.PENDING,

    /** Firestore server timestamp. @type {object | null} */
    createdAt: options.createdAt ?? null,

    /** Firestore server timestamp — updated on manager resolution. @type {object | null} */
    resolvedAt: options.resolvedAt ?? null,

    /** Who resolved this request. @type {{ userId: string, displayName: string } | null} */
    resolvedBy: options.resolvedBy ?? null,

  };
}

//#endregion

//#region Helpers

/**
 * Returns true if a slot is valid (from < until, both set).
 * @param {object} slot
 * @returns {boolean}
 */
export function isSlotValid(slot) {
  if (!slot.from || !slot.until) return false;
  return slot.from < slot.until;
}

/**
 * Returns true if any slots exist for a given date in a days map.
 * @param {object} days  - { [date: string]: slot[] }
 * @param {string} date  - 'YYYY-MM-DD'
 * @returns {boolean}
 */
export function hasAvailabilityForDate(days, date) {
  return (days[date]?.length ?? 0) > 0;
}

/**
 * Returns the submission count for an availability request.
 * @param {object} request - AvailabilityRequest
 * @param {number} total   - total players on the roster
 * @returns {{ submitted: number, total: number, rate: number }}
 */
export function getSubmissionRate(request, total) {
  const submitted = request.submittedBy?.length ?? 0;
  const rate      = total > 0 ? Math.round((submitted / total) * 100) : 0;
  return { submitted, total, rate };
}

/**
 * Returns true if the availability request deadline has passed.
 * @param {object} request - AvailabilityRequest
 * @returns {boolean}
 */
export function isRequestExpired(request) {
  if (!request.deadline) return false;
  const deadline = request.deadline?.toDate
    ? request.deadline.toDate()
    : new Date(request.deadline);
  return deadline < new Date();
}

//#endregion