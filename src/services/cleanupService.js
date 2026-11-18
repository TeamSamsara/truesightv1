/**
 * cleanupService.js
 * @version 1.0.0
 *
 * Handles Firestore cleanup for collections that accumulate dead data.
 * Triggered manually from the admin System tab.
 *
 * Cleanup rules:
 *   Invite tokens — delete all used + all expired immediately (no retention)
 *   Sessions      — delete closed sessions older than 48h (active never touched)
 *
 * Routes through USE_CLEANUP_CLOUD_FUNCTIONS flag in config.js.
 * Set to true once Cloud Function is deployed.
 * Target Path : src/services/cleanupService.js
 */

//#region Imports

import {
  getCollection,
  deleteDocument,
  getDocument,
  setDocument,
  serverTimestamp,
  where,
  orderBy,
}                                    from './firestoreService.js';

import { Logger }                    from '../utils/logger.js';
import { LOG_SOURCE, LOG_CLEANUP }   from '../constants/logMessages.js';
import {
  USE_CLEANUP_CLOUD_FUNCTIONS,
  CLEANUP_SESSION_RETENTION_MS,
}                                    from '../constants/config.js';

//#endregion

//#region Constants

const COLLECTIONS = {
  INVITE_TOKENS: 'inviteTokens',
  SESSIONS:      'sessions',
  SYSTEM:        'system',
};

const CLEANUP_META_DOC = 'cleanupMeta';

//#endregion

//#region Public API

/**
 * Runs a dry run — counts what would be deleted without deleting anything.
 * Called when the admin System page loads to show current state.
 * @returns {Promise<{ tokens: number, sessions: number }>}
 */
export async function getCleanupCounts() {
  const [tokens, sessions] = await Promise.all([
    _getStaleTokens(),
    _getStaleSessions(),
  ]);

  return {
    tokens:   tokens.length,
    sessions: sessions.length,
  };
}

/**
 * Runs the full cleanup.
 * Routes through USE_CLEANUP_CLOUD_FUNCTIONS flag.
 * @returns {Promise<{ tokens: number, sessions: number }>}
 */
export async function runCleanup() {
  if (USE_CLEANUP_CLOUD_FUNCTIONS) {
    return await _runViaCloudFunction();
  }
  return await _runViaClient();
}

/**
 * Returns metadata about the last cleanup run.
 * @returns {Promise<{ lastRun: timestamp | null, lastCounts: object | null }>}
 */
export async function getCleanupMeta() {
  try {
    const doc = await getDocument(COLLECTIONS.SYSTEM, CLEANUP_META_DOC);
    return {
      lastRun:    doc?.lastRun    ?? null,
      lastCounts: doc?.lastCounts ?? null,
    };
  } catch (err) {
    Logger.error(LOG_SOURCE.CLEANUP, LOG_CLEANUP.FAILED, err);
    return { lastRun: null, lastCounts: null };
  }
}

//#endregion

//#region Private — Client Implementation

async function _runViaClient() {
  Logger.info(LOG_SOURCE.CLEANUP, LOG_CLEANUP.STARTED);

  const [tokens, sessions] = await Promise.all([
    _getStaleTokens(),
    _getStaleSessions(),
  ]);

  if (tokens.length === 0 && sessions.length === 0) {
    Logger.info(LOG_SOURCE.CLEANUP, LOG_CLEANUP.NOTHING_TO_CLEAN);
    return { tokens: 0, sessions: 0 };
  }

  const [tokensDeleted, sessionsDeleted] = await Promise.all([
    _deleteAll(COLLECTIONS.INVITE_TOKENS, tokens),
    _deleteAll(COLLECTIONS.SESSIONS,      sessions),
  ]);

  const counts = { tokens: tokensDeleted, sessions: sessionsDeleted };

  await _writeCleanupMeta(counts);

  Logger.info(LOG_SOURCE.CLEANUP, LOG_CLEANUP.TOKENS_DELETED,   { count: tokensDeleted });
  Logger.info(LOG_SOURCE.CLEANUP, LOG_CLEANUP.SESSIONS_DELETED, { count: sessionsDeleted });
  Logger.info(LOG_SOURCE.CLEANUP, LOG_CLEANUP.COMPLETE, counts);

  return counts;
}

async function _runViaCloudFunction() {
  // TODO: Deploy Cloud Function for scheduled cleanup
  // Endpoint: POST /runCleanup
  // No body required — function applies cleanup rules from config
  // Returns: { tokens: number, sessions: number }
  // Advantage: runs on cron regardless of who is logged in,
  //            no client-side delete permissions required
  Logger.warn(LOG_SOURCE.CLEANUP, LOG_CLEANUP.CLOUD_FN_PENDING);
  throw new Error('Cloud Function not yet deployed. Set USE_CLEANUP_CLOUD_FUNCTIONS to false in config.js.');
}

//#endregion

//#region Private — Query Helpers

async function _getStaleTokens() {
  try {
    const used    = await getCollection(COLLECTIONS.INVITE_TOKENS, [
      where('used', '==', true),
    ]);

    const expired = await getCollection(COLLECTIONS.INVITE_TOKENS, [
      where('used', '==', false),
    ]);

    // Filter expired client-side — Firestore can't query on timestamp < now directly
    const now            = Date.now();
    const expiredUnused  = expired.filter(t => {
      const expiresAt = t.expiresAt?.toMillis
        ? t.expiresAt.toMillis()
        : t.expiresAt;
      return expiresAt < now;
    });

    return [...used, ...expiredUnused];
  } catch (err) {
    Logger.error(LOG_SOURCE.CLEANUP, LOG_CLEANUP.FAILED, err);
    return [];
  }
}

async function _getStaleSessions() {
  try {
    const all = await getCollection(COLLECTIONS.SESSIONS, [
      where('isActive', '==', false),
    ]);

    const cutoff = Date.now() - CLEANUP_SESSION_RETENTION_MS;

    return all.filter(s => {
      const closedAt = s.closedAt?.toMillis
        ? s.closedAt.toMillis()
        : s.closedAt;
      return closedAt && closedAt < cutoff;
    });
  } catch (err) {
    Logger.error(LOG_SOURCE.CLEANUP, LOG_CLEANUP.FAILED, err);
    return [];
  }
}

//#endregion

//#region Private — Delete Helpers

async function _deleteAll(collection, docs) {
  let deleted = 0;

  await Promise.allSettled(
    docs.map(async doc => {
      try {
        await deleteDocument(collection, doc.id);
        deleted++;
      } catch (err) {
        Logger.error(LOG_SOURCE.CLEANUP, LOG_CLEANUP.FAILED, err);
      }
    })
  );

  return deleted;
}

//#endregion

//#region Private — Meta

async function _writeCleanupMeta(counts) {
  try {
    await setDocument(COLLECTIONS.SYSTEM, CLEANUP_META_DOC, {
      lastRun:    serverTimestamp(),
      lastCounts: counts,
    });
  } catch (err) {
    Logger.error(LOG_SOURCE.CLEANUP, LOG_CLEANUP.FAILED, err);
  }
}

//#endregion