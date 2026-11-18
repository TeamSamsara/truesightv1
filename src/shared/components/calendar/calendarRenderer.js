/**
 * calendarRenderer.js — shared calendar component renderer
 * @version 1.0.0
 *
 * Renders the full calendar shell — toolbar + active mode view.
 * Delegates to mode-specific render functions for content.
 *
 * All rendering is HTML string injection into the container.
 * Data attributes drive controller event delegation — no inline handlers.
 *
 * Modes:
 *   List  — chronological day groups with event rows (default, fully implemented)
 *   Week  — 7-column time grid (stub — renders placeholder)
 *   Month — calendar grid (stub — renders placeholder)
 *   Day   — single day timeline (stub — renders placeholder)
 *
 * Target path: src/shared/components/calendar/calendarRenderer.js
 */

//#region Imports

import {
  calendarState,
  getFilteredEvents,
  getEventsForDay,
  CALENDAR_MODE,
  CALENDAR_FILTER,
  CALENDAR_FILTER_LABEL,
}                              from './calendarState.js';

import {
  getWeekDays,
  getMonthGridDays,
  formatWeekLabel,
  formatMonthLabel,
  formatDayLabel,
  formatShortDate,
  formatTime,
  formatTimeRange,
  isSameDay,
  isToday,
  toDate,
  addDays,
}                              from '../../../utils/dateHelpers.js';

import {
  EVENT_TYPE,
  EVENT_TYPE_LABEL,
  EVENT_STATUS,
}                              from '../../data/eventModel.js';

import { escHtml }             from '../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Renders the full calendar into the container.
 * Called by the controller on every state change.
 * @param {HTMLElement} container
 */
export function renderCalendar(container) {
  container.innerHTML = `
    <div class="c-calendar">
      ${_renderToolbar()}
      <div class="c-calendar__body">
        ${calendarState.isLoading ? _renderLoading()
        : calendarState.error     ? _renderError(calendarState.error)
        : _renderMode()}
      </div>
    </div>
  `;
}

//#endregion

//#region Toolbar

function _renderToolbar() {
  const { mode, anchorDate, rangeStart, rangeEnd, activeFilter,
          showModeToggle, showFilters, allowCreate } = calendarState;

  const periodLabel = mode === CALENDAR_MODE.MONTH
    ? formatMonthLabel(anchorDate)
    : mode === CALENDAR_MODE.DAY
      ? `${formatDayLabel(anchorDate)} · ${formatShortDate(anchorDate)}`
      : formatWeekLabel(rangeStart, rangeEnd);

  return `
    <div class="c-calendar__toolbar">
      <div class="c-calendar__toolbar-left">

        <div class="c-calendar__nav">
          <button class="c-calendar__nav-btn" data-cal-prev aria-label="Previous">‹</button>
          <button class="c-calendar__nav-today" data-cal-today>Today</button>
          <button class="c-calendar__nav-btn" data-cal-next aria-label="Next">›</button>
        </div>

        <div class="c-calendar__period">${escHtml(periodLabel)}</div>

      </div>
      <div class="c-calendar__toolbar-right">

        ${showFilters ? _renderFilterChips(activeFilter) : ''}

        ${showModeToggle ? _renderModeToggle(mode) : ''}

        ${allowCreate ? `
          <button class="c-calendar__new-btn" data-cal-new>
            + New Event
          </button>
        ` : ''}

      </div>
    </div>
  `;
}

function _renderFilterChips(activeFilter) {
  return `
    <div class="c-calendar__filters">
      ${Object.entries(CALENDAR_FILTER_LABEL).map(([key, label]) => `
        <button
          class="c-chip c-calendar__filter-chip ${activeFilter === key ? 'is-active' : ''}"
          data-cal-filter="${escHtml(key)}"
        >${escHtml(label)}</button>
      `).join('')}
    </div>
  `;
}

