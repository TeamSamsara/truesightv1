/**
 * adminIndex.js — admin feature
 * @version 1.2.0
 *
 * Entry point for the admin feature.
 * Tab navigation delegated to the shared Nav sub-nav component.
 * Overview tab uses the shared Dashboard + Widget system.
 *
 * Target path: src/features/admin/adminIndex.js
 */

//#region Imports

import {
  adminState,
  setAdminTab,
  setAdminLoading,
  setAdminError,
  clearAdminError,
  setWidgetCounts,
  setApprovalList,
  setStaleList,
  setRecentActivity,
  setCleanupCounts,
  setCleanupMeta,
  setCleanupRunning,
  setCleanupResult,
  ADMIN_TABS,
}                                          from './adminState.js';

import {
  loadWidgetCounts,
  loadRecentActivity,
  loadPendingApprovals,
  loadStaleProfiles,
  approveAction,
  rejectAction,
  keepStaleProfile,
  flagStaleForDeletion,
}                                          from './adminService.js';

import {
  getCleanupCounts,
  getCleanupMeta,
  runCleanup,
}                                          from '../../services/cleanupService.js';

import { initUsers, handleOpenCreateModal } from './adminController.js';

import {
  renderAdminShell,
  renderOverviewPage,
  updateOverviewWidgets,
  renderUsersPage,
  renderApprovalsPage,
  renderStalePage,
  renderSystemPage,
}                                          from './adminRenderer.js';


import { Nav, NAV_DOMAIN }                 from '../../shared/components/nav/navIndex.js';
import { canAccess }                       from '../../core/guards.js';
import { ROUTES }                          from '../../core/router.js';

//#endregion

//#region Constants

const ADD_USER_BTN_HTML = `
  <button class="c-button c-button--gold c-button--sm js-admin-add-user">
    + Add User
  </button>
`;

//#endregion

//#region Mount

export async function mount(container, params) {
  if (!canAccess(ROUTES.ADMIN)) return _cleanup;

  const counts = await _fetchCounts();

  Nav.setDomain(
    NAV_DOMAIN.ADMIN,
    _buildSubNavItems(counts),
    adminState.activeTab,
    ADD_USER_BTN_HTML,
    _handleTabClick,
  );

  _bindAddUserButton();
  renderAdminShell(adminState);
  await _loadTab(adminState.activeTab);

  return _cleanup;
}

//#endregion

//#region Cleanup

function _cleanup() {
  const modalMount = document.getElementById('admin-modal-mount');
  if (modalMount) modalMount.remove();
}

//#endregion

//#region Sub-Nav

function _buildSubNavItems(counts = {}) {
  return [
    { key: ADMIN_TABS.OVERVIEW,  label: 'Overview',       badge: null,                     alert: false },
    { key: ADMIN_TABS.USERS,     label: 'Users',          badge: counts.users    || null,  alert: false },
    { key: ADMIN_TABS.APPROVALS, label: 'Approvals',      badge: counts.approvals || null, alert: true  },
    { key: ADMIN_TABS.STALE,     label: 'Stale Profiles', badge: counts.stale    || null,  alert: false },
    { key: ADMIN_TABS.SYSTEM,    label: 'System',         badge: null,                     alert: false },
  ];
}

function _handleTabClick(key) {
  if (key === adminState.activeTab) return;
  setAdminTab(key);
  Nav.setActiveTab(key);
  _loadTab(key);
}

function _updateSubNavBadges(counts) {
  Nav.updateBadge(ADMIN_TABS.USERS,     counts.users     || null);
  Nav.updateBadge(ADMIN_TABS.APPROVALS, counts.approvals || null);
  Nav.updateBadge(ADMIN_TABS.STALE,     counts.stale     || null);
}

//#endregion

//#region Tab Loading

