/**
 * devState.js
 * @version 1.1.0
 *
 * Local state for the dev mode feature.
 * Tracks dev session, active simulation, toolbar visibility,
 * and token metadata.
 *
 * Target path: src/shared/features/dev/devState.js
 */

//#region Imports

import { USER_TYPE, USER_ROLE, USER_TYPE_LABEL, USER_ROLE_LABEL } from '../../../constants/roles.js';
import { DEV_TOKEN_EXPIRY_MS }                                     from '../../../constants/config.js';

//#endregion

//#region Constants

/**
 * The default dev simulation — no specific portal or role.
 * @type {{ type: string, role: string | null }}
 */
export const DEV_SIMULATION_DEFAULT = {
  type: USER_TYPE.DEV,
  role: null,
};

/**
 * The dev user profile injected into appState when dev mode is active.
 * type is USER_TYPE.DEV — bypasses all permission checks.
 */
export const DEV_PROFILE = {
  id:           'dev',
  uid:          'dev',
  trueSightId:  'DEV#0000',
  displayName:  'Developer',
  name:         'Developer',
  type:         USER_TYPE.DEV,
  role:         null,
  active:       true,
  isFirstLogin: false,
};

/**
 * All simulations available in the dev role switcher.
 * Each entry represents a full user context { type, role, label }.
 * Dev is listed last — it is the default entry state.
 */
export const DEV_SWITCHABLE_SIMULATIONS = [
  {
    type:  USER_TYPE.ADMIN,
    role:  null,
    label: USER_TYPE_LABEL[USER_TYPE.ADMIN],
  },
  {
    type:  USER_TYPE.STAFF,
    role:  USER_ROLE.HEAD_COACH,
    label: USER_ROLE_LABEL[USER_ROLE.HEAD_COACH],
  },
  {
    type:  USER_TYPE.STAFF,
    role:  USER_ROLE.COACH,
    label: USER_ROLE_LABEL[USER_ROLE.COACH],
  },
  {
    type:  USER_TYPE.STAFF,
    role:  USER_ROLE.GENERAL_MANAGER,
    label: USER_ROLE_LABEL[USER_ROLE.GENERAL_MANAGER],
  },
  {
    type:  USER_TYPE.STAFF,
    role:  USER_ROLE.MANAGER,
    label: USER_ROLE_LABEL[USER_ROLE.MANAGER],
  },
  {
    type:  USER_TYPE.STAFF,
    role:  USER_ROLE.SCOUT,
    label: USER_ROLE_LABEL[USER_ROLE.SCOUT],
  },
  {
    type:  USER_TYPE.PLAYER,
    role:  null,
    label: USER_TYPE_LABEL[USER_TYPE.PLAYER],
  },
  {
    type:  USER_TYPE.DEV,
    role:  null,
    label: 'Developer',
  },
];

//#endregion

//#region State

export const devState = {

  /**
   * Whether dev mode is currently active.
   * @type {boolean}
   */
  isActive: false,

  /**
   * The currently active simulation context.
   * Defaults to the DEV simulation on entry.
   * @type {{ type: string, role: string | null }}
   */
  activeSimulation: { ...DEV_SIMULATION_DEFAULT },

  /**
   * Whether the dev toolbar panel is expanded.
   * @type {boolean}
   */
  isPanelOpen: false,

  /**
   * The current dev token loaded from Firestore.
   * @type {string | null}
   */
  currentToken: null,

  /**
   * Timestamp when the current token was generated.
   * Used to calculate expiry and time remaining.
   * @type {number | null}  — Unix ms
   */
  tokenGeneratedAt: null,

  /**
   * Token expiry duration in milliseconds.
   * Sourced from config.js — DEV_TOKEN_EXPIRY_MS.
   * @type {number}
   */
  tokenExpiryMs: DEV_TOKEN_EXPIRY_MS,

  /**
   * Whether the dev access door is currently showing.
   * @type {boolean}
   */
  isDoorOpen: false,

};

//#endregion

//#region State Helpers

/**
 * Activates dev mode.
 * Resets simulation to the DEV default.
 */
export function activateDevMode() {
  devState.isActive         = true;
  devState.activeSimulation = { ...DEV_SIMULATION_DEFAULT };
  devState.isDoorOpen       = false;
}

/**
 * Deactivates dev mode and resets all dev state.
 */
export function deactivateDevMode() {
  devState.isActive         = false;
  devState.activeSimulation = { ...DEV_SIMULATION_DEFAULT };
  devState.isPanelOpen      = false;
  devState.currentToken     = null;
  devState.tokenGeneratedAt = null;
  devState.isDoorOpen       = false;
}

/**
 * Sets the active simulation context.
 * @param {{ type: string, role: string | null }} simulation
 */
export function setDevSimulation(simulation) {
  devState.activeSimulation = { ...simulation };
}

/**
 * Toggles the dev toolbar panel open/closed.
 */
export function toggleDevPanel() {
  devState.isPanelOpen = !devState.isPanelOpen;
}

/**
 * Opens the dev access door screen.
 */
export function openDevDoor() {
  devState.isDoorOpen = true;
}

/**
 * Closes the dev access door screen.
 */
export function closeDevDoor() {
  devState.isDoorOpen = false;
}

/**
 * Stores the current token and its generation timestamp.
 * @param {string} token
 * @param {number} generatedAt  — Unix ms
 */
export function setDevToken(token, generatedAt) {
  devState.currentToken     = token;
  devState.tokenGeneratedAt = generatedAt;
}

/**
 * Returns true if the current token is expired.
 * @returns {boolean}
 */
export function isTokenExpired() {
  if (!devState.tokenGeneratedAt) return true;
  return Date.now() - devState.tokenGeneratedAt > devState.tokenExpiryMs;
}

/**
 * Returns the milliseconds remaining until token expiry.
 * Returns 0 if already expired.
 * @returns {number}
 */
export function getTokenTimeRemaining() {
  if (!devState.tokenGeneratedAt) return 0;
  const elapsed   = Date.now() - devState.tokenGeneratedAt;
  const remaining = devState.tokenExpiryMs - elapsed;
  return Math.max(0, remaining);
}

/**
 * Returns a human-readable string of time remaining.
 * e.g. "7h 23m" or "45m"
 * @returns {string}
 */
export function getTokenTimeRemainingLabel() {
  const ms      = getTokenTimeRemaining();
  if (ms === 0) return 'Expired';
  const hours   = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

//#endregion