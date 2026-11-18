/**
 * Scouting feature entry point.
 *
 * TrueSight owns the route and application shell. ProspectSystem's existing
 * scouting records are accessed through the isolated data adapter.
 */

import { Nav, NAV_DOMAIN } from '../../../shared/components/nav/navIndex.js';
import { canAccess } from '../../../core/guards.js';
import { ROUTES } from '../../../core/router.js';
import { mountProspectWorkspace } from './prospects/prospectsIndex.js';

export async function mount(container) {
  if (!canAccess(ROUTES.SCOUTING)) return () => {};

  Nav.setDomain(NAV_DOMAIN.SCOUTING, [], null);
  return mountProspectWorkspace(container);
}
