/**
 * helpers.js
 * @version 1.0.0
 *
 * Pure utility functions with no side effects.
 * Formatters, sanitizers, and general purpose helpers.
 * No imports from the rest of the app.
 * Target path: src/utils/helpers.js
 */

//#region String Helpers

/**
 * Escapes HTML special characters to prevent XSS.
 * Always use this before inserting user-generated content into the DOM.
 * @param {string} str
 * @returns {string}
 */
export function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

/**
 * Truncates a string to a maximum length and appends ellipsis if needed.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//#endregion

//#region Number Formatters

/**
 * Formats an integer with comma separators.
 * @param {number} value
 * @returns {string}
 */
export function fmtInt(value) {
  if (value === null || value === undefined) return '—';
  return Math.round(value).toLocaleString();
}

/**
 * Formats a decimal to a fixed number of places.
 * @param {number} value
 * @param {number} places  - Default 2
 * @returns {string}
 */
export function fmtDec(value, places = 2) {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(places);
}

/**
 * Formats a win rate as a percentage string.
 * @param {number} value   - 0 to 1 or 0 to 100
 * @param {boolean} isDecimal  - true if value is 0–1, false if already 0–100
 * @returns {string}
 */
export function fmtWinRate(value, isDecimal = true) {
  if (value === null || value === undefined) return '—';
  const pct = isDecimal ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

//#endregion

//#region Date Formatters

/**
 * Formats a Firestore timestamp or JS Date to a readable date string.
 * @param {object | Date} timestamp
 * @returns {string}  e.g. "Mar 20, 2026"
 */
export function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  });
}

/**
 * Formats a Firestore timestamp or JS Date to date and time.
 * @param {object | Date} timestamp
 * @returns {string}  e.g. "Mar 20, 2026 · 14:32"
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const d = date.toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  });
  const t = date.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${d} · ${t}`;
}

/**
 * Returns a relative time string.
 * @param {object | Date} timestamp
 * @returns {string}  e.g. "2 hours ago", "just now"
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '—';
  const date  = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const delta = Math.floor((Date.now() - date.getTime()) / 1000);

  if (delta < 60)                return 'just now';
  if (delta < 3600)              return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400)             return `${Math.floor(delta / 3600)}h ago`;
  if (delta < 86400 * 7)        return `${Math.floor(delta / 86400)}d ago`;
  return formatDate(timestamp);
}

//#endregion

//#region Validation Helpers

/**
 * Validates a TrueSight ID format: Name#TAG
 * Name: 2–20 alphanumeric characters or spaces
 * TAG: 2–10 alphanumeric characters
 * @param {string} id
 * @returns {boolean}
 */
export function isValidTrueSightId(id) {
  if (!id) return false;
  const pattern = /^[a-zA-Z0-9 ]{2,20}#[a-zA-Z0-9]{2,10}$/;
  return pattern.test(id);
}

/**
 * Validates a password meets minimum requirements.
 * At least 8 characters, one uppercase, one number.
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || password.length < 8) return false;
  const hasUpper  = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpper && hasNumber;
}

/**
 * Validates an email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

//#endregion

//#region DOM Helpers

/**
 * Safely queries a DOM element. Throws a clear error if not found.
 * @param {string} selector
 * @param {Element} context  - Optional parent element
 * @returns {Element}
 */
export function qs(selector, context = document) {
  const el = context.querySelector(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

/**
 * Queries all matching DOM elements.
 * @param {string} selector
 * @param {Element} context
 * @returns {Element[]}
 */
export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Shows a DOM element by removing the is-hidden class.
 * @param {Element} el
 */
export function show(el) {
  el.classList.remove('is-hidden');
}

/**
 * Hides a DOM element by adding the is-hidden class.
 * @param {Element} el
 */
export function hide(el) {
  el.classList.add('is-hidden');
}

//#endregion