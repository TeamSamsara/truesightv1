/**
 * calendarWidgetState.js
 * @version 1.0.0
 *
 * State for the calendar widget type.
 * Displays a compact upcoming events list — not a full calendar grid.
 * For the full calendar component see shared/components/calendar/.
 *
 * Target path: src/shared/components/widget/widgets/calendarWidget/calendarWidgetState.js
 */

//#region Constants

/**
 * Event type variant — controls the accent color of the event indicator.
 */
export const CALENDAR_EVENT_TYPE = {
  SCRIM:    'scrim',
  OFFICIAL: 'official',
  VOD:      'vod',
  PRACTICE: 'practice',
  OTHER:    'other',
};

//#endregion

//#region Factory

/**
 * Creates a fresh calendar widget data object.
 * Passed as `data` in the widget definition.
 *
 * @param {object} options
 * @returns {object}
 */
export function createCalendarData(options = {}) {
  return {

    /**
     * Ordered list of upcoming events, soonest first.
     * Each entry: calendarEventItem
     * @type {object[]}
     */
    events: options.events ?? [],

    /**
     * Maximum number of events to display.
     * @type {number}
     */
    limit: options.limit ?? 5,

  };
}

/**
 * Creates a single calendar event item.
 * @param {object} options
 * @returns {object}
 */
export function createCalendarEvent(options = {}) {
  return {

    /**
     * Unique identifier for the event.
     * @type {string}
     */
    id: options.id ?? '',

    /**
     * Event type — controls visual styling.
     * @type {string}
     */
    type: options.type ?? CALENDAR_EVENT_TYPE.OTHER,

    /**
     * Event title.
     * @type {string}
     */
    title: options.title ?? '',

    /**
     * Optional opponent or secondary label.
     * @type {string | null}
     */
    sub: options.sub ?? null,

    /**
     * Event start time.
     * @type {object | Date | null}  - Firestore timestamp or JS Date
     */
    startsAt: options.startsAt ?? null,

    /**
     * Optional click callback for the event row.
     * @type {Function | null}
     */
    onClick: options.onClick ?? null,

  };
}

//#endregion