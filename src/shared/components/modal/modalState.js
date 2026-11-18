/**
 * modalState.js
 * @version 1.0.0
 *
 * State for the shared modal component.
 * Tracks open/close status, content, size,
 * loading state, and lifecycle callbacks.
 * No feature-specific logic.
 */

//#region Constants

export const MODAL_SIZE = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
};

export const MODAL_VARIANT = {
  DEFAULT: 'default',
  GOLD:    'gold',
  DANGER:  'danger',
};

//#endregion

//#region State

export const modalState = {

  /**
   * Whether the modal is currently open.
   * @type {boolean}
   */
  isOpen: false,

  /**
   * Modal eyebrow text — small label above the title.
   * @type {string | null}
   */
  eyebrow: null,

  /**
   * Modal title text.
   * @type {string | null}
   */
  title: null,

  /**
   * Optional subtitle below the title.
   * @type {string | null}
   */
  subtitle: null,

  /**
   * HTML string for the modal body content.
   * Set by the feature — the modal shell never
   * generates or modifies this.
   * @type {string}
   */
  content: '',

  /**
   * Size variant of the modal.
   * @type {string}  'sm' | 'md' | 'lg' | 'xl'
   */
  size: MODAL_SIZE.MD,

  /**
   * Visual variant of the modal.
   * @type {string}  'default' | 'gold' | 'danger'
   */
  variant: MODAL_VARIANT.GOLD,

  /**
   * Whether the modal is in a loading/submitting state.
   * Disables close interactions while true.
   * @type {boolean}
   */
  isLoading: false,

  /**
   * Whether the close button is visible.
   * Some modals may hide it during critical operations.
   * @type {boolean}
   */
  showClose: true,

  /**
   * Callback fired when the modal closes for any reason.
   * Set by the feature when opening.
   * @type {Function | null}
   */
  onClose: null,

  /**
   * Callback fired when the backdrop is clicked.
   * Defaults to close if null.
   * Set to false to disable backdrop close.
   * @type {Function | null | false}
   */
  onBackdropClick: null,

};

//#endregion

//#region State Helpers

/**
 * Opens the modal with the given options.
 * Merges options into state — only provided keys are updated.
 * @param {object} options
 */
export function setModalOpen(options = {}) {
  modalState.isOpen          = true;
  modalState.eyebrow         = options.eyebrow         ?? null;
  modalState.title           = options.title           ?? null;
  modalState.subtitle        = options.subtitle        ?? null;
  modalState.content         = options.content         ?? '';
  modalState.size            = options.size            ?? MODAL_SIZE.MD;
  modalState.variant         = options.variant         ?? MODAL_VARIANT.GOLD;
  modalState.isLoading       = false;
  modalState.showClose       = options.showClose       ?? true;
  modalState.onClose         = options.onClose         ?? null;
  modalState.onBackdropClick = options.onBackdropClick ?? null;
}

/**
 * Closes the modal and resets all state.
 */
export function setModalClosed() {
  modalState.isOpen          = false;
  modalState.eyebrow         = null;
  modalState.title           = null;
  modalState.subtitle        = null;
  modalState.content         = '';
  modalState.size            = MODAL_SIZE.MD;
  modalState.variant         = MODAL_VARIANT.GOLD;
  modalState.isLoading       = false;
  modalState.showClose       = true;
  modalState.onClose         = null;
  modalState.onBackdropClick = null;
}

/**
 * Updates the modal body content without touching the shell.
 * @param {string} html
 */
export function setModalContent(html) {
  modalState.content = html;
}

/**
 * Sets the modal loading state.
 * @param {boolean} value
 */
export function setModalLoading(value) {
  modalState.isLoading = value;
}

/**
 * Updates the modal title.
 * @param {string} title
 */
export function setModalTitle(title) {
  modalState.title = title;
}

/**
 * Updates the modal subtitle.
 * @param {string | null} subtitle
 */
export function setModalSubtitle(subtitle) {
  modalState.subtitle = subtitle;
}

//#endregion