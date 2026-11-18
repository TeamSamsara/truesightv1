/**
 * calendarWidgetRenderer.js
 * @version 1.0.0
 *
 * Renders the content for the calendar widget type.
 * Compact upcoming events list — not a full calendar grid.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/components/widget/widgets/calendarWidget/calendarWidgetRenderer.js
 */

//#region Imports

import { escHtml, formatDateTime } from '../../../../../utils/helpers.js';
import { CALENDAR_EVENT_TYPE }     from './calendarWidgetState.js';

//#endregion

//#region Constants

const TYPE_LABELS = {
  [CALENDAR_EVENT_TYPE.SCRIM]:    'Scrim',
  [CALENDAR_EVENT_TYPE.OFFICIAL]: 'Official',
  [CALENDAR_EVENT_TYPE.VOD]:      'VOD Review',
  [CALENDAR_EVENT_TYPE.PRACTICE]: 'Practice',
  [CALENDAR_EVENT_TYPE.OTHER]:    'Event',
};

//#endregion

//#region Public API

/**
 * Builds the calendar widget content HTML.
 * @param {object} data - calendarWidgetData instance
 * @returns {string}
 */
export function renderCalendarContent(data) {
  if (!data || !data.events.length) return _buildEmptyHTML();

  const visible = data.events.slice(0, data.limit);
  const hasMore = data.events.length > data.limit;

  return `
    <div class="c-calendar-widget">
      <div class="c-calendar-widget__list">
        ${visible.map(event => _buildEventHTML(event)).join('')}
      </div>
      ${hasMore ? _buildViewMoreHTML(data.events.length - data.limit) : ''}
    </div>
  `;
}

//#endregion

//#region Private — Event Builder

function _buildEventHTML(event) {
  const isClickable = typeof event.onClick === 'function';
  const typeLabel   = TYPE_LABELS[event.type] ?? TYPE_LABELS[CALENDAR_EVENT_TYPE.OTHER];

  return `
    <div
      class="c-calendar-widget__event c-calendar-widget__event--${escHtml(event.type)} ${isClickable ? 'is-clickable' : ''}"
      data-event-id="${escHtml(event.id)}"
    >
      <div class="c-calendar-widget__event-indicator"></div>
      <div class="c-calendar-widget__event-body">
        <div class="c-calendar-widget__event-title">${escHtml(event.title)}</div>
        ${event.sub ? `
          <div class="c-calendar-widget__event-sub">${escHtml(event.sub)}</div>
        ` : ''}
      </div>
      <div class="c-calendar-widget__event-right">
        <div class="c-calendar-widget__event-type">${escHtml(typeLabel)}</div>
        ${event.startsAt ? `
          <div class="c-calendar-widget__event-time">
            ${escHtml(formatDateTime(event.startsAt))}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function _buildViewMoreHTML(remaining) {
  return `
    <button class="c-calendar-widget__more js-calendar-more">
      ${escHtml(String(remaining))} more →
    </button>
  `;
}

function _buildEmptyHTML() {
  return `
    <div class="c-calendar-widget c-calendar-widget--empty">
      <div class="c-calendar-widget__empty-text">No upcoming events.</div>
    </div>
  `;
}

//#endregion