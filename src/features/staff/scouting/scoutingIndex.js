/**
 * scoutingIndex.js — scouting feature
 * @version 1.0.2
 *
 * Entry point for the Scouting domain.
 * Placeholder until Phase 2 (Tracker) and Phase 3 (Database).
 *
 * Target path: src/features/staff/scouting/scoutingIndex.js
 */

//#region Imports

import { Nav, NAV_DOMAIN } from '../../../shared/components/nav/navIndex.js';
import { canAccess }       from '../../../core/guards.js';
import { ROUTES }          from '../../../core/router.js';

//#endregion

//#region Mount

export async function mount(container, params) {
  if (!canAccess(ROUTES.SCOUTING)) return _cleanup;

  // TODO: Phase 2 — pass SUB_NAV_ITEMS and activeSubKey once sub-features are built
  Nav.setDomain(NAV_DOMAIN.SCOUTING, [], null);

  container.innerHTML = _buildHTML();

  return _cleanup;
}

//#endregion

//#region Cleanup

function _cleanup() {}

//#endregion

//#region Private — Render

function _buildHTML() {
  // TODO: Phase 2 — replace with Tracker view
  return `
    <div class="f-scouting">
      <div class="f-scouting__watermark">SCOUTING</div>
      <div class="l-page f-scouting__content">
        <div class="f-scouting__label">Scouting</div>
        <a href="#dashboard" class="c-button c-button--primary">
          Go to Dashboard
        </a>
      </div>
    </div>
  `;
}

//#endregion