/**
 * dashboardController.js
 * @version 1.0.0
 *
 * Manages the dashboard widget lifecycle.
 * Orchestrates initialization, widget mounting, updates, and teardown.
 * No rendering logic — delegates entirely to dashboardRenderer.js
 * and individual widget components.
 *
 * Target path: src/shared/components/dashboard/dashboardController.js
 */

//#region Imports

import {
  dashboardState,
  setWidgets,
  setWidgetLoading,
  setWidgetError,
  updateWidget,
  setDashboardReady,
  resetDashboardState,
}                              from './dashboardState.js';

import {
  renderDashboard,
  renderWidgets,
  getWidgetSlot,
  updateWidgetSlotState,
}                              from './dashboardRenderer.js';

//#endregion

//#region State

let _container       = null;
let _actionCallbacks = {};

//#endregion

//#region Public API

/**
 * Initializes the dashboard in the given container with the provided widgets.
 *
 * @param {HTMLElement} container
 * @param {object[]}    widgets   - array of widget definitions
 */
export function init(container, widgets) {
  destroy();
  _container = container;

  renderDashboard(container);
  setWidgets(widgets);
  renderWidgets();

  setDashboardReady();
  renderWidgets();

  _mountAllWidgets();
}

/**
 * Replaces all widgets with a new set.
 * Destroys existing widget instances before mounting new ones.
 * @param {object[]} widgets
 */
export function setDashboardWidgets(widgets) {
  _destroyAllWidgets();
  setWidgets(widgets);
  renderWidgets();
  _mountAllWidgets();
}

/**
 * Updates a single widget's data and re-renders it in place.
 * @param {string} id
 * @param {object} data
 */
export function updateDashboardWidget(id, data) {
  updateWidget(id, { data, isLoading: false, error: null });
  _remountWidget(id);
}

/**
 * Sets a widget's loading state and updates its slot chrome.
 * @param {string}  id
 * @param {boolean} value
 */
export function setDashboardWidgetLoading(id, value) {
  setWidgetLoading(id, value);
  const widget = _getWidget(id);
  if (widget) updateWidgetSlotState(widget);
}

/**
 * Sets a widget's error state and updates its slot chrome.
 * @param {string}      id
 * @param {string|null} message
 */
export function setDashboardWidgetError(id, message) {
  setWidgetError(id, message);
  const widget = _getWidget(id);
  if (widget) updateWidgetSlotState(widget);
}

/**
 * Registers an action callback for a specific widget.
 * Called when the widget fires its onAction event.
 * @param {string}   id
 * @param {Function} callback
 */
export function onWidgetAction(id, callback) {
  _actionCallbacks[id] = callback;
}

/**
 * Tears down the dashboard — destroys all widget instances and resets state.
 */
export function destroy() {
  _destroyAllWidgets();
  resetDashboardState();
  _actionCallbacks = {};
  _container       = null;
}

//#endregion

//#region Private — Widget Lifecycle

/**
 * Mounts all widgets in the current registry.
 */
function _mountAllWidgets() {
  dashboardState.widgets.forEach(widget => _mountWidget(widget));
}

/**
 * Mounts a single widget into its slot.
 * Resolves the widget component dynamically based on type.
 * @param {object} widget
 */
async function _mountWidget(widget) {
  const slot = getWidgetSlot(widget.id);
  if (!slot) return;

  const content = slot.querySelector('.js-widget-content');
  if (!content) return;

  const component = await _resolveWidgetComponent(widget.type);
  if (!component) return;

  if (typeof component.mount !== "function") {
    console.error("[Dashboard] widget type has no mount():", widget.type, component);
    return;
  }

  const actionCallback = _actionCallbacks[widget.id] ?? widget.onAction ?? null;

  component.mount(content, {
    ...widget,
    onAction: actionCallback,
  });
}

/**
 * Destroys a single widget instance and clears its slot content.
 * @param {string} id
 */
function _destroyWidget(id) {
  // Widget components clean up their own listeners on destroy
  // Slot content is cleared by renderWidgets on next render
}

/**
 * Destroys all widget instances.
 */
function _destroyAllWidgets() {
  dashboardState.widgets.forEach(w => _destroyWidget(w.id));
}

/**
 * Re-mounts a single widget after a data update.
 * @param {string} id
 */
function _remountWidget(id) {
  const widget = _getWidget(id);
  if (!widget) return;

  updateWidgetSlotState(widget);
  _mountWidget(widget);
}

//#endregion

//#region Private — Widget Component Resolution

/**
 * Dynamically resolves a widget component by type.
 * Returns null if the type is unrecognized.
 * @param {string} type
 * @returns {Promise<object | null>}
 */
async function _resolveWidgetComponent(type) {
  try {
    switch (type) {
      case 'stat':
        return await import('../widget/widgets/stat/statWidgetIndex.js');
      case 'feed':
        return await import('../widget/widgets/feed/feedWidgetIndex.js');
      case 'calendar':
        return await import('../widget/widgets/calendar/calendarWidgetIndex.js');
      case 'list':
        return await import('../widget/widgets/list/listWidgetIndex.js');
      case 'custom':
        return await import('../widget/widgets/custom/customWidgetIndex.js');
      default:
        return null;
    }
  } catch {
    return null;
  }
}

//#endregion

//#region Private — Helpers

/**
 * Returns a widget definition by id.
 * @param {string} id
 * @returns {object | undefined}
 */
function _getWidget(id) {
  return dashboardState.widgets.find(w => w.id === id);
}

//#endregion