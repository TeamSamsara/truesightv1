import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEmptyProspect,
  normalizeProspect,
} from '../src/features/staff/scouting/models/prospectModel.js';

test('normalizes legacy champion and scouting report fields', () => {
  const prospect = normalizeProspect({
    champions: [{ champion: 'Ahri', games: 12, keyStat1: '3.2', keyStat2: '8.1' }],
    keyStrengths: 'Strong communication',
    areasOfConcern: 'Small champion pool',
    highlightMoments: 'Good teamfight',
    additionalNotes: 'Legacy note',
  });

  assert.equal(prospect.champion.length, 1);
  assert.equal(prospect.champion[0].kda, '3.2');
  assert.equal(prospect.champion[0].csPerMin, '8.1');
  assert.equal(prospect.scoutingReports.length, 1);
  assert.equal(prospect.scoutingReports[0].isLegacy, true);
  assert.equal(prospect.scoutingReports[0].strengths, 'Strong communication');
});

test('preserves combine opponent IDs and legacy opponent text', () => {
  const prospect = normalizeProspect({
    combineLog: [{ opponent: 'Legacy opponent', axis1: '2', axis2: '3' }],
  });

  assert.equal(prospect.combineLog[0].opponentId, '');
  assert.equal(prospect.combineLog[0].opponent, 'Legacy opponent');
});

test('creates independent empty prospect objects', () => {
  const first = createEmptyProspect();
  const second = createEmptyProspect();
  first.champion.push({ champion: 'Ahri' });

  assert.equal(second.champion.length, 0);
});
