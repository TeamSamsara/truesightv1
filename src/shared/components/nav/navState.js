/**
 * navState.js
 * @version 1.1.0
 *
 * State for the global nav component.
 *
 * NAV_DISABLED_DOMAINS removed — domain visibility is now driven
 * by hasPermission() in navRenderer.js, not a static list.
 *
 * Target path: src/shared/components/nav/navState.js
 */

//#region Constants

export const NAV_DOMAIN = {
  DASHBOARD:  'dashboard',
  SCOUTING:   'scouting',
  ANALYSIS:   'analysis',
  OPERATIONS: 'operations',
  COACHING:   'coaching',
  ADMIN:      'admin',
};

//#endregion

//#region State

export const navState = {

  /** @type {string | null} */
  activeDomain: null,

  /**
   * Sub-nav items supplied by the active domain.
   * Each entry: { key, label, badge, alert }
   * @type {Array | null}
   */
  subNavItems: null,

  /** @type {string | null} */
  activeSubKey: null,

  /**
   * Optional HTML string injected into the sub-nav right slot.
   * @type {string}
   */
  subNavActions: '',

};

//#endregion

//#region State Helpers

/**
 * Sets the active nav domain.
 * @param {string} domain
 */
export function setActiveDomain(domain) {
  navState.activeDomain = domain;
}

/**
 * Sets the full sub-nav config.
 * @param {string}   domain
 * @param {object[]} items
 * @param {string}   activeSubKey
 * @param {string}   [actions]
 */
export function setSubNav(domain, items, activeSubKey, actions = '') {
  navState.activeDomain  = domain;
  navState.subNavItems   = items;
  navState.activeSubKey  = activeSubKey;
  navState.subNavActions = actions;
}

/**
 * Clears the sub-nav state.
 */
export function clearSubNav() {
  navState.subNavItems   = null;
  navState.activeSubKey  = null;
  navState.subNavActions = '';
}

/**
 * Sets the active sub-nav key.
 * @param {string} key
 */
export function setActiveSubKey(key) {
  navState.activeSubKey = key;
}

/**
 * Updates the badge count on a specific sub-nav item in state.
 * @param {string} key
 * @param {number} count
 */
export function updateSubNavBadgeState(key, count) {
  if (!navState.subNavItems) return;
  const item = navState.subNavItems.find(i => i.key === key);
  if (item) item.badge = count;
}

//#endregion