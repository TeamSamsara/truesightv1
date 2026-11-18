/**
 * widgetController.js
 * @version 1.0.0
 *
 * Manages the base widget shell lifecycle.
 * Handles mount, update, event binding, and destroy.
 * Widget types call these functions — they never manage
 * the chrome themselves.
 *
 * Target path: src/shared/components/widget/widgetController.js
 */

//#region Imports

import {
  createWidgetState,
}                              from './widgetState.js';

import {
  renderWidget,
  setWidgetContent,
  setWidgetLoadingState,
  setWidgetErrorState,
  setWidgetTitle,
}                              from './widgetRenderer.js';

//#endregion

//#region Public API

/**
 * Mounts the widget chrome into the container and returns a widget instance.
 * Widget types call this first, then mount their own content
 * into the returned content element.
 *
 * @param {HTMLElement} container
 * @param {object}      options   - widgetState options
 * @returns {object} widget instance
 */
export function mountWidget(container, options = {}) {
  const state = createWidgetState(options);

  renderWidget(container, state);
  _bindEvents(container, state);

  return _createInstance(container, state);
}

//#endregion

//#region Private — Instance Factory

/**
 * Creates a widget instance — the object widget types hold onto.
 * Exposes surgical update methods so types never touch the DOM directly.
 *
 * @param {HTMLElement} container
 * @param {object}      state
 * @returns {object}
 */
function _createInstance(container, state) {
  return {

    /**
     * Returns the content mount element.
     * Widget types render their content here.
     * @returns {HTMLElement | null}
     */
    getContentEl() {
      return container.querySelector('.js-widget-body');
    },

    /**
     * Replaces the widget body content.
     * @param {string} html
     */
    setContent(html) {
      setWidgetContent(container, html);
    },

    /**
     * Sets the loading state on the widget chrome.
     * @param {boolean} value
     */
    setLoading(value) {
      state.isLoading = value;
      setWidgetLoadingState(container, value);
    },

    /**
     * Sets the error state on the widget chrome.
     * @param {string|null} message
     */
    setError(message) {
      state.error = message;
      setWidgetErrorState(container, message);
    },

    /**
     * Updates the widget title.
     * @param {string} title
     */
    setTitle(title) {
      state.title = title;
      setWidgetTitle(container, title);
    },

    /**
     * Updates the action callback.
     * @param {Function} callback
     */
    setOnAction(callback) {
      state.onAction = callback;
    },

    /**
     * Destroys the widget — clears content and unbinds events.
     */
    destroy() {
      _unbindEvents(container);
      container.innerHTML = '';
    },

  };
}

//#endregion

//#region Private — Event Binding

/**
 * Binds the action button click.
 * Stored on the element so it can be cleanly removed on destroy.
 * @param {HTMLElement} container
 * @param {object}      state
 */
function _bindEvents(container, state) {
  const actionBtn = container.querySelector('.js-widget-action');
  if (!actionBtn) return;

  const handler = () => {
    if (typeof state.onAction === 'function') state.onAction();
  };

  actionBtn._handler = handler;
  actionBtn.addEventListener('click', handler);
}

/**
 * Removes all event listeners bound by this controller.
 * @param {HTMLElement} container
 */
function _unbindEvents(container) {
  const actionBtn = container.querySelector('.js-widget-action');
  if (actionBtn?._handler) {
    actionBtn.removeEventListener('click', actionBtn._handler);
    delete actionBtn._handler;
  }
}

//#endregion