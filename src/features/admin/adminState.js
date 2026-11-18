/**
 * adminState.js
 * @version 1.1.0
 *
 * Local state for the admin feature.
 * Tracks active sub-page, user list, approval queue,
 * stale profiles, and modal flow state.
 *
 * Migrated from staff-only to unified user management.
 *
 * Target path: src/features/admin/adminState.js
 */

//#region Constants

export const ADMIN_TABS = {
  OVERVIEW:  'overview',
  USERS:     'users',
  APPROVALS: 'approvals',
  STALE:     'stale',
  SYSTEM:    'system',
};

export const USER_MODAL_STEPS = {
  DETAILS:   1,
  DELIVERY:  2,
  CONFIRM:   3,
};

export const DELIVERY_METHOD = {
  COPY:   'copy',
  INVITE: 'invite',
};

//#endregion

//#region State

export const adminState = {

  /**
   * Currently active admin sub-page tab.
   * @type {string}
   */
  activeTab: ADMIN_TABS.OVERVIEW,

  /**
   * All platform users loaded from Firestore.
   * @type {object[]}
   */
  userList: [],

  /**
   * Filtered user list based on active filters.
   * @type {object[]}
   */
  filteredUsers: [],

  /**
   * Active type filter on the user list.
   * Null means show all types.
   * @type {string | null}
   */
  userTypeFilter: null,

  /**
   * Active role filter on the user list.
   * Null means show all roles.
   * @type {string | null}
   */
  userRoleFilter: null,

  /**
   * Active search query on the user list.
   * @type {string}
   */
  userSearchQuery: '',

  /**
   * Whether to show inactive users in the list.
   * @type {boolean}
   */
  showInactive: false,

  /**
   * All pending approvals loaded from Firestore.
   * @type {object[]}
   */
  approvalList: [],

  /**
   * All stale profiles loaded from Firestore.
   * @type {object[]}
   */
  staleList: [],

  /**
   * Filtered stale list based on active filters.
   * @type {object[]}
   */
  filteredStale: [],

  /**
   * Active role filter on the stale profiles list.
   * @type {string | null}
   */
  staleRoleFilter: null,

  /**
   * Active search query on the stale profiles list.
   * @type {string}
   */
  staleSearchQuery: '',

  /**
   * Recent audit trail entries for the activity feed.
   * @type {object[]}
   */
  recentActivity: [],

  /**
   * Overview widget counts.
   * @type {{ users: number, approvals: number, stale: number, invites: number }}
   */
  widgetCounts: {
    users:     0,
    approvals: 0,
    stale:     0,
    invites:   0,
  },

  /**
   * Whether any data is currently loading.
   * @type {boolean}
   */
  isLoading: false,

  /**
   * Current error message. Null if no error.
   * @type {string | null}
   */
  error: null,

  /**
   * System tab — cleanup state.
   */
  system: {
    cleanupCounts: { tokens: 0, sessions: 0 },
    cleanupMeta:   { lastRun: null, lastCounts: null },
    isRunning:     false,
    lastResult:    null,
  },

  /**
   * Create user modal state.
   */
  modal: {

    /**
     * Whether the create user modal is open.
     * @type {boolean}
     */
    isOpen: false,

    /**
     * Current step in the modal flow.
     * @type {number}  1 | 2 | 3
     */
    step: USER_MODAL_STEPS.DETAILS,

    /**
     * Form data for the user being created.
     */
    form: {
      name:  '',
      email: '',
      type:  '',
      role:  '',
    },

    /**
     * Selected delivery method.
     * @type {string}  'copy' | 'invite'
     */
    deliveryMethod: DELIVERY_METHOD.COPY,

    /**
     * Generated credentials shown in step 3.
     * Cleared when modal closes.
     */
    credentials: {
      tempId:       null,
      tempPassword: null,
      inviteLink:   null,
      email:        null,
    },

    /**
     * Error message inside the modal.
     * @type {string | null}
     */
    error: null,

    /**
     * Whether the modal is currently submitting.
     * @type {boolean}
     */
    isSubmitting: false,

  },

  /**
   * User action menu state.
   * Tracks which row menu is open.
   */
  rowMenu: {

    /**
     * The userId whose row menu is currently open.
     * Null if no menu is open.
     * @type {string | null}
     */
    openUserId: null,

  },

};

//#endregion

//#region State Helpers

/**
 * Sets the active admin tab.
 * @param {string} tab
 */
export function setAdminTab(tab) {
  adminState.activeTab = tab;
}

