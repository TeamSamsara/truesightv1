/**
 * statWidgetRenderer.js
 * @version 1.0.0
 *
 * Renders the content for the stat widget type.
 * Produces the HTML string injected into the widget body slot.
 * No fetch calls or state writes
 *
 * Target path: src/shared/components/widget/widgets/stat/statWidgetRenderer.js
 */

//#region Imports

import { escHtml }    from '../../../../../utils/helpers.js';
import { STAT_TREND } from './statWidgetState.js';

//#endregion

//#region Public API

/**
 * Builds the stat widget content HTML.
 * @param {object} data - statWidgetData instance
 * @returns {string}
 */
export function renderStatContent(data) {
  if (!data) return _buildEmptyHTML();

  return `
    <div class="c-stat-widget">
      <div class="c-stat-widget__value">
        ${escHtml(String(data.value))}
        ${_buildTrendHTML(data)}
      </div>
      ${data.sub ? `
        <div class="c-stat-widget__sub">${escHtml(data.sub)}</div>
      ` : ''}
      ${data.breakdown.length > 0 ? _buildBreakdownHTML(data.breakdown) : ''}
    </div>
  `;
}

//#endregion

//#region Private — Content Builders

function _buildTrendHTML(data) {
  if (!data.trend || data.trend === STAT_TREND.NEUTRAL) return '';

  const icon  = data.trend === STAT_TREND.UP ? '↑' : '↓';
  const mod   = data.trend === STAT_TREND.UP ? 'up' : 'down';
  const label = data.trendLabel ? escHtml(data.trendLabel) : '';

  return `
    <span class="c-stat-widget__trend c-stat-widget__trend--${mod}">
      ${icon}${label ? ` <span class="c-stat-widget__trend-label">${label}</span>` : ''}
    </span>
  `;
}

function _buildBreakdownHTML(breakdown) {
  return `
    <div class="c-stat-widget__breakdown">
      ${breakdown.map(item => `
        <div class="c-stat-widget__breakdown-item">
          <span class="c-stat-widget__breakdown-label">${escHtml(item.label)}</span>
          <span class="c-stat-widget__breakdown-value">${escHtml(String(item.value))}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function _buildEmptyHTML() {
  return `<div class="c-stat-widget c-stat-widget--empty">—</div>`;
}

//#endregion