/**
 * appState.js
 * @version 1.1.0
 *
 * Global application state.
 * Defines all states: active user, active view, and active prospect.
 * All features read from here — no duplication across the app.
 *
 * currentUser shape:
 * {
 *   uid:          string
 *   type:         USER_TYPE   — portal discriminator (admin / staff / player / dev)
 *   role:         USER_ROLE   — staff sub-role, null for admin / player / dev
 *   displayName:  string
 *   isFirstLogin: boolean
 * }
 */

//#region Imports

import { USER_TYPE } from '../constants/roles.js';

//#endregion

//#region State

export const appState = {

  /**
   * The currently authenticated user.
   * Null if no one is logged in.
   * @type {object | null}
   */
  currentUser: null,

  /**
   * The currently active view/route.
   * @type {string | null}
   */
  activeView: null,

  /**
   * The currently open prospect profile ID.
   * Null if no profile is open.
   * @type {string | null}
   */
  activeProspectId: null,

  /**
   * The currently active combine ID.
   * Null if no combine is open.
   * @type {string | null}
   */
  activeCombineId: null,

  /**
   * Global loading state.
   * True while any async operation is in flight.
   * @type {boolean}
   */
  isLoading: false,

  /**
   * Global error message.
   * Null if no error is active.
   * @type {string | null}
   */
  error: null,

};

//#endregion

//#region State Helpers

/**
 * Returns true if a user is currently logged in.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return appState.currentUser !== null;
}

/**
 * Returns true if the current user is on their first login.
 * @returns {boolean}
 */
export function isFirstLogin() {
  return appState.currentUser?.isFirstLogin === true;
}

/**
 * Returns true if the current user is an Admin type.
 * @returns {boolean}
 */
export function isAdmin() {
  return appState.currentUser?.type === USER_TYPE.ADMIN;
}

/**
 * Returns true if the current user is a Staff type.
 * @returns {boolean}
 */
export function isStaff() {
  return appState.currentUser?.type === USER_TYPE.STAFF;
}

/**
 * Returns true if the current user is a Player type.
 * @returns {boolean}
 */
export function isPlayer() {
  return appState.currentUser?.type === USER_TYPE.PLAYER;
}

/**
 * Returns true if the current session is a Dev type.
 * @returns {boolean}
 */
export function isDev() {
  return appState.currentUser?.type === USER_TYPE.DEV;
}

/**
 * Sets the global loading state.
 * @param {boolean} value
 */
export function setLoading(value) {
  appState.isLoading = value;
}

/**
 * Sets the global error message.
 * @param {string | null} message
 */
export function setError(message) {
  appState.error = message;
}

/**
 * Clears the global error message.
 */
export function clearError() {
  appState.error = null;
}

//#endregion