/**
 * adminController.js
 * @version 1.2.0
 *
 * Handles all user management interactions for the Admin feature.
 * Uses the shared Modal component for all modal flows.
 * No overlay management here — that belongs to Modal.
 *
 * Migrated from staff-only to unified user management.
 * Target path: src/features/admin/adminController.js
 */

//#region Imports

import {
  adminState,
  setAdminLoading,
  setAdminError,
  clearAdminError,
  setUserList,
  setFilteredUsers,
  setRowMenuOpen,
  DELIVERY_METHOD,
  USER_MODAL_STEPS,
  ADMIN_TABS,
} from './adminState.js';

import {
  loadAllUsers,
  loadUserAuditLog,
  createUserAccount,
  changeUserRole,
  deactivateUserAccount,
  reactivateUserAccount,
  resetUserPassword,
} from './adminService.js';

import {
  renderUsersPage,
  renderRowMenu,
  buildStep1HTML,
  buildStep2HTML,
  buildStep3HTML,
  buildRowActionHTML,
} from './adminRenderer.js';

import { Modal, MODAL_SIZE, MODAL_VARIANT } from '../../shared/components/modal/modalIndex.js';
import { isValidEmail }                     from '../../utils/helpers.js';
import { USER_TYPE, USER_ROLE }             from '../../constants/roles.js';

//#endregion

//#region State

/**
 * Local controller state — tracks the current modal flow.
 * Separate from adminState to keep modal concerns isolated.
 */
const _modal = {
  form:           { name: '', email: '', type: '', role: '' },
  deliveryMethod: DELIVERY_METHOD.COPY,
  credentials:    null,
};

//#endregion

//#region Init

/**
 * Initializes the user management page.
 * @returns {Promise<void>}
 */
export async function initUsers() {
  setAdminLoading(true);
  clearAdminError();

  try {
    const users = await loadAllUsers();
    setUserList(users);
    setAdminLoading(false);
    renderUsersPage(adminState);
    _bindUsersPageEvents();

  } catch (err) {
    setAdminLoading(false);
    setAdminError('Failed to load user accounts.');
    console.error('initUsers failed:', err);
  }
}

//#endregion

//#region User List — Filtering

export function handleTypeFilterChange(type) {
  adminState.userTypeFilter = type;
  _applyUserFilters();
  renderUsersPage(adminState);
  _bindUsersPageEvents();
}

export function handleRoleFilterChange(role) {
  adminState.userRoleFilter = role;
  _applyUserFilters();
  renderUsersPage(adminState);
  _bindUsersPageEvents();
}

export function handleUserSearch(query) {
  adminState.userSearchQuery = query.toLowerCase().trim();
  _applyUserFilters();
  renderUsersPage(adminState);
  _bindUsersPageEvents();
}

export function handleShowInactiveToggle(value) {
  adminState.showInactive = value;
  _applyUserFilters();
  renderUsersPage(adminState);
  _bindUsersPageEvents();
}

//#endregion

//#region Row Menu

export function handleRowMenuOpen(userId) {
  const isSameMenu = adminState.rowMenu.openUserId === userId;
  setRowMenuOpen(isSameMenu ? null : userId);

  if (isSameMenu) {
    document.getElementById(`js-row-menu-${userId}`)?.remove();
    document.getElementById(`js-row-menu-btn-${userId}`)?.classList.remove('is-active');
    return;
  }

  renderRowMenu(userId, adminState.userList.find(u => u.id === userId));
  _bindRowMenuEvents(userId);
  _bindOutsideClickClose();
}

//#endregion

//#region Create User Modal

/**
 * Opens the create user modal at step 1.
 */
export function handleOpenCreateModal() {
  _modal.form           = { name: '', email: '', type: '', role: '' };
  _modal.deliveryMethod = DELIVERY_METHOD.COPY;
  _modal.credentials    = null;

  Modal.open({
    eyebrow:  'Admin · Users',
    title:    'ADD USER',
    size:     MODAL_SIZE.LG,
    variant:  MODAL_VARIANT.GOLD,
    content:  buildStep1HTML(_modal.form, null),
    onClose:  _handleModalClose,
  });

  _bindModalContentEvents();
}

