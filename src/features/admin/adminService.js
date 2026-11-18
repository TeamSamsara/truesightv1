/**
 * adminService.js
 * @version 1.1.0
 *
 * All Firestore and Auth operations for the admin feature.
 * Wraps Auth user creation behind a feature flag —
 * switching USE_AUTH_CLOUD_FUNCTIONS to true migrates
 * from REST API to Cloud Functions with no other changes.
 *
 * Migrated from 'staff' collection to unified 'users' collection.
 * loadAllUsers() returns all platform users — filter by type in the UI.
 */

//#region Imports

import {
  getDocument,
  setDocument,
  updateDocument,
  addDocument,
  getCollection,
  serverTimestamp,
  where,
  orderBy,
  limit,
}                                      from '../../services/firestoreService.js';

import {
  generateInviteToken,
  adminResetPassword,
}                                      from '../../shared/features/auth/authService.js';

import { logUserAction }               from '../../services/auditService.js';
import { appState }                    from '../../core/appState.js';
import { USER_TYPE }                   from '../../constants/roles.js';
import { Logger }                      from '../../utils/logger.js';
import { LOG_SOURCE, LOG_ADMIN }       from '../../constants/logMessages.js';

import {
  USE_AUTH_CLOUD_FUNCTIONS,
  FIREBASE_REST_BASE,
  FIREBASE_API_KEY,
  buildInviteLink,
}                                      from '../../constants/config.js';

//#endregion

//#region Constants

const COLLECTIONS = {
  USERS:         'users',
  APPROVALS:     'approvals',
  PROSPECTS:     'prospects',
  INVITE_TOKENS: 'inviteTokens',
  USER_AUDIT:    'userAudit',
};

//#endregion

//#region Users — Read

/**
 * Loads all platform users from Firestore.
 * Returns all user types — filter by type in the UI layer.
 * Sorted client-side by createdAt descending.
 * @returns {Promise<object[]>}
 */
export async function loadAllUsers() {
  const users = await getCollection(COLLECTIONS.USERS, []);
  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USERS_LOADED, { count: users.length });
  return users.sort((a, b) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return bTime - aTime;
  });
}

/**
 * Loads a single user account by ID.
 * @param {string} userId
 * @returns {Promise<object | null>}
 */
export async function loadUserById(userId) {
  return await getDocument(COLLECTIONS.USERS, userId);
}

/**
 * Loads the audit trail for a specific user.
 * Returns the most recent 50 entries.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function loadUserAuditLog(userId) {
  const log = await getCollection(COLLECTIONS.USER_AUDIT, [
    where('targetUserId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(50),
  ]);
  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.AUDIT_LOG_LOADED, { userId, count: log.length });
  return log;
}

/**
 * Loads recent platform-wide audit activity.
 * Returns the most recent 20 entries for the activity feed.
 * @returns {Promise<object[]>}
 */
export async function loadRecentActivity() {
  return await getCollection(COLLECTIONS.USER_AUDIT, [
    orderBy('timestamp', 'desc'),
    limit(20),
  ]);
}

/**
 * Loads active invite tokens count.
 * @returns {Promise<number>}
 */
export async function loadActiveInviteCount() {
  const tokens = await getCollection(COLLECTIONS.INVITE_TOKENS, [
    where('used', '==', false),
  ]);
  return tokens.filter(t => {
    const expiresAt = t.expiresAt?.toDate ? t.expiresAt.toDate() : new Date(t.expiresAt);
    return expiresAt > new Date();
  }).length;
}

//#endregion

//#region Users — Create

/**
 * Creates a new user account.
 * Handles both Auth user creation and Firestore document creation.
 * Delivery method determines what credentials are returned.
 *
 * @param {object} form             - { name, email, type, role }
 * @param {string} deliveryMethod   - 'copy' | 'invite'
 * @returns {Promise<{
 *   userId:       string,
 *   tempId:       string,
 *   tempPassword: string | null,
 *   inviteLink:   string | null,
 *   email:        string,
 * }>}
 */
export async function createUserAccount(form, deliveryMethod) {
  const { name, email, type, role } = form;

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USER_CREATE, { email, type, role, deliveryMethod });

  const tempId       = _generateTempId();
  const tempPassword = _generateTempPassword();

  const uid    = await _createAuthUser(email, tempPassword);
  const userId = await _createUserDocument({ uid, name, email, type, role, tempId });

  await logUserAction(userId, 'created', { type, role, deliveryMethod });

  if (deliveryMethod === 'invite') {
    const token      = await generateInviteToken(userId, appState.currentUser.id, tempPassword);
    const inviteLink = buildInviteLink(token);
    Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USER_CREATED, { userId, deliveryMethod: 'invite' });
    return { userId, tempId, tempPassword: null, inviteLink, email };
  }

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USER_CREATED, { userId, deliveryMethod: 'copy' });
  return { userId, tempId, tempPassword, inviteLink: null, email };
}

