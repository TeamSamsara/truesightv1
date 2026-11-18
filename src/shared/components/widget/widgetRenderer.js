/**
 * widgetRenderer.js
 * @version 1.0.0
 *
 * Renders the base widget chrome — header, loading overlay,
 * error state, and content slot.
 * Never generates or modifies content — that belongs to widget types.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/components/widget/widgetRenderer.js
 */

//#region Imports

import { escHtml } from '../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Renders the full widget chrome into the given container.
 * The content slot (.js-widget-body) is where widget types mount.
 * @param {HTMLElement} container
 * @param {object}      state     - widgetState instance
 */
export function renderWidget(container, state) {
  container.innerHTML = _buildWidgetHTML(state);
}

/**
 * Swaps the widget content without rebuilding the chrome.
 * Called by widget types when their data updates.
 * @param {HTMLElement} container
 * @param {string}      html
 */
export function setWidgetContent(container, html) {
  const body = container.querySelector('.js-widget-body');
  if (!body) return;
  body.innerHTML = html;
}

/**
 * Sets the widget loading overlay on or off.
 * @param {HTMLElement} container
 * @param {boolean}     value
 */
export function setWidgetLoadingState(container, value) {
  container.classList.toggle('is-loading', value);
}

/**
 * Updates the widget error state.
 * Shows or hides the error message without rebuilding the chrome.
 * @param {HTMLElement} container
 * @param {string|null} message
 */
export function setWidgetErrorState(container, message) {
  container.classList.toggle('is-error', !!message);

  const errorEl = container.querySelector('.js-widget-error');
  if (!errorEl) return;

  errorEl.textContent   = message ?? '';
  errorEl.style.display = message ? '' : 'none';
}

/**
 * Updates the widget title without rebuilding the chrome.
 * @param {HTMLElement} container
 * @param {string}      title
 */
export function setWidgetTitle(container, title) {
  const titleEl = container.querySelector('.js-widget-title');
  if (titleEl) titleEl.textContent = title;
}

//#endregion

//#region Private — Chrome Builder

/**
 * Builds the full widget chrome HTML.
 * @param {object} state - widgetState instance
 * @returns {string}
 */
function _buildWidgetHTML(state) {
  return `
    <div class="c-widget c-widget--${escHtml(state.variant)}">

      ${_buildHeaderHTML(state)}

      <div class="c-widget__body js-widget-body">
        ${state.isLoading ? '' : ''}
      </div>

      <div
        class="c-widget__error js-widget-error"
        style="display: ${state.error ? '' : 'none'}"
      >
        ${escHtml(state.error ?? '')}
      </div>

      <div class="c-widget__loading-overlay js-widget-loading">
        <div class="c-widget__spinner"></div>
      </div>

    </div>
  `;
}

/**
 * Builds the widget header — eyebrow, title, optional action button.
 * @param {object} state
 * @returns {string}
 */
function _buildHeaderHTML(state) {
  if (!state.title && !state.eyebrow && !state.actionLabel) return '';

  return `
    <div class="c-widget__header">
      <div class="c-widget__header-text">
        ${state.eyebrow ? `
          <div class="c-widget__eyebrow">${escHtml(state.eyebrow)}</div>
        ` : ''}
        <div class="c-widget__title js-widget-title">
          ${escHtml(state.title)}
        </div>
      </div>
      ${state.actionLabel ? `
        <button class="c-widget__action js-widget-action">
          ${escHtml(state.actionLabel)}
        </button>
      ` : ''}
    </div>
  `;
}

//#endregion