/**
 * calendarState.js — shared calendar component state
 * @version 1.0.0
 *
 * Owns all calendar view state — current mode, anchor date,
 * active filters, and the event registry.
 *
 * The calendar component owns its view state (what to display).
 * The consuming feature owns event data (what happened).
 * Features pass events in via Calendar.setEvents() — the calendar
 * never fetches its own data.
 *
 * Target path: src/shared/components/calendar/calendarState.js
 */

import { getStartOfWeek, getEndOfWeek } from '../../../utils/dateHelpers.js';
import { EVENT_TYPE }                   from '../../data/eventModel.js';

//#region Constants

/**
 * Calendar display mode.
 * Controls which renderer is active and how the toolbar labels.
 */
export const CALENDAR_MODE = {
  LIST:  'list',  // Chronological day groups — default
  WEEK:  'week',  // Time grid, 7 columns
  MONTH: 'month', // Calendar grid
  DAY:   'day',   // Single day timeline
};

/**
 * CalendarEvent contract — the minimal shape the calendar needs
 * to render an event. Consuming features map from the full
 * eventModel to this shape before calling Calendar.setEvents().
 *
 * @typedef {object} CalendarEvent
 * @property {string}      id
 * @property {string}      title
 * @property {string}      type          - EVENT_TYPE constant
 * @property {Date}        startsAt      - JS Date (use resolveTimestamp)
 * @property {Date|null}   endsAt
 * @property {Date|null}   meetAt        - optional pre-event meet time
 * @property {string|null} rosterId
 * @property {string|null} rosterName    - for multi-roster display
 * @property {string|null} rosterColor   - hex string
 * @property {string}      status        - EVENT_STATUS constant
 * @property {string|null} meta          - optional sub-line e.g. "vs Militia · BO3"
 */

/**
 * All event types available as filter chips.
 * The 'all' key is synthetic — not a real EVENT_TYPE.
 */
export const CALENDAR_FILTER = {
  ALL:      'all',
  SCRIM:    EVENT_TYPE.SCRIM,
  MATCH:    EVENT_TYPE.MATCH,
  REVIEW:   EVENT_TYPE.REVIEW,
  PRACTICE: EVENT_TYPE.PRACTICE,
};

export const CALENDAR_FILTER_LABEL = {
  [CALENDAR_FILTER.ALL]:      'All',
  [CALENDAR_FILTER.SCRIM]:    'Scrim',
  [CALENDAR_FILTER.MATCH]:    'Match',
  [CALENDAR_FILTER.REVIEW]:   'VOD Review',
  [CALENDAR_FILTER.PRACTICE]: 'Practice',
};

//#endregion

//#region State

/**
 * Internal calendar state.
 * Reset on every Calendar.init() call via resetCalendarState().
 */
export const calendarState = {

  /**
   * Active display mode.
   * @type {string} CALENDAR_MODE
   */
  mode: CALENDAR_MODE.LIST,

  /**
   * The anchor date — single source of truth for all date math.
   * All week/month/day ranges derive from this value.
   * Initialized to today on Calendar.init().
   * @type {Date}
   */
  anchorDate: new Date(),

  /**
   * Computed range start — derives from anchorDate + mode.
   * Updated by _updateRange() whenever anchorDate or mode changes.
   * @type {Date}
   */
  rangeStart: getStartOfWeek(new Date()),

  /**
   * Computed range end — derives from anchorDate + mode.
   * @type {Date}
   */
  rangeEnd: getEndOfWeek(new Date()),

  /**
   * All events passed in by the consuming feature.
   * Stored as received — filtering is applied at render time.
   * @type {CalendarEvent[]}
   */
  events: [],

  /**
   * Active event type filter.
   * 'all' means no filter — show all event types.
   * @type {string} CALENDAR_FILTER
   */
  activeFilter: CALENDAR_FILTER.ALL,

  /**
   * Whether the calendar is in a loading state.
   * Set to true when the consuming feature is fetching events
   * for a new range. Cleared when setEvents() is called.
   * @type {boolean}
   */
  isLoading: false,

  /**
   * Optional error message. Null if no error.
   * @type {string | null}
   */
  error: null,

  /**
   * Whether the calendar has been initialized.
   * @type {boolean}
   */
  isReady: false,

};

//#endregion

//#region State Helpers

/**
 * Resets calendar state to defaults.
 * Called at the start of Calendar.init() to ensure a clean slate.
 */
export function resetCalendarState() {
  const now             = new Date();
  calendarState.mode        = CALENDAR_MODE.LIST;
  calendarState.anchorDate  = now;
  calendarState.rangeStart  = getStartOfWeek(now);
  calendarState.rangeEnd    = getEndOfWeek(now);
  calendarState.events      = [];
  calendarState.activeFilter = CALENDAR_FILTER.ALL;
  calendarState.isLoading   = false;
  calendarState.error       = null;
  calendarState.isReady     = false;
}

