/**
 * Interview domain model ported from ProspectSystem.
 * Existing interview documents are keyed by their prospect document ID.
 */

export const INTERVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  DONE: 'done',
  NO_SHOW: 'noshow',
});

const EMPTY_INTERVIEW = {
  availability: [],
  scheduledSlot: null,
  status: INTERVIEW_STATUS.PENDING,
};

export function createEmptyInterview() {
  return structuredClone(EMPTY_INTERVIEW);
}

export function normalizeInterview(raw) {
  if (!raw) return createEmptyInterview();

  return {
    ...createEmptyInterview(),
    ...raw,
    availability: Array.isArray(raw.availability) ? raw.availability : [],
    scheduledSlot: raw.scheduledSlot ?? null,
    status: raw.status ?? INTERVIEW_STATUS.PENDING,
  };
}

export function hasAvailability(interview) {
  return interview.availability.length > 0;
}

export function isTerminal(interview) {
  return interview.status === INTERVIEW_STATUS.DONE
    || interview.status === INTERVIEW_STATUS.NO_SHOW;
}