//#endregion

//#region Users — Update

/**
 * Changes the role of a staff user.
 * Only applies to USER_TYPE.STAFF — other types have no sub-role.
 * @param {string} userId
 * @param {string} newRole
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function changeUserRole(userId, newRole, reason) {
  const current = await getDocument(COLLECTIONS.USERS, userId);
  if (!current) throw new Error('User account not found.');

  await updateDocument(COLLECTIONS.USERS, userId, { role: newRole });

  await logUserAction(userId, 'role_changed', {
    fromRole: current.role,
    toRole:   newRole,
    reason,
  });

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USER_ROLE_CHANGED, {
    userId,
    from: current.role,
    to:   newRole,
  });
}

/**
 * Deactivates a user account.
 * Preserves the account record and all audit trail entries.
 * @param {string} userId
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function deactivateUserAccount(userId, reason) {
  await updateDocument(COLLECTIONS.USERS, userId, {
    active:        false,
    deactivatedAt: serverTimestamp(),
  });

  await logUserAction(userId, 'deactivated', { reason });

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USER_DEACTIVATED, { userId });
}

/**
 * Reactivates a previously deactivated user account.
 * @param {string} userId
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function reactivateUserAccount(userId, reason) {
  await updateDocument(COLLECTIONS.USERS, userId, {
    active:        true,
    deactivatedAt: null,
  });

  await logUserAction(userId, 'reactivated', { reason });

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USER_REACTIVATED, { userId });
}

/**
 * Resets a user's password.
 * Returns new temp credentials for delivery.
 * @param {string} userId
 * @param {string} deliveryMethod  - 'copy' | 'invite'
 * @returns {Promise<{ tempPassword: string | null, inviteLink: string | null }>}
 */
export async function resetUserPassword(userId, deliveryMethod) {
  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.USER_PASSWORD_RESET, { userId, deliveryMethod });

  await logUserAction(userId, 'password_reset', { deliveryMethod });

  if (deliveryMethod === 'invite') {
    const tempPassword = _generateTempPassword();
    const token        = await generateInviteToken(userId, appState.currentUser.id, tempPassword);
    const inviteLink   = buildInviteLink(token);
    return { tempPassword: null, inviteLink };
  }

  const { tempPassword } = await adminResetPassword(userId);
  return { tempPassword, inviteLink: null };
}

//#endregion

//#region Approvals — Read & Resolve

/**
 * Loads all pending approvals from Firestore.
 * @returns {Promise<object[]>}
 */
export async function loadPendingApprovals() {
  const approvals = await getCollection(COLLECTIONS.APPROVALS, [
    where('status', '==', 'pending'),
    orderBy('requestedAt', 'desc'),
  ]);
  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.APPROVALS_LOADED, { count: approvals.length });
  return approvals;
}

/**
 * Approves a pending action.
 * Executes the payload and marks the approval as resolved.
 * @param {string} approvalId
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function approveAction(approvalId, reason) {
  const approval = await getDocument(COLLECTIONS.APPROVALS, approvalId);
  if (!approval) throw new Error('Approval not found.');

  await _executeApprovalPayload(approval);

  await updateDocument(COLLECTIONS.APPROVALS, approvalId, {
    status:     'approved',
    resolvedBy: {
      userId:      appState.currentUser.id,
      displayName: appState.currentUser.displayName,
    },
    resolvedAt: serverTimestamp(),
    reason,
  });

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.APPROVAL_RESOLVED, {
    approvalId,
    decision: 'approved',
  });
}

/**
 * Rejects a pending action.
 * @param {string} approvalId
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function rejectAction(approvalId, reason) {
  await updateDocument(COLLECTIONS.APPROVALS, approvalId, {
    status:     'rejected',
    resolvedBy: {
      userId:      appState.currentUser.id,
      displayName: appState.currentUser.displayName,
    },
    resolvedAt: serverTimestamp(),
    reason,
  });

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.APPROVAL_RESOLVED, {
    approvalId,
    decision: 'rejected',
  });
}

//#endregion

//#region Stale Profiles — Read & Resolve

/**
 * Loads all stale prospect profiles from Firestore.
 * @returns {Promise<object[]>}
 */
export async function loadStaleProfiles() {
  const profiles = await getCollection(COLLECTIONS.PROSPECTS, [
    where('staleFlagged', '==', true),
    orderBy('updatedAt', 'asc'),
  ]);
  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.STALE_LOADED, { count: profiles.length });
  return profiles;
}

/**
 * Marks a stale profile as reviewed — keep as-is.
 * @param {string} prospectId
 * @returns {Promise<void>}
 */
export async function keepStaleProfile(prospectId) {
  await updateDocument(COLLECTIONS.PROSPECTS, prospectId, {
    staleFlagged: false,
  });
  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.STALE_KEPT, { prospectId });
}

