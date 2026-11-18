/**
 * devController.js
 * @version 1.1.0
 *
 * Handles all interactions for dev mode.
 * Token entry, session start/end, simulation switching,
 * toolbar toggle, and route jumping.
 *
 * Target path: src/shared/features/dev/devController.js
 */

//#region Imports

import {
  devState,
  setDevSimulation,
  DEV_SWITCHABLE_SIMULATIONS,
  getTokenTimeRemainingLabel,
}                                       from './devState.js';

import {
  validateDevToken,
  startDevSession,
  endDevSession,
  applyDevSimulation,
}                                       from './devService.js';

import {
  renderDevDoor,
  renderDevToolbar,
  renderDevDoorError,
  renderDevDoorFirstSetup,
  updateDevSimulationDisplay,
  updateDevTokenTimer,
}                                       from './devRenderer.js';

import { navigateTo, ROUTES }           from '../../../core/router.js';
import { Nav }                           from '../../../shared/components/nav/navIndex.js';
import { closeSession }                  from '../../../services/sessionService.js';
import { Logger }                       from '../../../utils/logger.js';
import { LOG_SOURCE, LOG_DEV }          from '../../../constants/logMessages.js';

//#endregion

//#region Constants

const TOOLBAR_ID        = 'dev-toolbar';
const TIMER_INTERVAL_MS = 60 * 1000;

//#endregion

//#region State

let _timerInterval       = null;
let _simPopupOpen        = false;
let _routePopupOpen      = false;

//#endregion

//#region Dev Door

/**
 * Initializes the dev access door screen.
 * Called when dev:// is detected in the login form.
 */
export function initDevDoor() {
  renderDevDoor();
  _bindDevDoorEvents();
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.DOOR_OPEN);
}

/**
 * Handles the dev token form submission.
 * @param {Event} event
 */
async function handleDevTokenSubmit(event) {
  event.preventDefault();

  const input     = document.getElementById('js-dev-token-input');
  const submitBtn = document.getElementById('js-dev-token-submit');
  if (!input) return;

  const token = input.value.trim();

  if (!token) {
    renderDevDoorError('Please enter your dev token.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Validating…';
  }

  Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOKEN_VALIDATING);

  try {
    const result = await validateDevToken(token);

    if (result.firstSetup) {
      Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOKEN_FIRST_SETUP);
      renderDevDoorFirstSetup(result.message);
      return;
    }

    if (!result.valid) {
      Logger.warn(LOG_SOURCE.DEV, LOG_DEV.TOKEN_INVALID);
      renderDevDoorError(result.message);
      return;
    }

    Logger.info(LOG_SOURCE.DEV, LOG_DEV.SESSION_START);
    startDevSession();
    Nav.registerCloseSession(closeSession);
    Nav.init();
    _mountDevToolbar();
    navigateTo(ROUTES.DASHBOARD);

  } catch (err) {
    Logger.error(LOG_SOURCE.DEV, LOG_DEV.TOKEN_ERROR, err);
    renderDevDoorError('Something went wrong. Try again.');

  } finally {
    if (submitBtn) {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Enter';
    }
  }
}

/**
 * Handles the back button on the dev door.
 */
function handleDevDoorBack() {
  devState.isDoorOpen = false;
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.DOOR_CLOSE);
  navigateTo(ROUTES.LOGIN);
}

//#endregion

//#region Dev Toolbar

/**
 * Mounts the dev toolbar into the DOM.
 */
function _mountDevToolbar() {
  const app = document.getElementById('app');
  if (!app) return;

  const existing = document.getElementById(TOOLBAR_ID);
  if (existing) existing.remove();

  const wrapper     = document.createElement('div');
  wrapper.id        = TOOLBAR_ID;
  wrapper.innerHTML = renderDevToolbar(devState);
  app.appendChild(wrapper);

  _bindToolbarEvents();
  _startTokenTimer();

  Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOOLBAR_MOUNT);
}

/**
 * Removes the dev toolbar from the DOM.
 */
function _unmountDevToolbar() {
  const toolbar = document.getElementById(TOOLBAR_ID);
  if (toolbar) toolbar.remove();
  _stopTokenTimer();
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOOLBAR_UNMOUNT);
}

/**
 * Re-binds toolbar events after a route change re-renders the toolbar.
 * Called by the router's onAfterMount hook.
 */
export function rebindToolbarEvents() {
  _bindToolbarEvents();
}

//#endregion

//#region Simulation Switching

/**
 * Handles simulation tool button click — toggles simulation popup.
 */
function handleSimToolClick() {
  _togglePopup('simulation');
}

/**
 * Handles simulation button click inside the simulation popup.
 * Looks up the simulation by index from DEV_SWITCHABLE_SIMULATIONS.
 * @param {number} index
 */
