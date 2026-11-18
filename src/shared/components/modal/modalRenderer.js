/**
 * modalRenderer.js
 * @version 1.1.0
 *
 * Renders the shared modal shell.
 * Only responsible for the chrome — overlay, container,
 * header, close button, body slot, and footer slot.
 * Never generates or modifies body/footer content.
 * Content is always managed by the consuming feature.
 *
 * v1.1.0 — added footer slot (#js-modal-footer)
 */

//#region Imports

import { escHtml }    from '../../../utils/helpers.js';
import { modalState } from './modalState.js';

//#endregion

//#region Constants

const MOUNT_ID = 'modal-root';

//#endregion

//#region Public API

/**
 * Renders the full modal shell into the modal root.
 * Creates the root element if it does not exist.
 * @param {object} state  - modalState
 */
export function renderModal(state) {
  const root = _getOrCreateRoot();
  root.innerHTML = _buildModalHTML(state);
  root.classList.add('is-active');
}

/**
 * Removes the modal from the DOM and deactivates the root.
 */
export function removeModal() {
  const root = document.getElementById(MOUNT_ID);
  if (!root) return;
  root.innerHTML = '';
  root.classList.remove('is-active');
}

/**
 * Swaps the modal body content without rebuilding the shell.
 * Use for step transitions — no flicker, no re-render.
 * @param {string} html
 */
export function swapModalContent(html) {
  const body = document.getElementById('js-modal-body');
  if (!body) return;
  body.innerHTML = html;
}

/**
 * Returns the modal body element.
 * Consuming features use this for surgical DOM updates
 * instead of full body replacement via swapModalContent.
 * @returns {HTMLElement | null}
 */
export function getModalBody() {
  return document.getElementById('js-modal-body');
}

/**
 * Returns the modal footer element.
 * Consuming features mount their own footer content here.
 * @returns {HTMLElement | null}
 */
export function getModalFooter() {
  return document.getElementById('js-modal-footer');
}

/**
 * Updates the modal title text without rebuilding the shell.
 * @param {string} title
 */
export function updateModalTitle(title) {
  const el = document.getElementById('js-modal-title');
  if (el) el.textContent = title;
}

/**
 * Updates the modal subtitle text without rebuilding the shell.
 * @param {string | null} subtitle
 */
export function updateModalSubtitle(subtitle) {
  const el = document.getElementById('js-modal-subtitle');
  if (!el) return;
  el.textContent   = subtitle || '';
  el.style.display = subtitle ? '' : 'none';
}

/**
 * Sets the modal into a loading visual state.
 * Disables close button and adds loading class.
 * @param {boolean} value
 */
export function setModalLoadingState(value) {
  const closeBtn = document.getElementById('js-modal-close');
  const overlay  = document.getElementById('js-modal-overlay');
  if (closeBtn) closeBtn.disabled = value;
  if (overlay)  overlay.classList.toggle('is-loading', value);
}

//#endregion

//#region Private — Shell Builder

function _buildModalHTML(state) {
  return `
    <div
      class="c-modal-overlay"
      id="js-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="js-modal-title"
    >
      <div class="c-modal c-modal--${escHtml(state.size)} c-modal--${escHtml(state.variant)}">

        ${_buildHeaderHTML(state)}

        <div class="c-modal__body" id="js-modal-body">
          ${state.content ?? ''}
        </div>

        <div class="c-modal__footer" id="js-modal-footer"></div>

      </div>
    </div>
  `;
}

function _buildHeaderHTML(state) {
  return `
    <div class="c-modal__header">
      <div class="c-modal__header-text">
        ${state.eyebrow ? `
          <div class="c-modal__eyebrow">${escHtml(state.eyebrow)}</div>
        ` : ''}
        <div class="c-modal__title" id="js-modal-title">
          ${escHtml(state.title || '')}
        </div>
        ${state.subtitle ? `
          <div class="c-modal__subtitle" id="js-modal-subtitle">
            ${escHtml(state.subtitle)}
          </div>
        ` : `
          <div class="c-modal__subtitle" id="js-modal-subtitle" style="display:none"></div>
        `}
      </div>
      ${state.showClose ? `
        <button
          class="c-modal__close"
          id="js-modal-close"
          aria-label="Close modal"
          ${state.isLoading ? 'disabled' : ''}
        >✕</button>
      ` : ''}
    </div>
  `;
}

//#endregion

//#region Private — Root Management

function _getOrCreateRoot() {
  let root = document.getElementById(MOUNT_ID);
  if (!root) {
    root    = document.createElement('div');
    root.id = MOUNT_ID;
    document.body.appendChild(root);
  }
  return root;
}

//#endregion