/**
 * Flags a stale profile for deletion.
 * Creates an approval request — deletion requires second confirmation.
 * @param {string} prospectId
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function flagStaleForDeletion(prospectId, reason) {
  await addDocument(COLLECTIONS.APPROVALS, {
    targetId:   prospectId,
    actionType: 'DELETE_PROSPECT',
    requestedBy: {
      userId:      appState.currentUser.id,
      displayName: appState.currentUser.displayName,
    },
    requestedAt: serverTimestamp(),
    reason,
    status:      'pending',
    payload:     { prospectId },
    resolvedBy:  null,
    resolvedAt:  null,
  });
  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.STALE_FLAGGED, { prospectId });
}

//#endregion

//#region Overview Counts

/**
 * Loads all counts needed for the overview widgets.
 * @returns {Promise<{ users: number, approvals: number, stale: number, invites: number }>}
 */
export async function loadWidgetCounts() {
  const [users, approvals, stale, invites] = await Promise.all([
    getCollection(COLLECTIONS.USERS,     [where('active', '==', true)]),
    getCollection(COLLECTIONS.APPROVALS, [where('status', '==', 'pending')]),
    getCollection(COLLECTIONS.PROSPECTS, [where('staleFlagged', '==', true)]),
    loadActiveInviteCount(),
  ]);

  const counts = {
    users:     users.length,
    approvals: approvals.length,
    stale:     stale.length,
    invites,
  };

  Logger.info(LOG_SOURCE.ADMIN, LOG_ADMIN.WIDGET_COUNTS_LOADED, counts);
  return counts;
}

//#endregion

//#region Private — Auth User Creation

/**
 * Creates a Firebase Auth user.
 * Routes to REST API or Cloud Function based on USE_AUTH_CLOUD_FUNCTIONS flag.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} The Firebase Auth UID
 */
async function _createAuthUser(email, password) {
  if (USE_AUTH_CLOUD_FUNCTIONS) {
    return await _createAuthUserViaCloudFunction(email, password);
  }
  return await _createAuthUserViaRestApi(email, password);
}

/**
 * Creates a Firebase Auth user via the Identity Toolkit REST API.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} The Firebase Auth UID
 */
async function _createAuthUserViaRestApi(email, password) {
  const url      = `${FIREBASE_REST_BASE}/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create Auth user.');
  }

  const data = await response.json();
  return data.localId;
}

/**
 * Creates a Firebase Auth user via Cloud Function.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} The Firebase Auth UID
 */
async function _createAuthUserViaCloudFunction(email, password) {
  // TODO: Call deployed Cloud Function endpoint here
  throw new Error('Cloud Function not yet deployed. Set USE_AUTH_CLOUD_FUNCTIONS to false.');
}

//#endregion

//#region Private — Firestore Document Creation

/**
 * Creates the Firestore user document in the unified users collection.
 * type is always explicit — passed from the creation form.
 * role is only set for USER_TYPE.STAFF — null for all other types.
 * @param {object} params  - { uid, name, email, type, role, tempId }
 * @returns {Promise<string>} The Firestore document ID (same as uid)
 */
async function _createUserDocument({ uid, name, email, type, role, tempId }) {
  await setDocument(COLLECTIONS.USERS, uid, {
    uid,
    type,
    role:           type === USER_TYPE.STAFF ? (role ?? null) : null,
    trueSightId:    null,
    tempId,
    displayName:    null,
    name,
    email,
    active:         true,
    isFirstLogin:   true,
    createdAt:      serverTimestamp(),
    lastLoginAt:    null,
    deactivatedAt:  null,
    passwordResets: [],
    createdBy: {
      userId:      appState.currentUser?.id          || 'dev',
      displayName: appState.currentUser?.displayName || appState.currentUser?.name || 'Unknown',
    },
  });

  return uid;
}

//#endregion

//#region Private — Approval Execution

/**
 * Executes an approved action based on its actionType.
 * @param {object} approval
 * @returns {Promise<void>}
 */
async function _executeApprovalPayload(approval) {
  switch (approval.actionType) {

    case 'DELETE_PROSPECT':
      await updateDocument(COLLECTIONS.PROSPECTS, approval.payload.prospectId, {
        deleted:   true,
        deletedAt: serverTimestamp(),
      });
      break;

    case 'STATUS_REENTRY':
      await updateDocument(COLLECTIONS.PROSPECTS, approval.payload.prospectId, {
        status: approval.payload.newStatus,
      });
      break;

    case 'REMOVE_STATUS_HISTORY':
      // Append-only — handled by flagging, not deleting. Phase 3.
      break;

    default:
      throw new Error(`Unknown approval action type: ${approval.actionType}`);
  }
}

//#endregion

//#region Private — Generators

/**
 * Generates a temporary user ID e.g. "User#A3X9"
 * @returns {string}
 */
function _generateTempId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const tag   = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `User#${tag}`;
}

/**
 * Generates a temporary password.
 * @returns {string}
 */
function _generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

//#endregion