async function handleSimulationSwitch(index) {
  const simulation = DEV_SWITCHABLE_SIMULATIONS[index];
  if (!simulation) return;

  const current = devState.activeSimulation;
  if (current.type === simulation.type && current.role === simulation.role) return;

  Logger.info(LOG_SOURCE.DEV, LOG_DEV.ROLE_SWITCH, {
    from: { type: current.type, role: current.role },
    to:   { type: simulation.type, role: simulation.role },
  });

  setDevSimulation(simulation);
  applyDevSimulation(simulation);
  updateDevSimulationDisplay(simulation);

  _closeAllPopups();

  const currentRoute = window.location.hash.replace('#', '') || ROUTES.DASHBOARD;
  navigateTo(currentRoute);
}

//#endregion

//#region Route Jumping

/**
 * Handles route tool button click — toggles route popup.
 */
function handleRouteToolClick() {
  _togglePopup('route');
}

/**
 * Handles route button click inside the route popup.
 * @param {string} route
 */
function handleRouteJump(route) {
  if (!route) return;

  Logger.info(LOG_SOURCE.DEV, LOG_DEV.ROUTE_JUMP, { route });
  _closeAllPopups();
  navigateTo(route);
}

//#endregion

//#region Dev Session Actions

/**
 * Handles exit dev mode button.
 */
async function handleExitDevMode() {
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.SESSION_END);
  _unmountDevToolbar();
  await endDevSession();
  navigateTo(ROUTES.LOGIN);
}

/**
 * Handles force first login button.
 */
function handleForceFirstLogin() {
  if (!devState.isActive) return;
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.FORCE_FIRST_LOGIN);
  navigateTo(ROUTES.FIRST_LOGIN);
}

/**
 * Handles state inspector button — logs appState to console.
 */
function handleStateInspector() {
  Logger.inspect('App State', window.appState);
}

//#endregion

//#region Token Timer

function _startTokenTimer() {
  _stopTokenTimer();
  _timerInterval = setInterval(() => {
    updateDevTokenTimer(getTokenTimeRemainingLabel());
  }, TIMER_INTERVAL_MS);
}

function _stopTokenTimer() {
  if (!_timerInterval) return;
  clearInterval(_timerInterval);
  _timerInterval = null;
}

//#endregion

//#region Popup Helpers

/**
 * Toggles the given popup open/closed, closing the other one.
 * @param {'simulation' | 'route'} target
 */
function _togglePopup(target) {
  const isSim   = target === 'simulation';
  const isRoute = target === 'route';

  _simPopupOpen   = isSim   ? !_simPopupOpen   : false;
  _routePopupOpen = isRoute ? !_routePopupOpen : false;

  _toggleBtn('js-dev-tool-simulation', _simPopupOpen);
  _toggleBtn('js-dev-tool-route',      _routePopupOpen);

  _setPopupVisible('js-dev-simulation-popup', _simPopupOpen);
  _setPopupVisible('js-dev-route-popup',       _routePopupOpen);
}

function _closeAllPopups() {
  _simPopupOpen   = false;
  _routePopupOpen = false;

  _toggleBtn('js-dev-tool-simulation', false);
  _toggleBtn('js-dev-tool-route',      false);

  _setPopupVisible('js-dev-simulation-popup', false);
  _setPopupVisible('js-dev-route-popup',       false);
}

function _toggleBtn(id, active) {
  document.getElementById(id)?.classList.toggle('is-active', active);
}

function _setPopupVisible(id, visible) {
  document.getElementById(id)?.classList.toggle('is-hidden', !visible);
}

//#endregion

//#region Event Binding

function _bindDevDoorEvents() {
  const form    = document.getElementById('js-dev-door-form');
  const backBtn = document.getElementById('js-dev-door-back');

  if (form)    form.addEventListener('submit', handleDevTokenSubmit);
  if (backBtn) backBtn.addEventListener('click', handleDevDoorBack);
}

function _bindToolbarEvents() {
  const simToolBtn   = document.getElementById('js-dev-tool-simulation');
  const routeToolBtn = document.getElementById('js-dev-tool-route');
  const exitBtn      = document.getElementById('js-dev-exit');
  const stateBtn     = document.getElementById('js-dev-state-inspector');
  const firstLogin   = document.getElementById('js-dev-force-first-login');

  if (simToolBtn)   simToolBtn.addEventListener('click',   handleSimToolClick);
  if (routeToolBtn) routeToolBtn.addEventListener('click', handleRouteToolClick);
  if (exitBtn)      exitBtn.addEventListener('click',      handleExitDevMode);
  if (stateBtn)     stateBtn.addEventListener('click',     handleStateInspector);
  if (firstLogin)   firstLogin.addEventListener('click',   handleForceFirstLogin);

  _bindSimulationPopupEvents();
  _bindRoutePopupEvents();
}

function _bindSimulationPopupEvents() {
  document.querySelectorAll('.js-dev-sim-btn').forEach(btn => {
    const index = parseInt(btn.dataset.simIndex, 10);
    btn.addEventListener('click', () => handleSimulationSwitch(index));
  });
}

function _bindRoutePopupEvents() {
  document.querySelectorAll('.js-dev-route-btn').forEach(btn => {
    btn.addEventListener('click', () => handleRouteJump(btn.dataset.route));
  });
}

//#endregion

//#region Public API

/**
 * Returns true if dev mode is currently active.
 * @returns {boolean}
 */
export function isDevModeActive() {
  return devState.isActive;
}

//#endregion