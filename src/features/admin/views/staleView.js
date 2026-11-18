/**
 * staleView.js
 * @version 1.0.0
 *
 * Renders the Admin Stale Profiles page.
 * Called by adminRenderer.js. Never called directly by controllers.
 */

//#region Imports

import { escHtml, formatDate } from '../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Renders the stale profiles page into the admin content area.
 * @param {HTMLElement} content - the #js-admin-content element
 * @param {object}      state   - adminState
 */
export function renderStalePage(content, state) {
  content.innerHTML = `
    <div class="f-admin__page">

      <div class="f-admin__page-header">
        <div class="f-admin__page-header-left">
          <div class="f-admin__page-eyebrow">Admin · Stale Profiles</div>
          <div class="f-admin__page-title">STALE PROFILES</div>
          <div class="f-admin__page-sub">
            Prospect profiles with no modifications in 24+ months.
          </div>
        </div>
      </div>

      <div class="f-admin__info-banner">
        <div class="f-admin__info-banner-icon">ℹ</div>
        <div class="f-admin__info-banner-text">
          These profiles have had <strong>no modifications for 24 months or more</strong>.
          Review each one and decide whether to keep it or flag it for deletion.
          No action is taken automatically — this is a visibility prompt only.
        </div>
      </div>

      <div class="f-admin__section">
        <div class="f-admin__stale-toolbar">
          <div class="f-admin__stale-toolbar-left">
            <input
              id="js-stale-search"
              class="c-search"
              type="text"
              placeholder="Search prospects…"
              value="${escHtml(state.staleSearchQuery)}"
            />
            <button
              class="c-chip js-stale-role-filter ${!state.staleRoleFilter ? 'is-active' : ''}"
              data-role=""
            >All</button>
            ${['top','jg','mid','adc','sup'].map(role => `
              <button
                class="c-chip js-stale-role-filter ${state.staleRoleFilter === role ? 'is-active' : ''}"
                data-role="${escHtml(role)}"
              >${escHtml(role.toUpperCase())}</button>
            `).join('')}
          </div>
          <div class="f-admin__stale-toolbar-right">
            <span class="f-admin__stale-count">
              ${escHtml(String(state.filteredStale.length))} profiles
            </span>
          </div>
        </div>

        <div class="f-admin__stale-list">
          <div class="f-admin__stale-header">
            <div class="f-admin__stale-header-cell">Prospect</div>
            <div class="f-admin__stale-header-cell">Role</div>
            <div class="f-admin__stale-header-cell">Status</div>
            <div class="f-admin__stale-header-cell">Last Modified</div>
            <div class="f-admin__stale-header-cell">Inactive For</div>
            <div class="f-admin__stale-header-cell f-admin__stale-header-cell--right">Action</div>
          </div>
          ${state.isLoading
            ? _buildLoadingHTML()
            : state.filteredStale.length > 0
              ? state.filteredStale.map(_buildStaleRowHTML).join('')
              : _buildEmptyHTML()
          }
        </div>
      </div>

    </div>
  `;
}

//#endregion

//#region Private — Stale Rows

function _buildStaleRowHTML(prospect) {
  const inactiveMonths = _getInactiveMonths(prospect.updatedAt);
  const inactiveMod    = inactiveMonths >= 36 ? 'alert' : 'warn';

  return `
    <div class="f-admin__stale-row">
      <div class="f-admin__stale-row-player">
        <div class="f-admin__stale-row-name">
          ${escHtml(prospect.primaryRiotId || prospect.displayName || '—')}
        </div>
        <div class="f-admin__stale-row-id">${escHtml(prospect.id)}</div>
      </div>
      <div>
        <span class="c-role c-role-${escHtml(prospect.role?.toLowerCase() || '')}">
          ${escHtml(prospect.role?.toUpperCase() || '—')}
        </span>
      </div>
      <div>
        <span class="c-status c-status--${escHtml(prospect.status || '')}">
          ${escHtml(prospect.status || '—')}
        </span>
      </div>
      <div class="f-admin__stale-row-last-modified">
        ${escHtml(formatDate(prospect.updatedAt))}
      </div>
      <div class="f-admin__stale-row-inactive f-admin__stale-row-inactive--${escHtml(inactiveMod)}">
        ${escHtml(_formatInactiveDuration(inactiveMonths))}
      </div>
      <div class="f-admin__stale-row-actions">
        <button class="f-admin__btn-keep js-stale-keep" data-prospect-id="${escHtml(prospect.id)}">Keep</button>
        <button class="f-admin__btn-flag js-stale-flag" data-prospect-id="${escHtml(prospect.id)}">Flag Delete</button>
      </div>
    </div>
  `;
}

function _getInactiveMonths(updatedAt) {
  if (!updatedAt) return 0;
  const date   = updatedAt.toDate ? updatedAt.toDate() : new Date(updatedAt);
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
}

function _formatInactiveDuration(months) {
  if (months >= 12) {
    const years  = Math.floor(months / 12);
    const remain = months % 12;
    return remain > 0 ? `${years}y ${remain}m` : `${years}y`;
  }
  return `${months}m`;
}

//#endregion

//#region Private — Empty / Loading States

function _buildLoadingHTML() {
  return `<div class="f-admin__loading">Loading…</div>`;
}

function _buildEmptyHTML() {
  return `
    <div class="f-admin__empty-state">
      <div class="f-admin__empty-state-icon">✓</div>
      <div class="f-admin__empty-state-title">NO STALE PROFILES</div>
      <div class="f-admin__empty-state-sub">
        All profiles have been active within the last 24 months.
      </div>
    </div>
  `;
}

//#endregion