/**
 * authService.js
 * @version 1.2.0
 *
 * Firebase Auth rules, session management, password operations,
 * invite token generation and validation, and rate limit enforcement.
 *
 * All Firestore profile reads go through _normalizeProfile() before
 * being written to appState.currentUser. This ensures every user object
 * carries the correct { type, role } shape required by hasPermission().
 *
 * Migrated from 'staff' collection to unified 'users' collection.
 * type is written on account creation — no role-based inference needed.
 *
 * Target path: src/shared/features/auth/authService.js
 */

//#region Imports

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

import { auth }        from '../../../core/firebase.js';
import { appState }    from '../../../core/appState.js';
import {
  getDocument,
  updateDocument,
  addDocument,
  getCollection,
  serverTimestamp,
  where,
}                      from '../../../services/firestoreService.js';
import { USER_TYPE }   from '../../../constants/roles.js';
import {
  AUTH_RESET_RATE_LIMIT,
  AUTH_RESET_WINDOW_MS,
}                      from '../../../constants/config.js';

//#endregion

//#region Constants

const COLLECTIONS = {
  USERS:         'users',
  INVITE_TOKENS: 'inviteTokens',
};

const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000;

//#endregion

//#region Session

/**
 * Restores the active session on app boot.
 * Listens to Firebase Auth state and syncs to appState.
 * @returns {Promise<object | null>}
 */
export function restoreSession() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (!user) {
        appState.currentUser = null;
        resolve(null);
        return;
      }

      const profile = await getDocument(COLLECTIONS.USERS, user.uid);

      if (!profile || !profile.active) {
        await signOut(auth);
        appState.currentUser = null;
        resolve(null);
        return;
      }

      appState.currentUser = _normalizeProfile(profile, user.uid);
      resolve(appState.currentUser);
    });
  });
}

//#endregion

//#region Login / Logout

/**
 * Signs a user in with email and password.
 * Updates lastLoginAt on success.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>}
 */
export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user       = credential.user;

  const profile = await getDocument(COLLECTIONS.USERS, user.uid);

  if (!profile || !profile.active) {
    await signOut(auth);
    throw new Error('Account is inactive. Contact an administrator.');
  }

  await updateDocument(COLLECTIONS.USERS, user.uid, {
    lastLoginAt: serverTimestamp(),
  });

  appState.currentUser = _normalizeProfile(profile, user.uid, { lastLoginAt: new Date() });
  return appState.currentUser;
}

/**
 * Signs the current user out and clears app state.
 * @returns {Promise<void>}
 */
export async function logout() {
  await signOut(auth);
  appState.currentUser = null;
}

//#endregion

//#region First Login Setup

/**
 * Completes the first login setup flow.
 * Sets TrueSight ID, display name, and permanent password.
 * Clears tempId and flips isFirstLogin to false.
 * @param {string} trueSightId
 * @param {string} displayName
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function completeFirstLoginSetup(trueSightId, displayName, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user. Please use your invite link again.');

  const isTaken = await _isTrueSightIdTaken(trueSightId);
  if (isTaken) throw new Error('That TrueSight ID is already taken. Choose another.');

  await updatePassword(user, newPassword);

  await updateDocument(COLLECTIONS.USERS, user.uid, {
    trueSightId,
    displayName,
    tempId:       null,
    isFirstLogin: false,
  });

  appState.currentUser = {
    ...appState.currentUser,
    trueSightId,
    displayName,
    tempId:       null,
    isFirstLogin: false,
  };
}

//#endregion

//#region Invite Tokens

/**
 * Generates an invite token for a user account.
 * Stores the temp password so the invite link can auto sign-in.
 * @param {string} userId
 * @param {string} generatedBy
 * @param {string} tempPassword
 * @returns {Promise<string>}
 */
export async function generateInviteToken(userId, generatedBy, tempPassword) {
  const token     = _generateToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

  await addDocument(COLLECTIONS.INVITE_TOKENS, {
    token,
    userId,
    generatedBy,
    tempPassword,
    expiresAt,
    used: false,
  });

  return token;
}

