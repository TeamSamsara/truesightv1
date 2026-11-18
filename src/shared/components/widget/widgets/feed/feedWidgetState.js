/**
 * feedWidgetState.js
 * @version 1.0.0
 *
 * State for the feed widget type.
 * Displays a chronological list of activity items —
 * audit trail entries, platform events, or any timestamped log.
 *
 * Target path: src/shared/components/widget/widgets/feed/feedWidgetState.js
 */

//#region Constants

/**
 * Feed item dot variant — controls the accent color of the timeline dot.
 */
export const FEED_DOT = {
  DEFAULT: 'default',
  PASS:    'pass',
  ALERT:   'alert',
  GOLD:    'gold',
  INFO:    'info',
};

//#endregion

//#region Factory

/**
 * Creates a fresh feed widget data object.
 * Passed as `data` in the widget definition.
 *
 * @param {object} options
 * @returns {object}
 */
export function createFeedData(options = {}) {
  return {

    /**
     * Ordered list of feed items, newest first.
     * Each entry: { id, dot, label, sub, timestamp }
     * @type {object[]}
     */
    items: options.items ?? [],

    /**
     * Maximum number of items to display.
     * If items exceed this, a "view all" cue is shown.
     * @type {number}
     */
    limit: options.limit ?? 10,

  };
}

/**
 * Creates a single feed item.
 * @param {object} options
 * @returns {object}
 */
export function createFeedItem(options = {}) {
  return {
    /**
     * Unique identifier for the item.
     * @type {string}
     */
    id: options.id ?? '',

    /**
     * Dot variant for this item.
     * @type {string}
     */
    dot: options.dot ?? FEED_DOT.DEFAULT,

    /**
     * Primary label text.
     * @type {string}
     */
    label: options.label ?? '',

    /**
     * Optional secondary line below the label.
     * @type {string | null}
     */
    sub: options.sub ?? null,

    /**
     * Timestamp for relative time display.
     * @type {object | Date | null}  - Firestore timestamp or JS Date
     */
    timestamp: options.timestamp ?? null,
  };
}

//#endregion