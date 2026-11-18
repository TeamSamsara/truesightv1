/**
 * authState.js
 * @version 1.0.1
 *
 * Local state for the auth feature.
 * Tracks form state, loading, and error conditions
 * specific to the login and first login setup flows.
 *
 * Target path: src/shared/features/auth/authState.js
 */

//#region State

export const authState = {

  /**
   * Which auth view is currently active.
   * @type {'login' | 'first-login'}
   */
  activeView: 'login',

  /**
   * True while an auth operation is in flight.
   * @type {boolean}
   */
  isLoading: false,

  /**
   * Error message to display on the auth screen.
   * Null if no error is active.
   * @type {string | null}
   */
  error: null,

  /**
   * The email value from the login form.
   * @type {string}
   */
  email: '',

  /**
   * True if the user arrived via an invite link.
   * @type {boolean}
   */
  hasInviteToken: false,

  /**
   * The invite token parsed from the URL on arrival.
   * Null if user arrived directly.
   * @type {string | null}
   */
  inviteToken: null,

  /**
   * The userId resolved from a validated invite token.
   * Null until token is validated.
   * @type {string | null}
   */
  resolvedUserId: null,

};

//#endregion

//#region State Helpers

/**
 * Sets the active auth view.
 * @param {'login' | 'first-login'} view
 */
export function setAuthView(view) {
  authState.activeView = view;
}

/**
 * Sets the auth loading state.
 * @param {boolean} value
 */
export function setAuthLoading(value) {
  authState.isLoading = value;
}

/**
 * Sets the auth error message.
 * @param {string | null} message
 */
export function setAuthError(message) {
  authState.error = message;
}

/**
 * Clears the auth error message.
 */
export function clearAuthError() {
  authState.error = null;
}

/**
 * Stores a validated invite token and the resolved userId.
 * @param {string} token
 * @param {string} userId
 */
export function setResolvedInvite(token, userId) {
  authState.hasInviteToken  = true;
  authState.inviteToken     = token;
  authState.resolvedUserId = userId;
}

/**
 * Resets auth state to defaults.
 * Called on logout or after successful setup completion.
 */
export function resetAuthState() {
  authState.activeView      = 'login';
  authState.isLoading       = false;
  authState.error           = null;
  authState.email           = '';
  authState.hasInviteToken  = false;
  authState.inviteToken     = null;
  authState.resolvedUserId = null;
}

//#endregion