/**
 * permissions.js -> Shared system with roles.js, guards.js
 * @version 1.0.1
 *
 * Defines every platform permission as composable, validated groups.
 * Roles declare capabilities — they never list permissions directly.
 *
 * Three-layer architecture:
 *   ACTIONS + DOMAINS  → structured PERMISSION constants (action:domain)
 *   PERMISSION         → grouped into ACCESS_CAPABILITY and ACTION_CAPABILITY
 *   CAPABILITY_KEY     → typed keys used in role declarations (no raw strings)
 *   ROLE_CAPABILITIES  → roles composed from capability keys
 *
 * Action semantics — defined once, enforced everywhere:
 *   NAVIGATE  — routing and nav visibility
 *   VIEW      — content visibility within a domain
 *   CREATE    — instantiate a new entity from scratch
 *   ADD       — attach an existing entity to something
 *   EDIT      — user-initiated modification
 *   UPDATE    — system or automated modification
 *   DELETE    — permanent removal
 *   REMOVE    — detach or unlink without destroying
 *   APPROVE   — authorize a pending action
 *   ASSIGN    — set a role or ownership on an entity
 *
 * Usage:
 *   hasPermission(user, PERMISSION.CREATE_EVENT)
 *   getPermissions(user) -> Set<string>
 */

//#region Imports

import { USER_ROLE, USER_TYPE } from '../constants/roles.js';

//#endregion

//#region Action Constants

/**
 * Atomic action verbs.
 * Every permission is built from one of these + a domain.
 * See file header for semantic rules — each action has exactly one meaning.
 */
export const ACTIONS = {
  NAVIGATE: 'navigate',
  VIEW:     'view',
  CREATE:   'create',
  ADD:      'add',
  EDIT:     'edit',
  UPDATE:   'update',
  DELETE:   'delete',
  REMOVE:   'remove',
  APPROVE:  'approve',
  ASSIGN:   'assign',
};

//#endregion

//#region Domain Constants

/**
 * Platform resource domains.
 * Combined with an ACTIONS verb to form a structured permission string.
 */
export const DOMAINS = {
  // ── Navigation domains ────────────────────────────────────
  DASHBOARD:  'dashboard',
  SCOUTING:   'scouting',
  TRACKER:    'tracker',
  ANALYSIS:   'analysis',
  COACHING:   'coaching',
  OPERATIONS: 'operations',
  ADMIN:      'admin',
  AUTH:       'auth',
  DEV:        'dev',

  // ── Session ───────────────────────────────────────────────
  EVENT: 'event',
  AVAILABILITY_REQUEST: 'availability_request',

  // ── Roster ────────────────────────────────────────────────
  ROSTER:        'roster',
  ROSTER_STAFF:  'roster_staff',
  ROSTER_PLAYER: 'roster_player',

  // ── Accounts ──────────────────────────────────────────────
  USER_ACCOUNT:   'user_account',
  USER_AUDIT:     'user_audit',
  ADMIN_ACCOUNT:  'admin_account',
  ADMIN_AUDIT:    'admin_audit',
  PLAYER_ACCOUNT: 'player_account',
  PLAYER_AUDIT:   'player_audit',

  // ── Role management ───────────────────────────────────────
  USER_ROLE: 'user_role',
};

//#endregion

//#region Permission Factory

/**
 * Generates NAVIGATE + VIEW permission pairs for a nav domain.
 * Avoids manual duplication across every navigable domain.
 *
 * @param {string} domain - value from DOMAINS
 * @returns {{ navigate: string, view: string }}
 */
function _createDomainPermissions(domain) {
  return {
    navigate: `${ACTIONS.NAVIGATE}:${domain}`,
    view:     `${ACTIONS.VIEW}:${domain}`,
  };
}

/**
 * Generates a standard CRUD permission set for a resource domain.
 * Use for domains that support full lifecycle operations.
 *
 * @param {string} domain - value from DOMAINS
 * @returns {{ create: string, edit: string, delete: string, view: string }}
 */
function _createResourcePermissions(domain) {
  return {
    create: `${ACTIONS.CREATE}:${domain}`,
    edit:   `${ACTIONS.EDIT}:${domain}`,
    delete: `${ACTIONS.DELETE}:${domain}`,
    view:   `${ACTIONS.VIEW}:${domain}`,
  };
}

