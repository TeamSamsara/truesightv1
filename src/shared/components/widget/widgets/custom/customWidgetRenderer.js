/**
 * customWidgetRenderer.js
 * @version 1.0.0
 *
 * Renders the content for the custom widget type.
 * Passes the caller-provided HTML through unchanged.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/components/widget/widgets/custom/customWidgetRenderer.js
 */

//#region Public API

/**
 * Returns the caller-provided HTML as-is.
 * Callers are responsible for sanitizing their own content.
 * @param {object} data - customWidgetData instance
 * @returns {string}
 */
export function renderCustomContent(data) {
  if (!data?.html) return _buildEmptyHTML();
  return `<div class="c-custom-widget">${data.html}</div>`;
}

//#endregion

//#region Private

function _buildEmptyHTML() {
  return `<div class="c-custom-widget c-custom-widget--empty"></div>`;
}

//#endregion