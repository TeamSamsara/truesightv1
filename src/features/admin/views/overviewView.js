/**
 * overviewView.js
 * @version 1.2.0
 *
 * Renders the Admin Overview page — platform health dashboard.
 * Migrated to use the shared Dashboard + Widget component system.
 * Called by adminRenderer.js. Never called directly by controllers.
 *
 * Target path: src/features/admin/views/overviewView.js
 */

//#region Imports

import { Dashboard, WIDGET_SIZE, WIDGET_TYPE } from '../../../shared/components/dashboard/dashboardIndex.js';
import { createStatData }                      from '../../../shared/components/widget/widgets/stat/statWidgetIndex.js';
import { createFeedData, createFeedItem,
         FEED_DOT }                            from '../../../shared/components/widget/widgets/feed/feedWidgetIndex.js';
import { WIDGET_VARIANT }                      from '../../../shared/components/widget/widgetIndex.js';
import { USER_ROLE_LABEL, USER_TYPE_LABEL } from '../../../constants/roles.js';
import { ADMIN_TABS }                          from '../adminState.js';

//#endregion

//#region Public API

/**
 * Renders the overview page into the admin content area.
 * Initializes the dashboard with loading widgets — data is populated
 * by updateOverviewWidgets() once fetches complete.
 *
 * @param {HTMLElement} content    - the #js-admin-content element
 * @param {object}      state      - adminState
 * @param {Function}    onTabClick - callback to switch admin tabs
 */
export function renderOverviewPage(content, state, onTabClick) {
  content.innerHTML = `
    <div class="f-admin__page">
      <div class="f-admin__page-header">
        <div class="f-admin__page-header-left">
          <div class="f-admin__page-eyebrow">Admin · Overview</div>
          <div class="f-admin__page-title">PLATFORM OVERVIEW</div>
          <div class="f-admin__page-sub">
            Monitor platform activity and manage user accounts.
          </div>
        </div>
      </div>
      <div id="js-admin-overview-dashboard"></div>
    </div>
  `;

  const container = content.querySelector('#js-admin-overview-dashboard');
  if (!container) return;

  Dashboard.init(container, _buildWidgets(state, onTabClick));
}

/**
 * Surgically updates all overview widgets with fresh data.
 * Called by the controller after data fetches complete.
 *
 * @param {object}   state      - adminState
 * @param {Function} onTabClick - callback to switch admin tabs
 */
export function updateOverviewWidgets(state, onTabClick) {
  const { widgetCounts, userList, recentActivity } = state;

  Dashboard.updateWidget('users', createStatData({
    value:     widgetCounts.users ?? 0,
    sub:       'Active accounts on platform',
    breakdown: _buildUserBreakdown(userList),
  }));

  Dashboard.updateWidget('approvals', createStatData({
    value: widgetCounts.approvals ?? 0,
    sub:   'Actions waiting for confirmation',
  }));

  Dashboard.updateWidget('stale', createStatData({
    value: widgetCounts.stale ?? 0,
    sub:   'Prospects inactive for 24+ months',
  }));

  Dashboard.updateWidget('invites', createStatData({
    value: widgetCounts.invites ?? 0,
    sub:   'Pending acceptance',
  }));

  Dashboard.updateWidget('activity', createFeedData({
    items: recentActivity.map(item => createFeedItem({
      id:        item.id,
      dot:       _getActivityDot(item.action),
      label:     item.actorName || 'Unknown',
      sub:       _buildActivityDescription(item),
      timestamp: item.timestamp,
    })),
    limit: 8,
  }));
}

//#endregion

//#region Private — Widget Definitions

/**
 * Builds the initial widget set — all in loading state until data arrives.
 * @param {object}   state
 * @param {Function} onTabClick
 * @returns {object[]}
 */
