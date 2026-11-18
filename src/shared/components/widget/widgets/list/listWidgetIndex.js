/**
 * listWidgetIndex.js — list widget type
 * @version 1.0.0
 *
 * Entry point for the list widget type.
 * Implements the widget type contract — exposes mount().
 * Called by dashboardController via dynamic import.
 *
 * Usage (via Dashboard):
 *   Dashboard.init(container, [{
 *     id:    'roster-members',
 *     type:  WIDGET_TYPE.LIST,
 *     size:  WIDGET_SIZE.MD,
 *     title: 'Roster Members',
 *     data:  createListData({
 *       items: members.map(m => createListItem({
 *         id:    m.id,
 *         label: m.displayName,
 *         sub:   USER_ROLE_LABEL[m.role],
 *         meta:  m.trueSightId,
 *       })),
 *     }),
 *   }]);
 *
 * Target path: src/shared/components/widget/widgets/list/listWidgetIndex.js
 */

//#region Imports

import { mountWidget }        from '../../../widget/widgetIndex.js';
import { renderListContent }  from './listWidgetRenderer.js';
import { createListData,
         createListItem,
         LIST_BADGE }         from './listWidgetState.js';

//#endregion

//#region Widget Type Contract

/**
 * Mounts the list widget into the given container.
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
    widget.setContent(renderListContent(options.data));
    _bindEvents(container, options.data);
  }

  return widget;
}

//#endregion

//#region Private — Event Binding

/**
 * Binds row click events and the view-more button.
 * Row clicks fire the item's own onClick callback if present.
 * View-more fires onAction({ type: 'view-more' }).
 * @param {HTMLElement} container
 * @param {object}      data
 */
function _bindEvents(container, data) {
  container.querySelectorAll('.c-list-widget__item.is-clickable').forEach(row => {
    const id   = row.dataset.listId;
    const item = data.items.find(i => i.id === id);
    if (!item?.onClick) return;
    row.addEventListener('click', () => item.onClick(item));
  });

  const moreBtn = container.querySelector('.js-list-more');
  if (!moreBtn) return;

  moreBtn.addEventListener('click', () => {
    if (typeof data.onAction === 'function') {
      data.onAction({ type: 'view-more' });
    }
  });
}

//#endregion

//#region Re-exports

export { createListData, createListItem, LIST_BADGE };

//#endregion