/**
 * Validates an invite token and auto signs-in the user.
 * Returns the userId and profile after signing in.
 * @param {string} token
 * @returns {Promise<{ userId: string, profile: object }>}
 */
export async function validateInviteToken(token) {
  const results = await getCollection(COLLECTIONS.INVITE_TOKENS, [
    where('token', '==', token),
    where('used',  '==', false),
  ]);

  if (results.length === 0) {
    throw new Error('Invalid or already used invite link.');
  }

  const record = results[0];

  const expiresAt = record.expiresAt?.toDate
    ? record.expiresAt.toDate()
    : new Date(record.expiresAt);

  if (new Date() > expiresAt) {
    throw new Error('This invite link has expired. Ask an admin to generate a new one.');
  }

  const profile = await getDocument(COLLECTIONS.USERS, record.userId);
  if (!profile) throw new Error('User account not found.');

  await signInWithEmailAndPassword(auth, profile.email, record.tempPassword);
  await updateDocument(COLLECTIONS.INVITE_TOKENS, record.id, { used: true });

  appState.currentUser = _normalizeProfile(profile, record.userId);

  return { userId: record.userId, profile: appState.currentUser };
}

//#endregion

//#region Password Reset

/**
 * Self-serve password reset with rate limiting.
 * @param {string} userId
 * @returns {Promise<{ tempPassword: string }>}
 */
export async function selfResetPassword(userId) {
  const profile = await getDocument(COLLECTIONS.USERS, userId);
  if (!profile) throw new Error('User account not found.');

  _enforceRateLimit(profile);

  const tempPassword = _generateTempPassword();
  const now          = Date.now();
  const recentResets = _getRecentResets(profile, now);

  await updateDocument(COLLECTIONS.USERS, userId, {
    isFirstLogin:   true,
    passwordResets: [...recentResets, now],
  });

  return { tempPassword };
}

/**
 * Admin-initiated password reset. Bypasses rate limit.
 * @param {string} userId
 * @returns {Promise<{ tempPassword: string }>}
 */
export async function adminResetPassword(userId) {
  const tempPassword = _generateTempPassword();

  await updateDocument(COLLECTIONS.USERS, userId, {
    isFirstLogin: true,
  });

  return { tempPassword };
}

//#endregion

//#region Private — Profile Normalization

/**
 * Normalizes a raw Firestore user profile into the appState.currentUser shape.
 * type is read directly from profile.type — written on account creation.
 * Falls back to USER_TYPE.STAFF if type is missing (legacy safety net).
 *
 * @param {object} profile     - raw Firestore document
 * @param {string} uid         - Firebase Auth UID
 * @param {object} [overrides] - optional fields to merge (e.g. lastLoginAt)
 * @returns {object}
 */
function _normalizeProfile(profile, uid, overrides = {}) {
  const type = profile.type ?? USER_TYPE.STAFF;

  return {
    ...profile,
    ...overrides,
    id:   uid,
    type,
    role: type === USER_TYPE.STAFF ? (profile.role ?? null) : null,
  };
}

//#endregion

//#region Private — Helpers

/**
 * Checks if a TrueSight ID is already taken.
 * @param {string} trueSightId
 * @returns {Promise<boolean>}
 */
async function _isTrueSightIdTaken(trueSightId) {
  const results = await getCollection(COLLECTIONS.USERS, [
    where('trueSightId', '==', trueSightId),
  ]);
  return results.length > 0;
}

/**
 * Enforces the password reset rate limit.
 * @param {object} profile
 */
function _enforceRateLimit(profile) {
  const now          = Date.now();
  const recentResets = _getRecentResets(profile, now);
  if (recentResets.length >= AUTH_RESET_RATE_LIMIT) {
    throw new Error('Password reset limit reached. Contact an administrator.');
  }
}

/**
 * Returns reset timestamps within the rate limit window.
 * @param {object} profile
 * @param {number} now
 * @returns {number[]}
 */
function _getRecentResets(profile, now) {
  const resets = profile.passwordResets || [];
  return resets.filter(ts => now - ts < AUTH_RESET_WINDOW_MS);
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

/**
 * Generates a cryptographically random invite token.
 * @returns {string}
 */
function _generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

//#endregion