/**
 * Prospect scoring engine ported from ProspectSystem formulas v2.1.0.
 *
 * Keep this calculation behavior stable during migration. Any scoring changes
 * should be reviewed as product changes, not bundled into the application merge.
 */

const NEUTRAL = 2.5;
const BAYES_K = 3;
const SOS_WEIGHT_UP = 0.20;
const SOS_WEIGHT_DOWN = 0.07;
const SOS_CAP = 0.30;
const DEPTH_SCALE = 0.10;
const DEPTH_CAP = 0.10;
const SOS_MIN_ENTRIES = 3;
const SOFT_WEIGHT = 0.25;
const AXES_WEIGHT = 0.75;

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bayesian(rawAverage, count) {
  const confidence = count / (count + BAYES_K);
  return confidence * rawAverage + (1 - confidence) * NEUTRAL;
}

function sosModifier(opponentId, prospects) {
  if (!opponentId || !prospects?.length) return 0;
  const opponent = prospects.find(prospect => prospect.id === opponentId);
  if (!opponent) return 0;

  const score = Number(opponent.data?.rawScore || opponent.data?.overallScore);
  if (!score || score <= 0) return 0;

  const entries = (opponent.data?.combineLog || [])
    .filter(row => Number(row.axis1) > 0).length;
  if (entries < SOS_MIN_ENTRIES) return 0;

  const gap = score - NEUTRAL;
  const weight = gap > 0 ? SOS_WEIGHT_UP : SOS_WEIGHT_DOWN;
  return clamp(gap * weight, -SOS_CAP, SOS_CAP);
}

function poolDepthModifier(championLog) {
  if (!championLog?.length) return 0;
  const totalGames = championLog.reduce((sum, champion) => sum + (Number(champion.games) || 0), 0);
  if (!totalGames) return 0;

  const uniqueChampions = new Set(
    championLog.map(champion => (champion.champion || '').toLowerCase().trim()).filter(Boolean)
  ).size;

  return clamp(((uniqueChampions / totalGames) - 0.5) * DEPTH_SCALE, -DEPTH_CAP, DEPTH_CAP);
}

function letterGrade(score) {
  const value = Number(score);
  if (value >= 3.75) return 'A+';
  if (value >= 3.5) return 'A';
  if (value >= 3.25) return 'A-';
  if (value >= 3.0) return 'B+';
  if (value >= 2.75) return 'B';
  if (value >= 2.5) return 'B-';
  if (value >= 2.25) return 'C+';
  if (value >= 2.0) return 'C';
  if (value >= 1.5) return 'D';
  return 'F';
}

function autoDecision(score) {
  const value = Number(score);
  if (value >= 3.0) return 'SIGN';
  if (value >= 2.0) return 'TRIAL';
  if (value >= 1.5) return 'FLAG';
  return 'NO';
}

function winRate(wins, losses) {
  const won = Number(wins) || 0;
  const lost = Number(losses) || 0;
  return won + lost ? `${Math.round((won / (won + lost)) * 100)}%` : '-';
}

/**
 * Calculate all scoring fields in-place, preserving ProspectSystem v2.1.0
 * semantics, including asymmetric strength-of-schedule adjustments.
 */
export function calculateProfileStats(profile, allProspects = []) {
  const log = profile.combineLog || [];
  const axis1Entries = log.filter(row => Number(row.axis1) > 0);
  const axis1Count = axis1Entries.length;
  const adjustedAxis1 = axis1Entries.map(row =>
    clamp(Number(row.axis1) + sosModifier(row.opponentId || null, allProspects), 1, 4)
  );

  const axis1Raw = axis1Count ? average(adjustedAxis1) : 0;
  const axis1Confidence = axis1Count ? axis1Count / (axis1Count + BAYES_K) : 0;
  const axis1Bayes = axis1Count ? bayesian(axis1Raw, axis1Count) : 0;

  const championLog = profile.champion || profile.champions || [];
  const depthModifier = poolDepthModifier(championLog);
  const axis1Final = axis1Count ? clamp(axis1Bayes + depthModifier, 1, 4) : 0;

  const axis2Entries = log.filter(row => Number(row.axis2) > 0);
  const axis2Count = axis2Entries.length;
  const axis2Raw = axis2Count ? average(axis2Entries.map(row => Number(row.axis2))) : 0;
  const axis2Confidence = axis2Count ? axis2Count / (axis2Count + BAYES_K) : 0;
  const axis2Final = axis2Count ? bayesian(axis2Raw, axis2Count) : 0;

  const softFields = ['coachability', 'communication', 'attitude', 'teamFit', 'selfAwareness'];
  const softValues = softFields.map(field => Number(profile[field]) || 0).filter(value => value > 0);
  const softAverage = softValues.length ? average(softValues) : 0;

  const hasAxes = axis1Final > 0 || axis2Final > 0;
  const hasSoft = softAverage > 0;
  const rawAxis1 = axis1Count ? average(axis1Entries.map(row => Number(row.axis1))) : null;
  const rawAxis2 = axis2Count ? average(axis2Entries.map(row => Number(row.axis2))) : null;
  const rawParts = [rawAxis1, rawAxis2, hasSoft ? softAverage : null]
    .filter(value => value !== null && value > 0);
  const rawScore = rawParts.length ? average(rawParts) : 0;

  let adjustedScore = 0;
  if (hasAxes && hasSoft) {
    adjustedScore = average([axis1Final, axis2Final].filter(value => value > 0)) * AXES_WEIGHT
      + softAverage * SOFT_WEIGHT;
  } else if (hasAxes) {
    adjustedScore = average([axis1Final, axis2Final].filter(value => value > 0));
  } else if (hasSoft) {
    adjustedScore = softAverage;
  }

  profile.axis1Raw = axis1Raw;
  profile.axis1Bayes = axis1Bayes;
  profile.axis1PoolDepth = depthModifier;
  profile.axis1Final = axis1Final;
  profile.axis1Entries = axis1Count;
  profile.axis1Confidence = Math.round(axis1Confidence * 100);

  profile.axis2Raw = axis2Raw;
  profile.axis2Bayes = axis2Final;
  profile.axis2Final = axis2Final;
  profile.axis2Entries = axis2Count;
  profile.axis2Confidence = Math.round(axis2Confidence * 100);
  profile.softSkillsCount = softValues.length;

  profile.axis1Avg = axis1Final > 0 ? axis1Final.toFixed(2) : '0.00';
  profile.axis2Avg = axis2Final > 0 ? axis2Final.toFixed(2) : '0.00';
  profile.softSkillsAvg = softAverage > 0 ? softAverage.toFixed(2) : '0.00';
  profile.rawScore = rawScore > 0 ? rawScore.toFixed(2) : '0.00';
  profile.adjustedScore = adjustedScore > 0 ? adjustedScore.toFixed(2) : '0.00';
  profile.overallScore = profile.adjustedScore;
  profile.letterGrade = letterGrade(adjustedScore);
  profile.autoDecision = profile.finalDecisions || autoDecision(adjustedScore);

  championLog.forEach(champion => {
    champion.winRate = winRate(champion.wins, champion.losses);
  });

  return profile;
}

export function calculateProfileStatsRaw(profile) {
  return calculateProfileStats(profile, []);
}

export const SCORING = Object.freeze({
  NEUTRAL,
  BAYES_K,
  SOS_WEIGHT_UP,
  SOS_WEIGHT_DOWN,
  SOS_MIN_ENTRIES,
  SOFT_WEIGHT,
  AXES_WEIGHT,
  DEPTH_CAP,
  SOS_CAP,
});