/**
 * Handles Step 1 Next.
 */
export function handleModalStep1Next() {
  const name  = _val('js-modal-user-name');
  const email = _val('js-modal-user-email');
  const type  = _val('js-modal-user-type');
  const role  = _val('js-modal-user-role');

  if (!_validateStep1(name, email, type, role)) return;

  _modal.form = { name, email, type, role };

  Modal.setContent(buildStep2HTML(_modal.form.name, _modal.deliveryMethod, null));
  _bindModalContentEvents();
}

/**
 * Handles Step 2 delivery method selection.
 */
export function handleDeliveryMethodSelect(method) {
  _modal.deliveryMethod = method;
  document.querySelectorAll('.js-delivery-option').forEach(btn => {
    btn.classList.toggle('is-selected', btn.dataset.method === method);
  });
}

/**
 * Handles Step 2 Create Account submit.
 */
export async function handleModalStep2Submit() {
  Modal.setLoading(true);
  _disableSubmitButton(true);

  try {
    const result = await createUserAccount(_modal.form, _modal.deliveryMethod);

    _modal.credentials = {
      tempId:       result.tempId,
      tempPassword: result.tempPassword,
      inviteLink:   result.inviteLink,
      email:        result.email,
    };

    const users = await loadAllUsers();
    setUserList(users);
    _applyUserFilters();

    Modal.setLoading(false);
    Modal.setTitle('ACCOUNT CREATED');
    Modal.setContent(buildStep3HTML(
      _modal.form.name,
      _modal.credentials,
      _modal.deliveryMethod === DELIVERY_METHOD.INVITE,
    ));
    _bindModalContentEvents();

  } catch (err) {
    Modal.setLoading(false);
    _disableSubmitButton(false);
    _showModalError(err.message || 'Failed to create account. Try again.');
  }
}

/**
 * Handles Step 2 Back.
 */
export function handleModalStep2Back() {
  Modal.setTitle('ADD USER');
  Modal.setContent(buildStep1HTML(_modal.form, null));
  _bindModalContentEvents();
}

/**
 * Handles Step 3 Done.
 */
export function handleModalDone() {
  Modal.close();
  _refreshUsersPage();
}

//#endregion

//#region Row Action Modals

export function handleResetPassword(userId) {
  setRowMenuOpen(null);
  _openRowActionModal('reset-password', userId);
}

export function handleChangeRole(userId) {
  setRowMenuOpen(null);
  _openRowActionModal('change-role', userId);
}

export function handleDeactivate(userId) {
  setRowMenuOpen(null);
  _openRowActionModal('deactivate', userId);
}

export function handleReactivate(userId) {
  setRowMenuOpen(null);
  _openRowActionModal('reactivate', userId);
}

export async function handleViewActionLog(userId) {
  setRowMenuOpen(null);
  const user = adminState.userList.find(u => u.id === userId);
  if (!user) return;

  try {
    const log = await loadUserAuditLog(userId);
    Modal.open({
      eyebrow:  'Admin · Users',
      title:    'ACTION LOG',
      subtitle: user.displayName || user.name,
      size:     MODAL_SIZE.LG,
      variant:  MODAL_VARIANT.GOLD,
      content:  buildRowActionHTML('action-log', user, log),
      onClose:  _handleModalClose,
    });
    _bindModalContentEvents();
  } catch (err) {
    setAdminError('Failed to load action log.');
    console.error('handleViewActionLog failed:', err);
  }
}

//#endregion

//#region Private — Row Action Modal

function _openRowActionModal(type, userId) {
  const user = adminState.userList.find(u => u.id === userId);
  if (!user) return;

  const titles = {
    'reset-password': 'RESET PASSWORD',
    'change-role':    'CHANGE ROLE',
    'deactivate':     'DEACTIVATE ACCOUNT',
    'reactivate':     'REACTIVATE ACCOUNT',
  };

  Modal.open({
    eyebrow:  'Admin · Users',
    title:    titles[type] || 'ACTION',
    subtitle: user.displayName || user.name,
    size:     MODAL_SIZE.LG,
    variant:  type === 'deactivate' ? MODAL_VARIANT.DANGER : MODAL_VARIANT.GOLD,
    content:  buildRowActionHTML(type, user),
    onClose:  _handleModalClose,
  });

  _bindModalContentEvents();
}

