/**
 * dashboardState.js
 * @version 1.0.0
 *
 * State for the shared dashboard component.
 * Tracks the widget registry, layout, and loading states.
 * No feature-specific logic — the caller owns widget definitions.
 *
 * Target path: src/shared/components/dashboard/dashboardState.js
 */

//#region Constants

/**
 * Available widget size variants.
 * Controls how many grid columns a widget occupies.
 */
export const WIDGET_SIZE = {
  SM:   'sm',   // 1 column
  MD:   'md',   // 2 columns
  LG:   'lg',   // 3 columns
  FULL: 'full', // full width
};

/**
 * Available widget type identifiers.
 * Each type maps to a dedicated renderer in widgets/.
 */
export const WIDGET_TYPE = {
  STAT:     'stat',
  FEED:     'feed',
  CALENDAR: 'calendar',
  LIST:     'list',
  CUSTOM:   'custom',
};

//#endregion

//#region State

/**
 * Dashboard component state.
 * Widgets are the single source of truth — everything else is derived.
 */
export const dashboardState = {

  /**
   * Ordered list of widget definitions.
   * Each widget: { id, type, size, title, data, isLoading, error, onAction }
   * @type {object[]}
   */
  widgets: [],

  /**
   * Whether the dashboard itself is initializing.
   * True until the first render completes.
   * @type {boolean}
   */
  isInitializing: true,

};

//#endregion

//#region State Helpers

/**
 * Replaces the full widget registry.
 * @param {object[]} widgets
 */
export function setWidgets(widgets) {
  dashboardState.widgets = widgets.map(w => _normalizeWidget(w));
}

/**
 * Updates a single widget's data by id.
 * Merges the provided fields — does not replace the whole widget.
 * @param {string} id
 * @param {object} fields - partial widget fields to merge
 */
export function updateWidget(id, fields) {
  const widget = dashboardState.widgets.find(w => w.id === id);
  if (!widget) return;
  Object.assign(widget, fields);
}

/**
 * Sets the loading state for a specific widget.
 * @param {string}  id
 * @param {boolean} value
 */
export function setWidgetLoading(id, value) {
  updateWidget(id, { isLoading: value });
}

/**
 * Sets the error state for a specific widget.
 * @param {string}      id
 * @param {string|null} message
 */
export function setWidgetError(id, message) {
  updateWidget(id, { error: message, isLoading: false });
}

/**
 * Marks the dashboard initialization as complete.
 */
export function setDashboardReady() {
  dashboardState.isInitializing = false;
}

/**
 * Resets the dashboard state to defaults.
 * Called on destroy.
 */
export function resetDashboardState() {
  dashboardState.widgets        = [];
  dashboardState.isInitializing = true;
}

//#endregion

//#region Private Helpers

/**
 * Normalizes a widget definition — fills in defaults for optional fields.
 * @param {object} widget
 * @returns {object}
 */
function _normalizeWidget(widget) {
  return {
    id:        widget.id,
    type:      widget.type,
    size:      widget.size      ?? WIDGET_SIZE.MD,
    title:     widget.title     ?? '',
    data:      widget.data      ?? null,
    isLoading: widget.isLoading ?? true,
    error:     widget.error     ?? null,
    onAction:  widget.onAction  ?? null,
  };
}

//#endregion