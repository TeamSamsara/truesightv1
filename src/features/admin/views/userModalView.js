/**
 * userModalView.js
 * @version 1.0.0
 *
 * Builds HTML strings for all user-related modal content.
 * Covers the create-user flow (steps 1–3) and row action modals
 * (reset password, change role, deactivate, action log).
 *
 * Called by adminController and passed to Modal.open() / Modal.setContent().
 * No overlay management, no DOM queries — HTML strings only.
 *
 * Target path: src/features/admin/views/userModalView.js
 */

//#region Imports

import { escHtml, timeAgo }       from '../../../utils/helpers.js';
import { USER_TYPE_LABEL,
         USER_ROLE_LABEL,
         USER_TYPE }              from '../../../constants/roles.js';
import {
  USER_MODAL_STEPS,
  DELIVERY_METHOD,
}                                 from '../adminState.js';

//#endregion

//#region Public API — Create User Flow

/**
 * Builds the step progress indicator HTML.
 * @param {number} currentStep
 * @returns {string}
 */
export function buildModalStepsHTML(currentStep) {
  const steps = [
    { num: USER_MODAL_STEPS.DETAILS,  label: 'Details'  },
    { num: USER_MODAL_STEPS.DELIVERY, label: 'Delivery' },
    { num: USER_MODAL_STEPS.CONFIRM,  label: 'Confirm'  },
  ];

  return `
    <div class="c-modal__steps">
      ${steps.map((step, i) => {
        const isDone   = currentStep > step.num;
        const isActive = currentStep === step.num;
        return `
          ${i > 0 ? `<div class="c-modal__step-line ${isDone ? 'is-done' : ''}"></div>` : ''}
          <div class="c-modal__step-item">
            <div class="c-modal__step-num ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}">
              ${isDone ? '✓' : escHtml(String(step.num))}
            </div>
            <div class="c-modal__step-name ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}">
              ${escHtml(step.label)}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Builds step 1 — user details form.
 * Role selector only shown when type === USER_TYPE.STAFF.
 * @param {object}      modalForm - { name, email, type, role }
 * @param {string|null} error
 * @returns {string}
 */
export function buildStep1HTML(modalForm, error) {
  return `
    ${buildModalStepsHTML(USER_MODAL_STEPS.DETAILS)}
    ${error ? `<div class="c-form-error">${escHtml(error)}</div>` : ''}
    <div class="c-field">
      <label class="c-field__label c-field__label--required" for="js-modal-user-name">
        Full Name
      </label>
      <input
        id="js-modal-user-name"
        class="c-input"
        type="text"
        placeholder="Emma Davis"
        value="${escHtml(modalForm.name)}"
      />
    </div>
    <div class="c-field">
      <label class="c-field__label c-field__label--required" for="js-modal-user-email">
        Email Address
      </label>
      <input
        id="js-modal-user-email"
        class="c-input"
        type="email"
        placeholder="emma@teamsamsara.gg"
        value="${escHtml(modalForm.email)}"
      />
    </div>
    <div class="c-field">
      <label class="c-field__label c-field__label--required" for="js-modal-user-type">
        User Type
      </label>
      <select id="js-modal-user-type" class="c-select c-select--field">
        <option value="">Select a type…</option>
        ${Object.entries(USER_TYPE_LABEL)
          .filter(([type]) => type !== USER_TYPE.DEV)
          .map(([type, label]) => `
            <option value="${escHtml(type)}" ${modalForm.type === type ? 'selected' : ''}>
              ${escHtml(label)}
            </option>
          `).join('')}
      </select>
    </div>
    ${modalForm.type === USER_TYPE.STAFF ? `
      <div class="c-field">
        <label class="c-field__label c-field__label--required" for="js-modal-user-role">
          Staff Role
        </label>
        <select id="js-modal-user-role" class="c-select c-select--field">
          <option value="">Select a role…</option>
          ${Object.entries(USER_ROLE_LABEL).map(([role, label]) => `
            <option value="${escHtml(role)}" ${modalForm.role === role ? 'selected' : ''}>
              ${escHtml(label)}
            </option>
          `).join('')}
        </select>
      </div>
    ` : ''}
    <div class="c-modal__footer">
      <button class="c-button c-button--ghost" id="js-modal-cancel">Cancel</button>
      <button class="c-button c-button--gold" id="js-modal-step1-next">Next →</button>
    </div>
  `;
}

/**
 * Builds step 2 — delivery method selection.
 * @param {string}      userName
 * @param {string}      deliveryMethod
 * @param {string|null} error
 * @returns {string}
 */
export function buildStep2HTML(userName, deliveryMethod, error) {
  return `
    ${buildModalStepsHTML(USER_MODAL_STEPS.DELIVERY)}
    ${error ? `<div class="c-form-error">${escHtml(error)}</div>` : ''}
    <div class="c-modal__body-hint">
      How would you like to deliver credentials to
      <strong>${escHtml(userName)}</strong>?
    </div>
    <div class="f-admin__delivery-options">
      <button
        class="f-admin__delivery-option js-delivery-option ${deliveryMethod === DELIVERY_METHOD.COPY ? 'is-selected' : ''}"
        data-method="${DELIVERY_METHOD.COPY}"
      >
        <div class="f-admin__delivery-option-icon">📋</div>
        <div class="f-admin__delivery-option-content">
          <div class="f-admin__delivery-option-title">Copy &amp; Paste</div>
          <div class="f-admin__delivery-option-sub">
            Credentials shown once — copy and share manually
          </div>
        </div>
      </button>
      <button
        class="f-admin__delivery-option js-delivery-option ${deliveryMethod === DELIVERY_METHOD.INVITE ? 'is-selected' : ''}"
        data-method="${DELIVERY_METHOD.INVITE}"
      >
        <div class="f-admin__delivery-option-icon">🔗</div>
        <div class="f-admin__delivery-option-content">
          <div class="f-admin__delivery-option-title">Invite Link</div>
          <div class="f-admin__delivery-option-sub">
            Generate a one-time link valid for 24 hours
          </div>
        </div>
      </button>
    </div>
    <div class="c-modal__footer">
      <button class="c-button c-button--ghost" id="js-modal-step2-back">← Back</button>
      <button class="c-button c-button--gold" id="js-modal-step2-submit">
        Create Account →
      </button>
    </div>
  `;
}

/**
 * Builds step 3 — credentials display.
 * @param {string}  userName
 * @param {object}  credentials - { email, tempId, tempPassword, inviteLink }
 * @param {boolean} isInvite
 * @returns {string}
 */
export function buildStep3HTML(userName, credentials, isInvite) {
  return `
    ${buildModalStepsHTML(USER_MODAL_STEPS.CONFIRM)}
    <div class="c-modal__body-hint">
      Account created for <strong>${escHtml(userName)}</strong>.
      ${isInvite
        ? 'Share the invite link — it expires in 24 hours.'
        : 'Share these credentials — they will not be shown again.'
      }
    </div>
    <div class="c-modal__credential-block">
      ${credentials.email ? `
        <div class="c-modal__credential-row">
          <span class="c-modal__credential-label">Email</span>
          <span class="c-modal__credential-value">${escHtml(credentials.email)}</span>
          <button class="c-modal__credential-copy js-credential-copy" data-value="${escHtml(credentials.email)}">Copy</button>
        </div>
      ` : ''}
      ${credentials.tempId ? `
        <div class="c-modal__credential-row">
          <span class="c-modal__credential-label">Temp ID</span>
          <span class="c-modal__credential-value">${escHtml(credentials.tempId)}</span>
          <button class="c-modal__credential-copy js-credential-copy" data-value="${escHtml(credentials.tempId)}">Copy</button>
        </div>
      ` : ''}
      ${credentials.tempPassword ? `
        <div class="c-modal__credential-row">
          <span class="c-modal__credential-label">Password</span>
          <span class="c-modal__credential-value">${escHtml(credentials.tempPassword)}</span>
          <button class="c-modal__credential-copy js-credential-copy" data-value="${escHtml(credentials.tempPassword)}">Copy</button>
        </div>
      ` : ''}
      ${credentials.inviteLink ? `
        <div class="c-modal__credential-row">
          <span class="c-modal__credential-label">Invite Link</span>
          <span class="c-modal__credential-value c-modal__credential-value--link">${escHtml(credentials.inviteLink)}</span>
          <button class="c-modal__credential-copy js-credential-copy" data-value="${escHtml(credentials.inviteLink)}">Copy</button>
        </div>
      ` : ''}
    </div>
    ${!isInvite ? `
      <div class="c-modal__credential-warning">
        ⚠ These credentials will not be shown again. Copy them before closing.
      </div>
    ` : ''}
    <div class="c-modal__footer">
      <button class="c-button c-button--gold" id="js-modal-step3-done">Done</button>
    </div>
  `;
}

//#endregion

//#region Public API — Row Action Modals

/**
 * Builds row action modal body HTML.
 * @param {string}   type  - 'action-log' | 'change-role' | 'deactivate' | default
 * @param {object}   user
 * @param {object[]} [log]
 * @returns {string}
 */
export function buildRowActionHTML(type, user, log = []) {
  switch (type) {
    case 'action-log':  return _buildActionLogHTML(log);
    case 'change-role': return _buildChangeRoleHTML(user);
    case 'deactivate':  return _buildDeactivateHTML(user);
    default:            return _buildDefaultActionHTML(type, user);
  }
}

//#endregion

//#region Private — Row Action Bodies

function _buildActionLogHTML(log) {
  if (!log?.length) return `
    <div class="f-admin__empty-state" style="padding:24px">
      <div class="f-admin__empty-state-sub">
        No actions recorded for this user.
      </div>
    </div>
    <div class="c-modal__footer">
      <button class="c-button c-button--ghost" id="js-modal-cancel">Close</button>
    </div>
  `;

  return `
    <div class="f-admin__action-log">
      ${log.map(entry => `
        <div class="f-admin__action-log-item">
          <div class="f-admin__action-log-action">${escHtml(entry.action || '—')}</div>
          <div class="f-admin__action-log-meta">${escHtml(timeAgo(entry.timestamp))}</div>
        </div>
      `).join('')}
    </div>
    <div class="c-modal__footer">
      <button class="c-button c-button--ghost" id="js-modal-cancel">Close</button>
    </div>
  `;
}

function _buildChangeRoleHTML(user) {
  return `
    <div class="c-field">
      <label class="c-field__label c-field__label--required" for="js-row-action-new-role">
        New Role
      </label>
      <select id="js-row-action-new-role" class="c-select c-select--field">
        <option value="">Select a role…</option>
        ${Object.entries(USER_ROLE_LABEL).map(([role, label]) => `
          <option value="${escHtml(role)}" ${user.role === role ? 'selected' : ''}>
            ${escHtml(label)}
          </option>
        `).join('')}
      </select>
    </div>
    ${_buildReasonFieldHTML()}
    <div class="c-modal__footer">
      <button class="c-button c-button--ghost" id="js-modal-cancel">Cancel</button>
      <button
        class="c-button c-button--gold"
        id="js-row-action-confirm"
        data-action-type="change-role"
        data-user-id="${escHtml(user.id)}"
      >Confirm</button>
    </div>
  `;
}

function _buildDeactivateHTML(user) {
  return `
    ${_buildReasonFieldHTML()}
    <div class="c-modal__footer">
      <button class="c-button c-button--ghost" id="js-modal-cancel">Cancel</button>
      <button
        class="c-button c-button--danger"
        id="js-row-action-confirm"
        data-action-type="deactivate"
        data-user-id="${escHtml(user.id)}"
      >Deactivate</button>
    </div>
  `;
}

function _buildDefaultActionHTML(type, user) {
  return `
    ${_buildReasonFieldHTML()}
    <div class="c-modal__footer">
      <button class="c-button c-button--ghost" id="js-modal-cancel">Cancel</button>
      <button
        class="c-button c-button--gold"
        id="js-row-action-confirm"
        data-action-type="${escHtml(type)}"
        data-user-id="${escHtml(user.id)}"
      >Confirm</button>
    </div>
  `;
}

//#endregion

//#region Private — Shared Field Builders

function _buildReasonFieldHTML() {
  return `
    <div class="c-field">
      <label class="c-field__label c-field__label--required" for="js-row-action-reason">
        Reason
      </label>
      <textarea
        id="js-row-action-reason"
        class="c-textarea"
        placeholder="Required — brief reason for this action"
        rows="3"
      ></textarea>
    </div>
  `;
}

//#endregion