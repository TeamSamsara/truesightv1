/**
 * ProspectSystem Firebase connection.
 *
 * This is a named secondary Firebase app. It deliberately does not replace
 * TrueSight's default Firebase app or its auth/database instances.
 *
 * Access is read-only at this stage. A user must authenticate against the
 * ProspectSystem Firebase project before protected Firestore reads are made.
 */

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const APP_NAME = 'prospect-system-data';

const FIREBASE_CONFIGS = {
  staging: {
    apiKey: 'AIzaSyCPkaIoGvvc9UiF0XG3QjE50E3F4VgNBPY',
    authDomain: 'prospecttooldev-staging.firebaseapp.com',
    projectId: 'prospecttooldev-staging',
    storageBucket: 'prospecttooldev-staging.firebasestorage.app',
    messagingSenderId: '614438934943',
    appId: '1:614438934943:web:63b7ceb52898a63aaec5aa',
  },
  production: {
    apiKey: 'AIzaSyBzt3-9T_L7NJzBeAbls0ncSpWjJdIVbm0',
    authDomain: 'prospecttooldev-8ddbf.firebaseapp.com',
    projectId: 'prospecttooldev-8ddbf',
    storageBucket: 'prospecttooldev-8ddbf.firebasestorage.app',
    messagingSenderId: '505273806742',
    appId: '1:505273806742:web:eea33008f82bc559cff7b7',
  },
};

function resolveEnvironment() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'staging';
  }
  if (hostname.includes('staging')) return 'staging';
  return 'production';
}

const environment = resolveEnvironment();
const existingApp = getApps().find(app => app.name === APP_NAME);
const app = existingApp || initializeApp(FIREBASE_CONFIGS[environment], APP_NAME);

export const prospectFirebaseEnvironment = environment;
export const prospectFirebaseApp = app;
export const prospectAuth = getAuth(app);
export const prospectDb = getFirestore(app);

/**
 * Transitional authentication for the ProspectSystem project.
 * This is intentionally separate from TrueSight authentication.
 */
export async function signInToProspectData(email, password) {
  if (!email?.trim() || !password) {
    throw new Error('Email and password are required.');
  }
  return signInWithEmailAndPassword(prospectAuth, email.trim().toLowerCase(), password);
}

export function signOutOfProspectData() {
  return signOut(prospectAuth);
}

export function onProspectDataAuthStateChanged(callback) {
  return onAuthStateChanged(prospectAuth, callback);
}

export function requireProspectDataUser() {
  const user = prospectAuth.currentUser;
  if (!user) {
    throw new Error('ProspectSystem authentication is required before accessing scouting data.');
  }
  return user;
}
