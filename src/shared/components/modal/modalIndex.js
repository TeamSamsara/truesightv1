/**
 * modalIndex.js — shared modal component
 * @version 1.1.0
 *
 * Public API for the shared modal component.
 * This is the only file features should import from.
 *
 * Two rendering strategies are supported:
 *
 * 1. FULL REPLACEMENT (existing pattern — step flows, simple forms)
 *    Modal.open({ content: html })
 *    Modal.setContent(newHtml)
 *
 * 2. SURGICAL DOM UPDATES (new — complex interactive content)
 *    Modal.open({ title: '...' })         // no content
 *    const body   = Modal.getBody()       // get the body element
 *    const footer = Modal.getFooter()     // get the footer element
 *    body.appendChild(myComponent)        // consumer owns the DOM inside
 *    footer.innerHTML = _buildFooterHTML() // consumer owns the footer
 *
 * Both strategies can be mixed — setContent() still works alongside getBody().
 *
 * Target path: src/shared/components/modal/modalIndex.js
 */

//#region Imports

import {
  open,
  close,
  setContent,
  getBody,
  getFooter,
  setTitle,
  setSubtitle,
  setLoading,
  isOpen,
} from './modalController.js';

import { MODAL_SIZE, MODAL_VARIANT } from './modalState.js';

//#endregion

//#region Public API

export const Modal = {

  /** Opens the modal. @param {object} options */
  open,

  /** Closes the modal and fires onClose callback. */
  close,

  /**
   * Swaps the modal body content (full replacement).
   * Use for step transitions.
   * @param {string} html
   */
  setContent,

  /**
   * Returns the modal body HTMLElement.
   * Use for surgical DOM updates — the consumer owns what's inside.
   * @returns {HTMLElement | null}
   */
  getBody,

  /**
   * Returns the modal footer HTMLElement.
   * Use to mount footer content — buttons, summaries etc.
   * @returns {HTMLElement | null}
   */
  getFooter,

  /**
   * Updates the modal title without rebuilding the shell.
   * @param {string} title
   */
  setTitle,

  /**
   * Updates the modal subtitle without rebuilding the shell.
   * @param {string | null} subtitle
   */
  setSubtitle,

  /**
   * Sets the modal loading state.
   * Disables close button and backdrop click while true.
   * @param {boolean} value
   */
  setLoading,

  /**
   * Returns true if the modal is currently open.
   * @returns {boolean}
   */
  isOpen,

};

//#endregion

//#region Re-exports — Constants

export { MODAL_SIZE, MODAL_VARIANT };

//#endregion