//#endregion

//#region Permission Constants

/**
 * Every platform permission — structured as action:domain.
 * Generated via factory functions where patterns apply.
 * Features check against these — never against raw role or type strings.
 */

const _dashboard  = _createDomainPermissions(DOMAINS.DASHBOARD);
const _scouting   = _createDomainPermissions(DOMAINS.SCOUTING);
const _tracker    = _createDomainPermissions(DOMAINS.TRACKER);
const _analysis   = _createDomainPermissions(DOMAINS.ANALYSIS);
const _coaching   = _createDomainPermissions(DOMAINS.COACHING);
const _operations = _createDomainPermissions(DOMAINS.OPERATIONS);
const _admin      = _createDomainPermissions(DOMAINS.ADMIN);
const _dev        = _createDomainPermissions(DOMAINS.DEV);

const _event = _createResourcePermissions(DOMAINS.EVENT);
const _roster       = _createResourcePermissions(DOMAINS.ROSTER);
const _userAccount = _createResourcePermissions(DOMAINS.USER_ACCOUNT);
const _adminAccount = _createResourcePermissions(DOMAINS.ADMIN_ACCOUNT);
const _playerAccount = _createResourcePermissions(DOMAINS.PLAYER_ACCOUNT);

export const PERMISSION = {

  // ── Domain navigation ─────────────────────────────────────
  NAVIGATE_DASHBOARD:  _dashboard.navigate,
  NAVIGATE_SCOUTING:   _scouting.navigate,
  NAVIGATE_TRACKER:    _tracker.navigate,
  NAVIGATE_ANALYSIS:   _analysis.navigate,
  NAVIGATE_COACHING:   _coaching.navigate,
  NAVIGATE_OPERATIONS: _operations.navigate,
  NAVIGATE_ADMIN:      _admin.navigate,
  NAVIGATE_DEV:        _dev.navigate,

  // ── Domain content visibility ─────────────────────────────
  VIEW_DASHBOARD:  _dashboard.view,
  VIEW_SCOUTING:   _scouting.view,
  VIEW_TRACKER:    _tracker.view,
  VIEW_ANALYSIS:   _analysis.view,
  VIEW_COACHING:   _coaching.view,
  VIEW_OPERATIONS: _operations.view,
  VIEW_ADMIN:      _admin.view,
  VIEW_DEV:        _dev.view,

  // ── Session ───────────────────────────────────────────────
  CREATE_EVENT:            _event.create,
  EDIT_EVENT:              _event.edit,
  DELETE_EVENT:            _event.delete,
  SEND_AVAILABILITY_REQUEST: `${ACTIONS.CREATE}:${DOMAINS.AVAILABILITY_REQUEST}`,

  // ── Roster ────────────────────────────────────────────────
  CREATE_ROSTER:             _roster.create,
  EDIT_ROSTER:               _roster.edit,
  DELETE_ROSTER:             _roster.delete,
  ADD_STAFF_TO_ROSTER:       `${ACTIONS.ADD}:${DOMAINS.ROSTER_STAFF}`,
  REMOVE_STAFF_FROM_ROSTER:  `${ACTIONS.REMOVE}:${DOMAINS.ROSTER_STAFF}`,
  ADD_PLAYER_TO_ROSTER:      `${ACTIONS.ADD}:${DOMAINS.ROSTER_PLAYER}`,
  REMOVE_PLAYER_FROM_ROSTER: `${ACTIONS.REMOVE}:${DOMAINS.ROSTER_PLAYER}`,

  // ── Staff account management ──────────────────────────────
  CREATE_USER_ACCOUNT: _userAccount.create,
  EDIT_USER_ACCOUNT:   _userAccount.edit,
  DELETE_USER_ACCOUNT: _userAccount.delete,
  VIEW_USER_AUDIT:     `${ACTIONS.VIEW}:${DOMAINS.USER_AUDIT}`,

  // ── Admin account management ──────────────────────────────
  CREATE_ADMIN_ACCOUNT: _adminAccount.create,
  EDIT_ADMIN_ACCOUNT:   _adminAccount.edit,
  DELETE_ADMIN_ACCOUNT: _adminAccount.delete,
  VIEW_ADMIN_AUDIT:     `${ACTIONS.VIEW}:${DOMAINS.ADMIN_AUDIT}`,

  // ── Player account management ─────────────────────────────
  CREATE_PLAYER_ACCOUNT: _playerAccount.create,
  EDIT_PLAYER_ACCOUNT:   _playerAccount.edit,
  DELETE_PLAYER_ACCOUNT: _playerAccount.delete,
  VIEW_PLAYER_AUDIT:     `${ACTIONS.VIEW}:${DOMAINS.PLAYER_AUDIT}`,

  // ── Role management ───────────────────────────────────────
  ASSIGN_USER_ROLE: `${ACTIONS.ASSIGN}:${DOMAINS.USER_ROLE}`,

  // ── Platform approvals ────────────────────────────────────
  APPROVE_ACTIONS: `${ACTIONS.APPROVE}:${DOMAINS.ADMIN}`,

  // ── Scouting pipeline (deferred — not yet implemented) ────
  // EVALUATE_PLAYER: `${ACTIONS.CREATE}:evaluation`,
  // PROMOTE_PLAYER:  `${ACTIONS.UPDATE}:player_status`,

};