async function _loadTab(tab) {
  const content = document.getElementById('js-admin-content');

  if (content) {
    content.style.transition = 'opacity .12s ease';
    content.style.opacity    = '0';
  }

  setAdminLoading(true);
  clearAdminError();

  try {
    switch (tab) {
      case ADMIN_TABS.OVERVIEW:  await _loadOverview();  break;
      case ADMIN_TABS.USERS:     await initUsers();      break;
      case ADMIN_TABS.APPROVALS: await _loadApprovals(); break;
      case ADMIN_TABS.STALE:     await _loadStale();     break;
      case ADMIN_TABS.SYSTEM:    await _loadSystem();    break;
      default:                   await _loadOverview();
    }
  } catch (err) {
    setAdminError('Failed to load page. Please try again.');
    console.error(`_loadTab(${tab}) failed:`, err);
  } finally {
    setAdminLoading(false);

    const updated = document.getElementById('js-admin-content');
    if (updated) {
      updated.style.opacity    = '0';
      updated.style.transition = 'opacity .15s ease';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { updated.style.opacity = '1'; });
      });
    }
  }
}

async function _loadOverview() {

  // Reset counts to null so widgets show loading state
  setWidgetCounts({ users: null, approvals: null, stale: null, invites: null });

  // Render shell with loading widgets immediately
  renderOverviewPage(adminState, _handleTabClick);

  // Fetch data in parallel
  const [counts, activity] = await Promise.all([
    loadWidgetCounts(),
    loadRecentActivity(),
  ]);

  // Guard — user may have navigated away while data was loading
  if (adminState.activeTab !== ADMIN_TABS.OVERVIEW) return;

  setWidgetCounts(counts);
  setRecentActivity(activity);
  _updateSubNavBadges(counts);

  // Surgically update widgets — no full re-render
  updateOverviewWidgets(adminState, _handleTabClick);
}

async function _loadApprovals() {
  const approvals = await loadPendingApprovals();
  setApprovalList(approvals);
  renderApprovalsPage(adminState);
  _bindApprovalEvents();
}

async function _loadStale() {
  const profiles = await loadStaleProfiles();
  setStaleList(profiles);
  renderStalePage(adminState);
  _bindStaleEvents();
}

async function _loadSystem() {
  const [counts, meta] = await Promise.all([
    getCleanupCounts(),
    getCleanupMeta(),
  ]);

  setCleanupCounts(counts);
  setCleanupMeta(meta);
  setCleanupResult(null);

  renderSystemPage(adminState);
  _bindSystemEvents();
}

async function _fetchCounts() {
  try {
    return await loadWidgetCounts();
  } catch {
    return { users: null, approvals: null, stale: null };
  }
}

//#endregion

//#region Event Binding — Add User

function _bindAddUserButton() {
  const btn = document.querySelector('.js-admin-add-user');
  if (!btn) return;
  btn.addEventListener('click', handleOpenCreateModal);
}

//#endregion

//#region Event Binding — Approvals

function _bindApprovalEvents() {
  const content = document.getElementById('js-admin-content');
  if (!content) return;

  content.addEventListener('click', async (e) => {
    const approveBtn = e.target.closest('.js-approval-approve');
    const rejectBtn  = e.target.closest('.js-approval-reject');

    if (approveBtn) await _handleApprovalDecision(approveBtn.dataset.approvalId, 'approve');
    if (rejectBtn)  await _handleApprovalDecision(rejectBtn.dataset.approvalId,  'reject');
  });
}

async function _handleApprovalDecision(approvalId, decision) {
  const reason = window.prompt(
    `Enter a reason for your ${decision === 'approve' ? 'approval' : 'rejection'}:`
  );
  if (!reason?.trim()) return;

  setAdminLoading(true);

  try {
    decision === 'approve'
      ? await approveAction(approvalId, reason.trim())
      : await rejectAction(approvalId, reason.trim());

    const approvals = await loadPendingApprovals();
    setApprovalList(approvals);
    renderApprovalsPage(adminState);
    _bindApprovalEvents();

    const counts = await loadWidgetCounts();
    setWidgetCounts(counts);
    _updateSubNavBadges(counts);
  } catch (err) {
    setAdminError(err.message || 'Action failed. Please try again.');
    console.error('_handleApprovalDecision failed:', err);
  } finally {
    setAdminLoading(false);
  }
}

//#endregion

