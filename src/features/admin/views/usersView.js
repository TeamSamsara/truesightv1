/**
 * usersView.js
 * @version 1.0.0
 *
 * Renders the Admin Users page — list, toolbar, row menus.
 * Shows all platform users — admins, staff, players.
 * Called by adminRenderer.js. Never called directly by controllers.
 *
 * Target path: src/features/admin/views/usersView.js
 */

//#region Imports

import { escHtml, formatDate } from '../../../utils/helpers.js';
import {
  USER_TYPE_LABEL,
  USER_ROLE_LABEL,
  USER_TYPE,
}                              from '../../../constants/roles.js';

//#endregion

//#region Public API

/**
 * Renders the user management page into the admin content area.
 * @param {HTMLElement} content - the #js-admin-content element
 * @param {object}      state   - adminState
 */
export function renderUsersPage(content, state) {
  content.innerHTML = `
    <div class="f-admin__page">

      <div class="f-admin__page-header">
        <div class="f-admin__page-header-left">
          <div class="f-admin__page-eyebrow">Admin · Users</div>
          <div class="f-admin__page-title">USER MANAGEMENT</div>
          <div class="f-admin__page-sub">Manage platform access across all user types.</div>
        </div>
      </div>

      <div class="f-admin__section">
        <div class="f-admin__users-toolbar">
          <div class="f-admin__users-toolbar-left">
            <input
              id="js-users-search"
              class="c-search f-admin__users-search"
              type="text"
              placeholder="Search users…"
              value="${escHtml(state.userSearchQuery)}"
            />
            <button
              class="c-chip js-users-type-filter ${!state.userTypeFilter ? 'is-active' : ''}"
              data-type=""
            >All</button>
            ${Object.entries(USER_TYPE_LABEL).map(([type, label]) => `
              <button
                class="c-chip js-users-type-filter ${state.userTypeFilter === type ? 'is-active' : ''}"
                data-type="${escHtml(type)}"
              >${escHtml(label)}</button>
            `).join('')}
            ${state.userTypeFilter === USER_TYPE.STAFF ? `
              <div class="f-admin__users-toolbar-divider"></div>
              <button
                class="c-chip js-users-role-filter ${!state.userRoleFilter ? 'is-active' : ''}"
                data-role=""
              >All Roles</button>
              ${Object.entries(USER_ROLE_LABEL).map(([role, label]) => `
                <button
                  class="c-chip js-users-role-filter ${state.userRoleFilter === role ? 'is-active' : ''}"
                  data-role="${escHtml(role)}"
                >${escHtml(label)}</button>
              `).join('')}
            ` : ''}
            <label class="f-admin__inactive-toggle">
              <input
                id="js-users-show-inactive"
                type="checkbox"
                ${state.showInactive ? 'checked' : ''}
              />
              Show Inactive
            </label>
          </div>
          <div class="f-admin__users-toolbar-right">
            <span class="f-admin__users-count">
              ${escHtml(String(state.filteredUsers.length))} users
            </span>
          </div>
        </div>

        <div class="f-admin__users-list">
          ${_buildListHeaderHTML()}
          ${state.isLoading
            ? _buildLoadingHTML()
            : state.filteredUsers.length > 0
              ? state.filteredUsers.map(u => _buildUserRowHTML(u, state.rowMenu.openUserId)).join('')
              : _buildEmptyHTML()
          }
        </div>
      </div>

    </div>
  `;
}

/**
 * Surgically renders the row menu for a specific user.
 * @param {string} userId
 * @param {object} user
 */
export function renderRowMenu(userId, user) {
  const wrap = document.getElementById(`js-row-menu-btn-${userId}`)?.parentElement;
  if (!wrap) return;

  const existing = wrap.querySelector('.f-admin__users-row-menu');
  if (existing) { existing.remove(); return; }

  wrap.insertAdjacentHTML('beforeend', _buildRowMenuHTML(user));
}

//#endregion

//#region Private — List Header

function _buildListHeaderHTML() {
  return `
    <div class="f-admin__users-list-header">
      <div class="f-admin__users-header-cell">Name</div>
      <div class="f-admin__users-header-cell">Type / Role</div>
      <div class="f-admin__users-header-cell">TrueSight ID</div>
      <div class="f-admin__users-header-cell">Last Login</div>
      <div class="f-admin__users-header-cell">Status</div>
      <div class="f-admin__users-header-cell"></div>
    </div>
  `;
}

