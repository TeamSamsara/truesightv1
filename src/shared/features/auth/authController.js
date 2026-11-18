/**
 * authController.js
 * @version 1.0.7
 *
 * Handles all interactions for the login and
 * first login setup flows.
 * Wires DOM events to authService and updates
 * authState and authRenderer accordingly.
 *
 * Target path: src/shared/features/auth/authController.js
 */

//#region Imports

import {
  authState,
  setAuthLoading,
  setAuthError,
  clearAuthError,
  setResolvedInvite,
  resetAuthState,
}                              from './authState.js';
import {
  renderAuthError,
  renderAuthLoading,
  renderLoginView,
  renderFirstLoginView,
}                              from './authRenderer.js';
import {
  login,
  completeFirstLoginSetup,
  validateInviteToken,
}                              from './authService.js';
import { logUserAction }      from '../../../services/auditService.js';
import { initSession,
         closeSession }        from '../../../services/sessionService.js';
import { navigateTo, ROUTES }  from '../../../core/router.js';
import { Nav }                 from '../../components/nav/navIndex.js';
import {
  isValidTrueSightId,
  isValidPassword,
  isValidEmail,
  qs,
}                              from '../../../utils/helpers.js';
import { Logger }              from '../../../utils/logger.js';
import { LOG_SOURCE, LOG_AUTH } from '../../../constants/logMessages.js';

//#endregion

//#region Init

/**
 * Initializes the auth feature for the given route.
 * Passes route params so first-login can read the invite token.
 * @param {string} route   - 'login' | 'first-login'
 * @param {object} params  - route params from the router
 */
export async function initAuth(route, params = {}) {
  if (route === ROUTES.FIRST_LOGIN) {
    await _checkInviteToken(params.token || null);
    renderFirstLoginView(authState);
    _bindFirstLoginEvents();
    return;
  }

  renderLoginView(authState);
  _bindLoginEvents();
}

//#endregion

//#region Login Flow

/**
 * Handles the login form submission.
 * Detects dev:// trigger before normal login flow.
 * @param {Event} event
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  clearAuthError();

  const email    = _getInputValue('js-login-email');
  const password = _getInputValue('js-login-password');

  if (email.toLowerCase().startsWith('dev://')) {
    Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.DEV_DOOR_TRIGGER);
    navigateTo(ROUTES.DEV);
    return;
  }

  if (!_validateLoginInputs(email, password)) return;

  setAuthLoading(true);
  renderAuthLoading(true);

  Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.LOGIN_ATTEMPT, { email });

  try {
    const profile = await login(email, password);

    if (profile.isFirstLogin) {
      Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.FIRST_LOGIN_REDIRECT);
      navigateTo(ROUTES.FIRST_LOGIN);
      return;
    }

    initSession();
    Nav.registerCloseSession(closeSession);
    Nav.init();

    Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.LOGIN_SUCCESS, {
      userId: profile.id,
      type:   profile.type,
      role:   profile.role,
    });

    const redirect = _getRedirectRoute();
    navigateTo(redirect ?? ROUTES.DASHBOARD);

  } catch (err) {
    Logger.warn(LOG_SOURCE.AUTH, LOG_AUTH.LOGIN_FAILED, { email, err: err.message });
    setAuthError(_parseAuthError(err.message));
    renderAuthError(authState.error);

  } finally {
    setAuthLoading(false);
    renderAuthLoading(false);
  }
}

/**
 * Validates login form inputs.
 * @param {string} email
 * @param {string} password
 * @returns {boolean}
 */
function _validateLoginInputs(email, password) {
  if (!email || !password) {
    setAuthError('Please enter your email and password.');
    renderAuthError(authState.error);
    return false;
  }

  if (!isValidEmail(email)) {
    setAuthError('Please enter a valid email address.');
    renderAuthError(authState.error);
    return false;
  }

  return true;
}

//#endregion

//#region First Login Setup Flow

/**
 * Checks for an invite token in route params.
 * Validates the token and auto signs-in if valid.
 * @param {string | null} token
 */
async function _checkInviteToken(token) {
  if (!token) return;

  Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.INVITE_TOKEN_CHECK);

  try {
    const { userId } = await validateInviteToken(token);
    setResolvedInvite(token, userId);
    Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.INVITE_TOKEN_VALID, { userId });
  } catch (err) {
    Logger.warn(LOG_SOURCE.AUTH, LOG_AUTH.INVITE_TOKEN_INVALID, { err: err.message });
    setAuthError(err.message);
  }
}

/**
 * Handles the first login setup form submission.
 * @param {Event} event
 */
