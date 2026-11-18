/**
 * availabilityState.js — availability component state
 * @version 1.0.0
 *
 * Owns all state for the availability input component.
 * Tracks mode, date selection, per-day slot data,
 * validation errors, and submission state.
 *
 * The component is data-agnostic — it does not know about
 * rosters, requests, or Firestore. Consuming features pass
 * in existing entries and receive back AvailabilityEntry
 * objects via the onSave callback.
 *
 * Target path: src/shared/components/time/availability/availabilityState.js
 */

//#region Imports

import {
  AVAILABILITY_MODE,
  createSlot,
}                        from '../../../data/availabilityModel.js';

import {
  toISODate,
  getISODatesInRange,
}                        from '../../../../utils/dateHelpers.js';

//#endregion

//#region State

export const availabilityState = {

  /**
   * Current input mode — single date or date range.
   * @type {string} AVAILABILITY_MODE
   */
  mode: AVAILABILITY_MODE.SINGLE,

  /**
   * Selected date for single mode. ISO string 'YYYY-MM-DD'.
   * Null until user picks a date.
   * @type {string | null}
   */
  date: null,

  /**
   * Range start date for range mode. ISO string 'YYYY-MM-DD'.
   * @type {string | null}
   */
  fromDate: null,

  /**
   * Range end date for range mode. ISO string 'YYYY-MM-DD'.
   * @type {string | null}
   */
  toDate: null,

  /**
   * Per-day slot arrays.
   * Keys are ISO date strings 'YYYY-MM-DD'.
   * Values are arrays of { from: string, until: string } slot objects.
   * Empty array for a day means the user is off/unavailable that day.
   * @type {object}  { [date: string]: slot[] }
   */
  days: {},

  /**
   * Whether the component is in read-only mode.
   * Inputs are disabled — used for history view.
   * @type {boolean}
   */
  readOnly: false,

  /**
   * Deadline timestamp for display.
   * Null if no deadline applies.
   * @type {Date | null}
   */
  deadline: null,

  /**
   * Validation error message. Null if no error.
   * @type {string | null}
   */
  error: null,

  /**
   * Whether the component is currently submitting.
   * Disables all inputs and buttons while true.
   * @type {boolean}
   */
  isSubmitting: false,

  /**
   * Whether the component has been initialized.
   * @type {boolean}
   */
  isReady: false,

};

//#endregion

//#region State Helpers — Init / Reset

/**
 * Resets availability state to defaults.
 * Called at the start of Availability.init().
 */
export function resetAvailabilityState() {
  availabilityState.mode         = AVAILABILITY_MODE.SINGLE;
  availabilityState.date         = null;
  availabilityState.fromDate     = null;
  availabilityState.toDate       = null;
  availabilityState.days         = {};
  availabilityState.readOnly     = false;
  availabilityState.deadline     = null;
  availabilityState.error        = null;
  availabilityState.isSubmitting = false;
  availabilityState.isReady      = false;
}

/**
 * Hydrates state from an existing AvailabilityEntry.
 * Used when editing an existing entry or pre-filling for a request.
 * @param {object} entry - AvailabilityEntry from availabilityModel
 */
export function hydrateFromEntry(entry) {
  if (!entry) return;

  availabilityState.mode = entry.mode ?? AVAILABILITY_MODE.SINGLE;

  if (entry.mode === AVAILABILITY_MODE.SINGLE) {
    availabilityState.date = entry.date ?? null;
    availabilityState.days = entry.date
      ? { [entry.date]: entry.slots ?? [] }
      : {};
  }

  if (entry.mode === AVAILABILITY_MODE.RANGE) {
    availabilityState.fromDate = entry.fromDate ?? null;
    availabilityState.toDate   = entry.toDate   ?? null;
    availabilityState.days     = entry.days      ?? {};
  }
}

//#endregion

//#region State Helpers — Mode

/**
 * Sets the input mode and resets date/slot state.
 * Switching modes clears all entered data.
 * @param {string} mode - AVAILABILITY_MODE
 */
