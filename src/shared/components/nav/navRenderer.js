/**
 * navRenderer.js
 * @version 1.1.1
 *
 * Builds and updates the global nav DOM.
 * Reads from navState and appState only — no logic here.
 *
 * Domain link visibility is driven by hasPermission — no static
 * disabled list. Each domain is rendered only if the current user
 * holds the NAVIGATE permission for it.
 *
 * Target path: src/shared/components/nav/navRenderer.js
 */

//#region Imports

import { escHtml, truncate }              from '../../../utils/helpers.js';
import { appState }                       from '../../../core/appState.js';
import { navState, NAV_DOMAIN }           from './navState.js';
import { hasPermission, PERMISSION }      from '../../../constants/permissions.js';

//#endregion

//#region Constants

const NAV_ID     = 'app-nav';
const SUB_NAV_ID = 'app-subnav';

const DOMAIN_LABELS = {

  [NAV_DOMAIN.SCOUTING]:   'Scouting',
  [NAV_DOMAIN.ANALYSIS]:   'Analysis',
  [NAV_DOMAIN.OPERATIONS]: 'Operations',
  [NAV_DOMAIN.COACHING]:   'Coaching',
  [NAV_DOMAIN.ADMIN]:      'Admin',
};

/**
 * All nav domains and their required NAVIGATE permission.
 * Rendered in this order. Admin is handled separately in the user area.
 */
const NAV_DOMAINS = [
  { domain: NAV_DOMAIN.SCOUTING,   permission: PERMISSION.NAVIGATE_SCOUTING   },
  { domain: NAV_DOMAIN.ANALYSIS,   permission: PERMISSION.NAVIGATE_ANALYSIS   },
  { domain: NAV_DOMAIN.OPERATIONS, permission: PERMISSION.NAVIGATE_OPERATIONS },
  { domain: NAV_DOMAIN.COACHING,   permission: PERMISSION.NAVIGATE_COACHING   },
];

//#endregion

//#region Public API

export function renderNav() {
  const nav = document.getElementById(NAV_ID);
  if (!nav) return;
  nav.innerHTML = _buildNavHTML();
}

export function showNav() {
  document.getElementById(NAV_ID)?.classList.remove('is-hidden');
}

export function hideNav() {
  document.getElementById(NAV_ID)?.classList.add('is-hidden');
}

export function renderSubNav() {
  const existing = document.getElementById(SUB_NAV_ID);

  if (!navState.subNavItems || navState.subNavItems.length === 0) {
    if (existing) existing.remove();
    return;
  }

  const html = _buildSubNavHTML();

  if (existing) {
    existing.outerHTML = html;
    return;
  }

  document.getElementById(NAV_ID)?.insertAdjacentHTML('afterend', html);
}

/**
 * Surgical active domain update — no full re-render.
 * @param {string} domain
 */
export function updateActiveDomain(domain) {
  document.querySelectorAll('.js-nav-domain').forEach(link => {
    link.classList.toggle('is-active', link.dataset.domain === domain);
  });
}

/**
 * Surgical active sub-key update — no full re-render.
 * @param {string} key
 */
export function updateActiveSubKey(key) {
  document.querySelectorAll('.js-subnav-link').forEach(link => {
    link.classList.toggle('is-active', link.dataset.key === key);
  });
}

/**
 * Surgical badge update — avoids full sub-nav re-render.
 * @param {string} key
 * @param {number | null} badge
 */
export function updateSubNavBadge(key, badge) {
  const link = document.querySelector(`.js-subnav-link[data-key="${key}"]`);
  if (!link) return;

  let badgeEl = link.querySelector('.c-subnav__badge');

  if (badge === null || badge === 0) {
    badgeEl?.remove();
    return;
  }

  if (!badgeEl) {
    badgeEl           = document.createElement('span');
    badgeEl.className = 'c-subnav__badge';
    link.appendChild(badgeEl);
  }

  const isAlert       = navState.subNavItems?.find(i => i.key === key)?.alert ?? false;
  badgeEl.className   = `c-subnav__badge${isAlert ? ' c-subnav__badge--alert' : ''}`;
  badgeEl.textContent = String(badge);
}

