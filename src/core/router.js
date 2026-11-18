/**
 * router.js
 * @version 1.1.0
 *
 * SPA view switching. Maps routes to feature modules.
 * Mounts and unmounts feature views dynamically.
 * Controls nav visibility per route — auth and dev are standalone,
 * all other routes show the nav.
 *
 * Active routes reflect only fully implemented features.
 * Stub routes are commented out and will be wired as features are built.
 */

//#region Imports

import { appState, isLoggedIn, isFirstLogin } from './appState.js';
import { Logger }                             from '../utils/logger.js';
import { LOG_SOURCE, LOG_ROUTER }             from '../constants/logMessages.js';

//#endregion

//#region Constants

const MOUNT_POINT_ID = 'app-mount';

export const ROUTES = {
  // ── Auth ──────────────────────────────────────────────────
  LOGIN:       'login',
  FIRST_LOGIN: 'first-login',

  // ── Dev ───────────────────────────────────────────────────
  DEV: 'dev',

  // ── Staff portal — implemented ────────────────────────────
  DASHBOARD:  'dashboard',
  SCOUTING:   'scouting',
  ADMIN:      'admin',
  OPERATIONS: 'operations',

  // ── Staff portal — scouting sub-features (not yet implemented) ──
  // TRACKER:    'tracker',
  // PROSPECTS:  'prospects',
  // PROSPECT:   'prospect',
  // COMBINES:   'combines',
  // INTERVIEWS: 'interviews',
  // EVALUATION: 'evaluation',

  // ── Player portal (not yet implemented) ───────────────────
  // PLAYER_DASHBOARD: 'player-dashboard',
  // PLAYER_SCHEDULE:  'player-schedule',
  // PLAYER_MYTEAM:    'player-myteam',
  // PLAYER_PROFILE:   'player-profile',
};

const NAV_HIDDEN_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.FIRST_LOGIN,
  ROUTES.DEV,
];

const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.FIRST_LOGIN,
  ROUTES.DEV,
];

//#endregion

//#region State

let _currentRoute   = null;
let _currentCleanup = null;
let _onAfterMount   = null;
let _nav            = null;

//#endregion

//#region Public API

/**
 * @param {Function} onAfterMount - called after every mount (used for dev toolbar rebind)
 * @param {object}   nav          - Nav public API reference to control visibility
 */
export function initRouter(onAfterMount = null, nav = null) {
  _onAfterMount = onAfterMount;
  _nav          = nav;
  window.addEventListener('hashchange', _handleRouteChange);
  _handleRouteChange();
}

export function navigateTo(route, params = {}) {
  appState.activeView = route;

  if (params.prospectId) {
    appState.activeProspectId = params.prospectId;
  }

  window.location.hash = _buildHash(route, params);
}

export function getCurrentRoute() {
  return _currentRoute;
}

//#endregion

//#region Route Handling

async function _handleRouteChange() {
  const { route, params } = _parseHash(window.location.hash);

  if (!isLoggedIn()) {
    if (!PUBLIC_ROUTES.includes(route)) {
      Logger.info(LOG_SOURCE.ROUTER, LOG_ROUTER.REDIRECT, { to: ROUTES.LOGIN, reason: 'not authenticated' });
      _redirect(ROUTES.LOGIN);
      return;
    }
  }

  if (isLoggedIn() && isFirstLogin()) {
    if (route !== ROUTES.FIRST_LOGIN) {
      Logger.info(LOG_SOURCE.ROUTER, LOG_ROUTER.REDIRECT, { to: ROUTES.FIRST_LOGIN, reason: 'first login incomplete' });
      _redirect(ROUTES.FIRST_LOGIN);
      return;
    }
  }

  if (isLoggedIn() && !isFirstLogin()) {
    if (route === ROUTES.LOGIN || route === ROUTES.FIRST_LOGIN) {
      Logger.info(LOG_SOURCE.ROUTER, LOG_ROUTER.REDIRECT, { to: ROUTES.DASHBOARD, reason: 'already authenticated' });
      _redirect(ROUTES.DASHBOARD);
      return;
    }
  }

  await _mountView(route, params);
}

