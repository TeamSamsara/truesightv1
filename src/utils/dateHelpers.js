/**
 * dateHelpers.js — platform-wide date utility functions
 * @version 1.0.0
 *
 * Pure functions for date computation and formatting.
 * No state, no side effects, no Firestore dependency.
 *
 * Used by: calendar component, timesheet, availability model,
 * event display, and any feature that needs date math.
 *
 * All functions treat weeks as Monday–Sunday.
 * Times are handled in the user's local timezone unless
 * an explicit IANA timezone string is passed.
 *
 * Target path: src/utils/dateHelpers.js
 */

//#region Week Utilities

/**
 * Returns the Monday of the week containing the given date.
 * @param {Date} date
 * @returns {Date}
 */
export function getStartOfWeek(date) {
  const d   = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const diff = (day === 0) ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the Sunday of the week containing the given date.
 * @param {Date} date
 * @returns {Date}
 */
export function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  return addDays(start, 6);
}

/**
 * Returns an array of 7 Date objects (Mon–Sun) for the week
 * containing the given date.
 * @param {Date} date
 * @returns {Date[]}
 */
export function getWeekDays(date) {
  const start = getStartOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

//#endregion

//#region Month Utilities

/**
 * Returns the first day of the month containing the given date.
 * @param {Date} date
 * @returns {Date}
 */
export function getStartOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the last day of the month containing the given date.
 * @param {Date} date
 * @returns {Date}
 */
export function getEndOfMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns all days in a month grid including leading/trailing days
 * from adjacent months to fill complete Mon–Sun rows.
 * Useful for rendering a full month calendar grid.
 * @param {Date} date
 * @returns {Date[]}
 */
export function getMonthGridDays(date) {
  const start     = getStartOfMonth(date);
  const end       = getEndOfMonth(date);
  const gridStart = getStartOfWeek(start);
  const gridEnd   = getEndOfWeek(end);
  const days      = [];
  let   current   = new Date(gridStart);

  while (current <= gridEnd) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }

  return days;
}

//#endregion

//#region Day Utilities

/**
 * Adds n days to a date and returns a new Date.
 * Negative n moves backwards.
 * @param {Date}   date
 * @param {number} n
 * @returns {Date}
 */
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Adds n months to a date and returns a new Date.
 * @param {Date}   date
 * @param {number} n
 * @returns {Date}
 */
export function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/**
 * Returns true if two dates represent the same calendar day.
 * Ignores time.
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/**
 * Returns true if the given date is today.
 * @param {Date} date
 * @returns {boolean}
 */
export function isToday(date) {
  return isSameDay(date, new Date());
}

/**
 * Returns true if the given date is in the current week (Mon–Sun).
 * @param {Date} date
 * @returns {boolean}
 */
export function isThisWeek(date) {
  const start = getStartOfWeek(new Date());
  const end   = getEndOfWeek(new Date());
  return date >= start && date <= end;
}

/**
 * Returns true if date A is before date B (ignoring time).
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isBefore(a, b) {
  return startOfDay(a) < startOfDay(b);
}

/**
 * Returns true if date A is after date B (ignoring time).
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isAfter(a, b) {
  return startOfDay(a) > startOfDay(b);
}

/**
 * Returns a new Date set to midnight of the given date.
 * @param {Date} date
 * @returns {Date}
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a new Date set to 23:59:59 of the given date.
 * @param {Date} date
 * @returns {Date}
 */
export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

//#endregion

//#region Firestore Timestamp Utilities

/**
 * Converts a Firestore timestamp or JS Date to a JS Date.
 * Safe to call on either — returns null if value is null/undefined.
 * @param {object | Date | null} value
 * @returns {Date | null}
 */
export function toDate(value) {
  if (!value)                return null;
  if (value instanceof Date) return value;
  if (value?.toDate)         return value.toDate();
  return new Date(value);
}

/**
 * Returns a JS Date from a Firestore timestamp or ISO string,
 * or null if the value is falsy.
 * Alias for toDate — use wherever the intent is event time resolution.
 * @param {object | string | null} value
 * @returns {Date | null}
 */
export function resolveTimestamp(value) {
  return toDate(value);
}

//#endregion

//#region ISO String Utilities

/**
 * Returns an ISO date string 'YYYY-MM-DD' for a given Date.
 * Used as keys in availability days maps.
 * @param {Date} date
 * @returns {string}
 */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses an ISO date string 'YYYY-MM-DD' to a Date at local midnight.
 * @param {string} isoDate
 * @returns {Date}
 */
export function fromISODate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Returns all ISO date strings in a range (inclusive).
 * @param {string} fromISO - 'YYYY-MM-DD'
 * @param {string} toISO   - 'YYYY-MM-DD'
 * @returns {string[]}
 */
export function getISODatesInRange(fromISO, toISO) {
  const dates   = [];
  let   current = fromISODate(fromISO);
  const end     = fromISODate(toISO);

  while (current <= end) {
    dates.push(toISODate(current));
    current = addDays(current, 1);
  }

  return dates;
}

//#endregion

//#region Formatting

/**
 * Formats a week label for the calendar toolbar.
 * e.g. "Mar 24 – Mar 30, 2026"
 * If the week spans two months: "Mar 28 – Apr 3, 2026"
 * @param {Date} weekStart - Monday
 * @param {Date} weekEnd   - Sunday
 * @returns {string}
 */
export function formatWeekLabel(weekStart, weekEnd) {
  const opts  = { month: 'short', day: 'numeric' };
  const start = weekStart.toLocaleDateString('en-US', opts);
  const end   = weekEnd.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${start} – ${end}`;
}

/**
 * Formats a month label for the calendar toolbar.
 * e.g. "March 2026"
 * @param {Date} date
 * @returns {string}
 */
export function formatMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Formats a day header label.
 * e.g. "Monday" or "MON" (short)
 * @param {Date}    date
 * @param {boolean} [short=false]
 * @returns {string}
 */
export function formatDayLabel(date, short = false) {
  return date.toLocaleDateString('en-US', {
    weekday: short ? 'short' : 'long',
  }).toUpperCase();
}

/**
 * Formats a short date for day group headers.
 * e.g. "Mar 24"
 * @param {Date} date
 * @returns {string}
 */
export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a full date for display in event rows.
 * e.g. "Monday, March 24, 2026"
 * @param {Date} date
 * @returns {string}
 */
export function formatFullDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
  });
}

/**
 * Formats a time for display in event rows.
 * e.g. "7:30 PM"
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a time range for event display.
 * e.g. "7:00 PM – 9:00 PM"
 * @param {Date} start
 * @param {Date} end
 * @returns {string}
 */
export function formatTimeRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/**
 * Formats an HH:mm string for display.
 * e.g. "18:00" → "6:00 PM"
 * @param {string} hhmm - '18:00'
 * @returns {string}
 */
export function formatHHmm(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const date   = new Date();
  date.setHours(h, m, 0, 0);
  return formatTime(date);
}

/**
 * Formats a deadline countdown string.
 * e.g. "2d 4h remaining" or "Expired"
 * @param {Date} deadline
 * @returns {string}
 */
export function formatDeadlineCountdown(deadline) {
  const now  = Date.now();
  const diff = deadline.getTime() - now;

  if (diff <= 0) return 'Expired';

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)  return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

//#endregion