/**
 * Sets the active display mode.
 * @param {string} mode - CALENDAR_MODE
 */
export function setCalendarMode(mode) {
  calendarState.mode = mode;
}

/**
 * Sets the anchor date and updates the derived range.
 * The range is recomputed based on the current mode.
 * @param {Date}   anchorDate
 * @param {string} mode - CALENDAR_MODE
 */
export function setCalendarAnchor(anchorDate, mode) {
  calendarState.anchorDate = anchorDate;
  _updateRange(anchorDate, mode);
}

/**
 * Sets the events array.
 * Called by the consuming feature after fetching.
 * Clears loading state.
 * @param {CalendarEvent[]} events
 */
export function setCalendarEvents(events) {
  calendarState.events    = events;
  calendarState.isLoading = false;
  calendarState.error     = null;
}

/**
 * Sets the active event type filter.
 * @param {string} filter - CALENDAR_FILTER
 */
export function setCalendarFilter(filter) {
  calendarState.activeFilter = filter;
}

/**
 * Sets the loading state.
 * @param {boolean} value
 */
export function setCalendarLoading(value) {
  calendarState.isLoading = value;
}

/**
 * Sets the error message.
 * @param {string | null} message
 */
export function setCalendarError(message) {
  calendarState.error     = message;
  calendarState.isLoading = false;
}

/**
 * Marks the calendar as ready.
 */
export function setCalendarReady() {
  calendarState.isReady = true;
}

//#endregion

//#region Derived Getters

/**
 * Returns the events filtered by the active filter.
 * 'all' returns everything. Other values filter by event type.
 * @returns {CalendarEvent[]}
 */
export function getFilteredEvents() {
  if (calendarState.activeFilter === CALENDAR_FILTER.ALL) {
    return calendarState.events;
  }
  return calendarState.events.filter(
    e => e.type === calendarState.activeFilter
  );
}

/**
 * Returns events filtered and sorted by start time for a specific day.
 * @param {Date} date
 * @returns {CalendarEvent[]}
 */
export function getEventsForDay(date) {
  return getFilteredEvents()
    .filter(e => {
      if (!e.startsAt) return false;
      return isSameDayLocal(e.startsAt, date);
    })
    .sort((a, b) => a.startsAt - b.startsAt);
}

/**
 * Returns the current date range as a plain object.
 * Used by the consuming feature's onRangeChange callback.
 * @returns {{ start: Date, end: Date }}
 */
export function getCalendarRange() {
  return {
    start: calendarState.rangeStart,
    end:   calendarState.rangeEnd,
  };
}

//#endregion

//#region Private — Range Computation

/**
 * Recomputes rangeStart and rangeEnd from anchorDate and mode.
 * Called whenever anchorDate or mode changes.
 * @param {Date}   anchorDate
 * @param {string} mode - CALENDAR_MODE
 */
function _updateRange(anchorDate, mode) {
  switch (mode) {
    case CALENDAR_MODE.LIST:
    case CALENDAR_MODE.WEEK: {
      calendarState.rangeStart = getStartOfWeek(anchorDate);
      calendarState.rangeEnd   = getEndOfWeek(anchorDate);
      break;
    }
    case CALENDAR_MODE.MONTH: {
      const { getStartOfMonth, getEndOfMonth } = _importMonthHelpers();
      calendarState.rangeStart = getStartOfMonth(anchorDate);
      calendarState.rangeEnd   = getEndOfMonth(anchorDate);
      break;
    }
    case CALENDAR_MODE.DAY: {
      const { startOfDay, endOfDay } = _importDayHelpers();
      calendarState.rangeStart = startOfDay(anchorDate);
      calendarState.rangeEnd   = endOfDay(anchorDate);
      break;
    }
    default: {
      calendarState.rangeStart = getStartOfWeek(anchorDate);
      calendarState.rangeEnd   = getEndOfWeek(anchorDate);
    }
  }
}

// Lazy imports to avoid circular dependency issues with dateHelpers
function _importMonthHelpers() {
  return {
    getStartOfMonth: (d) => { const r = new Date(d); r.setDate(1); r.setHours(0,0,0,0); return r; },
    getEndOfMonth:   (d) => { const r = new Date(d); r.setMonth(r.getMonth()+1, 0); r.setHours(23,59,59,999); return r; },
  };
}

function _importDayHelpers() {
  return {
    startOfDay: (d) => { const r = new Date(d); r.setHours(0,0,0,0); return r; },
    endOfDay:   (d) => { const r = new Date(d); r.setHours(23,59,59,999); return r; },
  };
}

function isSameDayLocal(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

//#endregion