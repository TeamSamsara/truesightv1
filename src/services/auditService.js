/**
 * auditService.js
 * @version 1.1.0
 *
 * Audit trail writes. Called by any action that requires logging.
 * Every status transition, identity change, and documented action
 * goes through here. Never called directly by renderers.
 * Target path: src/services/auditService.js
 */

//#region Imports

import { addSubDocument, addDocument, serverTimestamp } from './firestoreService.js';
import { appState }                                     from '../core/appState.js';

//#endregion

//#region Constants

const COLLECTIONS = {
  STAFF_AUDIT: 'userAudit',
};

//#endregion

//#region Prospect Audit Trail

/**
 * Logs a status transition on a prospect profile.
 * @param {string} prospectId
 * @param {string} fromStatus
 * @param {string} toStatus
 * @param {string} reason       - Required, written by the actor
 * @returns {Promise<void>}
 */
export async function logStatusTransition(prospectId, fromStatus, toStatus, reason) {
  const actor = _getActor();

  await addSubDocument('prospects', prospectId, 'statusHistory', {
    userId:    actor.userId,
    displayName:  actor.displayName,
    fromStatus,
    toStatus,
    reason,
    timestamp:  serverTimestamp(),
  });
}

/**
 * Logs an alias link or removal on a prospect profile.
 * @param {string} prospectId
 * @param {string} action       - 'linked' | 'removed'
 * @param {string} riotId       - The account being linked or removed
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function logAliasChange(prospectId, action, riotId, reason) {
  const actor = _getActor();

  await addSubDocument('prospects', prospectId, 'statusHistory', {
    userId:   actor.userId,
    displayName: actor.displayName,
    action:    `alias_${action}`,
    riotId,
    reason,
    timestamp: serverTimestamp(),
  });
}

/**
 * Logs when an unverified TrueSight entry is confirmed or discarded.
 * @param {string} prospectId
 * @param {string} entryId
 * @param {string} action     - 'confirmed' | 'discarded'
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function logTrueSightEntryAction(prospectId, entryId, action, reason) {
  const actor = _getActor();

  await addSubDocument('prospects', prospectId, 'statusHistory', {
    userId:   actor.userId,
    displayName: actor.displayName,
    action:    `truesight_entry_${action}`,
    entryId,
    reason,
    timestamp: serverTimestamp(),
  });
}

/**
 * Logs a direct add to the database.
 * @param {string} prospectId
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function logDirectAdd(prospectId, reason) {
  const actor = _getActor();

  await addSubDocument('prospects', prospectId, 'statusHistory', {
    userId:   actor.userId,
    displayName: actor.displayName,
    action:    'direct_add',
    reason,
    timestamp: serverTimestamp(),
  });
}

//#endregion

//#region User Audit Trail

/**
 * Logs a user account action.
 * Covers creation, deactivation, role change, password reset.
 * @param {string} targetUserId   - The user the action was performed on
 * @param {string} action          - 'created' | 'deactivated' | 'role_changed' | 'password_reset'
 * @param {object} meta            - Any additional context { fromRole, toRole, etc. }
 * @returns {Promise<void>}
 */
export async function logUserAction(targetUserId, action, meta = {}) {
  const actor = _getActor();

  await addDocument(COLLECTIONS.STAFF_AUDIT, {
    actorId:       actor.userId,
    actorName:     actor.displayName,
    targetUserId,
    action,
    meta,
    timestamp:     serverTimestamp(),
  });
}

//#endregion

//#region Private Helpers

/**
 * Reads the current actor from appState.
 * Throws if no user is logged in — audit entries must always have an author.
 * @returns {{ userId: string, displayName: string }}
 */
function _getActor() {
  const user = appState.currentUser;
  if (!user) throw new Error('No authenticated user. Cannot write audit entry.');

  return {
    userId:   user.id,
    displayName: user.displayName || user.tempId || user.name,
  };
}

//#endregion