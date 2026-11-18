/**
 * adminRenderer.js
 * @version 2.0.3
 *
 * Coordinator for all Admin feature rendering.
 * Owns the view lifecycle — fetches the content mount point
 * and delegates all page rendering to the appropriate view.
 *
 * Controllers import from here only — never from views directly.
 *
 * Target path: src/features/admin/adminRenderer.js
 */

//#region Imports

import { renderOverviewPage  as _overviewView,
         updateOverviewWidgets as _updateOverviewWidgets } from './views/overviewView.js';
import { renderApprovalsPage as _approvalsView }          from './views/approvalsView.js';
import { renderStalePage     as _staleView     }          from './views/staleView.js';
import { renderSystemPage    as _systemView    }          from './views/systemView.js';
import { renderUsersPage     as _usersView,
         renderRowMenu }                                  from './views/usersView.js';
import {
  buildModalStepsHTML,
  buildStep1HTML,
  buildStep2HTML,
  buildStep3HTML,
  buildRowActionHTML,
}                                                         from './views/userModalView.js';

//#endregion

//#region Mount Point

/**
 * Returns the admin content area.
 * All page renders go through this — views never query it themselves.
 * @returns {HTMLElement | null}
 */
function _getContent() {
  return document.getElementById('js-admin-content');
}

//#endregion

//#region Shell

/**
 * Renders the admin content shell.
 * Owns the container that all views are mounted into.
 * Sub-nav is rendered by the shared Nav component — not here.
 * @param {object} state - adminState (accepted for signature consistency, not used)
 */
export function renderAdminShell(state) {
  const mount = document.getElementById('app-mount');
  if (!mount) return;

  mount.innerHTML = `<div id="js-admin-content" class="f-admin__content"></div>`;
}

//#endregion

//#region Page Renders — delegated to views

export function renderOverviewPage(state, onTabClick) {
  const content = _getContent();
  if (!content) return;
  _overviewView(content, state, onTabClick);
}

export function updateOverviewWidgets(state, onTabClick) {
  _updateOverviewWidgets(state, onTabClick);
}

export function renderUsersPage(state) {
  const content = _getContent();
  if (!content) return;
  _usersView(content, state);
}

export function renderApprovalsPage(state) {
  const content = _getContent();
  if (!content) return;
  _approvalsView(content, state);
}

export function renderStalePage(state) {
  const content = _getContent();
  if (!content) return;
  _staleView(content, state);
}

export function renderSystemPage(state) {
  const content = _getContent();
  if (!content) return;
  _systemView(content, state);
}

//#endregion

//#region Surgical Updates — delegated to views

export { renderRowMenu };

//#endregion

//#region Modal Content — delegated to userModalView

export {
  buildModalStepsHTML,
  buildStep1HTML,
  buildStep2HTML,
  buildStep3HTML,
  buildRowActionHTML,
};

//#endregion