//#endregion

//#region Private — Nav Builder

function _buildNavHTML() {
  return `
    <div class="l-nav__inner">
      ${_buildBrandHTML()}
      ${_buildDomainLinksHTML()}
      ${_buildUserHTML()}
    </div>
  `;
}

function _buildBrandHTML() {
  return `
    <a class="l-nav__brand js-nav-home" href="#dashboard" aria-label="Go to dashboard">
      <div class="c-brand-mark">TS</div>
      <div>
        <div class="c-brand__sub">TEAM SAMSARA</div>
        <div class="c-brand__name">TRUESIGHT</div>
      </div>
    </a>
  `;
}

function _buildDomainLinksHTML() {
  const user  = appState.currentUser;
  const links = NAV_DOMAINS
    .filter(({ permission }) => hasPermission(user, permission))
    .map(({ domain }) => _buildDomainLinkHTML(domain))
    .join('');

  return `<nav class="l-nav__links" aria-label="Main navigation">${links}</nav>`;
}

/**
 * Builds a single nav domain link.
 * All rendered links are accessible — filtering happens before this call.
 * @param {string} domain
 * @returns {string}
 */
function _buildDomainLinkHTML(domain) {
  const isActive = navState.activeDomain === domain;
  const label    = DOMAIN_LABELS[domain] ?? domain;

  const classes = [
    'c-nav__link',
    'js-nav-domain',
    isActive ? 'is-active' : '',
  ].filter(Boolean).join(' ');

  return `
    <a
      class="${escHtml(classes)}"
      data-domain="${escHtml(domain)}"
      href="#${escHtml(domain)}"
    >${escHtml(label)}</a>
  `;
}

function _buildUserHTML() {
  const user      = appState.currentUser;
  const displayId = user?.trueSightId ?? user?.displayName ?? '—';
  const truncated = truncate(displayId, 18);

  return `
    <div class="l-nav__user">
      <span class="c-nav__user-id">${escHtml(truncated)}</span>
      ${hasPermission(user, PERMISSION.NAVIGATE_ADMIN) ? _buildAdminLinkHTML() : ''}
      <button class="c-button c-button--ghost c-button--sm js-nav-logout">
        Sign out
      </button>
    </div>
  `;
}

function _buildAdminLinkHTML() {
  const isActive = navState.activeDomain === NAV_DOMAIN.ADMIN;

  const classes = [
    'c-nav__link',
    'js-nav-domain',
    'is-admin',
    isActive ? 'is-active' : '',
  ].filter(Boolean).join(' ');

  return `
    <a
      class="${escHtml(classes)}"
      data-domain="${escHtml(NAV_DOMAIN.ADMIN)}"
      href="#admin"
    >Admin</a>
  `;
}

//#endregion

//#region Private — Sub-Nav Builder

function _buildSubNavHTML() {
  const items   = navState.subNavItems ?? [];
  const actions = navState.subNavActions ?? '';

  const links = items.map(item => {
    const isActive = navState.activeSubKey === item.key;
    const badge    = item.badge != null
      ? `<span class="c-subnav__badge${item.alert ? ' c-subnav__badge--alert' : ''}">${escHtml(String(item.badge))}</span>`
      : '';

    return `
      <button
        class="c-subnav__link js-subnav-link ${isActive ? 'is-active' : ''}"
        data-key="${escHtml(item.key)}"
      >${escHtml(item.label)}${badge}</button>
    `;
  }).join('');

  return `
    <div id="${SUB_NAV_ID}" class="c-subnav c-subnav--${escHtml(navState.activeDomain ?? '')}">
      <div class="c-subnav__inner">
        <div class="c-subnav__links">${links}</div>
        ${actions ? `<div class="c-subnav__actions">${actions}</div>` : ''}
      </div>
    </div>
  `;
}

//#endregion