//#region Event Binding — Stale Profiles

function _bindStaleEvents() {
  const content = document.getElementById('js-admin-content');
  if (!content) return;

  content.addEventListener('click', async (e) => {
    const keepBtn = e.target.closest('.js-stale-keep');
    const flagBtn = e.target.closest('.js-stale-flag');
    const chip    = e.target.closest('.js-stale-role-filter');

    if (keepBtn) await _handleStaleKeep(keepBtn.dataset.prospectId);
    if (flagBtn) await _handleStaleFlag(flagBtn.dataset.prospectId);

    if (chip) {
      adminState.staleRoleFilter = chip.dataset.role || null;
      document.querySelectorAll('.js-stale-role-filter').forEach(c =>
        c.classList.toggle('is-active', (c.dataset.role || null) === adminState.staleRoleFilter)
      );
      _applyStaleFilters();
      renderStalePage(adminState);
      _bindStaleEvents();
    }
  });

  const searchEl = document.getElementById('js-stale-search');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      adminState.staleSearchQuery = e.target.value.toLowerCase().trim();
      _applyStaleFilters();
      renderStalePage(adminState);
      _bindStaleEvents();
    });
  }
}

async function _handleStaleKeep(prospectId) {
  setAdminLoading(true);
  try {
    await keepStaleProfile(prospectId);
    const profiles = await loadStaleProfiles();
    setStaleList(profiles);
    _applyStaleFilters();
    renderStalePage(adminState);
    _bindStaleEvents();

    const counts = await loadWidgetCounts();
    setWidgetCounts(counts);
    _updateSubNavBadges(counts);
  } catch (err) {
    setAdminError('Failed to update profile.');
    console.error('_handleStaleKeep failed:', err);
  } finally {
    setAdminLoading(false);
  }
}

async function _handleStaleFlag(prospectId) {
  const reason = window.prompt('Enter a reason for flagging this profile for deletion:');
  if (!reason?.trim()) return;

  setAdminLoading(true);
  try {
    await flagStaleForDeletion(prospectId, reason.trim());
    const profiles = await loadStaleProfiles();
    setStaleList(profiles);
    _applyStaleFilters();
    renderStalePage(adminState);
    _bindStaleEvents();

    const counts = await loadWidgetCounts();
    setWidgetCounts(counts);
    _updateSubNavBadges(counts);
  } catch (err) {
    setAdminError('Failed to flag profile.');
    console.error('_handleStaleFlag failed:', err);
  } finally {
    setAdminLoading(false);
  }
}

//#endregion

//#region Event Binding — System

function _bindSystemEvents() {
  const content = document.getElementById('js-admin-content');
  if (!content) return;

  content.addEventListener('click', async (e) => {
    if (e.target.closest('.js-system-run-cleanup')) {
      await _handleRunCleanup();
    }
  });
}

async function _handleRunCleanup() {
  setCleanupRunning(true);
  renderSystemPage(adminState);
  _bindSystemEvents();

  try {
    const result = await runCleanup();
    setCleanupResult(result);

    const [counts, meta] = await Promise.all([
      getCleanupCounts(),
      getCleanupMeta(),
    ]);
    setCleanupCounts(counts);
    setCleanupMeta(meta);
  } catch (err) {
    setAdminError(err.message || 'Cleanup failed.');
    console.error('_handleRunCleanup failed:', err);
  } finally {
    setCleanupRunning(false);
    renderSystemPage(adminState);
    _bindSystemEvents();
  }
}

//#endregion

//#region Private Helpers

function _applyStaleFilters() {
  let filtered = [...adminState.staleList];

  if (adminState.staleRoleFilter) {
    filtered = filtered.filter(p =>
      p.role?.toLowerCase() === adminState.staleRoleFilter
    );
  }

  if (adminState.staleSearchQuery) {
    const q = adminState.staleSearchQuery;
    filtered = filtered.filter(p =>
      p.primaryRiotId?.toLowerCase().includes(q) ||
      p.displayName?.toLowerCase().includes(q)
    );
  }

  adminState.filteredStale = filtered;
}

//#endregion