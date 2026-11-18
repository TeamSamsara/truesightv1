/**
 * modalController.js
 * @version 1.1.0
 *
 * Controls the shared modal lifecycle.
 * Handles open, close, content swapping, loading state,
 * escape key, backdrop click, and focus trap.
 * No feature-specific logic.
 *
 * v1.1.0 — added getBody() and getFooter() primitives
 */

//#region Imports

import {
  modalState,
  setModalOpen,
  setModalClosed,
  setModalContent,
  setModalLoading,
  setModalTitle,
  setModalSubtitle,
} from './modalState.js';

import {
  renderModal,
  removeModal,
  swapModalContent,
  getModalBody,
  getModalFooter,
  updateModalTitle,
  updateModalSubtitle,
  setModalLoadingState,
} from './modalRenderer.js';

//#endregion

//#region State

let _escHandler        = null;
let _previouslyFocused = null;

//#endregion

//#region Public API

/**
 * Opens the modal with the given options.
 * Renders the shell, injects content, binds interactions.
 *
 * @param {object}            options
 * @param {string}            options.title
 * @param {string}            [options.eyebrow]
 * @param {string}            [options.subtitle]
 * @param {string}            [options.content]         - HTML string for the body (optional)
 * @param {string}            [options.size]            - MODAL_SIZE constant
 * @param {string}            [options.variant]         - MODAL_VARIANT constant
 * @param {boolean}           [options.showClose]       - default true
 * @param {Function | null}   [options.onClose]         - called when modal closes
 * @param {Function | false}  [options.onBackdropClick] - false disables backdrop close
 */
export function open(options = {}) {
  _previouslyFocused = document.activeElement;
  setModalOpen(options);
  renderModal(modalState);
  _bindInteractions();
  _lockBodyScroll();
  _trapFocus();
}

/**
 * Closes the modal and cleans up all listeners.
 * Fires the onClose callback if one was provided.
 */
export function close() {
  if (!modalState.isOpen)   return;
  if (modalState.isLoading) return;

  const callback = modalState.onClose;

  _unbindInteractions();
  _unlockBodyScroll();
  _restoreFocus();

  setModalClosed();
  removeModal();

  if (typeof callback === 'function') callback();
}

/**
 * Swaps the modal body content without rebuilding the shell.
 * Use for step transitions — no flicker, no re-render.
 * @param {string} html
 */
export function setContent(html) {
  setModalContent(html);
  swapModalContent(html);
}

/**
 * Returns the modal body HTMLElement.
 * Use this for surgical DOM updates — append, prepend, query inside.
 * The consuming feature owns what's inside the body.
 * @returns {HTMLElement | null}
 */
export function getBody() {
  return getModalBody();
}

/**
 * Returns the modal footer HTMLElement.
 * Use this to mount footer content — action buttons, summaries etc.
 * The consuming feature owns what's inside the footer.
 * @returns {HTMLElement | null}
 */
export function getFooter() {
  return getModalFooter();
}

/**
 * Updates the modal title text without rebuilding the shell.
 * @param {string} title
 */
export function setTitle(title) {
  setModalTitle(title);
  updateModalTitle(title);
}

/**
 * Updates the modal subtitle without rebuilding the shell.
 * @param {string | null} subtitle
 */
export function setSubtitle(subtitle) {
  setModalSubtitle(subtitle);
  updateModalSubtitle(subtitle);
}

/**
 * Sets the modal loading state.
 * When true — close button disabled, backdrop click ignored.
 * When false — all interactions restored.
 * @param {boolean} value
 */
export function setLoading(value) {
  setModalLoading(value);
  setModalLoadingState(value);
}

/**
 * Returns true if the modal is currently open.
 * @returns {boolean}
 */
export function isOpen() {
  return modalState.isOpen;
}

//#endregion

//#region Private — Interaction Binding

function _bindInteractions() {
  _bindCloseButton();
  _bindBackdropClick();
  _bindEscapeKey();
}

function _unbindInteractions() {
  if (_escHandler) {
    document.removeEventListener('keydown', _escHandler);
    _escHandler = null;
  }
}

function _bindCloseButton() {
  const closeBtn = document.getElementById('js-modal-close');
  if (!closeBtn) return;
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
}

function _bindBackdropClick() {
  const overlay = document.getElementById('js-modal-overlay');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => {
    if (e.target !== overlay)  return;
    if (modalState.isLoading)  return;
    const handler = modalState.onBackdropClick;
    if (handler === false)               return;
    if (typeof handler === 'function') { handler(); return; }
    close();
  });
}

function _bindEscapeKey() {
  _escHandler = (e) => {
    if (e.key !== 'Escape')   return;
    if (modalState.isLoading) return;
    close();
  };
  document.addEventListener('keydown', _escHandler);
}

//#endregion

//#region Private — Body Scroll Lock

function _lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position  = 'fixed';
  document.body.style.top       = `-${scrollY}px`;
  document.body.style.width     = '100%';
  document.body.dataset.scrollY = String(scrollY);
}

function _unlockBodyScroll() {
  const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
  document.body.style.position  = '';
  document.body.style.top       = '';
  document.body.style.width     = '';
  delete document.body.dataset.scrollY;
  window.scrollTo(0, scrollY);
}

//#endregion

//#region Private — Focus Management

function _trapFocus() {
  const modal = document.querySelector('.c-modal');
  if (!modal) return;
  const focusable = _getFocusableElements(modal);
  if (focusable.length === 0) return;
  focusable[0].focus();
  modal.addEventListener('keydown', _handleFocusTrap);
}

function _handleFocusTrap(e) {
  if (e.key !== 'Tab') return;
  const modal = document.querySelector('.c-modal');
  if (!modal) return;
  const focusable = _getFocusableElements(modal);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
}

function _getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])'
  ));
}

function _restoreFocus() {
  if (_previouslyFocused && typeof _previouslyFocused.focus === 'function') {
    _previouslyFocused.focus();
    _previouslyFocused = null;
  }
}

//#endregion