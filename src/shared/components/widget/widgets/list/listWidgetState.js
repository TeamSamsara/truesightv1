/**
 * listWidgetState.js
 * @version 1.0.0
 *
 * State for the list widget type.
 * Displays a labeled list of items — roster members,
 * pending tasks, alerts, or any key/value collection.
 *
 * Target path: src/shared/components/widget/widgets/list/listWidgetState.js
 */

//#region Constants

/**
 * List item badge variant — controls badge color.
 */
export const LIST_BADGE = {
  DEFAULT: 'default',
  PASS:    'pass',
  ALERT:   'alert',
  GOLD:    'gold',
  INFO:    'info',
};

//#endregion

//#region Factory

/**
 * Creates a fresh list widget data object.
 * Passed as `data` in the widget definition.
 *
 * @param {object} options
 * @returns {object}
 */
export function createListData(options = {}) {
  return {

    /**
     * Ordered list of items to display.
     * Each entry: { id, label, sub, meta, badge, badgeVariant, onClick }
     * @type {object[]}
     */
    items: options.items ?? [],

    /**
     * Maximum number of items to display before showing a view-more cue.
     * @type {number}
     */
    limit: options.limit ?? 8,

  };
}

/**
 * Creates a single list item.
 * @param {object} options
 * @returns {object}
 */
export function createListItem(options = {}) {
  return {

    /**
     * Unique identifier for the item.
     * @type {string}
     */
    id: options.id ?? '',

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
     * Optional right-aligned meta text.
     * @type {string | null}
     */
    meta: options.meta ?? null,

    /**
     * Optional badge value displayed alongside the label.
     * @type {string | number | null}
     */
    badge: options.badge ?? null,

    /**
     * Badge color variant.
     * @type {string}
     */
    badgeVariant: options.badgeVariant ?? LIST_BADGE.DEFAULT,

    /**
     * Optional click callback for the item row.
     * @type {Function | null}
     */
    onClick: options.onClick ?? null,

  };
}

//#endregion