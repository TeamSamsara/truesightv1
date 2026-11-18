/**
 * widgetIndex.js — base widget component
 * @version 1.0.0
 *
 * Public API for the base widget shell component.
 * This is the only file widget types should import from.
 *
 * Usage:
 *   import { mountWidget, WIDGET_VARIANT } from '../../widget/widgetIndex.js';
 *
 *   const widget = mountWidget(container, {
 *     title:       'Upcoming Events',
 *     eyebrow:     'Operations',
 *     variant:     WIDGET_VARIANT.GOLD,
 *     actionLabel: 'View all →',
 *     onAction:    () => navigateTo(ROUTES.OPERATIONS),
 *   });
 *
 *   widget.setContent(html);
 *   widget.setLoading(false);
 *   widget.setError('Failed to load.');
 *   widget.destroy();
 *
 * Target path: src/shared/components/widget/widgetIndex.js
 */

//#region Imports

import { mountWidget }    from './widgetController.js';
import { WIDGET_VARIANT } from './widgetState.js';

//#endregion

//#region Public API

export { mountWidget };

//#endregion

//#region Re-exports — Constants

export { WIDGET_VARIANT };

//#endregion