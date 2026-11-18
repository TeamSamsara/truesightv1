/**
 * guards.js -> Shared system with roles.js, permissions.js
 * @version 1.1.0
 *
 * Route guards and permission-based access checks.
 * Called by the router and feature controllers before mounting views.
 *
 * All permission checks go through hasPermission() — no raw role
 * or type string comparisons anywhere in this file.
 *
 * DEV type bypasses all guards entirely via hasPermission().
 */

//#region Imports

import { appState, isLoggedIn, isFirstLogin } from './appState.js';
import { navigateTo, ROUTES }                 from './router.js';
import { USER_TYPE }                          from '../constants/roles.js';
import { hasPermission, PERMISSION }          from '../constants/permissions.js';

//#endregion

//#region Constants

/**
 * Routes that do not require authentication.
 */
const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.FIRST_LOGIN,
  ROUTES.DEV,
];

/**
 * Maps each protected route to the NAVIGATE permission required to access it.
 * Any route not listed here is accessible to all authenticated users.
 */
const ROUTE_PERMISSION_MAP = {
  [ROUTES.ADMIN]:    PERMISSION.NAVIGATE_ADMIN,
  [ROUTES.SCOUTING]: PERMISSION.NAVIGATE_SCOUTING,
  [ROUTES.TRACKER]:  PERMISSION.NAVIGATE_TRACKER,
};

//#endregion

//#region Public Guards

/**
 * Auth guard — enforces login and first-login completion.
 * DEV type bypasses all auth checks.
 *
 * @param {string} route
 * @returns {boolean}
 */
export function authGuard(route) {
  if (_isDevSession()) return true;

  if (!isLoggedIn()) {
    if (!PUBLIC_ROUTES.includes(route)) {
      navigateTo(ROUTES.LOGIN);
      return false;
    }
    return true;
  }

  if (isFirstLogin()) {
    if (route !== ROUTES.FIRST_LOGIN) {
      navigateTo(ROUTES.FIRST_LOGIN);
      return false;
    }
    return true;
  }

  if (PUBLIC_ROUTES.includes(route)) {
    navigateTo(ROUTES.DASHBOARD);
    return false;
  }

  return true;
}

/**
 * Role guard — checks if the current user holds the NAVIGATE permission
 * required for the given route.
 * DEV type bypasses all role checks.
 *
 * @param {string} route
 * @returns {boolean}
 */
export function roleGuard(route) {
  if (_isDevSession())                return true;
  if (PUBLIC_ROUTES.includes(route))  return true;
  if (!isLoggedIn())                  return false;

  const required = ROUTE_PERMISSION_MAP[route];
  if (!required) return true;

  if (!hasPermission(appState.currentUser, required)) {
    navigateTo(ROUTES.DASHBOARD);
    return false;
  }

  return true;
}

/**
 * Combined guard — runs auth and role checks in sequence.
 * Use this as the single entry point in all feature index files.
 *
 * @param {string} route
 * @returns {boolean}
 */
export function canAccess(route) {
  if (!authGuard(route)) return false;
  if (!roleGuard(route)) return false;
  return true;
}

//#endregion

//#region Permission Guards

/**
 * Returns true if the current user can manage user accounts.
 * @returns {boolean}
 */
export function guardCanManageStaff() {
  return hasPermission(appState.currentUser, PERMISSION.CREATE_USER_ACCOUNT);
}

/**
 * Returns true if the current user can manage player accounts.
 * @returns {boolean}
 */
export function guardCanManagePlayers() {
  return hasPermission(appState.currentUser, PERMISSION.CREATE_PLAYER_ACCOUNT);
}

/**
 * Returns true if the current user can assign or change roles.
 * @returns {boolean}
 */
export function guardCanAssignRoles() {
  return hasPermission(appState.currentUser, PERMISSION.ASSIGN_USER_ROLE);
}

/**
 * Returns true if the current user can approve irreversible actions.
 * @returns {boolean}
 */
export function guardCanApprove() {
  return hasPermission(appState.currentUser, PERMISSION.APPROVE_ACTIONS);
}

/**
 * Returns true if the current user can create events.
 * @returns {boolean}
 */
export function guardCanCreateEvent() {
  return hasPermission(appState.currentUser, PERMISSION.CREATE_EVENT);
}

/**
 * Returns true if the current user can manage rosters.
 * @returns {boolean}
 */
export function guardCanManageRosters() {
  return hasPermission(appState.currentUser, PERMISSION.CREATE_ROSTER);
}

/**
 * Returns true if the current user can add players to a roster.
 * @returns {boolean}
 */
export function guardCanAddPlayerToRoster() {
  return hasPermission(appState.currentUser, PERMISSION.ADD_PLAYER_TO_ROSTER);
}

/**
 * Returns true if the current user can add staff to a roster.
 * @returns {boolean}
 */
export function guardCanAddStaffToRoster() {
  return hasPermission(appState.currentUser, PERMISSION.ADD_STAFF_TO_ROSTER);
}

/**
 * Returns true if the current user can send availability requests.
 * @returns {boolean}
 */
export function guardCanSendAvailabilityRequest() {
  return hasPermission(appState.currentUser, PERMISSION.SEND_AVAILABILITY_REQUEST);
}

// ── Scouting pipeline (deferred — not yet implemented) ────────
// export function guardCanEvaluate() {
//   return hasPermission(appState.currentUser, PERMISSION.EVALUATE_PLAYER);
// }
// export function guardCanPromote() {
//   return hasPermission(appState.currentUser, PERMISSION.PROMOTE_PLAYER);
// }

//#endregion

//#region Require Helpers

/**
 * Throws if the current user does not hold the specified permission.
 * Use for hard enforcement inside service functions.
 *
 * @param {string} permission - value from PERMISSION
 * @param {string} [message]  - optional custom error message
 * @throws {Error}
 */
export function requirePermission(permission, message) {
  if (hasPermission(appState.currentUser, permission)) return;
  throw new Error(message ?? `This action requires the "${permission}" permission.`);
}

/**
 * Throws if no user is currently logged in.
 * DEV session bypasses.
 *
 * @throws {Error}
 */
export function requireAuth() {
  if (_isDevSession()) return;
  if (!isLoggedIn()) {
    throw new Error('You must be logged in to perform this action.');
  }
}

//#endregion

//#region Private Helpers

/**
 * Returns true if the current session belongs to a DEV type user.
 * DEV bypasses all guards and permission checks.
 * @returns {boolean}
 */
function _isDevSession() {
  return appState.currentUser?.type === USER_TYPE.DEV;
}

//#endregion