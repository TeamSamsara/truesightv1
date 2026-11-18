/**
 * dashboardRenderer.js
 * @version 1.0.0
 *
 * Renders the dashboard shell and widget grid.
 * Owns the grid layout only — individual widget content
 * is delegated to the widget component.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/components/dashboard/dashboardRenderer.js
 */

//#region Imports

import { escHtml }                   from '../../../utils/helpers.js';
import { dashboardState, WIDGET_SIZE } from './dashboardState.js';

//#endregion

//#region Constants

const DASHBOARD_ID = 'c-dashboard';
const GRID_ID      = 'js-dashboard-grid';

//#endregion

//#region Public API

/**
 * Renders the full dashboard shell into the container.
 * @param {HTMLElement} container
 */
export function renderDashboard(container) {
  container.innerHTML = _buildDashboardHTML();
}

/**
 * Renders all widgets into the grid.
 * Called after initial render and on full widget set replacement.
 */
export function renderWidgets() {
  const grid = document.getElementById(GRID_ID);
  if (!grid) return;

  if (dashboardState.isInitializing) {
    grid.innerHTML = _buildSkeletonHTML();
    return;
  }

  if (!dashboardState.widgets.length) {
    grid.innerHTML = _buildEmptyHTML();
    return;
  }

  grid.innerHTML = dashboardState.widgets
    .map(widget => _buildWidgetSlotHTML(widget))
    .join('');
}

/**
 * Surgically updates a single widget slot without re-rendering the grid.
 * The widget component renders its own content into this slot.
 * @param {string} id - widget id
 * @returns {HTMLElement | null} - the widget slot element
 */
export function getWidgetSlot(id) {
  return document.getElementById(`js-widget-slot-${id}`);
}

/**
 * Updates the widget slot chrome — loading, error states — without
 * touching the widget content area.
 * @param {object} widget
 */
export function updateWidgetSlotState(widget) {
  const slot = getWidgetSlot(widget.id);
  if (!slot) return;

  slot.classList.toggle('is-loading', widget.isLoading);
  slot.classList.toggle('is-error',   !!widget.error);

  const errorEl = slot.querySelector('.js-widget-error');
  if (errorEl) {
    errorEl.textContent  = widget.error ?? '';
    errorEl.style.display = widget.error ? '' : 'none';
  }
}

//#endregion

//#region Private — Dashboard Shell

function _buildDashboardHTML() {
  return `
    <div class="${DASHBOARD_ID}" id="${DASHBOARD_ID}">
      <div class="c-dashboard__grid" id="${GRID_ID}">
        ${_buildSkeletonHTML()}
      </div>
    </div>
  `;
}

//#endregion

//#region Private — Widget Slot

/**
 * Builds the widget slot wrapper — the chrome the dashboard owns.
 * The widget component mounts its content into .js-widget-content.
 * @param {object} widget
 * @returns {string}
 */
function _buildWidgetSlotHTML(widget) {
  const sizeClass = `c-dashboard__slot--${escHtml(widget.size)}`;
  const loadingClass = widget.isLoading ? 'is-loading' : '';
  const errorClass   = widget.error     ? 'is-error'   : '';

  return `
    <div
      class="c-dashboard__slot ${sizeClass} ${loadingClass} ${errorClass}"
      id="js-widget-slot-${escHtml(widget.id)}"
      data-widget-id="${escHtml(widget.id)}"
      data-widget-type="${escHtml(widget.type)}"
    >
      <div class="c-dashboard__slot-inner">
        <div class="js-widget-content"></div>
        <div
          class="js-widget-error c-dashboard__slot-error"
          style="display: ${widget.error ? '' : 'none'}"
        >${escHtml(widget.error ?? '')}</div>
      </div>
    </div>
  `;
}

//#endregion

//#region Private — Loading / Empty States

/**
 * Builds skeleton placeholder slots while the dashboard initializes.
 * @returns {string}
 */
function _buildSkeletonHTML() {
  return [
    WIDGET_SIZE.MD,
    WIDGET_SIZE.MD,
    WIDGET_SIZE.SM,
    WIDGET_SIZE.SM,
    WIDGET_SIZE.LG,
  ].map(size => `
    <div class="c-dashboard__slot c-dashboard__slot--${size} is-skeleton">
      <div class="c-dashboard__slot-inner">
        <div class="c-dashboard__skeleton-block"></div>
      </div>
    </div>
  `).join('');
}

function _buildEmptyHTML() {
  return `
    <div class="c-dashboard__empty">
      <div class="c-dashboard__empty-text">No widgets configured.</div>
    </div>
  `;
}

//#endregion