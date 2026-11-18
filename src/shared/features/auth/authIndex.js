/**
 * authIndex.js — auth feature
 * @version 1.0.4
 *
 * Entry point for the auth feature.
 * Hides the global nav — auth screens are standalone.
 * Mounts the correct auth view based on the current route.
 *
 * Target path: src/shared/features/auth/authIndex.js
 */

//#region Imports

import { initAuth } from './authController.js';
import { Nav }      from '../../components/nav/navIndex.js';
import { ROUTES }   from '../../../core/router.js';

//#endregion

//#region Mount

export async function mount(container, params = {}) {
  Nav.hide();

  const hash  = window.location.hash.replace('#', '');
  const route = hash.split('?')[0].split('/')[0] || ROUTES.LOGIN;

  await initAuth(route, params);

  return _cleanup;
}

//#endregion

//#region Cleanup

function _cleanup() {}

//#endregion