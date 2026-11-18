/**
 * navController.js
 * @version 1.0.7
 *
 * Controls the global nav shell and sub-nav lifecycle.
 *
 * Target path: src/shared/components/nav/navController.js
 */

//#region Imports

import { navigateTo, ROUTES }          from '../../../core/router.js';
import { renderNav, renderSubNav,
         updateActiveDomain,
         updateSubNavBadge }           from './navRenderer.js';
import { navState, setSubNav,
         setActiveSubKey,
         updateSubNavBadgeState }      from './navState.js';
import { Logger }                      from '../../../utils/logger.js';
import { LOG_SOURCE, LOG_NAV }         from '../../../constants/logMessages.js';

//#endregion

//#region State

let _closeSessionFn = null;
let _onTabClickFn   = null;

//#endregion

//#region Public API

export function init() {
  renderNav();
  _bindNavEvents();
  Logger.info(LOG_SOURCE.NAV, LOG_NAV.INIT);
}

export function setDomain(domain, subNavItems = [], activeSubKey = null, actions = '', onTabClick = null) {
  _onTabClickFn = onTabClick;
  setSubNav(domain, subNavItems, activeSubKey, actions);

  updateActiveDomain(domain);

  renderSubNav();
  _bindSubNavEvents();

  Logger.info(LOG_SOURCE.NAV, LOG_NAV.DOMAIN_SET, { domain, activeSubKey });
}

export function setActiveTab(key) {
  setActiveSubKey(key);
  document.querySelectorAll('.js-subnav-link').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.key === key);
  });
  Logger.info(LOG_SOURCE.NAV, LOG_NAV.TAB_ACTIVE, { key });
}

export function updateBadge(key, count) {
  updateSubNavBadgeState(key, count);
  updateSubNavBadge(key, count);
}

export function refreshSubNav() {
  renderSubNav();
  _bindSubNavEvents();
  Logger.info(LOG_SOURCE.NAV, LOG_NAV.SUBNAV_REFRESHED);
}

export function hide() {
  document.getElementById('app-nav')?.classList.add('is-hidden');
  document.getElementById('app-subnav')?.classList.add('is-hidden');
  Logger.info(LOG_SOURCE.NAV, LOG_NAV.HIDDEN);
}

export function show() {
  document.getElementById('app-nav')?.classList.remove('is-hidden');
  document.getElementById('app-subnav')?.classList.remove('is-hidden');
}

export function registerCloseSession(fn) {
  _closeSessionFn = fn;
  Logger.info(LOG_SOURCE.NAV, LOG_NAV.SESSION_REGISTERED);
}

//#endregion

//#region Private — Nav Events

function _bindNavEvents() {
  const signOutBtn = document.querySelector('.js-nav-logout');
  if (signOutBtn) {
    const fresh = signOutBtn.cloneNode(true);
    signOutBtn.parentNode.replaceChild(fresh, signOutBtn);
    fresh.addEventListener('click', _handleSignOut);
  }

  const logo = document.querySelector('.js-nav-home');
  if (logo) {
    const fresh = logo.cloneNode(true);
    logo.parentNode.replaceChild(fresh, logo);
    fresh.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(ROUTES.DASHBOARD);
    });
  }
}

async function _handleSignOut() {
  Logger.info(LOG_SOURCE.NAV, LOG_NAV.SIGN_OUT);
  if (typeof _closeSessionFn === 'function') {
    await _closeSessionFn();
  } else {
    Logger.warn(LOG_SOURCE.NAV, LOG_NAV.SESSION_NOT_REGISTERED);
    navigateTo(ROUTES.LOGIN);
  }
}

//#endregion

//#region Private — Sub-Nav Events

function _bindSubNavEvents() {
  const el = document.getElementById('app-subnav');
  if (!el) return;

  const fresh = el.cloneNode(true);
  el.parentNode.replaceChild(fresh, el);
  fresh.addEventListener('click', _onSubNavClick);
}

function _onSubNavClick(e) {
  const tab = e.target.closest('.js-subnav-link');
  if (!tab) return;

  const key = tab.dataset.key;
  if (!key || key === navState.activeSubKey) return;

  setActiveTab(key);
  Logger.info(LOG_SOURCE.NAV, LOG_NAV.TAB_CLICKED, { key });

  if (typeof _onTabClickFn === 'function') {
    _onTabClickFn(key);
  }
}

//#endregion