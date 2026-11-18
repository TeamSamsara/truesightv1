/**
 * authRenderer.js
 * @version 1.0.1
 *
 * All DOM rendering for the auth feature.
 * Reads from authState and produces HTML.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/features/auth/authRenderer.js
 */

//#region Imports

import { escHtml } from '../../../utils/helpers.js';

//#endregion

//#region Login View

/**
 * Renders the full login view into the mount point.
 * @param {object} state - authState
 */
export function renderLoginView(state) {
  const mount = document.getElementById('app-mount');
  if (!mount) return;
  mount.innerHTML = _buildLoginHTML(state);
}

/**
 * Builds the login screen HTML string.
 * @param {object} state
 * @returns {string}
 */
function _buildLoginHTML(state) {
  return `
    <div class="f-auth">
      <div class="f-auth__card">

        <div class="f-auth__header">
          <div class="f-auth__brand-mark">TS</div>
          <div class="f-auth__brand-name">TRUESIGHT</div>
          <div class="f-auth__brand-sub">TEAM SAMSARA · INTERNAL PLATFORM</div>
        </div>

        ${state.error ? _buildErrorHTML(state.error) : ''}

        <form id="js-login-form" class="f-auth__form" novalidate>

          <div class="c-field">
            <label class="c-field__label c-field__label--required" for="js-login-email">
              Email
            </label>
            <input
              id="js-login-email"
              class="c-input"
              type="email"
              placeholder="your@email.com"
              autocomplete="email"
              value="${escHtml(state.email)}"
              required
            />
          </div>

          <div class="c-field">
            <label class="c-field__label c-field__label--required" for="js-login-password">
              Password
            </label>
            <input
              id="js-login-password"
              class="c-input"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            class="c-button c-button--primary c-button--full"
            ${state.isLoading ? 'disabled' : ''}
          >
            ${state.isLoading ? 'Signing in…' : 'Sign In'}
          </button>

        </form>

        <div class="f-auth__footer">
          <p class="f-auth__footer-text">
            Forgot your password? Contact an administrator.
          </p>
        </div>

      </div>
    </div>
  `;
}

//#endregion

//#region First Login Setup View

/**
 * Renders the first login setup view into the mount point.
 * @param {object} state - authState
 */
export function renderFirstLoginView(state) {
  const mount = document.getElementById('app-mount');
  if (!mount) return;
  mount.innerHTML = _buildFirstLoginHTML(state);
}

/**
 * Builds the first login setup screen HTML string.
 * @param {object} state
 * @returns {string}
 */
function _buildFirstLoginHTML(state) {
  return `
    <div class="f-auth">
      <div class="f-auth__card f-auth__card--wide">

        <div class="f-auth__header">
          <div class="f-auth__brand-mark">TS</div>
          <div class="f-auth__brand-name">TRUESIGHT</div>
          <div class="f-auth__brand-sub">ACCOUNT SETUP</div>
        </div>

        <div class="f-auth__setup-intro">
          <p class="f-auth__setup-intro-text">
            Welcome. Before you can access the platform, set your
            TrueSight ID, display name, and a permanent password.
            Your TrueSight ID cannot be changed once set.
          </p>
        </div>

        ${state.error ? _buildErrorHTML(state.error) : ''}

        <form id="js-first-login-form" class="f-auth__form" novalidate>

          <div class="f-auth__form-section">
            <div class="f-auth__form-section-label">Identity</div>

            <div class="c-field">
              <label class="c-field__label c-field__label--required" for="js-setup-truesight-id">
                TrueSight ID
              </label>
              <input
                id="js-setup-truesight-id"
                class="c-input"
                type="text"
                placeholder="CoachA#0042"
                autocomplete="off"
                spellcheck="false"
                required
              />
              <span id="js-truesight-id-feedback" class="c-field__hint"></span>
              <span class="c-field__hint">
                Format: Name#TAG — choose anything you like. This cannot be changed.
              </span>
            </div>

            <div class="c-field">
              <label class="c-field__label c-field__label--required" for="js-setup-display-name">
                Display Name
              </label>
              <input
                id="js-setup-display-name"
                class="c-input"
                type="text"
                placeholder="Coach Alex"
                autocomplete="off"
                required
              />
              <span class="c-field__hint">
                How your name appears in the platform and audit logs.
              </span>
            </div>
          </div>

          <div class="f-auth__form-section">
            <div class="f-auth__form-section-label">Password</div>

            <div class="c-field">
              <label class="c-field__label c-field__label--required" for="js-setup-password">
                New Password
              </label>
              <input
                id="js-setup-password"
                class="c-input"
                type="password"
                placeholder="At least 8 characters"
                autocomplete="new-password"
                required
              />
              <span class="c-field__hint">
                Minimum 8 characters, one uppercase letter, one number.
              </span>
            </div>

            <div class="c-field">
              <label class="c-field__label c-field__label--required" for="js-setup-password-confirm">
                Confirm Password
              </label>
              <input
                id="js-setup-password-confirm"
                class="c-input"
                type="password"
                placeholder="Repeat your password"
                autocomplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            class="c-button c-button--primary c-button--full"
            ${state.isLoading ? 'disabled' : ''}
          >
            ${state.isLoading ? 'Setting up…' : 'Complete Setup'}
          </button>

        </form>

      </div>
    </div>
  `;
}

//#endregion

//#region Partial Updates

/**
 * Updates the error display without re-rendering the full view.
 * @param {string | null} message
 */
export function renderAuthError(message) {
  const existing = document.querySelector('.f-auth__error');

  if (!message) {
    if (existing) existing.remove();
    return;
  }

  const errorHTML = _buildErrorHTML(message);

  if (existing) {
    existing.outerHTML = errorHTML;
    return;
  }

  const form = document.querySelector('.f-auth__form');
  if (form) form.insertAdjacentHTML('beforebegin', errorHTML);
}

/**
 * Updates the submit button loading state without re-rendering.
 * @param {boolean} isLoading
 */
export function renderAuthLoading(isLoading) {
  const btn = document.querySelector('.f-auth__form .c-button--primary');
  if (!btn) return;

  if (isLoading) {
    btn.disabled    = true;
    btn.textContent = btn.textContent.includes('Setup') ? 'Setting up…' : 'Signing in…';
  } else {
    btn.disabled    = false;
    btn.textContent = btn.textContent.includes('Setup') ? 'Complete Setup' : 'Sign In';
  }
}

//#endregion

//#region Private Helpers

/**
 * Builds the error message HTML block.
 * @param {string} message
 * @returns {string}
 */
function _buildErrorHTML(message) {
  return `
    <div class="f-auth__error" role="alert">
      <span class="f-auth__error-icon">⚠</span>
      <span class="f-auth__error-text">${escHtml(message)}</span>
    </div>
  `;
}

//#endregion