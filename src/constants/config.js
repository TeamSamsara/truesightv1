/**
 * config.js
 * @version 1.0.2
 *
 * Platform configuration constants and environment flags.
 * Single source for all environment-level behavior.
 *
 * Migration pattern — any operation that currently runs client-side
 * but could or should eventually run as a Cloud Function must be
 * gated behind a feature flag here. The flag is always false by default.
 * Implementation is split into two private functions in the relevant service —
 * one for the current client path, one stubbed Cloud Function path.
 * Flipping the flag is the only change required to migrate.
 * Target path : src/constants/config.js
 */

//#region Environment

export const IS_PRODUCTION =
  window.location.hostname !== '127.0.0.1' &&
  window.location.hostname !== 'localhost';

export const IS_DEV_MODE_ENABLED = true;

//#endregion

//#region Feature Flags

/**
 * Controls how Firebase Auth users are created.
 * false → REST API (current)
 * true  → Cloud Function (future)
 *
 * Migration:
 * 1. Deploy Cloud Function for Auth user creation
 * 2. Set flag to true
 */
export const USE_AUTH_CLOUD_FUNCTIONS = false;

/**
 * Controls dev token rotation.
 * false → Client writes directly to Firestore (current)
 * true  → Cloud Function handles rotation (future)
 *
 * Migration:
 * 1. Deploy Cloud Function for dev token rotation
 * 2. Set flag to true
 */
export const USE_DEV_CLOUD_FUNCTIONS = false;

/**
 * Controls Firestore cleanup execution.
 * false → Client-side batch deletes triggered manually by admin (current)
 * true  → Cloud Function scheduled cleanup (future)
 *
 * Migration:
 * 1. Deploy Cloud Function with cleanup logic and cron schedule
 * 2. Set flag to true — manual button in admin becomes trigger only
 */
export const USE_CLEANUP_CLOUD_FUNCTIONS = false;

/**
 * Controls staff account delivery method availability.
 * false → copy/paste and invite link only
 * true  → email delivery also available
 *
 * Migration:
 * 1. Configure email provider
 * 2. Build email delivery service
 * 3. Set flag to true
 */
export const USE_AUTH_EMAIL_DELIVERY = false;

/**
 * Controls how prospect tracker datasets are fetched.
 * false → Firestore documents (current)
 * true  → Firebase Storage JSON blobs (Phase 2)
 *
 * Migration:
 * 1. Migrate datasets to Firebase Storage
 * 2. Update storageService.js fetch logic
 * 3. Set flag to true
 */
export const USE_TRACKER_STORAGE = false;

/**
 * Controls whether combine stat ingestion uses
 * the external Riot API tool writing directly to Firestore.
 * false → manual file upload (placeholder)
 * true  → external tool writes directly (Phase 4)
 */
export const USE_COMBINE_EXTERNAL_TOOL = false;


/**
 * Controls webhook delivery for session confirmation and availability requests
 * false -> direct Firestore write
 * true -> webhook service active
 */
export const USE_WEBHOOK_SERVICE = false;

/**
 * Control availability resolution
 * false -> manual resolution only
 * true -> automated resolution service
 */
export const USE_AVAILABILITY_RESOLUTION_SERVICE = false;

//#endregion

//#region Firebase REST API

export const FIREBASE_REST_BASE = 'https://identitytoolkit.googleapis.com/v1';
export const FIREBASE_API_KEY   = 'AIzaSyB23b21FgqnxkTTsM_AF5KzOYSX1ulcdfo';

//#endregion

//#region Platform URLs

export const INVITE_LINK_BASE = IS_PRODUCTION
  ? 'https://your-production-domain.com'
  : 'http://127.0.0.1:3000';

export function buildInviteLink(token) {
  return `${INVITE_LINK_BASE}/src/app.html#first-login?token=${token}`;
}

//#endregion

//#region Breakpoints

export const BP_SM  = 480;
export const BP_MD  = 768;
export const BP_LG  = 1024;
export const BP_XL  = 1280;
export const BP_2XL = 1536;
export const BP_3XL = 1920;

//#endregion

//#region Device Detection

const _width = window.innerWidth;
const _touch = navigator.maxTouchPoints > 0;

export const IS_TOUCH_DEVICE = _touch;
export const IS_MOBILE       = _width < BP_MD;
export const IS_TABLET       = _width >= BP_MD && _width < BP_LG;
export const IS_DESKTOP      = _width >= BP_LG;
export const IS_LARGE_SCREEN = _width >= BP_2XL;

export const DEVICE_TYPE = IS_MOBILE
  ? 'mobile'
  : IS_TABLET
    ? 'tablet'
    : 'desktop';

export const IS_PRIMARY_TARGET = IS_DESKTOP;

//#endregion

//#region Platform Limits

export const MAX_ACTIVE_INVITE_LINKS        = 10;
export const AUTH_RESET_RATE_LIMIT          = 3;
export const AUTH_RESET_WINDOW_MS           = 60 * 60 * 1000;
export const PROSPECT_LOCK_TIMEOUT_MIN      = 15;
export const STALE_PROFILE_THRESHOLD_MONTHS = 24;
export const DEV_TOKEN_EXPIRY_HOURS         = 8;
export const DEV_TOKEN_EXPIRY_MS            = DEV_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

//#endregion

//#region Cleanup

export const CLEANUP_SESSION_RETENTION_MS  = 48 * 60 * 60 * 1000; // 48 hours
export const CLEANUP_TOKEN_RETENTION_MS    = 0;                    // immediate — no retention

//#endregion

