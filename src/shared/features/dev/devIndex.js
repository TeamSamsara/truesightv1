/**
 * devIndex.js — dev feature
 * @version 1.0.2
 *
 * Entry point for the dev feature.
 * Hides the global nav — dev door is a standalone screen.
 * Toolbar is mounted separately after successful token validation
 * and persists across route changes independently of this mount.
 *
 * Target path: src/shared/features/dev/devIndex.js
 */

//#region Imports

import { initDevDoor, isDevModeActive } from './devController.js';
import { devState }                     from './devState.js';
import { Nav }                          from '../../components/nav/navIndex.js';

//#endregion

//#region Mount

export async function mount(container, params) {
  Nav.hide();
  initDevDoor();
  return _cleanup;
}

//#endregion

//#region Cleanup

function _cleanup() {
  // Toolbar is mounted on #app directly and persists
  // across route changes — do not remove it here.
  devState.isDoorOpen = false;
}

//#endregion

//#region Public API

export { isDevModeActive };

//#endregion