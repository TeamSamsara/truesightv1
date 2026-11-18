/**
 * customWidgetState.js
 * @version 1.0.0
 *
 * State for the custom widget type.
 * Escape hatch for one-off widget content that doesn't fit
 * the standard types. The caller owns the HTML entirely.
 *
 * Target path: src/shared/components/widget/widgets/custom/customWidgetState.js
 */

//#region Factory

/**
 * Creates a fresh custom widget data object.
 * Passed as `data` in the widget definition.
 *
 * @param {object} options
 * @returns {object}
 */
export function createCustomData(options = {}) {
  return {

    /**
     * Raw HTML string to inject into the widget body.
     * The caller owns this content entirely.
     * @type {string}
     */
    html: options.html ?? '',

  };
}

//#endregion