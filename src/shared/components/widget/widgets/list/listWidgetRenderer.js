/**
 * listWidgetRenderer.js
 * @version 1.0.0
 *
 * Renders the content for the list widget type.
 * Produces the HTML string injected into the widget body slot.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/components/widget/widgets/list/listWidgetRenderer.js
 */

//#region Imports

import { escHtml } from '../../../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Builds the list widget content HTML.
 * @param {object} data - listWidgetData instance
 * @returns {string}
 */
export function renderListContent(data) {
  if (!data || !data.items.length) return _buildEmptyHTML();

  const visible = data.items.slice(0, data.limit);
  const hasMore = data.items.length > data.limit;

  return `
    <div class="c-list-widget">
      <div class="c-list-widget__list">
        ${visible.map(item => _buildItemHTML(item)).join('')}
      </div>
      ${hasMore ? _buildViewMoreHTML(data.items.length - data.limit) : ''}
    </div>
  `;
}

//#endregion

//#region Private — Item Builder

function _buildItemHTML(item) {
  const isClickable = typeof item.onClick === 'function';

  return `
    <div
      class="c-list-widget__item ${isClickable ? 'is-clickable' : ''}"
      data-list-id="${escHtml(item.id)}"
    >
      <div class="c-list-widget__item-main">
        <div class="c-list-widget__item-label">
          ${escHtml(item.label)}
          ${item.badge !== null ? `
            <span class="c-list-widget__badge c-list-widget__badge--${escHtml(item.badgeVariant)}">
              ${escHtml(String(item.badge))}
            </span>
          ` : ''}
        </div>
        ${item.sub ? `
          <div class="c-list-widget__item-sub">${escHtml(item.sub)}</div>
        ` : ''}
      </div>
      ${item.meta ? `
        <div class="c-list-widget__item-meta">${escHtml(item.meta)}</div>
      ` : ''}
    </div>
  `;
}

function _buildViewMoreHTML(remaining) {
  return `
    <button class="c-list-widget__more js-list-more">
      ${escHtml(String(remaining))} more →
    </button>
  `;
}

function _buildEmptyHTML() {
  return `
    <div class="c-list-widget c-list-widget--empty">
      <div class="c-list-widget__empty-text">Nothing to show.</div>
    </div>
  `;
}

//#endregion