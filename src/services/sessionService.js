/**
 * sessionService.js
 * @version 1.0.4
 *
 * Manages user session lifecycle:
 *   — Idle timeout (25 min warning, 5 min grace period, then force logout)
 *   — Session tracking writes to Firestore /sessions/{userId}
 *   — Integrates with auditService on force logout
 *
 * Owns its modal dependency internally — callers just call initSession().
 * Singleton — init once after login, survives all route changes.
 */

//#region Imports

import { logout }                          from '../shared/features/auth/authService.js';
import { appState }                        from '../core/appState.js';
import { navigateTo, ROUTES }              from '../core/router.js';
import { logUserAction }                  from './auditService.js';
import { setDocument, updateDocument,
         serverTimestamp }                 from './firestoreService.js';
import { getSessionCallbacks }             from '../shared/components/session/sessionModal.js';
import { Logger }                          from '../utils/logger.js';
import { LOG_SOURCE, LOG_SESSION }         from '../constants/logMessages.js';

//#endregion

//#region Constants

const IDLE_WARNING_MS    = 25 * 60 * 1000;
const IDLE_GRACE_MS      =  5 * 60 * 1000;
const ACTIVITY_EVENTS    = ['mousemove', 'keydown', 'touchstart', 'click'];
const SESSION_COLLECTION = 'sessions';

//#endregion

//#region State

let _idleTimer        = null;
let _graceTimer       = null;
let _graceInterval    = null;
let _isWarning        = false;
let _graceSecondsLeft = 0;
let _onWarnCb         = null;
let _onExpireCb       = null;
let _onDismissCb      = null;

//#endregion

//#region Public API

export function initSession() {
  if (!appState.currentUser) return;

  const { onWarn, onExpire, onDismiss } = getSessionCallbacks();
  _onWarnCb    = onWarn;
  _onExpireCb  = onExpire;
  _onDismissCb = onDismiss;

  _writeSessionOpen();
  _startIdleTimer();
  _bindActivityListeners();

  Logger.info(LOG_SOURCE.SESSION, LOG_SESSION.INIT);
}

export function extendSession() {
  _clearGrace();
  _isWarning = false;
  _startIdleTimer();
  _onDismissCb?.();
  _updateSessionActivity();

  Logger.info(LOG_SOURCE.SESSION, LOG_SESSION.EXTEND);
}

export async function closeSession() {
  _clearAll();

  try {
    await _writeSessionClose('voluntary');
    await logout();
    Logger.info(LOG_SOURCE.SESSION, LOG_SESSION.CLOSE_VOLUNTARY);
    navigateTo(ROUTES.LOGIN);
  } catch (err) {
    Logger.error(LOG_SOURCE.SESSION, LOG_SESSION.CLOSE_FAILED, err);
  }
}

export function getGraceSecondsRemaining() {
  return _graceSecondsLeft;
}

// TODO: Phase 6 — expose getActiveSessions() for admin session dashboard

//#endregion

//#region Private — Timers

function _startIdleTimer() {
  clearTimeout(_idleTimer);
  _idleTimer = setTimeout(_onIdleWarning, IDLE_WARNING_MS);
}

function _onIdleWarning() {
  _isWarning        = true;
  _graceSecondsLeft = IDLE_GRACE_MS / 1000;

  Logger.info(LOG_SOURCE.SESSION, LOG_SESSION.WARNING_SHOWN, {
    graceSeconds: _graceSecondsLeft,
  });

  _onWarnCb?.(_graceSecondsLeft);

  _graceInterval = setInterval(() => {
    _graceSecondsLeft -= 1;
    _onExpireCb?.(_graceSecondsLeft);
    if (_graceSecondsLeft <= 0) _forceLogout();
  }, 1000);

  _graceTimer = setTimeout(_forceLogout, IDLE_GRACE_MS);
}

function _clearGrace() {
  clearInterval(_graceInterval);
  clearTimeout(_graceTimer);
  _graceInterval    = null;
  _graceTimer       = null;
  _graceSecondsLeft = 0;
}

function _clearAll() {
  clearTimeout(_idleTimer);
  _clearGrace();
  _unbindActivityListeners();
  _isWarning = false;
}

//#endregion

//#region Private — Activity Listeners

function _onActivity() {
  if (_isWarning) return;
  _startIdleTimer();
}

function _bindActivityListeners() {
  ACTIVITY_EVENTS.forEach(event =>
    window.addEventListener(event, _onActivity, { passive: true })
  );
}

function _unbindActivityListeners() {
  ACTIVITY_EVENTS.forEach(event =>
    window.removeEventListener(event, _onActivity)
  );
}

//#endregion

//#region Private — Force Logout

async function _forceLogout() {
  _clearAll();

  const redirectHash = _getTopLevelHash();

  Logger.warn(LOG_SOURCE.SESSION, LOG_SESSION.FORCE_LOGOUT, {
    lastRoute: redirectHash,
    user:      appState.currentUser?.id,
  });

  try {
    await logUserAction(appState.currentUser?.id, 'session_expired', {
      lastRoute: redirectHash,
    });
    await _writeSessionClose('expired');
    await logout();
  } catch (err) {
    Logger.error(LOG_SOURCE.SESSION, LOG_SESSION.FORCE_LOGOUT_FAILED, err);
  } finally {
    const loginRoute = redirectHash
      ? `${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectHash)}`
      : ROUTES.LOGIN;

    navigateTo(loginRoute);
  }
}

function _getTopLevelHash() {
  const hash = window.location.hash.replace('#', '');
  return hash.split('/')[0] ?? '';
}

//#endregion

//#region Private — Session Tracking

async function _writeSessionOpen() {
  const user = appState.currentUser;
  if (!user?.id) return;

  try {
    await setDocument(SESSION_COLLECTION, user.id, {
      userId:       user.id,
      displayName:  user.displayName ?? user.trueSightId ?? '',
      type:         user.type ?? '',
      role:         user.role ?? null,
      openedAt:     serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      closedAt:     null,
      closeReason:  null,
      isActive:     true,
    });
  } catch (err) {
    Logger.error(LOG_SOURCE.SESSION, LOG_SESSION.OPEN_FAILED, err);
  }
}

async function _writeSessionClose(reason) {
  const user = appState.currentUser;
  if (!user?.id) return;

  try {
    await updateDocument(SESSION_COLLECTION, user.id, {
      closedAt:    serverTimestamp(),
      closeReason: reason,
      isActive:    false,
    });
  } catch (err) {
    Logger.error(LOG_SOURCE.SESSION, LOG_SESSION.CLOSE_FAILED, err);
  }
}

async function _updateSessionActivity() {
  const user = appState.currentUser;
  if (!user?.id) return;

  try {
    await updateDocument(SESSION_COLLECTION, user.id, {
      lastActiveAt: serverTimestamp(),
    });
  } catch (err) {
    Logger.error(LOG_SOURCE.SESSION, LOG_SESSION.ACTIVITY_FAILED, err);
  }
}

//#endregion