/**
 * dashboardIndex.js — dashboard component
 * @version 1.0.0
 *
 * Public API for the shared dashboard component.
 * This is the only file callers should import from.
 *
 * Usage:
 *   import { Dashboard } from '../../shared/components/dashboard/dashboardIndex.js';
 *
 *   Dashboard.init(container, widgets);
 *   Dashboard.updateWidget('upcoming-events', data);
 *   Dashboard.setWidgetLoading('pipeline-pulse', false);
 *   Dashboard.onWidgetAction('upcoming-events', callback);
 *   Dashboard.destroy();
 *
 * Target path: src/shared/components/dashboard/dashboardIndex.js
 */

//#region Imports

import {
  init,
  setDashboardWidgets,
  updateDashboardWidget,
  setDashboardWidgetLoading,
  setDashboardWidgetError,
  onWidgetAction,
  destroy,
}                    from './dashboardController.js';

import {
  WIDGET_SIZE,
  WIDGET_TYPE,
}                    from './dashboardState.js';

//#endregion

//#region Public API

export const Dashboard = {
  init,
  setWidgets:   setDashboardWidgets,
  updateWidget: updateDashboardWidget,
  setLoading:   setDashboardWidgetLoading,
  setError:     setDashboardWidgetError,
  onWidgetAction,
  destroy,
};

//#endregion

//#region Re-exports — Constants

export { WIDGET_SIZE, WIDGET_TYPE };

//#endregion