async function _handleRowActionConfirm(actionType, userId) {
  const reason = _val('js-row-action-reason');

  if (!reason && actionType !== 'reset-password') {
    _showModalError('A reason is required.');
    return;
  }

  const confirmBtn = document.getElementById('js-row-action-confirm');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Processing…'; }

  Modal.setLoading(true);

  try {
    switch (actionType) {

      case 'deactivate':
        await deactivateUserAccount(userId, reason);
        break;

      case 'reactivate':
        await reactivateUserAccount(userId, reason);
        break;

      case 'change-role': {
        const newRole = _val('js-row-action-new-role');
        if (!newRole) {
          _showModalError('Please select a role.');
          Modal.setLoading(false);
          if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm'; }
          return;
        }
        await changeUserRole(userId, newRole, reason);
        break;
      }

      case 'reset-password': {
        const result = await resetUserPassword(userId, _modal.deliveryMethod);
        Modal.setLoading(false);
        Modal.setTitle('CREDENTIALS');
        Modal.setContent(buildStep3HTML(
          adminState.userList.find(u => u.id === userId)?.name || '',
          {
            tempPassword: result.tempPassword,
            inviteLink:   result.inviteLink,
            email:        adminState.userList.find(u => u.id === userId)?.email,
          },
          _modal.deliveryMethod === DELIVERY_METHOD.INVITE,
        ));
        _bindModalContentEvents();
        return;
      }

      default:
        throw new Error(`Unknown action: ${actionType}`);
    }

    Modal.setLoading(false);
    Modal.close();

    const users = await loadAllUsers();
    setUserList(users);
    _applyUserFilters();
    _refreshUsersPage();

  } catch (err) {
    Modal.setLoading(false);
    _showModalError(err.message || 'Action failed. Try again.');
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm'; }
  }
}

//#endregion

//#region Private — Modal Event Binding

function _bindModalContentEvents() {
  const body = document.getElementById('js-modal-body');
  if (!body) return;

  if (body._handler) {
    body.removeEventListener('click', body._handler);
  }

  const handler = (e) => {
    const target = e.target;

    if (target.id === 'js-modal-cancel')       { Modal.close(); return; }
    if (target.id === 'js-modal-step1-next')   { handleModalStep1Next(); return; }
    if (target.id === 'js-modal-step2-back')   { handleModalStep2Back(); return; }
    if (target.id === 'js-modal-step2-submit') { handleModalStep2Submit(); return; }
    if (target.id === 'js-modal-step3-done')   { handleModalDone(); return; }

    const deliveryBtn = target.closest('.js-delivery-option');
    if (deliveryBtn) {
      handleDeliveryMethodSelect(deliveryBtn.dataset.method);
      return;
    }

    const copyBtn = target.closest('.js-credential-copy');
    if (copyBtn) {
      navigator.clipboard.writeText(copyBtn.dataset.value);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 1500);
      return;
    }

    if (target.id === 'js-row-action-confirm') {
      _handleRowActionConfirm(target.dataset.actionType, target.dataset.userId);
      return;
    }
  };

  body._handler = handler;
  body.addEventListener('click', handler);
}

//#endregion

//#region Private — Modal Helpers

function _handleModalClose() {
  if (adminState.activeTab === ADMIN_TABS.USERS) {
    _refreshUsersPage();
  }
}

function _refreshUsersPage() {
  renderUsersPage(adminState);
  _bindUsersPageEvents();
}

function _showModalError(message) {
  let errorEl = document.querySelector('.c-form-error');
  if (!errorEl) {
    errorEl           = document.createElement('div');
    errorEl.className = 'c-form-error';
    const body        = document.getElementById('js-modal-body');
    if (body) body.prepend(errorEl);
  }
  errorEl.textContent = message;
}

