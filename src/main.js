/**
 * main.js
 * @version 1.2.1
 *
 * Application entry point.
 * Nav visibility is controlled entirely by the router based on route —
 * features and main.js never call Nav.hide() or Nav.show() directly.
 */

//#region Imports

import { restoreSession }                  from './shared/features/auth/authService.js';
import { initRouter, navigateTo, ROUTES }  from './core/router.js';
import { appState, setLoading, setError }  from './core/appState.js';
import { Nav }                             from './shared/components/nav/navIndex.js';
import { initSession, closeSession }       from './services/sessionService.js';
import { rebindToolbarEvents }             from './shared/features/dev/devController.js';
import { Logger }                          from './utils/logger.js';
import { LOG_SOURCE, LOG_BOOT }            from './constants/logMessages.js';

//#endregion

//#region Boot

async function boot() {
  try {
    setLoading(true);
    Logger.info(LOG_SOURCE.BOOT, LOG_BOOT.START);

    // ── Invite link detection ──
    const hash                  = window.location.hash.replace('#', '');
    const [pathPart, queryPart] = hash.split('?');
    const route                 = pathPart.split('/')[0];

    const isInvitePath  = route === ROUTES.FIRST_LOGIN && pathPart.includes('/');
    const isInviteQuery = route === ROUTES.FIRST_LOGIN && !!queryPart?.includes('token=');

    if (isInvitePath || isInviteQuery) {
      initRouter(rebindToolbarEvents, Nav);
      return;
    }

    // ── Session restore ──
    await restoreSession();

    if (appState.currentUser) {
      Logger.info(LOG_SOURCE.BOOT, LOG_BOOT.SESSION_FOUND);
      initSession();
      Nav.registerCloseSession(closeSession);
      Nav.init();
      Logger.info(LOG_SOURCE.BOOT, LOG_BOOT.NAV_INIT);
    } else {
      Logger.info(LOG_SOURCE.BOOT, LOG_BOOT.SESSION_NONE);
    }

    initRouter(rebindToolbarEvents, Nav);
    Logger.info(LOG_SOURCE.BOOT, LOG_BOOT.ROUTER_INIT);

  } catch (err) {
    Logger.error(LOG_SOURCE.BOOT, LOG_BOOT.FAILED, err);
    setError('Failed to initialize the application. Please refresh.');
    navigateTo(ROUTES.LOGIN);

  } finally {
    setLoading(false);
  }
}

//#endregion

//#region Init

boot();

//#endregion