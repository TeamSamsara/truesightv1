import test from 'node:test';
import assert from 'node:assert/strict';

import { USER_ROLE, USER_TYPE } from '../src/constants/roles.js';
import { hasPermission, PERMISSION } from '../src/constants/permissions.js';

test('owner has full scouting access', () => {
  const owner = { type: USER_TYPE.ADMIN };

  assert.equal(hasPermission(owner, PERMISSION.NAVIGATE_SCOUTING), true);
  assert.equal(hasPermission(owner, PERMISSION.VIEW_SCOUTING), true);
});

test('all staff roles receive the same scouting suite access', () => {
  const staffRoles = Object.values(USER_ROLE);

  for (const role of staffRoles) {
    const staff = { type: USER_TYPE.STAFF, role };
    assert.equal(
      hasPermission(staff, PERMISSION.NAVIGATE_SCOUTING),
      true,
      `${role} should be able to navigate to Scouting`
    );
    assert.equal(
      hasPermission(staff, PERMISSION.VIEW_SCOUTING),
      true,
      `${role} should be able to view Scouting`
    );
    assert.equal(
      hasPermission(staff, PERMISSION.NAVIGATE_TRACKER),
      true,
      `${role} should receive the shared Scouting Suite capability`
    );
  }
});

test('players do not receive internal scouting access', () => {
  const player = { type: USER_TYPE.PLAYER };

  assert.equal(hasPermission(player, PERMISSION.NAVIGATE_SCOUTING), false);
  assert.equal(hasPermission(player, PERMISSION.VIEW_SCOUTING), false);
});