/**
 * Sets the admin loading state.
 * @param {boolean} value
 */
export function setAdminLoading(value) {
  adminState.isLoading = value;
}

/**
 * Sets the admin error message.
 * @param {string | null} message
 */
export function setAdminError(message) {
  adminState.error = message;
}

/**
 * Clears the admin error message.
 */
export function clearAdminError() {
  adminState.error = null;
}

/**
 * Sets the user list and resets filtered list.
 * @param {object[]} users
 */
export function setUserList(users) {
  adminState.userList     = users;
  adminState.filteredUsers = users;
}

/**
 * Sets the filtered user list.
 * @param {object[]} users
 */
export function setFilteredUsers(users) {
  adminState.filteredUsers = users;
}

/**
 * Sets the approval list.
 * @param {object[]} approvals
 */
export function setApprovalList(approvals) {
  adminState.approvalList = approvals;
}

/**
 * Sets the stale profiles list and resets filtered list.
 * @param {object[]} profiles
 */
export function setStaleList(profiles) {
  adminState.staleList     = profiles;
  adminState.filteredStale = profiles;
}

/**
 * Sets the filtered stale list.
 * @param {object[]} profiles
 */
export function setFilteredStale(profiles) {
  adminState.filteredStale = profiles;
}

/**
 * Sets the recent activity feed.
 * @param {object[]} activity
 */
export function setRecentActivity(activity) {
  adminState.recentActivity = activity;
}

/**
 * Updates the overview widget counts.
 * @param {object} counts
 */
export function setWidgetCounts(counts) {
  adminState.widgetCounts = { ...adminState.widgetCounts, ...counts };
}

/**
 * Opens the create user modal at step 1.
 */
export function openUserModal() {
  adminState.modal.isOpen         = true;
  adminState.modal.step           = USER_MODAL_STEPS.DETAILS;
  adminState.modal.error          = null;
  adminState.modal.isSubmitting   = false;
  adminState.modal.deliveryMethod = DELIVERY_METHOD.COPY;
  adminState.modal.form           = { name: '', email: '', type: '', role: '' };
  adminState.modal.credentials    = { tempId: null, tempPassword: null, inviteLink: null, email: null };
}

/**
 * Closes the create user modal and resets modal state.
 */
export function closeUserModal() {
  adminState.modal.isOpen         = false;
  adminState.modal.step           = USER_MODAL_STEPS.DETAILS;
  adminState.modal.error          = null;
  adminState.modal.isSubmitting   = false;
  adminState.modal.form           = { name: '', email: '', type: '', role: '' };
  adminState.modal.credentials    = { tempId: null, tempPassword: null, inviteLink: null, email: null };
}

/**
 * Advances the modal to the next step.
 */
export function advanceModalStep() {
  if (adminState.modal.step < USER_MODAL_STEPS.CONFIRM) {
    adminState.modal.step += 1;
  }
}

/**
 * Goes back one step in the modal.
 */
export function retreatModalStep() {
  if (adminState.modal.step > USER_MODAL_STEPS.DETAILS) {
    adminState.modal.step -= 1;
  }
}

/**
 * Sets the modal error message.
 * @param {string | null} message
 */
export function setModalError(message) {
  adminState.modal.error = message;
}

/**
 * Sets the modal submitting state.
 * @param {boolean} value
 */
export function setModalSubmitting(value) {
  adminState.modal.isSubmitting = value;
}

/**
 * Sets the generated credentials in the modal.
 * @param {object} credentials
 */
export function setModalCredentials(credentials) {
  adminState.modal.credentials = credentials;
}

/**
 * Sets the open row menu user ID.
 * @param {string | null} userId
 */
export function setRowMenuOpen(userId) {
  adminState.rowMenu.openUserId = userId;
}

/**
 * Sets the system cleanup counts.
 * @param {{ tokens: number, sessions: number }} counts
 */
export function setCleanupCounts(counts) {
  adminState.system.cleanupCounts = counts;
}

/**
 * Sets the system cleanup metadata.
 * @param {object} meta
 */
export function setCleanupMeta(meta) {
  adminState.system.cleanupMeta = meta;
}

/**
 * Sets the system cleanup running state.
 * @param {boolean} value
 */
export function setCleanupRunning(value) {
  adminState.system.isRunning = value;
}

/**
 * Sets the last cleanup result.
 * @param {object} result
 */
export function setCleanupResult(result) {
  adminState.system.lastResult = result;
}

//#endregion