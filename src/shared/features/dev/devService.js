/**
 * devService.js
 * @version 1.0.4
 *
 * Dev token validation, rotation, and session management.
 * Token lives at /system/devAccess in Firestore.
 * Rotation happens on session end, not on entry.
 * Client reads and writes to /system/devAccess directly.
 *
 * USE_DEV_CLOUD_FUNCTIONS flag controls rotation path:
 *   false → client-side Firestore write (current)
 *   true  → Cloud Function (future)
 *
 * Migration protocol:
 *   1. Deploy Cloud Function for token rotation
 *   2. Set USE_DEV_CLOUD_FUNCTIONS to true in config.js
 *   3. Nothing else changes
 *
 * Target path: src/shared/features/dev/devService.js
 */

//#region Imports

import {
  getDocument,
  setDocument,
}                                      from '../../../services/firestoreService.js';

import {
  setDevToken,
  devState,
  DEV_PROFILE,
  activateDevMode,
  deactivateDevMode,
}                                      from './devState.js';

import { appState }                    from '../../../core/appState.js';
import { USE_DEV_CLOUD_FUNCTIONS }     from '../../../constants/config.js';
import { Logger }                      from '../../../utils/logger.js';
import { LOG_SOURCE, LOG_DEV }         from '../../../constants/logMessages.js';

//#endregion

//#region Constants

const DEV_COLLECTION    = 'system';
const DEV_DOC_ID        = 'devAccess';
const TOKEN_PREFIX      = 'DEV-';
const TOKEN_BODY_LENGTH = 28;

//#endregion

//#region Token Validation

/**
 * Validates a token entered by the user.
 * Reads current token from Firestore and compares.
 *
 * First time setup:
 * If no document exists, generates the first token,
 * writes it to Firestore, and returns a setup message
 * so the user knows to check the Console.
 *
 * @param {string} inputToken
 * @returns {Promise<{
 *   valid:      boolean,
 *   firstSetup: boolean,
 *   message:    string | null
 * }>}
 */
export async function validateDevToken(inputToken) {
  const record = await getDocument(DEV_COLLECTION, DEV_DOC_ID);

  if (!record) {
    Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOKEN_FIRST_SETUP);
    await _generateAndStoreToken();
    return {
      valid:      false,
      firstSetup: true,
      message:    'First time setup complete. Go to Firebase Console → Firestore → /system/devAccess to get your token, then try again.',
    };
  }

  const storedToken = record.token;

  if (!inputToken || inputToken.trim() !== storedToken) {
    Logger.warn(LOG_SOURCE.DEV, LOG_DEV.TOKEN_INVALID);
    return {
      valid:      false,
      firstSetup: false,
      message:    'Invalid token. Check Firebase Console → Firestore → /system/devAccess for the current token.',
    };
  }

  const generatedAt = record.generatedAt?.toMillis
    ? record.generatedAt.toMillis()
    : record.generatedAt;

  setDevToken(storedToken, generatedAt);

  Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOKEN_VALID);
  return {
    valid:      true,
    firstSetup: false,
    message:    null,
  };
}

//#endregion

//#region Token Rotation

/**
 * Checks if the token needs rotation and rotates if necessary.
 * Called on dev session end — never on entry.
 * Silently writes new token to Firestore if older than expiry threshold.
 * @returns {Promise<void>}
 */
export async function rotateTokenIfNeeded() {
  const record = await getDocument(DEV_COLLECTION, DEV_DOC_ID);

  if (!record) {
    await _generateAndStoreToken();
    return;
  }

  const generatedAt = record.generatedAt?.toMillis
    ? record.generatedAt.toMillis()
    : record.generatedAt;

  const age           = Date.now() - generatedAt;
  const needsRotation = age > devState.tokenExpiryMs;

  if (!needsRotation) {
    Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOKEN_ROTATION_SKIPPED);
    return;
  }

  await rotateToken();
}

/**
 * Always rotates the token — no age check.
 * Routes through client or Cloud Function based on flag.
 * @returns {Promise<void>}
 */
export async function rotateToken() {
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOKEN_ROTATING);

  if (USE_DEV_CLOUD_FUNCTIONS) {
    await _rotateViaCloudFunction();
  } else {
    await _rotateViaClient();
  }
}

//#endregion

//#region Dev Session

/**
 * Starts a dev session.
 * Sets appState.currentUser to the dev profile.
 * In-memory only — no Firestore writes.
 */
export function startDevSession() {
  activateDevMode();
  appState.currentUser = { ...DEV_PROFILE };
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.SESSION_START);
}

/**
 * Ends the dev session.
 * Rotates the token on exit, then clears state.
 * @returns {Promise<void>}
 */
export async function endDevSession() {
  try {
    await rotateToken();
  } catch (err) {
    Logger.error(LOG_SOURCE.DEV, LOG_DEV.TOKEN_ROTATION_FAILED, err);
  }

  deactivateDevMode();
  appState.currentUser = null;
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.SESSION_END);
}

/**
 * Applies a simulation override to the active dev session.
 * Updates appState.currentUser with the full { type, role } context.
 * In-memory only — no Firestore writes.
 *
 * @param {{ type: string, role: string | null }} simulation
 */
export function applyDevSimulation(simulation) {
  if (!appState.currentUser) return;
  appState.currentUser = {
    ...appState.currentUser,
    type: simulation.type,
    role: simulation.role,
  };
  Logger.info(LOG_SOURCE.DEV, LOG_DEV.ROLE_SWITCH, {
    type: simulation.type,
    role: simulation.role,
  });
}

//#endregion

//#region Private — Rotation Implementations

/**
 * Rotates the token via direct Firestore write (client-side).
 * @returns {Promise<void>}
 */
async function _rotateViaClient() {
  await _generateAndStoreToken();
}

/**
 * Rotates the token via Cloud Function.
 * @returns {Promise<void>}
 */
async function _rotateViaCloudFunction() {
  // TODO: Call deployed Cloud Function endpoint here
  throw new Error('Cloud Function not yet deployed. Set USE_DEV_CLOUD_FUNCTIONS to false.');
}

//#endregion

//#region Private — Token Generation

/**
 * Generates a new token and writes it to Firestore.
 * Updates devState with the new token and timestamp.
 * @returns {Promise<{ token: string, generatedAt: number }>}
 */
async function _generateAndStoreToken() {
  const token       = _buildToken();
  const generatedAt = Date.now();

  await setDocument(DEV_COLLECTION, DEV_DOC_ID, {
    token,
    generatedAt,
    expiresAt: generatedAt + devState.tokenExpiryMs,
  });

  setDevToken(token, generatedAt);

  Logger.info(LOG_SOURCE.DEV, LOG_DEV.TOKEN_GENERATED);
  return { token, generatedAt };
}

/**
 * Builds a cryptographically random dev token.
 * Format: DEV- followed by 28 uppercase alphanumeric characters.
 * Total length: 32 characters.
 * @returns {string}
 */
function _buildToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(TOKEN_BODY_LENGTH);
  crypto.getRandomValues(array);
  const body  = Array.from(array)
    .map(b => chars[b % chars.length])
    .join('');
  return `${TOKEN_PREFIX}${body}`;
}

//#endregion