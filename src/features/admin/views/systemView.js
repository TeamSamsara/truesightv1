/**
 * systemView.js
 * @version 1.0.0
 *
 * Renders the Admin System page — Firestore cleanup controls and status.
 * Called by adminRenderer.js. Never called directly by controllers.
 */

//#region Imports

import { escHtml, formatDate } from '../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Renders the system page into the admin content area.
 * @param {HTMLElement} content - the #js-admin-content element
 * @param {object}      state   - adminState
 */
export function renderSystemPage(content, state) {
  const { cleanupCounts, cleanupMeta, isRunning, lastResult } = state.system;

  content.innerHTML = `
    <div class="f-admin__page">

      <div class="f-admin__page-header">
        <div class="f-admin__page-header-left">
          <div class="f-admin__page-eyebrow">Admin · System</div>
          <div class="f-admin__page-title">SYSTEM</div>
          <div class="f-admin__page-sub">
            Firestore maintenance and cleanup tools.
          </div>
        </div>
      </div>

      ${_buildCleanupSectionHTML(cleanupCounts, cleanupMeta, isRunning, lastResult)}

    </div>
  `;
}

//#endregion

//#region Private — Cleanup Section

function _buildCleanupSectionHTML(counts, meta, isRunning, lastResult) {
  const lastRunLabel    = meta?.lastRun    ? formatDate(meta.lastRun) : 'Never';
  const lastCountsLabel = meta?.lastCounts
    ? `${meta.lastCounts.tokens ?? 0} tokens · ${meta.lastCounts.sessions ?? 0} sessions`
    : '—';

  return `
    <div class="f-admin__section">

      <div class="f-admin__section-header">
        <div class="f-admin__section-title">FIRESTORE CLEANUP</div>
      </div>

      <div class="f-admin__system-body">

        <div class="f-admin__info-banner">
          <div class="f-admin__info-banner-icon">ℹ</div>
          <div class="f-admin__info-banner-text">
            Cleanup removes <strong>used and expired invite tokens</strong> and
            <strong>closed sessions older than 48 hours</strong>.
            Active sessions and audit trail entries are never touched.
          </div>
        </div>

        <div class="f-admin__system-grid">

          <div class="f-admin__system-card">
            <div class="f-admin__system-card-eyebrow">Invite Tokens</div>
            <div class="f-admin__system-card-value">${escHtml(String(counts.tokens ?? 0))}</div>
            <div class="f-admin__system-card-sub">stale records queued for deletion</div>
          </div>

          <div class="f-admin__system-card">
            <div class="f-admin__system-card-eyebrow">Sessions</div>
            <div class="f-admin__system-card-value">${escHtml(String(counts.sessions ?? 0))}</div>
            <div class="f-admin__system-card-sub">closed sessions older than 48h</div>
          </div>

          <div class="f-admin__system-card">
            <div class="f-admin__system-card-eyebrow">Last Run</div>
            <div class="f-admin__system-card-value f-admin__system-card-value--sm">${escHtml(lastRunLabel)}</div>
            <div class="f-admin__system-card-sub">${escHtml(lastCountsLabel)} removed</div>
          </div>

        </div>

        ${lastResult ? _buildResultHTML(lastResult) : ''}

        <div class="f-admin__system-actions">
          <button
            class="c-button c-button--primary js-system-run-cleanup"
            ${isRunning ? 'disabled' : ''}
          >
            ${isRunning ? 'Running…' : 'Run Cleanup'}
          </button>
          <span class="f-admin__system-actions-hint">
            ${counts.tokens + counts.sessions === 0
              ? 'Nothing to clean — collections are current.'
              : `${counts.tokens + counts.sessions} records will be deleted.`
            }
          </span>
        </div>

      </div>
    </div>
  `;
}

function _buildResultHTML(result) {
  const total = (result.tokens ?? 0) + (result.sessions ?? 0);
  return `
    <div class="f-admin__system-result">
      <span class="f-admin__system-result-icon">✓</span>
      Cleanup complete —
      <strong>${escHtml(String(result.tokens ?? 0))}</strong> tokens and
      <strong>${escHtml(String(result.sessions ?? 0))}</strong> sessions deleted
      (${escHtml(String(total))} total).
    </div>
  `;
}

//#endregion