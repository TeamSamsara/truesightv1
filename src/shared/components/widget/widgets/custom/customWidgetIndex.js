/**
 * customWidgetIndex.js — custom widget type
 * @version 1.0.0
 *
 * Entry point for the custom widget type.
 * Escape hatch for caller-owned content that doesn't fit standard types.
 * Implements the widget type contract — exposes mount().
 * Called by dashboardController via dynamic import.
 *
 * Usage (via Dashboard):
 *   Dashboard.init(container, [{
 *     id:    'my-custom-widget',
 *     type:  WIDGET_TYPE.CUSTOM,
 *     size:  WIDGET_SIZE.MD,
 *     title: 'Custom',
 *     data:  createCustomData({ html: '<p>My content</p>' }),
 *   }]);
 *
 * Target path: src/shared/components/widget/widgets/custom/customWidgetIndex.js
 */

//#region Imports

import { mountWidget }          from '../../../widget/widgetIndex.js';
import { renderCustomContent }  from './customWidgetRenderer.js';
import { createCustomData }     from './customWidgetState.js';

//#endregion

//#region Widget Type Contract

/**
 * Mounts the custom widget into the given container.
 * Called by dashboardController — do not call directly.
 *
 * @param {HTMLElement} container
 * @param {object}      options   - widget definition from dashboardState
 */
export function mount(container, options) {
  const widget = mountWidget(container, {
    title:       options.title,
    eyebrow:     options.eyebrow     ?? null,
    variant:     options.variant     ?? 'default',
    actionLabel: options.actionLabel ?? null,
    onAction:    options.onAction    ?? null,
    isLoading:   options.isLoading   ?? false,
  });

  if (options.data) {
    widget.setContent(renderCustomContent(options.data));
  }

  return widget;
}

//#endregion

//#region Re-exports

export { createCustomData };

//#endregion