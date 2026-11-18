/**
 * calendarIndex.js — shared calendar component
 * @version 1.0.0
 *
 * Public API for the shared calendar component.
 * This is the only file consuming features should import from.
 *
 * Usage:
 *   import { Calendar, CALENDAR_MODE, CALENDAR_FILTER } from '../../shared/components/calendar/calendarIndex.js';
 *
 *   Calendar.init(container, { mode: CALENDAR_MODE.LIST, allowCreate: true });
 *   Calendar.onRangeChange(({ start, end }) => fetchEvents(start, end));
 *   Calendar.onEventClick(event => openEventModal(event));
 *   Calendar.onDayClick(date => openCreateModal(date));
 *   Calendar.setEvents(events);
 *   Calendar.setLoading();
 *   Calendar.setError('Failed to load events.');
 *   Calendar.destroy();
 *
 * Target path: src/shared/components/calendar/calendarIndex.js
 */

//#region Imports

import {
  init,
  destroy,
  setEvents,
  setLoading,
  setError,
  onRangeChange,
  onEventClick,
  onDayClick,
  navigatePrev,
  navigateNext,
  navigateToday,
  switchMode,
  setFilter,
}                        from './calendarController.js';

import {
  CALENDAR_MODE,
  CALENDAR_FILTER,
  CALENDAR_FILTER_LABEL,
}                        from './calendarState.js';

//#endregion

//#region Public API

export const Calendar = {
  init,
  destroy,

  // Data
  setEvents,
  setLoading,
  setError,

  // Callbacks
  onRangeChange,
  onEventClick,
  onDayClick,

  // Navigation
  prev:  navigatePrev,
  next:  navigateNext,
  today: navigateToday,

  // Mode + Filter
  switchMode,
  setFilter,
};

//#endregion

//#region Re-exports — Constants

export { CALENDAR_MODE, CALENDAR_FILTER, CALENDAR_FILTER_LABEL };

//#endregion