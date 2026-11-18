/**
 * approvalsView.js
 * @version 1.0.0
 *
 * Renders the Admin Approvals page.
 * Called by adminRenderer.js. Never called directly by controllers.
 */

//#region Imports

import { escHtml, formatDate, timeAgo } from '../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Renders the approvals page into the admin content area.
 * @param {HTMLElement} content - the #js-admin-content element
 * @param {object}      state   - adminState
 */
export function renderApprovalsPage(content, state) {
  content.innerHTML = `
    <div class="f-admin__page">

      <div class="f-admin__page-header">
        <div class="f-admin__page-header-left">
          <div class="f-admin__page-eyebrow">Admin · Approvals</div>
          <div class="f-admin__page-title">PENDING APPROVALS</div>
          <div class="f-admin__page-sub">
            Irreversible actions waiting for a second staff member to confirm.
          </div>
        </div>
      </div>

      <div class="f-admin__section">
        <div class="f-admin__approval-header">
          <div class="f-admin__approval-header-cell">Action</div>
          <div class="f-admin__approval-header-cell">Requested By</div>
          <div class="f-admin__approval-header-cell">Waiting</div>
          <div class="f-admin__approval-header-cell f-admin__approval-header-cell--right">Decision</div>
        </div>
        <div class="f-admin__approval-list">
          ${state.isLoading
            ? _buildLoadingHTML()
            : state.approvalList.length > 0
              ? state.approvalList.map(_buildApprovalItemHTML).join('')
              : _buildEmptyHTML()
          }
        </div>
      </div>

    </div>
  `;
}

//#endregion

//#region Private — Approval Items

function _buildApprovalItemHTML(item) {
  const typeMod   = _getTypeMod(item.actionType);
  const typeLabel = _getTypeLabel(item.actionType);
  const isUrgent  = _isUrgent(item.requestedAt);

  return `
    <div class="f-admin__approval-item">
      <div class="f-admin__approval-item-main">
        <div class="f-admin__approval-type f-admin__approval-type--${escHtml(typeMod)}">
          ${escHtml(typeLabel)}
        </div>
        <div class="f-admin__approval-description">
          ${escHtml(_buildDescription(item))}
        </div>
        <div class="f-admin__approval-reason">"${escHtml(item.reason || '')}"</div>
      </div>
      <div class="f-admin__approval-meta">
        <div class="f-admin__approval-requester">${escHtml(item.requestedBy?.staffName || '—')}</div>
        <div class="f-admin__approval-time">${escHtml(formatDate(item.requestedAt))}</div>
      </div>
      <div class="f-admin__approval-age ${isUrgent ? 'f-admin__approval-age--urgent' : ''}">
        ${escHtml(timeAgo(item.requestedAt))}
      </div>
      <div class="f-admin__approval-actions">
        <button class="f-admin__btn-reject js-approval-reject" data-approval-id="${escHtml(item.id)}">Reject</button>
        <button class="f-admin__btn-approve js-approval-approve" data-approval-id="${escHtml(item.id)}">Approve</button>
      </div>
    </div>
  `;
}

function _getTypeMod(actionType) {
  switch (actionType) {
    case 'DELETE_PROSPECT':       return 'delete';
    case 'STATUS_REENTRY':        return 'reentry';
    case 'REMOVE_STATUS_HISTORY': return 'history';
    default:                      return 'delete';
  }
}

function _getTypeLabel(actionType) {
  switch (actionType) {
    case 'DELETE_PROSPECT':       return '⚠ Delete Profile';
    case 'STATUS_REENTRY':        return '↩ Pipeline Re-entry';
    case 'REMOVE_STATUS_HISTORY': return '✕ Remove Status Entry';
    default:                      return actionType;
  }
}

function _buildDescription(item) {
  switch (item.actionType) {
    case 'DELETE_PROSPECT':       return `Permanent deletion of prospect ${item.payload?.prospectId || '—'}.`;
    case 'STATUS_REENTRY':        return `Pipeline re-entry. Proposed status: ${item.payload?.newStatus || '—'}.`;
    case 'REMOVE_STATUS_HISTORY': return `Removal of a status history entry on ${item.payload?.prospectId || '—'}.`;
    default:                      return 'Unknown action.';
  }
}

function _isUrgent(timestamp) {
  if (!timestamp) return false;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Date.now() - date.getTime() > 24 * 60 * 60 * 1000;
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
      <div class="f-admin__empty-state-title">ALL CLEAR</div>
      <div class="f-admin__empty-state-sub">No pending approvals at this time.</div>
    </div>
  `;
}

//#endregion