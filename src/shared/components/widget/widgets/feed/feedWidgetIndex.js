/**
 * feedWidgetIndex.js — feed widget type
 * @version 1.0.0
 *
 * Entry point for the feed widget type.
 * Implements the widget type contract — exposes mount().
 * Called by dashboardController via dynamic import.
 *
 * Usage (via Dashboard):
 *   Dashboard.init(container, [{
 *     id:    'recent-activity',
 *     type:  WIDGET_TYPE.FEED,
 *     size:  WIDGET_SIZE.LG,
 *     title: 'Recent Activity',
 *     data:  createFeedData({
 *       items: activityItems.map(a => createFeedItem({
 *         id:        a.id,
 *         dot:       FEED_DOT.PASS,
 *         label:     a.staffName,
 *         sub:       a.action,
 *         timestamp: a.timestamp,
 *       })),
 *       limit: 8,
 *     }),
 *   }]);
 *
 * Target path: src/shared/components/widget/widgets/feed/feedWidgetIndex.js
 */

//#region Imports

import { mountWidget }        from '../../../widget/widgetIndex.js';
import { renderFeedContent }  from './feedWidgetRenderer.js';
import { createFeedData,
         createFeedItem,
         FEED_DOT }           from './feedWidgetState.js';

//#endregion

//#region Widget Type Contract

/**
 * Mounts the feed widget into the given container.
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
    widget.setContent(renderFeedContent(options.data));
    _bindEvents(container, options);
  }

  return widget;
}

//#endregion

//#region Private — Event Binding

/**
 * Binds the view more button if present.
 * Fires onAction with { type: 'view-more' } so the caller can handle it.
 * @param {HTMLElement} container
 * @param {object}      options
 */
function _bindEvents(container, options) {
  const moreBtn = container.querySelector('.js-feed-more');
  if (!moreBtn) return;

  moreBtn.addEventListener('click', () => {
    if (typeof options.onAction === 'function') {
      options.onAction({ type: 'view-more' });
    }
  });
}

//#endregion

//#region Re-exports

export { createFeedData, createFeedItem, FEED_DOT };

//#endregion