async function handleFirstLoginSubmit(event) {
  event.preventDefault();
  clearAuthError();

  const trueSightId     = _getInputValue('js-setup-truesight-id');
  const displayName     = _getInputValue('js-setup-display-name');
  const password        = _getInputValue('js-setup-password');
  const passwordConfirm = _getInputValue('js-setup-password-confirm');

  if (!_validateFirstLoginInputs(trueSightId, displayName, password, passwordConfirm)) return;

  setAuthLoading(true);
  renderAuthLoading(true);

  Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.SETUP_ATTEMPT, { trueSightId });

  try {
    await completeFirstLoginSetup(trueSightId, displayName, password);
    await logUserAction('self', 'first_login_complete', {});

    resetAuthState();

    initSession();
    Nav.registerCloseSession(closeSession);
    Nav.init();

    Logger.info(LOG_SOURCE.AUTH, LOG_AUTH.SETUP_SUCCESS, { trueSightId });
    navigateTo(ROUTES.DASHBOARD);

  } catch (err) {
    Logger.warn(LOG_SOURCE.AUTH, LOG_AUTH.SETUP_FAILED, { err: err.message });
    setAuthError(_parseAuthError(err.message));
    renderAuthError(authState.error);

  } finally {
    setAuthLoading(false);
    renderAuthLoading(false);
  }
}

/**
 * Validates first login setup inputs.
 * @param {string} trueSightId
 * @param {string} displayName
 * @param {string} password
 * @param {string} passwordConfirm
 * @returns {boolean}
 */
function _validateFirstLoginInputs(trueSightId, displayName, password, passwordConfirm) {
  if (!trueSightId || !displayName || !password || !passwordConfirm) {
    setAuthError('All fields are required.');
    renderAuthError(authState.error);
    return false;
  }

  if (!isValidTrueSightId(trueSightId)) {
    setAuthError('TrueSight ID must be in the format Name#TAG — e.g. CoachA#0042.');
    renderAuthError(authState.error);
    return false;
  }

  if (!isValidPassword(password)) {
    setAuthError('Password must be at least 8 characters, include one uppercase letter and one number.');
    renderAuthError(authState.error);
    return false;
  }

  if (password !== passwordConfirm) {
    setAuthError('Passwords do not match.');
    renderAuthError(authState.error);
    return false;
  }

  return true;
}

/**
 * Handles live TrueSight ID format feedback as the user types.
 * @param {Event} event
 */
function handleTrueSightIdInput(event) {
  const value    = event.target.value;
  const isValid  = isValidTrueSightId(value);
  const feedback = document.getElementById('js-truesight-id-feedback');

  if (!feedback) return;

  if (!value) {
    feedback.textContent = '';
    return;
  }

  if (isValid) {
    feedback.textContent = '✓ Valid format';
    feedback.className   = 'c-field__hint u-text-pass';
  } else {
    feedback.textContent = 'Format: Name#TAG — e.g. CoachA#0042';
    feedback.className   = 'c-field__hint';
  }
}

//#endregion

//#region Event Binding

function _bindLoginEvents() {
  try {
    const form = qs('#js-login-form');
    form.addEventListener('submit', handleLoginSubmit);
  } catch (err) {
    Logger.error(LOG_SOURCE.AUTH, LOG_AUTH.BIND_FAILED, { form: 'js-login-form', err });
  }
}

function _bindFirstLoginEvents() {
  try {
    const form    = qs('#js-first-login-form');
    const idInput = qs('#js-setup-truesight-id');

    form.addEventListener('submit', handleFirstLoginSubmit);
    idInput.addEventListener('input', handleTrueSightIdInput);
  } catch (err) {
    Logger.error(LOG_SOURCE.AUTH, LOG_AUTH.BIND_FAILED, { form: 'js-first-login-form', err });
  }
}

//#endregion

//#region Private Helpers

/**
 * Reads the ?redirect= query param and returns a whitelisted route.
 * Returns null if no valid redirect is present.
 * @returns {string | null}
 */
function _getRedirectRoute() {
  const params    = new URLSearchParams(window.location.search);
  const redirect  = params.get('redirect');
  const whitelist = [
    'dashboard', 'scouting', 'tracker', 'prospects',
    'combines', 'interviews', 'evaluation', 'admin',
  ];

  if (!redirect) return null;
  return whitelist.includes(redirect) ? redirect : null;
}

/**
 * Safely reads a value from a DOM input by its ID.
 * @param {string} id
 * @returns {string}
 */
function _getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/**
 * Converts raw Firebase auth error messages into human-readable strings.
 * @param {string} message
 * @returns {string}
 */
function _parseAuthError(message) {
  if (message.includes('user-not-found'))         return 'No account found with that email.';
  if (message.includes('wrong-password'))         return 'Incorrect password. Please try again.';
  if (message.includes('too-many-requests'))      return 'Too many attempts. Please wait before trying again.';
  if (message.includes('invalid-email'))          return 'Please enter a valid email address.';
  if (message.includes('invalid-credential'))     return 'Invalid email or password.';
  if (message.includes('network-request-failed')) return 'Network error. Check your connection and try again.';
  return message;
}

//#endregion