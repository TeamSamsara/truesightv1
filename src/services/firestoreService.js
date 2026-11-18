/**
 * firestoreService.js
 * @version 1.0.1
 *
 * Base Firestore CRUD wrappers.
 * This is the ONLY file that imports from the Firestore SDK.
 * All reads and writes across the platform go through here.
 * Target path : src/services/firestoreService.js
 */

//#region Imports

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { db }                          from '../core/firebase.js';
import { Logger }                      from '../utils/logger.js';
import { LOG_SOURCE, LOG_FIRESTORE }   from '../constants/logMessages.js';

//#endregion

//#region Document Operations

/**
 * Fetches a single document by collection and document ID.
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<object | null>}
 */
export async function getDocument(collectionName, docId) {
  try {
    const ref  = doc(db, collectionName, docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.READ_FAILED, { collectionName, docId, err });
    throw err;
  }
}

/**
 * Writes a document at a specific ID. Creates or overwrites.
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function setDocument(collectionName, docId, data) {
  try {
    const ref = doc(db, collectionName, docId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
    Logger.info(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE, { collectionName, docId });
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE_FAILED, { collectionName, docId, err });
    throw err;
  }
}

/**
 * Adds a new document with an auto-generated ID.
 * @param {string} collectionName
 * @param {object} data
 * @returns {Promise<string>} The new document ID
 */
export async function addDocument(collectionName, data) {
  try {
    const ref  = collection(db, collectionName);
    const snap = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    Logger.info(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE, { collectionName, docId: snap.id });
    return snap.id;
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE_FAILED, { collectionName, err });
    throw err;
  }
}

/**
 * Updates specific fields on an existing document.
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
  try {
    const ref = doc(db, collectionName, docId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    Logger.info(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE, { collectionName, docId });
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE_FAILED, { collectionName, docId, err });
    throw err;
  }
}

/**
 * Deletes a document by collection and document ID.
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  try {
    const ref = doc(db, collectionName, docId);
    await deleteDoc(ref);
    Logger.info(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.DELETE, { collectionName, docId });
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.DELETE_FAILED, { collectionName, docId, err });
    throw err;
  }
}

//#endregion

//#region Collection Operations

/**
 * Fetches all documents from a collection with optional query constraints.
 * @param {string} collectionName
 * @param {Array}  constraints   - Array of Firestore query constraints
 * @returns {Promise<object[]>}
 */
export async function getCollection(collectionName, constraints = []) {
  try {
    const ref  = collection(db, collectionName);
    const q    = query(ref, ...constraints);
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    Logger.info(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.READ, { collectionName, count: docs.length });
    return docs;
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.READ_FAILED, { collectionName, err });
    throw err;
  }
}

//#endregion

//#region Subcollection Operations

/**
 * Fetches a single document from a subcollection.
 * @param {string} collectionName
 * @param {string} docId
 * @param {string} subCollection
 * @param {string} subDocId
 * @returns {Promise<object | null>}
 */
export async function getSubDocument(collectionName, docId, subCollection, subDocId) {
  try {
    const ref  = doc(db, collectionName, docId, subCollection, subDocId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.READ_FAILED, {
      collectionName, docId, subCollection, subDocId, err,
    });
    throw err;
  }
}

/**
 * Fetches all documents from a subcollection.
 * @param {string} collectionName
 * @param {string} docId
 * @param {string} subCollection
 * @param {Array}  constraints
 * @returns {Promise<object[]>}
 */
export async function getSubCollection(collectionName, docId, subCollection, constraints = []) {
  try {
    const ref  = collection(db, collectionName, docId, subCollection);
    const q    = query(ref, ...constraints);
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    Logger.info(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.READ, {
      collectionName, docId, subCollection, count: docs.length,
    });
    return docs;
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.READ_FAILED, {
      collectionName, docId, subCollection, err,
    });
    throw err;
  }
}

/**
 * Adds a document to a subcollection with auto-generated ID.
 * @param {string} collectionName
 * @param {string} docId
 * @param {string} subCollection
 * @param {object} data
 * @returns {Promise<string>} The new document ID
 */
export async function addSubDocument(collectionName, docId, subCollection, data) {
  try {
    const ref  = collection(db, collectionName, docId, subCollection);
    const snap = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
    Logger.info(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE, {
      collectionName, docId, subCollection, subDocId: snap.id,
    });
    return snap.id;
  } catch (err) {
    Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.WRITE_FAILED, {
      collectionName, docId, subCollection, err,
    });
    throw err;
  }
}

//#endregion

//#region Query Helpers

/**
 * Exported Firestore query constraint builders for use across services.
 * Services import these instead of importing from the SDK directly.
 */
export { where, orderBy, limit, serverTimestamp };

//#endregion