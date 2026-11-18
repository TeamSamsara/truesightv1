/**
 * Read-only repository for the existing ProspectSystem Firestore dataset.
 *
 * No writes, deletes, imports, or document transformations are performed here.
 * Preserve original document IDs because combine and interview records refer
 * to prospects by those IDs.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { prospectDb, requireProspectDataUser } from './prospectFirebase.js';

const COLLECTIONS = Object.freeze({
  PROSPECTS: 'prospects',
  COMBINES: 'combines',
  COMBINE_LOBBIES: 'combineLobbies',
  INTERVIEWS: 'interviews',
});

function mapSnapshot(snapshot) {
  return snapshot.docs.map(document => ({
    id: document.id,
    data: document.data(),
  }));
}

function assertAuthenticated() {
  requireProspectDataUser();
}

export async function fetchProspects() {
  assertAuthenticated();
  const snapshot = await getDocs(collection(prospectDb, COLLECTIONS.PROSPECTS));
  return mapSnapshot(snapshot);
}

export async function fetchProspect(prospectId) {
  if (!prospectId) throw new Error('A prospect ID is required.');
  assertAuthenticated();
  const snapshot = await getDoc(doc(prospectDb, COLLECTIONS.PROSPECTS, prospectId));
  return snapshot.exists()
    ? { id: snapshot.id, data: snapshot.data() }
    : null;
}

export async function fetchCombines() {
  assertAuthenticated();
  const snapshot = await getDocs(collection(prospectDb, COLLECTIONS.COMBINES));
  return mapSnapshot(snapshot);
}

export async function fetchCombineLobbies() {
  assertAuthenticated();
  const snapshot = await getDocs(collection(prospectDb, COLLECTIONS.COMBINE_LOBBIES));
  return mapSnapshot(snapshot);
}

export async function fetchInterviews() {
  assertAuthenticated();
  const snapshot = await getDocs(collection(prospectDb, COLLECTIONS.INTERVIEWS));
  return mapSnapshot(snapshot);
}

export { COLLECTIONS as PROSPECT_DATA_COLLECTIONS };
