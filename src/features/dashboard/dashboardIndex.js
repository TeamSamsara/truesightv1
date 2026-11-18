/**
 * dashboardIndex.js — dashboard route entry
 * @version 1.0.0
 *
 * Entry point for the #dashboard route.
 * Delegates to the appropriate portal dashboard based on user type.
 * Never contains dashboard logic directly — only routing.
 *
 * Target path: src/features/dashboard/dashboardIndex.js
 */

//#region Imports

import { appState }        from '../../core/appState.js';
import { navigateTo,
         ROUTES }          from '../../core/router.js';
import { canAccess }       from '../../core/guards.js';
import { USER_TYPE }       from '../../constants/roles.js';

//#endregion

//#region Mount

export async function mount(container, params) {
  if (!canAccess(ROUTES.DASHBOARD)) return _cleanup;

  const user = appState.currentUser;

  switch (user.type) {
    case USER_TYPE.ADMIN:
    case USER_TYPE.DEV: {
      const { mount: mountAdmin } = await import('./adminDashboard.js');
      return await mountAdmin(container, params);
    }

    // case USER_TYPE.STAFF: {
    //   const { mount: mountStaff } = await import('./staffDashboard.js');
    //   return await mountStaff(container, params);
    // }

    // case USER_TYPE.PLAYER: {
    //   const { mount: mountPlayer } = await import('./playerDashboard.js');
    //   return await mountPlayer(container, params);
    // }

    default:
      navigateTo(ROUTES.LOGIN);
      return _cleanup;
  }
}

//#endregion

//#region Cleanup

function _cleanup() {}

//#endregion