//#endregion

//#region Capability Keys

/**
 * Typed capability keys.
 * Used in ROLE_CAPABILITIES declarations — no raw strings ever.
 * Validation at build time catches any undefined key reference.
 */
export const CAPABILITY_KEY = {

  // ── Access capabilities (navigation + UI visibility) ──────
  ACCESS_DASHBOARD:      'ACCESS_DASHBOARD',
  ACCESS_OPERATIONS:     'ACCESS_OPERATIONS',
  ACCESS_SCOUTING_SUITE: 'ACCESS_SCOUTING_SUITE',
  ACCESS_COACHING_SUITE: 'ACCESS_COACHING_SUITE',
  ACCESS_ADMIN:          'ACCESS_ADMIN',
  ACCESS_DEV:            'ACCESS_DEV',

  // ── Action capabilities (business operations) ─────────────
  MANAGE_USER_ACCOUNTS:   'MANAGE_USER_ACCOUNTS',
  MANAGE_ADMIN_ACCOUNTS:  'MANAGE_ADMIN_ACCOUNTS',
  MANAGE_PLAYER_ACCOUNTS: 'MANAGE_PLAYER_ACCOUNTS',
  MANAGE_ROLES:           'MANAGE_ROLES',
  APPROVE_ACTIONS:        'APPROVE_ACTIONS',
  MANAGE_ROSTERS:         'MANAGE_ROSTERS',
  MANAGE_ROSTER_STAFF:    'MANAGE_ROSTER_STAFF',
  MANAGE_ROSTER_PLAYERS:  'MANAGE_ROSTER_PLAYERS',
  MANAGE_EVENTS:        'MANAGE_EVENTS',

  // ── Scouting pipeline (deferred — not yet implemented) ────
  // EVALUATE:              'EVALUATE',
  // PROMOTE:               'PROMOTE',

};

//#endregion

//#region Capability Groups

/**
 * Capability groups split by concern.
 *
 * ACCESS_CAPABILITY — navigation and UI visibility only.
 *                     Controls what appears in the nav and what routes are accessible.
 *
 * ACTION_CAPABILITY — business operations only.
 *                     Controls what a user can do once inside a domain.
 */

