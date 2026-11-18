/**
 * Prospect domain model ported from ProspectSystem.
 * Legacy field fallbacks are intentionally retained so existing records
 * normalize without requiring a database migration.
 */

const EMPTY_CHAMPION_INPUT = {
  champion: '', games: '', wins: '', losses: '', winRate: '',
  kda: '', csPerMin: '', gdAt15: '', lobby: '', opponent: '', notes: '',
};

const EMPTY_COMBINE_INPUT = {
  lobby: '', gameNum: '', championPlayed: '', axis1: '', axis2: '',
  opponentId: '', opponent: '', coach: '', coachNotes: '',
};

const EMPTY_SCOUTING_REPORT_INPUT = {
  id: '', coach: '', date: '', strengths: '', concerns: '', highlights: '', notes: '',
};

const EMPTY_PROSPECT_PROFILE = {
  candidateFullname: '',
  candidateUsername: '',
  role: '',
  region: '',
  discord: '',
  twitter: '',
  age: '',
  profileCreatedAt: '',
  lastCombineAt: '',
  lastScoutingReportAt: '',
  evaluatedLastBy: '',
  currentTeam: '',
  currentRank: '',
  peakRank: '',
  previousTeam: '',
  achievement: '',
  champion: [],
  combineLog: [],
  coachability: '',
  communication: '',
  attitude: '',
  teamFit: '',
  selfAwareness: '',
  coachNotes: '',
  coachabilityNote: '',
  communicationNote: '',
  attitudeNote: '',
  teamFitNote: '',
  selfAwarenessNote: '',
  strengths: '',
  concerns: '',
  highlights: '',
  scoutingReports: [],
  finalDecisions: '',
  ceilingAssessment: '',
  writtenRecommendation: '',
  followUpAction: '',
  followUpDate: '',
  rawScore: '0.00',
  adjustedScore: '0.00',
  overallScore: '0.00',
  axis1Avg: '0.00',
  axis2Avg: '0.00',
  softSkillsAvg: '0.00',
  letterGrade: '-',
  autoDecision: 'PENDING',
  axis1Raw: 0,
  axis1Bayes: 0,
  axis1PoolDepth: 0,
  axis1Final: 0,
  axis1Entries: 0,
  axis1Confidence: 0,
  axis2Raw: 0,
  axis2Bayes: 0,
  axis2Final: 0,
  axis2Entries: 0,
  axis2Confidence: 0,
  softSkillsCount: 0,
  createdAt: null,
};

export function createEmptyProspect() {
  return structuredClone(EMPTY_PROSPECT_PROFILE);
}

export function normalizeProspect(raw = {}) {
  const prospect = { ...createEmptyProspect(), ...raw };

  prospect.champion = Array.isArray(raw.champion)
    ? raw.champion.map(normalizeChampionInput)
    : Array.isArray(raw.champions)
      ? raw.champions.map(normalizeChampionInput)
      : [];

  prospect.combineLog = Array.isArray(raw.combineLog)
    ? raw.combineLog.map(normalizeCombineInput)
    : [];

  prospect.scoutingReports = resolveScoutingReports(raw);
  return prospect;
}

export function createEmptyChampionInput() {
  return { ...EMPTY_CHAMPION_INPUT };
}

export function createEmptyCombineInput() {
  return { ...EMPTY_COMBINE_INPUT };
}

export function createScoutingInput({ coach = '', date = '' } = {}) {
  return {
    ...EMPTY_SCOUTING_REPORT_INPUT,
    id: crypto.randomUUID(),
    coach,
    date,
  };
}

function normalizeChampionInput(raw = {}) {
  return {
    ...EMPTY_CHAMPION_INPUT,
    ...raw,
    kda: raw.kda || raw.keyStat1 || '',
    csPerMin: raw.csPerMin || raw.keyStat2 || '',
  };
}

function normalizeCombineInput(raw = {}) {
  return {
    ...EMPTY_COMBINE_INPUT,
    ...raw,
    opponentId: raw.opponentId || '',
    opponent: raw.opponent || '',
  };
}

function resolveScoutingReports(raw) {
  if (Array.isArray(raw.scoutingReports) && raw.scoutingReports.length > 0) {
    return raw.scoutingReports;
  }

  const strengths = raw.strengths || raw.keyStrengths || '';
  const concerns = raw.concerns || raw.areasOfConcern || '';
  const highlights = raw.highlights || raw.highlightMoments || '';
  const notes = raw.notes || raw.additionalNotes || '';

  if (!(strengths || concerns || highlights || notes)) return [];

  return [{
    ...EMPTY_SCOUTING_REPORT_INPUT,
    id: 'legacy',
    strengths,
    concerns,
    highlights,
    notes,
    isLegacy: true,
  }];
}