export function setAvailabilityMode(mode) {
  availabilityState.mode     = mode;
  availabilityState.date     = null;
  availabilityState.fromDate = null;
  availabilityState.toDate   = null;
  availabilityState.days     = {};
  availabilityState.error    = null;
}

//#endregion

//#region State Helpers — Date Selection

/**
 * Sets the selected date for single mode.
 * Preserves existing slots for this date if any.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function setAvailabilityDate(isoDate) {
  availabilityState.date = isoDate;
  if (isoDate && !availabilityState.days[isoDate]) {
    availabilityState.days[isoDate] = [];
  }
}

/**
 * Sets the range start date.
 * Rebuilds the days map to cover the full range.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function setAvailabilityFromDate(isoDate) {
  availabilityState.fromDate = isoDate;
  _rebuildRangeDays();
}

/**
 * Sets the range end date.
 * Rebuilds the days map to cover the full range.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function setAvailabilityToDate(isoDate) {
  availabilityState.toDate = isoDate;
  _rebuildRangeDays();
}

//#endregion

//#region State Helpers — Slots

/**
 * Adds a new empty slot to a specific day.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function addSlot(isoDate) {
  if (!availabilityState.days[isoDate]) {
    availabilityState.days[isoDate] = [];
  }
  availabilityState.days[isoDate].push(createSlot());
}

/**
 * Removes a slot at a specific index from a day.
 * @param {string} isoDate - 'YYYY-MM-DD'
 * @param {number} index
 */
export function removeSlot(isoDate, index) {
  const slots = availabilityState.days[isoDate];
  if (!slots) return;
  slots.splice(index, 1);
}

/**
 * Updates the 'from' time on a specific slot.
 * @param {string} isoDate - 'YYYY-MM-DD'
 * @param {number} index
 * @param {string} value   - 'HH:mm'
 */
export function updateSlotFrom(isoDate, index, value) {
  const slot = availabilityState.days[isoDate]?.[index];
  if (slot) slot.from = value;
}

/**
 * Updates the 'until' time on a specific slot.
 * @param {string} isoDate - 'YYYY-MM-DD'
 * @param {number} index
 * @param {string} value   - 'HH:mm'
 */
export function updateSlotUntil(isoDate, index, value) {
  const slot = availabilityState.days[isoDate]?.[index];
  if (slot) slot.until = value;
}

//#endregion

//#region State Helpers — Validation / Submission

/**
 * Sets the error message.
 * @param {string | null} message
 */
export function setAvailabilityError(message) {
  availabilityState.error = message;
}

/**
 * Sets the submitting state.
 * @param {boolean} value
 */
export function setAvailabilitySubmitting(value) {
  availabilityState.isSubmitting = value;
}

/**
 * Marks the component as ready.
 */
export function setAvailabilityReady() {
  availabilityState.isReady = true;
}

//#endregion

//#region Derived Getters

/**
 * Returns the ISO dates currently in the range.
 * Empty array if fromDate or toDate is not set.
 * @returns {string[]}
 */
export function getRangeDates() {
  if (!availabilityState.fromDate || !availabilityState.toDate) return [];
  return getISODatesInRange(availabilityState.fromDate, availabilityState.toDate);
}

/**
 * Returns the slots for a specific date.
 * Returns an empty array if no slots exist.
 * @param {string} isoDate
 * @returns {object[]}
 */
export function getSlotsForDate(isoDate) {
  return availabilityState.days[isoDate] ?? [];
}

/**
 * Returns true if the current state has any slot data entered.
 * @returns {boolean}
 */
export function hasAnySlots() {
  return Object.values(availabilityState.days).some(slots => slots.length > 0);
}

//#endregion

//#region Private — Range Day Builder

/**
 * Rebuilds the days map when the date range changes.
 * Preserves existing slot data for dates that remain in the range.
 * Adds empty arrays for new dates. Drops dates outside the range.
 */
function _rebuildRangeDays() {
  const { fromDate, toDate, days } = availabilityState;
  if (!fromDate || !toDate) return;

  const dates    = getISODatesInRange(fromDate, toDate);
  const newDays  = {};

  dates.forEach(date => {
    newDays[date] = days[date] ?? [];
  });

  availabilityState.days = newDays;
}

//#endregion