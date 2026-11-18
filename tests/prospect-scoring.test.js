import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateProfileStats } from '../src/features/staff/scouting/models/scoring.js';

test('preserves ProspectSystem Bayesian scoring and verdict thresholds', () => {
  const profile = {
    combineLog: [
      { axis1: 3, axis2: 2.5 },
      { axis1: 3, axis2: 2.5 },
      { axis1: 3, axis2: 2.5 },
    ],
    champion: [],
    coachability: 3.5,
    communication: 3.5,
    attitude: 3.5,
    teamFit: 3.5,
    selfAwareness: 3.5,
  };

  calculateProfileStats(profile);

  assert.equal(profile.axis1Avg, '2.75');
  assert.equal(profile.axis2Avg, '2.50');
  assert.equal(profile.softSkillsAvg, '3.50');
  assert.equal(profile.rawScore, '3.00');
  assert.equal(profile.adjustedScore, '2.84');
  assert.equal(profile.letterGrade, 'B');
  assert.equal(profile.autoDecision, 'TRIAL');
});

test('rewards a prospect for performing against a sufficiently scored stronger opponent', () => {
  const opponent = {
    id: 'opponent-1',
    data: {
      rawScore: '4.00',
      combineLog: [{ axis1: 4 }, { axis1: 4 }, { axis1: 4 }],
    },
  };
  const profile = {
    combineLog: [{ axis1: 2.5, axis2: 0, opponentId: 'opponent-1' }],
    champion: [],
  };

  calculateProfileStats(profile, [opponent]);

  assert.equal(profile.axis1Final, 2.575);
  assert.equal(profile.axis1Confidence, 25);
});
