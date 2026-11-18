/**
 * statWidgetIndex.js — stat widget type
 * @version 1.0.0
 *
 * Entry point for the stat widget type.
 * Implements the widget type contract — exposes mount().
 * Called by dashboardController via dynamic import.
 *
 * Usage (via Dashboard):
 *   Dashboard.init(container, [{
 *     id:    'active-staff',
 *     type:  WIDGET_TYPE.STAT,
 *     size:  WIDGET_SIZE.SM,
 *     title: 'Active Staff',
 *     data:  createStatData({ value: 6, sub: 'Active accounts on platform' }),
 *   }]);
 *
 * Target path: src/shared/components/widget/widgets/stat/statWidgetIndex.js
 */

//#region Imports

import { mountWidget }        from '../../../widget/widgetIndex.js';
import { renderStatContent }  from './statWidgetRenderer.js';
import { createStatData }     from './statWidgetState.js';

//#endregion

//#region Widget Type Contract

/**
 * Mounts the stat widget into the given container.
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
    widget.setContent(renderStatContent(options.data));
  }

  return widget;
}

//#endregion

//#region Re-exports

export { createStatData };

//#endregion