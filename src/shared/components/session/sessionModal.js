/**
 * sessionModal.js
 * @version 1.0.0
 *
 * Builds and manages the session expiry warning modal.
 * Uses the shared Modal component — owns only the content inside it.
 * Callbacks are wired to sessionService via main.js.
 */

//#region Imports

import { Modal, MODAL_SIZE, MODAL_VARIANT } from '../modal/modalIndex.js';
import { extendSession }                    from '../../../services/sessionService.js';
import { escHtml }                          from '../../../utils/helpers.js';

//#endregion

//#region Constants

const COUNTDOWN_EL_ID = 'js-session-countdown';

//#endregion

//#region Public API

/**
 * Returns the three callbacks sessionService expects.
 * Pass the result directly into initSession().
 *
 * Usage in main.js:
 *   initSession(getSessionCallbacks());
 *
 * @returns {{ onWarn: Function, onExpire: Function, onDismiss: Function }}
 */
export function getSessionCallbacks() {
  return {
    onWarn:    _onWarn,
    onExpire:  _onExpire,
    onDismiss: _onDismiss,
  };
}

//#endregion

//#region Private — Callbacks

function _onWarn(secondsRemaining) {
  Modal.open({
    eyebrow:         'Session',
    title:           'ARE YOU STILL THERE?',
    size:            MODAL_SIZE.SM,
    variant:         MODAL_VARIANT.DANGER,
    showClose:       false,
    onBackdropClick: false,
    content:         _buildHTML(secondsRemaining),
  });

  _bindStayButton();
}

function _onExpire(secondsRemaining) {
  if (secondsRemaining <= 0) return;
  _updateCountdown(secondsRemaining);
}

function _onDismiss() {
  Modal.close();
}

//#endregion

//#region Private — HTML Builder

function _buildHTML(secondsRemaining) {
  const formatted = _formatTime(secondsRemaining);

  return `
    <div class="c-session-modal__body">
      <p class="c-session-modal__message">
        Your session will expire due to inactivity. Click below to stay logged in.
      </p>
      <div class="c-session-modal__countdown" id="${COUNTDOWN_EL_ID}">
        ${escHtml(formatted)}
      </div>
    </div>
    <div class="c-modal__footer">
      <button class="c-button c-button--primary c-button--full js-session-stay">
        Stay Logged In
      </button>
    </div>
  `;
}

//#endregion

//#region Private — DOM Updates

function _updateCountdown(secondsRemaining) {
  const el = document.getElementById(COUNTDOWN_EL_ID);
  if (!el) return;
  el.textContent = _formatTime(secondsRemaining);
}

function _bindStayButton() {
  // Modal body is in the DOM after Modal.open() — safe to query immediately
  const btn = document.querySelector('.js-session-stay');
  if (!btn) return;

  btn.addEventListener('click', () => extendSession(), { once: true });
}

//#endregion

//#region Private — Helpers

function _formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

//#endregion