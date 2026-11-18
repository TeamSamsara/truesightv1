/**
 * feedWidgetRenderer.js
 * @version 1.0.0
 *
 * Renders the content for the feed widget type.
 * Produces the HTML string injected into the widget body slot.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/components/widget/widgets/feed/feedWidgetRenderer.js
 */

//#region Imports

import { escHtml, timeAgo } from '../../../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Builds the feed widget content HTML.
 * @param {object} data - feedWidgetData instance
 * @returns {string}
 */
export function renderFeedContent(data) {
  if (!data || !data.items.length) return _buildEmptyHTML();

  const visible = data.items.slice(0, data.limit);
  const hasMore = data.items.length > data.limit;

  return `
    <div class="c-feed-widget">
      <div class="c-feed-widget__list">
        ${visible.map(item => _buildItemHTML(item)).join('')}
      </div>
      ${hasMore ? _buildViewMoreHTML(data.items.length - data.limit) : ''}
    </div>
  `;
}

//#endregion

//#region Private — Item Builder

function _buildItemHTML(item) {
  return `
    <div class="c-feed-widget__item" data-feed-id="${escHtml(item.id)}">
      <div class="c-feed-widget__dot c-feed-widget__dot--${escHtml(item.dot)}"></div>
      <div class="c-feed-widget__content">
        <div class="c-feed-widget__label">${escHtml(item.label)}</div>
        ${item.sub ? `
          <div class="c-feed-widget__sub">${escHtml(item.sub)}</div>
        ` : ''}
      </div>
      ${item.timestamp ? `
        <div class="c-feed-widget__time">${escHtml(timeAgo(item.timestamp))}</div>
      ` : ''}
    </div>
  `;
}

function _buildViewMoreHTML(remaining) {
  return `
    <button class="c-feed-widget__more js-feed-more">
      ${escHtml(String(remaining))} more →
    </button>
  `;
}

function _buildEmptyHTML() {
  return `
    <div class="c-feed-widget c-feed-widget--empty">
      <div class="c-feed-widget__empty-text">No activity yet.</div>
    </div>
  `;
}

//#endregion