function _disableSubmitButton(disabled) {
  const btn = document.getElementById('js-modal-step2-submit');
  if (!btn) return;
  btn.disabled    = disabled;
  btn.textContent = disabled ? 'Creating…' : 'Create Account →';
}

//#endregion

//#region Private — User Page Filtering

function _applyUserFilters() {
  let filtered = [...adminState.userList];

  if (!adminState.showInactive) {
    filtered = filtered.filter(u => u.active);
  }

  if (adminState.userTypeFilter) {
    filtered = filtered.filter(u => u.type === adminState.userTypeFilter);
  }

  if (adminState.userRoleFilter) {
    filtered = filtered.filter(u => u.role === adminState.userRoleFilter);
  }

  if (adminState.userSearchQuery) {
    const q = adminState.userSearchQuery;
    filtered = filtered.filter(u =>
      u.name?.toLowerCase().includes(q)        ||
      u.displayName?.toLowerCase().includes(q) ||
      u.trueSightId?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }

  setFilteredUsers(filtered);
}

//#endregion

//#region Private — Validation

function _validateStep1(name, email, type, role) {
  if (!name || name.length < 2) {
    _showModalError('Please enter a full name.');
    return false;
  }
  if (!isValidEmail(email)) {
    _showModalError('Please enter a valid email address.');
    return false;
  }
  if (!type || !Object.values(USER_TYPE).includes(type)) {
    _showModalError('Please select a user type.');
    return false;
  }
  if (type === USER_TYPE.STAFF && (!role || !Object.values(USER_ROLE).includes(role))) {
    _showModalError('Please select a role for this staff member.');
    return false;
  }
  return true;
}

//#endregion

//#region Private — Event Binding

function _bindUsersPageEvents() {
  try {
    const searchEl       = document.getElementById('js-users-search');
    const inactiveToggle = document.getElementById('js-users-show-inactive');

    if (searchEl) {
      searchEl.addEventListener('input', e => handleUserSearch(e.target.value));
    }

    if (inactiveToggle) {
      inactiveToggle.addEventListener('change', e =>
        handleShowInactiveToggle(e.target.checked)
      );
    }

    document.querySelectorAll('.js-users-type-filter').forEach(chip => {
      chip.addEventListener('click', () =>
        handleTypeFilterChange(chip.dataset.type || null)
      );
    });

    document.querySelectorAll('.js-users-role-filter').forEach(chip => {
      chip.addEventListener('click', () =>
        handleRoleFilterChange(chip.dataset.role || null)
      );
    });

    document.querySelectorAll('.js-users-row-menu-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        handleRowMenuOpen(btn.dataset.userId);
      });
    });

  } catch (err) {
    console.error('_bindUsersPageEvents failed:', err);
  }
}

function _bindRowMenuEvents(userId) {
  const ids = {
    [`js-row-reset-${userId}`]:      () => handleResetPassword(userId),
    [`js-row-role-${userId}`]:       () => handleChangeRole(userId),
    [`js-row-deactivate-${userId}`]: () => handleDeactivate(userId),
    [`js-row-reactivate-${userId}`]: () => handleReactivate(userId),
    [`js-row-log-${userId}`]:        () => handleViewActionLog(userId),
  };

  Object.entries(ids).forEach(([id, handler]) => {
    document.getElementById(id)?.addEventListener('click', handler);
  });
}

function _bindOutsideClickClose() {
  const handler = (e) => {
    if (!e.target.closest('.f-admin__users-row-menu-wrap')) {
      setRowMenuOpen(null);
      document.querySelectorAll('.f-admin__users-row-menu').forEach(m => m.remove());
      document.querySelectorAll('.f-admin__users-row-menu-btn').forEach(b =>
        b.classList.remove('is-active')
      );
      document.removeEventListener('click', handler);
    }
  };
  setTimeout(() => document.addEventListener('click', handler), 0);
}

//#endregion

//#region Private — Helpers

function _val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

//#endregion