const ACCESS_CAPABILITY = {

  [CAPABILITY_KEY.ACCESS_DASHBOARD]: [
    PERMISSION.NAVIGATE_DASHBOARD,
    PERMISSION.VIEW_DASHBOARD,
  ],

  [CAPABILITY_KEY.ACCESS_OPERATIONS]: [
    PERMISSION.NAVIGATE_OPERATIONS,
    PERMISSION.VIEW_OPERATIONS,
  ],

  [CAPABILITY_KEY.ACCESS_SCOUTING_SUITE]: [
    PERMISSION.NAVIGATE_SCOUTING,
    PERMISSION.VIEW_SCOUTING,
    PERMISSION.NAVIGATE_TRACKER,
    PERMISSION.VIEW_TRACKER,
  ],

  [CAPABILITY_KEY.ACCESS_COACHING_SUITE]: [
    PERMISSION.NAVIGATE_COACHING,
    PERMISSION.VIEW_COACHING,
    PERMISSION.NAVIGATE_ANALYSIS,
    PERMISSION.VIEW_ANALYSIS,
  ],

  [CAPABILITY_KEY.ACCESS_ADMIN]: [
    PERMISSION.NAVIGATE_ADMIN,
    PERMISSION.VIEW_ADMIN,
  ],

  [CAPABILITY_KEY.ACCESS_DEV]: [
    PERMISSION.NAVIGATE_DEV,
    PERMISSION.VIEW_DEV,
  ],

};

const ACTION_CAPABILITY = {

  [CAPABILITY_KEY.MANAGE_USER_ACCOUNTS]: [
    PERMISSION.CREATE_USER_ACCOUNT,
    PERMISSION.EDIT_USER_ACCOUNT,
    PERMISSION.DELETE_USER_ACCOUNT,
    PERMISSION.VIEW_USER_AUDIT,
  ],

  [CAPABILITY_KEY.MANAGE_ADMIN_ACCOUNTS]: [
    PERMISSION.CREATE_ADMIN_ACCOUNT,
    PERMISSION.EDIT_ADMIN_ACCOUNT,
    PERMISSION.DELETE_ADMIN_ACCOUNT,
    PERMISSION.VIEW_ADMIN_AUDIT,
  ],

  [CAPABILITY_KEY.MANAGE_PLAYER_ACCOUNTS]: [
    PERMISSION.CREATE_PLAYER_ACCOUNT,
    PERMISSION.EDIT_PLAYER_ACCOUNT,
    PERMISSION.DELETE_PLAYER_ACCOUNT,
    PERMISSION.VIEW_PLAYER_AUDIT,
  ],

  [CAPABILITY_KEY.MANAGE_ROLES]: [
    PERMISSION.ASSIGN_USER_ROLE,
  ],

  [CAPABILITY_KEY.APPROVE_ACTIONS]: [
    PERMISSION.APPROVE_ACTIONS,
  ],

  [CAPABILITY_KEY.MANAGE_ROSTERS]: [
    PERMISSION.CREATE_ROSTER,
    PERMISSION.EDIT_ROSTER,
    PERMISSION.DELETE_ROSTER,
  ],

  [CAPABILITY_KEY.MANAGE_ROSTER_STAFF]: [
    PERMISSION.ADD_STAFF_TO_ROSTER,
    PERMISSION.REMOVE_STAFF_FROM_ROSTER,
  ],

  [CAPABILITY_KEY.MANAGE_ROSTER_PLAYERS]: [
    PERMISSION.ADD_PLAYER_TO_ROSTER,
    PERMISSION.REMOVE_PLAYER_FROM_ROSTER,
  ],

  [CAPABILITY_KEY.MANAGE_EVENTS]: [
    PERMISSION.CREATE_EVENT,
    PERMISSION.EDIT_EVENT,
    PERMISSION.DELETE_EVENT,
    PERMISSION.SEND_AVAILABILITY_REQUEST,
  ],

  // ── Scouting pipeline (deferred — not yet implemented) ────
  // [CAPABILITY_KEY.EVALUATE]: [
  //   PERMISSION.EVALUATE_PLAYER,
  // ],
  // [CAPABILITY_KEY.PROMOTE]: [
  //   PERMISSION.PROMOTE_PLAYER,
  // ],

};

/**
 * Merged capability registry — single lookup used by _buildPermissionMap.
 */
const CAPABILITY = { ...ACCESS_CAPABILITY, ...ACTION_CAPABILITY };

//#endregion

//#region Role Capability Declarations

/**
 * Base capabilities shared by every STAFF sub-role.
 * Explicitly defined — inheritance is never implicit.
 */
const STAFF_BASE = [
  CAPABILITY_KEY.ACCESS_DASHBOARD,
  CAPABILITY_KEY.ACCESS_OPERATIONS,
];