function _renderModeToggle(activeMode) {
  const modes = [
    { key: CALENDAR_MODE.LIST,  label: 'List'  },
    { key: CALENDAR_MODE.WEEK,  label: 'Week'  },
    { key: CALENDAR_MODE.MONTH, label: 'Month' },
    { key: CALENDAR_MODE.DAY,   label: 'Day'   },
  ];

  return `
    <div class="c-calendar__mode-toggle">
      ${modes.map(m => `
        <button
          class="c-calendar__mode-btn ${activeMode === m.key ? 'is-active' : ''}"
          data-cal-mode="${m.key}"
        >${m.label}</button>
      `).join('')}
    </div>
  `;
}

//#endregion

//#region Mode Router

function _renderMode() {
  switch (calendarState.mode) {
    case CALENDAR_MODE.LIST:  return _renderListMode();
    case CALENDAR_MODE.WEEK:  return _renderWeekMode();
    case CALENDAR_MODE.MONTH: return _renderMonthMode();
    case CALENDAR_MODE.DAY:   return _renderDayMode();
    default:                  return _renderListMode();
  }
}

//#endregion

//#region List Mode

function _renderListMode() {
  const events = getFilteredEvents();
  const days   = _getWeekDaysInRange();

  if (events.length === 0) {
    return _renderEmpty('No events this week.');
  }

  return `
    <div class="c-calendar__list">
      ${days.map(day => {
        const dayEvents = _getEventsForDay(events, day);
        if (dayEvents.length === 0) return '';
        return _renderDayGroup(day, dayEvents);
      }).join('')}
    </div>
  `;
}

function _renderDayGroup(day, events) {
  return `
    <div class="c-calendar__day-group" data-cal-day="${_toISO(day)}">
      <div class="c-calendar__day-header">
        <span class="c-calendar__day-label ${isToday(day) ? 'is-today' : ''}">
          ${formatDayLabel(day)}
        </span>
        <span class="c-calendar__day-date">
          ${formatShortDate(day)}
        </span>
        <div class="c-calendar__day-line"></div>
        ${isToday(day) ? '<span class="c-calendar__today-tag">Today</span>' : ''}
      </div>
      <div class="c-calendar__day-events">
        ${events.map(event => _renderEventRow(event)).join('')}
      </div>
    </div>
  `;
}

function _renderEventRow(event) {
  const typeKey   = event.type ?? EVENT_TYPE.OTHER;
  const isPending = event.status === EVENT_STATUS.PENDING;
  const isCancelled = event.status === EVENT_STATUS.CANCELLED;
  const isOfficial = typeKey === EVENT_TYPE.MATCH;

  const startDate = toDate(event.startsAt);
  const endDate   = toDate(event.endsAt);
  const meetDate  = toDate(event.meetAt);

  return `
    <div
      class="c-calendar__event-row
             c-calendar__event-row--${escHtml(typeKey)}
             ${isOfficial  ? 'c-calendar__event-row--official' : ''}
             ${isPending   ? 'c-calendar__event-row--pending'  : ''}
             ${isCancelled ? 'c-calendar__event-row--cancelled': ''}"
      data-cal-event-id="${escHtml(event.id)}"
    >
      <div class="c-calendar__event-index">
        ${_renderTypePill(typeKey)}
      </div>

      <div class="c-calendar__event-main">
        <div class="c-calendar__event-title">${escHtml(event.title)}</div>
        ${event.meta ? `
          <div class="c-calendar__event-meta">${escHtml(event.meta)}</div>
        ` : ''}
        ${event.rosterName ? `
          <div class="c-calendar__event-roster" style="color:${escHtml(event.rosterColor ?? '#8fa3b1')}">
            ${escHtml(event.rosterName)}
          </div>
        ` : ''}
      </div>

      <div class="c-calendar__event-time">
        ${startDate ? `
          <div class="c-calendar__event-time-val">
            ${escHtml(formatTime(startDate))}
          </div>
        ` : ''}
        ${endDate ? `
          <div class="c-calendar__event-time-range">
            ${escHtml(formatTimeRange(startDate, endDate))}
          </div>
        ` : ''}
        ${meetDate ? `
          <div class="c-calendar__event-meet">
            Meet ${escHtml(formatTime(meetDate))}
          </div>
        ` : ''}
      </div>

      <div class="c-calendar__event-status">
        ${_renderStatusPill(event.status)}
      </div>

    </div>
  `;
}

