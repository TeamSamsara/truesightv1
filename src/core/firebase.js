/**
 * firebase.js
 * @version 1.0.1
 *
 * Firebase initialization — Auth and Firestore.
 * All other files access Firebase through their services.
 * This is the only file that initializes the Firebase app.
 * Target path: src/core/firebase.js
 */

//#region Imports

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

//#endregion

//#region Config

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyB23b21FgqnxkTTsM_AF5KzOYSX1ulcdfo',
  authDomain:        'truesightfb.firebaseapp.com',
  projectId:         'truesightfb',
  storageBucket:     'truesightfb.firebasestorage.app',
  messagingSenderId: '1017241882405',
  appId:             '1:1017241882405:web:10348dfcb3b66e00c5d4cc',
  measurementId:     'G-ZVSG3WJDZS',
};

//#endregion

//#region Init

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

//#endregion

//#region Exports

export { auth, db };

//#endregion