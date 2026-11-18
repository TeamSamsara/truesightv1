/**
 * roles.js -> Shared system with permission.js, guard.js
 * @version 1.1.0
 *
 * User types and roles. 
 * 
 * Three distinct concern :
 * USER_TYPE: top-level portal discriminator (Admin/Staff/Players)
 * USER_ROLE: functional role within a USER_TYPE 
 * USER_PERMISSION: functional permission for a USER_ROLE -> lives inside permission.js
 * 
 * Static value only
 */

//#region User Types

/**
 * Top-level user category
 * Determines which portal a user accesses and their base permissions set.
 * 
 * ADMIN - Full platform access, all domains including admin
 * STAFF - Staff portal, role-based domains access within it
 * PLAYERS - Player portal only and its domains
 * DEV -> Developers 
 * 
 * ADMIN Can't see the player portal
 * Staff can't see the admin portal and player portal
 * PLayer can only see their portal 
 * Dev as special access to all portal -> really special exception
 */
export const USER_TYPE = {
  ADMIN: 'admin',
  STAFF: 'staff',
  PLAYER: 'player',
  DEV: 'dev',
};

/**
 * Display labels for user types
 */

export const USER_TYPE_LABEL = {
  [USER_TYPE.ADMIN]: 'Admin',
  [USER_TYPE.STAFF]: 'Staff',
  [USER_TYPE.PLAYER]: 'Player',
  [USER_TYPE.DEV]: 'Dev',
};
//#endregion

//#region User Roles

/**
 * Functional roles within each user type
 * 
 * Admin, Players, and Dev have no sub-roles - USER_TYPE alone determine their access.
 * Staff sub-role share a base set of permissions with role specific additions on top.
 * Role specific permission are defined in permissions.js
 */

export const USER_ROLE = {
  // Staff sub-roles only 
  HEAD_COACH: 'head_coach',
  COACH: 'coach',
  GENERAL_MANAGER: 'general_manager',
  MANAGER: 'manager',
  SCOUT: 'scout',
};

/**
 * Display labels for user roles
 */

export const USER_ROLE_LABEL = {
  [USER_ROLE.HEAD_COACH]: 'Head Coach',
  [USER_ROLE.COACH]: 'Coach',
  [USER_ROLE.GENERAL_MANAGER]: 'General Manager',
  [USER_ROLE.MANAGER]: 'Manager',
  [USER_ROLE.SCOUT]: 'Scout',
};

/**
 * Ordered list of staff roles for displays purposes
 */

export const USER_ROLE_ORDER = [
USER_ROLE.HEAD_COACH,
USER_ROLE.COACH,
USER_ROLE.GENERAL_MANAGER,
USER_ROLE.MANAGER,
USER_ROLE.SCOUT,
]
//#endregion

