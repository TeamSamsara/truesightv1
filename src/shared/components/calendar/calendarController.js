/**
 * calendarController.js — shared calendar component controller
 * @version 1.0.0
 *
 * Handles all calendar interactions:
 * - Mode switching (List / Week / Month / Day)
 * - Week/month/day navigation (prev, next, today)
 * - Filter chip toggling
 * - Event and day click delegation to consuming feature callbacks
 *
 * Never fetches data — fires onRangeChange so the consuming feature
 * can re-fetch for the new date range and call Calendar.setEvents().
 *
 * Target path: src/shared/components/calendar/calendarController.js
 */

//#region Imports

import {
  calendarState,
  resetCalendarState,
  setCalendarMode,
  setCalendarAnchor,
  setCalendarEvents,
  setCalendarFilter,
  setCalendarLoading,
  setCalendarError,
  setCalendarReady,
  getCalendarRange,
  CALENDAR_MODE,
  CALENDAR_FILTER,
}                              from './calendarState.js';

import { renderCalendar }      from './calendarRenderer.js';

import {
  getStartOfWeek,
  getEndOfWeek,
  addDays,
  addMonths,
  startOfDay,
  endOfDay,
}                              from '../../../utils/dateHelpers.js';

//#endregion

//#region Callbacks

/**
 * Registered by the consuming feature via Calendar.onRangeChange().
 * Fires whenever the visible date range changes — feature re-fetches events.
 * Receives { start: Date, end: Date }
 * @type {Function | null}
 */
let _onRangeChange = null;

/**
 * Registered by the consuming feature via Calendar.onEventClick().
 * Fires when a user clicks an event row or block.
 * Receives the CalendarEvent object.
 * @type {Function | null}
 */
let _onEventClick = null;

/**
 * Registered by the consuming feature via Calendar.onDayClick().
 * Fires when a user clicks an empty day slot.
 * Receives the Date object for that day.
 * @type {Function | null}
 */
let _onDayClick = null;

//#endregion

//#region Container

let _container = null;

//#endregion

//#region Init / Destroy

/**
 * Initializes the calendar in the given container.
 * Resets all state, renders the shell, and fires onRangeChange
 * so the consuming feature can load the initial events.
 *
 * @param {HTMLElement} container
 * @param {object}      options
 * @param {string}      [options.mode]         - initial CALENDAR_MODE (default: LIST)
 * @param {Date}        [options.anchorDate]   - initial anchor (default: today)
 * @param {boolean}     [options.showModeToggle] - show mode switcher in toolbar (default: true)
 * @param {boolean}     [options.showFilters]  - show filter chips (default: true)
 * @param {boolean}     [options.allowCreate]  - show + New Event button (default: false)
 */
export function init(container, options = {}) {
  destroy();

  _container = container;

  resetCalendarState();

  const initialMode   = options.mode       ?? CALENDAR_MODE.LIST;
  const initialAnchor = options.anchorDate ?? new Date();

  calendarState.showModeToggle = options.showModeToggle ?? true;
  calendarState.showFilters    = options.showFilters    ?? true;
  calendarState.allowCreate    = options.allowCreate    ?? false;

  setCalendarAnchor(initialAnchor, initialMode);
  setCalendarMode(initialMode);
  setCalendarLoading(true);

  renderCalendar(_container);
  _bindEvents();
  setCalendarReady();

  _fireRangeChange();
}

/**
 * Tears down the calendar — clears state, removes listeners, empties container.
 */
export function destroy() {
  _unbindEvents();
  resetCalendarState();
  _onRangeChange = null;
  _onEventClick  = null;
  _onDayClick    = null;
  _container     = null;
}

//#endregion

//#region Public API — Data

/**
 * Sets the events array and re-renders.
 * Called by the consuming feature after fetching.
 * @param {CalendarEvent[]} events
 */
export function setEvents(events) {
  setCalendarEvents(events);
  _rerender();
}

/**
 * Sets the calendar into a loading state and re-renders.
 * Called by the consuming feature before fetching.
 */
export function setLoading() {
  setCalendarLoading(true);
  _rerender();
}

/**
 * Sets an error message and re-renders.
 * @param {string} message
 */
export function setError(message) {
  setCalendarError(message);
  _rerender();
}

//#endregion

//#region Public API — Callbacks

/**
 * Registers the range change callback.
 * Fires with { start: Date, end: Date } whenever the visible range changes.
 * The consuming feature should re-fetch events for the new range.
 * @param {Function} callback
 */
export function onRangeChange(callback) {
  _onRangeChange = callback;
}