function _buildWidgets(state, onTabClick) {
  const counts = state.widgetCounts;

  return [
    {
      id:          'users',
      type:        WIDGET_TYPE.STAT,
      size:        WIDGET_SIZE.SM,
      title:       'Users',
      eyebrow:     'Accounts',
      variant:     WIDGET_VARIANT.GOLD,
      actionLabel: 'Manage →',
      isLoading:   counts.users === null,
      data:        counts.users !== null ? createStatData({
        value:     counts.users,
        sub:       'Active accounts on platform',
        breakdown: _buildUserBreakdown(state.userList),
      }) : null,
      onAction: () => onTabClick?.(ADMIN_TABS.USERS),
    },
    {
      id:          'approvals',
      type:        WIDGET_TYPE.STAT,
      size:        WIDGET_SIZE.SM,
      title:       'Pending Approvals',
      eyebrow:     'Queue',
      variant:     (counts.approvals ?? 0) > 0 ? WIDGET_VARIANT.ALERT : WIDGET_VARIANT.PASS,
      actionLabel: 'Review →',
      isLoading:   counts.approvals === null,
      data:        counts.approvals !== null ? createStatData({
        value: counts.approvals,
        sub:   'Actions waiting for confirmation',
      }) : null,
      onAction: () => onTabClick?.(ADMIN_TABS.APPROVALS),
    },
    {
      id:          'stale',
      type:        WIDGET_TYPE.STAT,
      size:        WIDGET_SIZE.SM,
      title:       'Stale Profiles',
      eyebrow:     'Scouting',
      variant:     WIDGET_VARIANT.INFO,
      actionLabel: 'Review →',
      isLoading:   counts.stale === null,
      data:        counts.stale !== null ? createStatData({
        value: counts.stale,
        sub:   'Prospects inactive for 24+ months',
      }) : null,
      onAction: () => onTabClick?.(ADMIN_TABS.STALE),
    },
    {
      id:          'invites',
      type:        WIDGET_TYPE.STAT,
      size:        WIDGET_SIZE.SM,
      title:       'Active Invites',
      eyebrow:     'Onboarding',
      variant:     WIDGET_VARIANT.PASS,
      actionLabel: 'Manage →',
      isLoading:   counts.invites === null,
      data:        counts.invites !== null ? createStatData({
        value: counts.invites,
        sub:   'Pending acceptance',
      }) : null,
      onAction: () => onTabClick?.(ADMIN_TABS.USERS),
    },
    {
      id:          'activity',
      type:        WIDGET_TYPE.FEED,
      size:        WIDGET_SIZE.FULL,
      title:       'Recent Activity',
      eyebrow:     'Platform',
      variant:     WIDGET_VARIANT.DEFAULT,
      actionLabel: 'View all →',
      isLoading:   true,
      data:        null,
      onAction:    null,
    },
  ];
}

//#endregion

//#region Private — Data Helpers

/**
 * Builds the user type/role breakdown for the stat widget.
 * @param {object[]} userList
 * @returns {object[]}
 */
function _buildUserBreakdown(userList) {
  if (!userList?.length) return [];

  const counts = {};
  userList.filter(u => u.active).forEach(u => {
    counts[u.type] = (counts[u.type] || 0) + 1;
  });

  return Object.entries(counts).map(([type, count]) => ({
    label: USER_TYPE_LABEL[type] || type,
    value: count,
  }));
}

/**
 * Maps an action type to a feed dot variant.
 * @param {string} action
 * @returns {string}
 */
function _getActivityDot(action) {
  if (!action)                      return FEED_DOT.GOLD;
  if (action.includes('creat'))     return FEED_DOT.PASS;
  if (action.includes('deactivat')) return FEED_DOT.ALERT;
  if (action.includes('approv'))    return FEED_DOT.PASS;
  if (action.includes('reject'))    return FEED_DOT.ALERT;
  if (action.includes('reset'))     return FEED_DOT.INFO;
  return FEED_DOT.GOLD;
}

/**
 * Builds a human-readable description for a feed item.
 * @param {object} item
 * @returns {string}
 */
function _buildActivityDescription(item) {
  switch (item.action) {
    case 'created':        return 'created a user account';
    case 'deactivated':    return 'deactivated a user account';
    case 'reactivated':    return 'reactivated a user account';
    case 'role_changed':   return 'changed a user role';
    case 'password_reset': return 'reset a user password';
    default:               return item.action || 'performed an action';
  }
}

//#endregion