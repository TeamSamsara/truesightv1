/**
 * navIndex.js — nav component
 * @version 1.1.0
 *
 * Public API for the global nav component.
 * This is the only file features should import from.
 *
 * Usage:
 *   import { Nav, NAV_DOMAIN } from '../../shared/components/nav/navIndex.js';
 *
 *   Nav.init();
 *   Nav.registerCloseSession(closeSession);
 *   Nav.setDomain(NAV_DOMAIN.ADMIN, subNavItems, activeKey, actionsHTML, onTabClick);
 *   Nav.updateBadge('approvals', 3);
 *   Nav.hide();
 *
 * Target path: src/shared/components/nav/navIndex.js
 */

//#region Imports

import {
  init,
  setDomain,
  setActiveTab,
  updateBadge,
  refreshSubNav,
  hide,
  show,
  registerCloseSession,
}                      from './navController.js';
import { NAV_DOMAIN,
         navState }    from './navState.js';

//#endregion

//#region Public API

export const Nav = {
  init,
  setDomain,
  setActiveTab,
  updateBadge,
  refreshSubNav,
  hide,
  show,
  registerCloseSession,
};

//#endregion

//#region Re-exports — Constants

export { NAV_DOMAIN, navState };

//#endregion