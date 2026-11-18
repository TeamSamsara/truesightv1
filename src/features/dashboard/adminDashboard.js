/**
 * adminDashboard.js — admin portal dashboard
 * @version 1.0.0
 *
 * Organization overview dashboard for admin and dev users.
 * Cross-domain org health view — platform health, scouting pipeline,
 * roster state, upcoming events, and recent activity.
 *
 * Stub widgets (pipeline, roster, events) render empty until their
 * respective features are built and wired in.
 *
 * Target path: src/features/dashboard/adminDashboard.js
 */

//#region Imports

import { Nav, NAV_DOMAIN }                     from '../../shared/components/nav/navIndex.js';
import { Dashboard, WIDGET_SIZE, WIDGET_TYPE } from '../../shared/components/dashboard/dashboardIndex.js';
import { createStatData }                      from '../../shared/components/widget/widgets/stat/statWidgetIndex.js';
import { createFeedData, createFeedItem,
         FEED_DOT }                            from '../../shared/components/widget/widgets/feed/feedWidgetIndex.js';
import { WIDGET_VARIANT }                      from '../../shared/components/widget/widgetIndex.js';
import { appState }                            from '../../core/appState.js';
import { escHtml }                             from '../../utils/helpers.js';
import {
  loadWidgetCounts,
  loadRecentActivity,
}                                              from '../admin/adminService.js';

//#endregion

//#region Mount

export async function mount(container, params) {
  Nav.setDomain(NAV_DOMAIN.DASHBOARD, [], null);

  container.innerHTML = `
    <div class="f-dashboard">
      <div class="f-dashboard__page-header">
        <div class="f-dashboard__page-eyebrow">${escHtml(_buildEyebrow())}</div>
        <div class="f-dashboard__page-title">ORGANIZATION OVERVIEW</div>
        <div class="f-dashboard__page-sub">
          Current state of the organization across all domains.
        </div>
      </div>
      <div id="js-admin-dashboard-mount"></div>
    </div>
  `;

  const mount = container.querySelector('#js-admin-dashboard-mount');
  if (!mount) return _cleanup;

  Dashboard.init(mount, _buildWidgets());

  _fetchData();

  return _cleanup;
}

//#endregion

//#region Cleanup

function _cleanup() {
  Dashboard.destroy();
}

//#endregion

//#region Data

async function _fetchData() {
  try {
    const [counts, activity] = await Promise.all([
      loadWidgetCounts(),
      loadRecentActivity(),
    ]);

    Dashboard.updateWidget('users', createStatData({
      value: counts.staff ?? 0,
      sub:   'Active accounts on platform',
    }));

    Dashboard.updateWidget('approvals', createStatData({
      value: counts.approvals ?? 0,
      sub:   'Actions waiting for confirmation',
    }));

    Dashboard.updateWidget('activity', createFeedData({
      items: activity.map(item => createFeedItem({
        id:        item.id,
        dot:       _getActivityDot(item.action),
        label:     item.actorName || 'Unknown',
        sub:       _buildActivityDescription(item),
        timestamp: item.timestamp,
      })),
      limit: 6,
    }));

  } catch (err) {
    Dashboard.setError('users',    'Failed to load.');
    Dashboard.setError('activity', 'Failed to load.');
    console.error('adminDashboard _fetchData failed:', err);
  }
}

//#endregion

//#region Widget Definitions

function _buildWidgets() {
  return [
    {
      id:          'users',
      type:        WIDGET_TYPE.STAT,
      size:        WIDGET_SIZE.SM,
      title:       'Users',
      eyebrow:     'Accounts',
      variant:     WIDGET_VARIANT.GOLD,
      actionLabel: 'Manage →',
      isLoading:   true,
      data:        null,
      onAction:    () => { window.location.hash = 'admin'; },
    },
    {
      id:          'approvals',
      type:        WIDGET_TYPE.STAT,
      size:        WIDGET_SIZE.SM,
      title:       'Pending Approvals',
      eyebrow:     'Queue',
      variant:     WIDGET_VARIANT.PASS,
      actionLabel: 'Review →',
      isLoading:   true,
      data:        null,
      onAction:    () => { window.location.hash = 'admin'; },
    },
    {
      id:        'pipeline',
      type:      WIDGET_TYPE.STAT,
      size:      WIDGET_SIZE.SM,
      title:     'Pipeline',
      eyebrow:   'Scouting',
      variant:   WIDGET_VARIANT.DEFAULT,
      isLoading: false,
      data:      null,
      // onAction: () => navigateTo(ROUTES.SCOUTING) — wire when scouting is built
    },
    {
      id:        'roster',
      type:      WIDGET_TYPE.STAT,
      size:      WIDGET_SIZE.SM,
      title:     'Active Roster',
      eyebrow:   'Operations',
      variant:   WIDGET_VARIANT.DEFAULT,
      isLoading: false,
      data:      null,
      // onAction: () => navigateTo(ROUTES.OPERATIONS) — wire when operations is built
    },
    {
      id:          'events',
      type:        WIDGET_TYPE.CALENDAR,
      size:        WIDGET_SIZE.MD,
      title:       'Upcoming Events',
      eyebrow:     'Operations',
      variant:     WIDGET_VARIANT.DEFAULT,
      actionLabel: 'Schedule →',
      isLoading:   false,
      data:        null,
      // onAction: () => navigateTo(ROUTES.OPERATIONS) — wire when operations is built
    },
    {
      id:          'activity',
      type:        WIDGET_TYPE.FEED,
      size:        WIDGET_SIZE.MD,
      title:       'Recent Activity',
      eyebrow:     'Platform',
      variant:     WIDGET_VARIANT.DEFAULT,
      actionLabel: 'View all →',
      isLoading:   true,
      data:        null,
      onAction:    () => { window.location.hash = 'admin'; },
    },
  ];
}

//#endregion

//#region Private — Helpers

function _buildEyebrow() {
  const user = appState.currentUser;
  const name = user?.displayName ?? user?.trueSightId ?? '';
  return name ? `${name} · Dashboard` : 'Dashboard';
}

function _getActivityDot(action) {
  if (!action)                      return FEED_DOT.GOLD;
  if (action.includes('creat'))     return FEED_DOT.PASS;
  if (action.includes('deactivat')) return FEED_DOT.ALERT;
  if (action.includes('approv'))    return FEED_DOT.PASS;
  if (action.includes('reject'))    return FEED_DOT.ALERT;
  if (action.includes('reset'))     return FEED_DOT.INFO;
  return FEED_DOT.GOLD;
}

function _buildActivityDescription(item) {
  switch (item.action) {
    case 'created':        return 'created a staff account';
    case 'deactivated':    return 'deactivated a staff account';
    case 'reactivated':    return 'reactivated a staff account';
    case 'role_changed':   return 'changed a staff role';
    case 'password_reset': return 'reset a staff password';
    default:               return item.action || 'performed an action';
  }
}

//#endregion