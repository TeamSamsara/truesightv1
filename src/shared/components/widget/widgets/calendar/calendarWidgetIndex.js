/**
 * calendarWidgetIndex.js — calendar widget type
 * @version 1.0.0
 *
 * Entry point for the calendar widget type.
 * Displays a compact upcoming events list.
 * Implements the widget type contract — exposes mount().
 * Called by dashboardController via dynamic import.
 *
 * Usage (via Dashboard):
 *   Dashboard.init(container, [{
 *     id:    'upcoming-events',
 *     type:  WIDGET_TYPE.CALENDAR,
 *     size:  WIDGET_SIZE.MD,
 *     title: 'Upcoming Events',
 *     data:  createCalendarData({
 *       events: events.map(e => createCalendarEvent({
 *         id:       e.id,
 *         type:     CALENDAR_EVENT_TYPE.SCRIM,
 *         title:    e.title,
 *         sub:      e.opponent,
 *         startsAt: e.startsAt,
 *         onClick:  () => navigateTo(ROUTES.OPERATIONS),
 *       })),
 *       limit: 5,
 *     }),
 *   }]);
 *
 * Target path: src/shared/components/widget/widgets/calendarWidget/calendarWidgetIndex.js
 */

//#region Imports

import { mountWidget }              from '../../../widget/widgetIndex.js';
import { renderCalendarContent }    from './calendarWidgetRenderer.js';
import { createCalendarData,
         createCalendarEvent,
         CALENDAR_EVENT_TYPE }      from './calendarWidgetState.js';

//#endregion

//#region Widget Type Contract

/**
 * Mounts the calendar widget into the given container.
 * Called by dashboardController — do not call directly.
 *
 * @param {HTMLElement} container
 * @param {object}      options   - widget definition from dashboardState
 */
export function mount(container, options) {
  const widget = mountWidget(container, {
    title:       options.title,
    eyebrow:     options.eyebrow     ?? null,
    variant:     options.variant     ?? 'default',
    actionLabel: options.actionLabel ?? null,
    onAction:    options.onAction    ?? null,
    isLoading:   options.isLoading   ?? false,
  });

  if (options.data) {
    widget.setContent(renderCalendarContent(options.data));
    _bindEvents(container, options);
  }

  return widget;
}

//#endregion

//#region Private — Event Binding

/**
 * Binds event row clicks and the view-more button.
 * Row clicks fire the event's own onClick callback if present.
 * View-more fires onAction({ type: 'view-more' }).
 * @param {HTMLElement} container
 * @param {object}      options
 */
function _bindEvents(container, options) {
  container.querySelectorAll('.c-calendar-widget__event.is-clickable').forEach(row => {
    const id    = row.dataset.eventId;
    const event = options.data.events.find(e => e.id === id);
    if (!event?.onClick) return;
    row.addEventListener('click', () => event.onClick(event));
  });

  const moreBtn = container.querySelector('.js-calendar-more');
  if (!moreBtn) return;

  moreBtn.addEventListener('click', () => {
    if (typeof options.onAction === 'function') {
      options.onAction({ type: 'view-more' });
    }
  });
}

//#endregion

//#region Re-exports

export { createCalendarData, createCalendarEvent, CALENDAR_EVENT_TYPE };

//#endregion