//#endregion

//#region Week Mode (stub)

function _renderWeekMode() {
  const days = getWeekDays(calendarState.anchorDate);
  return `
    <div class="c-calendar__week">
      <div class="c-calendar__week-header">
        ${days.map(day => `
          <div class="c-calendar__week-col-header ${isToday(day) ? 'is-today' : ''}">
            <div class="c-calendar__week-day-label">${formatDayLabel(day, true)}</div>
            <div class="c-calendar__week-day-num ${isToday(day) ? 'is-today' : ''}">${day.getDate()}</div>
          </div>
        `).join('')}
      </div>
      <div class="c-calendar__week-stub">
        <div class="c-calendar__stub-text">Week view coming soon.</div>
      </div>
    </div>
  `;
}

//#endregion

//#region Month Mode (stub)

function _renderMonthMode() {
  const gridDays = getMonthGridDays(calendarState.anchorDate);
  const events   = getFilteredEvents();

  return `
    <div class="c-calendar__month">
      <div class="c-calendar__month-header">
        ${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => `
          <div class="c-calendar__month-col-header">${d}</div>
        `).join('')}
      </div>
      <div class="c-calendar__month-grid">
        ${gridDays.map(day => {
          const dayEvents = _getEventsForDay(events, day);
          const isCurrentMonth = day.getMonth() === calendarState.anchorDate.getMonth();
          return `
            <div
              class="c-calendar__month-cell
                     ${isToday(day)        ? 'is-today'         : ''}
                     ${!isCurrentMonth     ? 'is-outside-month' : ''}"
              data-cal-day="${_toISO(day)}"
            >
              <div class="c-calendar__month-cell-date">${day.getDate()}</div>
              <div class="c-calendar__month-cell-events">
                ${dayEvents.slice(0, 2).map(ev => `
                  <div
                    class="c-calendar__month-pill c-calendar__month-pill--${escHtml(ev.type)}"
                    data-cal-event-id="${escHtml(ev.id)}"
                  >${escHtml(ev.title)}</div>
                `).join('')}
                ${dayEvents.length > 2 ? `
                  <div class="c-calendar__month-more">+${dayEvents.length - 2} more</div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

//#endregion

//#region Day Mode (stub)

function _renderDayMode() {
  const events = _getEventsForDay(getFilteredEvents(), calendarState.anchorDate);
  return `
    <div class="c-calendar__day">
      <div class="c-calendar__day-stub">
        ${events.length > 0
          ? events.map(ev => _renderEventRow(ev)).join('')
          : _renderEmpty('No events today.')}
      </div>
    </div>
  `;
}

//#endregion

//#region Shared Partials

function _renderTypePill(type) {
  const label = EVENT_TYPE_LABEL[type] ?? type;
  return `
    <span class="c-calendar__type-pill c-calendar__type-pill--${escHtml(type)}">
      ${escHtml(label)}
    </span>
  `;
}

function _renderStatusPill(status) {
  if (!status || status === EVENT_STATUS.UPCOMING) return '';
  return `
    <span class="c-calendar__status-pill c-calendar__status-pill--${escHtml(status)}">
      ${escHtml(_capitalize(status))}
    </span>
  `;
}

function _renderLoading() {
  return `
    <div class="c-calendar__loading">
      <div class="c-calendar__loading-text">Loading…</div>
    </div>
  `;
}

function _renderError(message) {
  return `
    <div class="c-calendar__error">
      ${escHtml(message)}
    </div>
  `;
}

function _renderEmpty(message) {
  return `
    <div class="c-calendar__empty">
      <div class="c-calendar__empty-text">${escHtml(message)}</div>
    </div>
  `;
}

//#endregion

//#region Private — Helpers

function _getWeekDaysInRange() {
  const days = [];
  let current = new Date(calendarState.rangeStart);
  while (current <= calendarState.rangeEnd) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}

function _getEventsForDay(events, day) {
  return events
    .filter(e => {
      const d = toDate(e.startsAt);
      return d && isSameDay(d, day);
    })
    .sort((a, b) => toDate(a.startsAt) - toDate(b.startsAt));
}

function _toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function _capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//#endregion