async function _mountView(route, params) {
  if (_currentCleanup) {
    Logger.info(LOG_SOURCE.ROUTER, LOG_ROUTER.UNMOUNT, { route: _currentRoute });
    _currentCleanup();
    _currentCleanup = null;
  }

  _currentRoute       = route;
  appState.activeView = route;

  if (_nav) {
    if (NAV_HIDDEN_ROUTES.includes(route)) {
      _nav.hide();
    } else {
      _nav.show();
    }
  }

  const mountPoint = document.getElementById(MOUNT_POINT_ID);
  if (!mountPoint) {
    Logger.error(LOG_SOURCE.ROUTER, LOG_ROUTER.MOUNT_POINT_MISSING);
    return;
  }

  mountPoint.innerHTML = '';

  Logger.info(LOG_SOURCE.ROUTER, LOG_ROUTER.MOUNT, { route });

  const module = await _loadModule(route);
  if (!module) {
    Logger.warn(LOG_SOURCE.ROUTER, LOG_ROUTER.MODULE_FAILED, { route });
    mountPoint.innerHTML = '<p>Page not found.</p>';
    return;
  }

  _currentCleanup = await module.mount(mountPoint, params) || null;

  _onAfterMount?.();
}

async function _loadModule(route) {
  try {
    switch (route) {

      // ── Auth ────────────────────────────────────────────────
      case ROUTES.LOGIN:
      case ROUTES.FIRST_LOGIN:
        return await import('../shared/features/auth/authIndex.js');

      // ── Dev ─────────────────────────────────────────────────
      case ROUTES.DEV:
        return await import('../shared/features/dev/devIndex.js');

      // ── Staff portal ─────────────────────────────────────────
      case ROUTES.DASHBOARD:
        return await import('../features/dashboard/dashboardIndex.js');

      case ROUTES.SCOUTING:
        return await import('../features/staff/scouting/scoutingIndex.js');

      case ROUTES.ADMIN:
        return await import('../features/admin/adminIndex.js');

      case ROUTES.OPERATIONS:
        return await import('../features/staff/operations/operationsIndex.js');

      // ── Scouting sub-features (not yet implemented) ──────────
      // case ROUTES.TRACKER:
      //   return await import('../features/staff/scouting/tracker/trackerIndex.js');
      // case ROUTES.PROSPECTS:
      // case ROUTES.PROSPECT:
      //   return await import('../features/staff/scouting/prospects/prospectsIndex.js');
      // case ROUTES.COMBINES:
      //   return await import('../features/staff/scouting/combines/combinesIndex.js');
      // case ROUTES.INTERVIEWS:
      //   return await import('../features/staff/scouting/interviews/interviewsIndex.js');
      // case ROUTES.EVALUATION:
      //   return await import('../features/staff/scouting/evaluation/evaluationIndex.js');

      // ── Player portal (not yet implemented) ──────────────────
      // case ROUTES.PLAYER_DASHBOARD:
      //   return await import('../features/player/dashboard/dashboardIndex.js');
      // case ROUTES.PLAYER_SCHEDULE:
      //   return await import('../features/player/schedule/scheduleIndex.js');
      // case ROUTES.PLAYER_MYTEAM:
      //   return await import('../features/player/myteam/myTeamIndex.js');
      // case ROUTES.PLAYER_PROFILE:
      //   return await import('../features/player/profile/profileIndex.js');

      default:
        return null;
    }
  } catch (err) {
    Logger.error(LOG_SOURCE.ROUTER, LOG_ROUTER.MODULE_FAILED, err);
    return null;
  }
}

//#endregion

//#region Hash Helpers

function _parseHash(hash) {
  const raw                   = hash.replace('#', '') || ROUTES.LOGIN;
  const [pathPart, queryPart] = raw.split('?');
  const parts                 = pathPart.split('/');
  const route                 = parts[0];
  const params                = {};

  if (route === ROUTES.FIRST_LOGIN && parts[1]) {
    params.token = decodeURIComponent(parts[1]);
  }

  // case ROUTES.PROSPECT — not yet implemented
  // if (route === ROUTES.PROSPECT && parts[1]) {
  //   params.prospectId = decodeURIComponent(parts[1]);
  // }

  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((value, key) => {
      if (!params[key]) params[key] = value;
    });
  }

  return { route, params };
}

function _buildHash(route, params) {
  if (route === ROUTES.FIRST_LOGIN && params.token) {
    return `${route}/${params.token}`;
  }

  // case ROUTES.PROSPECT — not yet implemented
  // if (route === ROUTES.PROSPECT && params.prospectId) {
  //   return `${route}/${params.prospectId}`;
  // }

  return route;
}

function _redirect(route) {
  window.location.hash = route;
}

//#endregion