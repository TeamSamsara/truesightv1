/**
 * statuses.js
 * @version 1.0.0
 *
 * Prospect pipeline statuses and valid transition map.
 * No logic — static values only.
 * Target path: src/constants/statuses.js
 */

//#region Statuses

export const STATUS = {
  APPLICANT:   'applicant',
  PROSPECT:    'prospect',
  SHORTLISTED: 'shortlisted',
  IN_PROCESS:  'in_process',
  EVALUATED:   'evaluated',
  DECIDED:     'decided',
};

/**
 * Display labels for statuses.
 */
export const STATUS_LABEL = {
  [STATUS.APPLICANT]:   'Applicant',
  [STATUS.PROSPECT]:    'Prospect',
  [STATUS.SHORTLISTED]: 'Shortlisted',
  [STATUS.IN_PROCESS]:  'In Process',
  [STATUS.EVALUATED]:   'Evaluated',
  [STATUS.DECIDED]:     'Decided',
};

/**
 * Ordered list of statuses for display purposes.
 */
export const STATUS_ORDER = [
  STATUS.APPLICANT,
  STATUS.PROSPECT,
  STATUS.SHORTLISTED,
  STATUS.IN_PROCESS,
  STATUS.EVALUATED,
  STATUS.DECIDED,
];

//#endregion

//#region Valid Transitions

/**
 * Maps each status to the statuses it can transition to.
 * Based on the platform design document transition rules.
 *
 * applicant   → prospect
 * prospect    → shortlisted, decided
 * shortlisted → in_process, decided
 * in_process  → evaluated (semi-auto), shortlisted
 * evaluated   → decided
 * decided     → no forward transitions (requires approval to re-enter)
 */
export const VALID_TRANSITIONS = {
  [STATUS.APPLICANT]:   [STATUS.PROSPECT],
  [STATUS.PROSPECT]:    [STATUS.SHORTLISTED, STATUS.DECIDED],
  [STATUS.SHORTLISTED]: [STATUS.IN_PROCESS, STATUS.DECIDED],
  [STATUS.IN_PROCESS]:  [STATUS.EVALUATED, STATUS.SHORTLISTED],
  [STATUS.EVALUATED]:   [STATUS.DECIDED],
  [STATUS.DECIDED]:     [],
};

//#endregion

//#region Transition Helpers

/**
 * Returns true if a transition from one status to another is valid.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
export function isValidTransition(fromStatus, toStatus) {
  const allowed = VALID_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

/**
 * Returns the list of valid next statuses from a given status.
 * @param {string} fromStatus
 * @returns {string[]}
 */
export function getValidNextStatuses(fromStatus) {
  return VALID_TRANSITIONS[fromStatus] || [];
}

/**
 * Returns true if the transition is semi-automatic.
 * Only in_process → evaluated qualifies.
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
export function isSemiAutoTransition(fromStatus, toStatus) {
  return fromStatus === STATUS.IN_PROCESS && toStatus === STATUS.EVALUATED;
}

//#endregion

//#region Source Constants

export const PROSPECT_SOURCE = {
  LEAGUE:    'league',
  MANUAL:    'manual',
  APPLICANT: 'applicant',
};

//#endregion