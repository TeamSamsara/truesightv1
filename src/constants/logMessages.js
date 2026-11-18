/**
 * logMessages.js
 * @version 1.1.0
 *
 * Single source of truth for all log messages across the platform.
 * Every console output references a constant from here — no raw strings.
 * Grouped by system source to match LOG_SOURCE in logger.js.
 * Target Path : src/constants/logMessages.js
 */

//#region Sources

export const LOG_SOURCE = {
  BOOT:      'BOOT',
  ROUTER:    'ROUTER',
  SESSION:   'SESSION',
  NAV:       'NAV',
  AUTH:      'AUTH',
  DEV:       'DEV',
  ADMIN:     'ADMIN',
  FIRESTORE: 'FIRESTORE',
  CLEANUP:   'CLEANUP',
};

//#endregion

//#region Boot

export const LOG_BOOT = {
  START:          'Application boot started',
  SESSION_FOUND:  'Existing session restored',
  SESSION_NONE:   'No existing session — routing to login',
  SESSION_INIT:   'Session service initialized',
  NAV_INIT:       'Nav initialized',
  ROUTER_INIT:    'Router initialized',
  FAILED:         'Boot failed',
};

//#endregion

//#region Router

export const LOG_ROUTER = {
  MOUNT:               'Mounting view',
  UNMOUNT:             'Unmounting previous view',
  REDIRECT:            'Redirecting',
  MODULE_FAILED:       'Failed to load feature module',
  MOUNT_POINT_MISSING: 'Mount point #app-mount not found',
};

//#endregion

//#region Session

export const LOG_SESSION = {
  INIT:                'Session initialized',
  OPEN_FAILED:         'Session open write failed',
  CLOSE_FAILED:        'Session close write failed',
  CLOSE_VOLUNTARY:     'Session closed voluntarily',
  ACTIVITY_FAILED:     'Session activity update failed',
  FORCE_LOGOUT:        'Session expired — forcing logout',
  FORCE_LOGOUT_FAILED: 'Force logout encountered an error',
  EXTEND:              'Session extended by user',
  WARNING_SHOWN:       'Session warning modal shown',
};

//#endregion

//#region Nav

export const LOG_NAV = {
  INIT:                 'Nav initialized',
  DOMAIN_SET:           'Active domain set',
  MOUNT_FAILED:         'Sub-nav mount failed',
  SUBNAV_REFRESHED:     'Sub-nav refreshed',
  TAB_CLICKED:          'Sub-nav tab clicked',
  TAB_ACTIVE:           'Sub-nav active tab set',
  HIDDEN:               'Nav hidden',
  SIGN_OUT:             'Sign out triggered',
  SESSION_REGISTERED:   'Close session handler registered',
  SESSION_NOT_REGISTERED: 'Sign out attempted — no session handler registered',
};

//#endregion

//#region Auth

export const LOG_AUTH = {
  LOGIN_ATTEMPT:        'Login attempt',
  LOGIN_SUCCESS:        'Login successful',
  LOGIN_FAILED:         'Login failed',
  FIRST_LOGIN_REDIRECT: 'Redirecting to first login setup',
  SETUP_ATTEMPT:        'First login setup attempt',
  SETUP_SUCCESS:        'First login setup completed',
  SETUP_FAILED:         'First login setup failed',
  INVITE_TOKEN_CHECK:   'Checking invite token',
  INVITE_TOKEN_VALID:   'Invite token validated',
  INVITE_TOKEN_INVALID: 'Invite token invalid or expired',
  DEV_DOOR_TRIGGER:     'Dev door triggered from login',
  BIND_FAILED:          'Failed to bind auth form events',
};

//#endregion

//#region Dev

export const LOG_DEV = {
  DOOR_OPEN:             'Dev door opened',
  DOOR_CLOSE:            'Dev door closed',
  TOKEN_VALIDATING:      'Validating dev token',
  TOKEN_VALID:           'Dev token valid',
  TOKEN_INVALID:         'Dev token invalid',
  TOKEN_FIRST_SETUP:     'Dev token first-time setup',
  TOKEN_ERROR:           'Dev token validation error',
  TOKEN_GENERATED:       'Dev token generated and stored',
  TOKEN_ROTATING:        'Dev token rotating',
  TOKEN_ROTATION_SKIPPED:'Dev token rotation skipped — not expired',
  TOKEN_ROTATION_FAILED: 'Dev token rotation failed',
  SESSION_START:         'Dev session started',
  SESSION_END:           'Dev session ended',
  TOOLBAR_MOUNT:         'Dev toolbar mounted',
  TOOLBAR_UNMOUNT:       'Dev toolbar unmounted',
  ROLE_SWITCH:           'Dev simulation override applied',
  ROUTE_JUMP:            'Dev route jump',
  FORCE_FIRST_LOGIN:     'Dev forced first login route',
};

//#endregion

//#region Admin

export const LOG_ADMIN = {
  USERS_LOADED:        'User accounts loaded',
  USER_CREATE:         'Creating user account',
  USER_CREATED:        'User account created',
  USER_DEACTIVATED:    'User account deactivated',
  USER_REACTIVATED:    'User account reactivated',
  USER_ROLE_CHANGED:   'User role changed',
  USER_PASSWORD_RESET: 'User password reset initiated',
  AUDIT_LOG_LOADED:    'User audit log loaded',
  APPROVALS_LOADED:    'Pending approvals loaded',
  APPROVAL_RESOLVED:   'Approval resolved',
  STALE_LOADED:        'Stale profiles loaded',
  STALE_KEPT:          'Stale profile marked keep',
  STALE_FLAGGED:       'Stale profile flagged for deletion',
  WIDGET_COUNTS_LOADED:'Widget counts loaded',
};

//#endregion

//#region Firestore

export const LOG_FIRESTORE = {
  READ:          'Firestore read',
  READ_FAILED:   'Firestore read failed',
  WRITE:         'Firestore write',
  WRITE_FAILED:  'Firestore write failed',
  DELETE:        'Firestore delete',
  DELETE_FAILED: 'Firestore delete failed',
  BATCH_FAILED:  'Firestore batch commit failed',
};

//#endregion

//#region Cleanup

export const LOG_CLEANUP = {
  STARTED:          'Cleanup started',
  COMPLETE:         'Cleanup complete',
  FAILED:           'Cleanup failed',
  TOKENS_DELETED:   'Expired/used invite tokens deleted',
  SESSIONS_DELETED: 'Stale session records deleted',
  NOTHING_TO_CLEAN: 'Nothing to clean — collections are current',
  DRY_RUN:          'Cleanup dry run — counts only, no deletes',
  CLOUD_FN_PENDING: 'Cloud Function cleanup not yet deployed',
};

//#endregion