/**
 * Each role declares which capabilities it holds using CAPABILITY_KEY constants.
 * No raw strings — any undefined key is caught by validation at module load.
 *
 * ADMIN, PLAYER, and DEV are resolved by USER_TYPE — no entry needed here.
 */
const ROLE_CAPABILITIES = {

  [USER_ROLE.HEAD_COACH]: [
    ...STAFF_BASE,
    CAPABILITY_KEY.ACCESS_SCOUTING_SUITE,
    CAPABILITY_KEY.ACCESS_COACHING_SUITE,
  ],

  [USER_ROLE.COACH]: [
    ...STAFF_BASE,
    CAPABILITY_KEY.ACCESS_SCOUTING_SUITE,
    CAPABILITY_KEY.ACCESS_COACHING_SUITE,
  ],

  [USER_ROLE.SCOUT]: [
    ...STAFF_BASE,
    CAPABILITY_KEY.ACCESS_SCOUTING_SUITE,
  ],

  [USER_ROLE.MANAGER]: [
    ...STAFF_BASE,
    CAPABILITY_KEY.MANAGE_EVENTS,
    CAPABILITY_KEY.MANAGE_ROSTER_PLAYERS,
  ],

  // Superset of MANAGER — additional GM-specific capabilities added as features are built
  [USER_ROLE.GENERAL_MANAGER]: [
    ...STAFF_BASE,
    CAPABILITY_KEY.MANAGE_EVENTS,
    CAPABILITY_KEY.MANAGE_ROSTER_PLAYERS,
    CAPABILITY_KEY.MANAGE_ROSTER_STAFF,
    CAPABILITY_KEY.MANAGE_ROSTERS,
  ],

};

//#endregion

//#region Validation

/**
 * Validates every capability key declared in ROLE_CAPABILITIES exists in CAPABILITY.
 * Throws at module load — misconfiguration is caught immediately, never silently.
 */
function _validateCapabilityDeclarations() {
  for (const [role, keys] of Object.entries(ROLE_CAPABILITIES)) {
    for (const key of keys) {
      if (!CAPABILITY[key]) {
        throw new Error(
          `permissions.js — invalid capability key "${key}" declared for role "${role}". ` +
          `Check CAPABILITY_KEY and ensure a matching entry exists in ACCESS_CAPABILITY or ACTION_CAPABILITY.`
        );
      }
    }
  }
}

_validateCapabilityDeclarations();

//#endregion

//#region Permission Map

/**
 * Derives the permission Set for each role from its capability declarations.
 * Runs once at module load after validation — no runtime cost per permission check.
 * @returns {Object<string, Set<string>>}
 */
function _buildPermissionMap() {
  const map = {};

  for (const [role, keys] of Object.entries(ROLE_CAPABILITIES)) {
    const permissions = keys.flatMap(key => CAPABILITY[key] ?? []);
    map[role] = new Set(permissions);
  }

  return map;
}

const PERMISSION_MAP = _buildPermissionMap();

//#endregion

//#region Public API

/**
 * Returns true if the given user holds the specified permission.
 *
 * Resolution order:
 *   1. DEV   — always true, bypasses all checks
 *   2. ADMIN — always true, full access
 *   3. STAFF — resolved via USER_ROLE against PERMISSION_MAP
 *   4. PLAYER — always false for staff/admin permissions
 *
 * @param {{ type: string, role?: string }} user
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user)                         return false;
  if (user.type === USER_TYPE.DEV)   return true;
  if (user.type === USER_TYPE.ADMIN) return true;
  if (user.type !== USER_TYPE.STAFF) return false;

  const set = PERMISSION_MAP[user.role];
  if (!set) return false;

  return set.has(permission);
}

/**
 * Returns the full permission Set for a given user.
 * Useful for bulk checks such as rendering nav domains.
 *
 * @param {{ type: string, role?: string }} user
 * @returns {Set<string>}
 */
export function getPermissions(user) {
  if (!user)                         return new Set();
  if (user.type === USER_TYPE.DEV)   return new Set(Object.values(PERMISSION));
  if (user.type === USER_TYPE.ADMIN) return new Set(Object.values(PERMISSION));
  if (user.type !== USER_TYPE.STAFF) return new Set();

  return PERMISSION_MAP[user.role] ?? new Set();
}

//#endregion