//#endregion

//#region Private — User Rows

function _buildUserRowHTML(user, openMenuUserId) {
  const isMenuOpen = openMenuUserId === user.id;
  const isInactive = !user.active;

  return `
    <div class="f-admin__users-row ${isInactive ? 'f-admin__users-row--inactive' : ''}">

      <div class="f-admin__users-row-name">
        <div class="f-admin__users-row-display-name-wrap">
          <span class="f-admin__users-row-display-name">
            ${escHtml(user.displayName || user.name || '—')}
          </span>
        </div>
        <div class="f-admin__users-row-real-name">
          ${escHtml(user.name || '')}
        </div>
      </div>

      <div class="f-admin__users-row-type">
        <span class="f-admin__users-type-badge f-admin__users-type-badge--${escHtml(user.type)}">
          ${escHtml(USER_TYPE_LABEL[user.type] || user.type)}
        </span>
        ${user.role ? `
          <span class="f-admin__users-role-badge">
            ${escHtml(USER_ROLE_LABEL[user.role] || user.role)}
          </span>
        ` : ''}
      </div>

      <div class="f-admin__users-row-truesight-id">
        ${user.trueSightId
          ? escHtml(user.trueSightId)
          : user.tempId
            ? `<span class="f-admin__users-temp-id">${escHtml(user.tempId)}</span>`
            : '<span class="u-na">—</span>'
        }
      </div>

      <div class="f-admin__users-row-last-login">
        ${user.lastLoginAt
          ? escHtml(formatDate(user.lastLoginAt))
          : '<span class="u-na">Never</span>'
        }
      </div>

      <div class="f-admin__users-row-status">
        ${_buildStatusHTML(user)}
      </div>

      <div class="f-admin__users-row-actions">
        <div class="f-admin__users-row-menu-wrap">
          <button
            class="f-admin__users-row-menu-btn js-users-row-menu-btn ${isMenuOpen ? 'is-active' : ''}"
            data-user-id="${escHtml(user.id)}"
            id="js-row-menu-btn-${escHtml(user.id)}"
          >⋯</button>
          ${isMenuOpen ? _buildRowMenuHTML(user) : ''}
        </div>
      </div>

    </div>
  `;
}

function _buildStatusHTML(user) {
  if (!user.active) return `
    <span class="f-admin__users-status f-admin__users-status--inactive">
      <span class="f-admin__users-status-dot"></span>Inactive
    </span>`;

  if (user.isFirstLogin) return `
    <span class="f-admin__users-status f-admin__users-status--pending">
      <span class="f-admin__users-status-dot"></span>Awaiting Setup
    </span>`;

  return `
    <span class="f-admin__users-status f-admin__users-status--active">
      <span class="f-admin__users-status-dot"></span>Active
    </span>`;
}

//#endregion

//#region Private — Row Menu

function _buildRowMenuHTML(user) {
  return `
    <div class="f-admin__users-row-menu" id="js-row-menu-${escHtml(user.id)}">
      <button class="f-admin__row-menu-item" id="js-row-reset-${escHtml(user.id)}">
        Reset Password
      </button>
      ${user.type === USER_TYPE.STAFF ? `
        <button class="f-admin__row-menu-item" id="js-row-role-${escHtml(user.id)}">
          Change Role
        </button>
      ` : ''}
      <div class="f-admin__row-menu-divider"></div>
      ${user.active
        ? `<button class="f-admin__row-menu-item f-admin__row-menu-item--danger" id="js-row-deactivate-${escHtml(user.id)}">
            Deactivate Account
           </button>`
        : `<button class="f-admin__row-menu-item" id="js-row-reactivate-${escHtml(user.id)}">
            Reactivate Account
           </button>`
      }
      <div class="f-admin__row-menu-divider"></div>
      <button class="f-admin__row-menu-item" id="js-row-log-${escHtml(user.id)}">
        View Action Log
      </button>
    </div>
  `;
}

//#endregion

//#region Private — Empty / Loading States

function _buildLoadingHTML() {
  return `<div class="f-admin__loading">Loading…</div>`;
}

function _buildEmptyHTML() {
  return `
    <div class="f-admin__empty-state">
      <div class="f-admin__empty-state-icon">👤</div>
      <div class="f-admin__empty-state-title">NO USERS FOUND</div>
      <div class="f-admin__empty-state-sub">
        No user accounts match your current filters.
      </div>
    </div>
  `;
}

//#endregion