/**
 * Registers the event click callback.
 * Fires with the CalendarEvent object when an event is clicked.
 * @param {Function} callback
 */
export function onEventClick(callback) {
  _onEventClick = callback;
}

/**
 * Registers the day click callback.
 * Fires with a Date when an empty day slot is clicked.
 * Only fires if allowCreate was true on init.
 * @param {Function} callback
 */
export function onDayClick(callback) {
  _onDayClick = callback;
}

//#endregion

//#region Navigation

/**
 * Navigates to the previous period (week/month/day).
 * Updates anchor, re-derives range, fires onRangeChange.
 */
export function navigatePrev() {
  _navigate(-1);
}

/**
 * Navigates to the next period (week/month/day).
 */
export function navigateNext() {
  _navigate(1);
}

/**
 * Resets anchor to today and re-derives range.
 */
export function navigateToday() {
  setCalendarAnchor(new Date(), calendarState.mode);
  setCalendarLoading(true);
  _rerender();
  _fireRangeChange();
}

//#endregion

//#region Mode Switching

/**
 * Switches the display mode and re-derives range from current anchor.
 * @param {string} mode - CALENDAR_MODE
 */
export function switchMode(mode) {
  if (mode === calendarState.mode) return;
  setCalendarMode(mode);
  setCalendarAnchor(calendarState.anchorDate, mode);
  setCalendarLoading(true);
  _rerender();
  _fireRangeChange();
}

//#endregion

//#region Filter

/**
 * Sets the active event type filter and re-renders.
 * No data re-fetch — filtering is client-side on the loaded events.
 * @param {string} filter - CALENDAR_FILTER
 */
export function setFilter(filter) {
  setCalendarFilter(filter);
  _rerender();
}

//#endregion

//#region Private — Navigation

function _navigate(direction) {
  const anchor = calendarState.anchorDate;
  let   next;

  switch (calendarState.mode) {
    case CALENDAR_MODE.LIST:
    case CALENDAR_MODE.WEEK:
      next = addDays(anchor, direction * 7);
      break;
    case CALENDAR_MODE.MONTH:
      next = addMonths(anchor, direction);
      break;
    case CALENDAR_MODE.DAY:
      next = addDays(anchor, direction);
      break;
    default:
      next = addDays(anchor, direction * 7);
  }

  setCalendarAnchor(next, calendarState.mode);
  setCalendarLoading(true);
  _rerender();
  _fireRangeChange();
}

//#endregion

//#region Private — Event Binding

/**
 * Binds delegated click events on the calendar container.
 * Uses data attributes to identify actions — no per-element listeners.
 */
function _bindEvents() {
  if (!_container) return;

  _container._calHandler = (e) => {
    const target = e.target;

    // ── Toolbar actions ───────────────────────────────

    if (target.closest('[data-cal-prev]'))  { navigatePrev();  return; }
    if (target.closest('[data-cal-next]'))  { navigateNext();  return; }
    if (target.closest('[data-cal-today]')) { navigateToday(); return; }

    const modeBtn = target.closest('[data-cal-mode]');
    if (modeBtn) {
      switchMode(modeBtn.dataset.calMode);
      return;
    }

    const filterBtn = target.closest('[data-cal-filter]');
    if (filterBtn) {
      setFilter(filterBtn.dataset.calFilter);
      return;
    }

    // ── Event click ────────────────────────────────────

    const eventEl = target.closest('[data-cal-event-id]');
    if (eventEl) {
      const id    = eventEl.dataset.calEventId;
      const event = calendarState.events.find(ev => ev.id === id);
      if (event && _onEventClick) {
        _onEventClick(event);
      }
      return;
    }

    // ── Day click (empty slot) ─────────────────────────

    if (calendarState.allowCreate) {
      const dayEl = target.closest('[data-cal-day]');
      if (dayEl && _onDayClick) {
        const dateStr = dayEl.dataset.calDay;
        if (dateStr) {
          const [y, m, d] = dateStr.split('-').map(Number);
          _onDayClick(new Date(y, m - 1, d));
        }
      }
    }
  };

  _container.addEventListener('click', _container._calHandler);
}

function _unbindEvents() {
  if (_container?._calHandler) {
    _container.removeEventListener('click', _container._calHandler);
    delete _container._calHandler;
  }
}

//#endregion

//#region Private — Render / Callback

function _rerender() {
  if (!_container) return;
  renderCalendar(_container);
}

function _fireRangeChange() {
  if (_onRangeChange) {
    _onRangeChange(getCalendarRange());
  }
}

//#endregion