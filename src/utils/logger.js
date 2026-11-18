/**
 * logger.js
 * @version 1.0.0
 *
 * Centralized logging utility for the TrueSight platform.
 * All console output goes through here — never directly.
 *
 * Levels:
 *   info  — verbose, dev mode only
 *   warn  — always shown
 *   error — always shown, includes stack trace
 *
 * Usage:
 *   import { Logger } from '../utils/logger.js';
 *   import { LOG_SOURCE, LOG_SESSION } from '../constants/logMessages.js';
 *
 *   Logger.info(LOG_SOURCE.SESSION, LOG_SESSION.EXTEND);
 *   Logger.error(LOG_SOURCE.FIRESTORE, LOG_FIRESTORE.READ_FAILED, err);
 *   Logger.inspect('App State', appState, navState);
 *   Logger.group(LOG_SOURCE.ADMIN, 'Staff load', () => { ... });
 * Target path: src/utils/logger.js
 */

//#region Imports

import { IS_PRODUCTION } from '../constants/config.js';

//#endregion

//#region Constants

const STYLES = {
  BOOT:      'color: #95EC5D; font-weight: bold;',
  ROUTER:    'color: #5b9cf6; font-weight: bold;',
  SESSION:   'color: #a78bfa; font-weight: bold;',
  NAV:       'color: #95EC5D; font-weight: bold;',
  AUTH:      'color: #f5c842; font-weight: bold;',
  DEV:       'color: #f5c842; font-weight: bold;',
  ADMIN:     'color: #f5c842; font-weight: bold;',
  FIRESTORE: 'color: #5b9cf6; font-weight: bold;',
  CLEANUP:   'color: #f59c42; font-weight: bold;',
  DEFAULT:   'color: #8fa3b1; font-weight: bold;',
};

const LEVEL_STYLES = {
  info:  'color: #8fa3b1;',
  warn:  'color: #f5c842;',
  error: 'color: #f25c5c;',
};

//#endregion

//#region Public API

export const Logger = {

  /**
   * Verbose info log — dev mode only.
   * @param {string} source  — LOG_SOURCE constant
   * @param {string} message — LOG_* message constant
   * @param {*}      data    — optional extra data
   */
  info(source, message, data) {
    if (IS_PRODUCTION) return;
    _log('info', source, message, data);
  },

  /**
   * Warning — always shown.
   * @param {string} source
   * @param {string} message
   * @param {*}      data
   */
  warn(source, message, data) {
    _log('warn', source, message, data);
  },

  /**
   * Error — always shown with stack trace if err provided.
   * @param {string} source
   * @param {string} message
   * @param {Error}  err
   */
  error(source, message, err) {
    _log('error', source, message, err);
    if (err?.stack && !IS_PRODUCTION) {
      console.groupCollapsed(`%c[${source}] Stack trace`, STYLES[source] ?? STYLES.DEFAULT);
      console.error(err.stack);
      console.groupEnd();
    }
  },

  /**
   * Wraps a block of logs in a collapsible console group.
   * Dev mode only.
   * @param {string}   source
   * @param {string}   label
   * @param {Function} fn
   */
  group(source, label, fn) {
    if (IS_PRODUCTION) { fn(); return; }
    console.groupCollapsed(`%c[${source}] ${label}`, STYLES[source] ?? STYLES.DEFAULT);
    fn();
    console.groupEnd();
  },

  /**
   * Pretty-prints one or more state objects for inspection.
   * Dev mode only. Used by dev toolbar state inspector.
   * @param {string} label
   * @param {...*}   objects
   */
  inspect(label, ...objects) {
    if (IS_PRODUCTION) return;
    console.groupCollapsed(
      `%c[INSPECT] ${label} — ${_timestamp()}`,
      'color: #95EC5D; font-weight: bold; font-size: 11px;'
    );
    objects.forEach((obj, i) => {
      const name = obj?.constructor?.name ?? `Object ${i + 1}`;
      console.log(`%c${name}`, 'color: #8fa3b1; font-style: italic;', obj);
    });
    console.groupEnd();
  },

};

//#endregion

//#region Private Helpers

function _log(level, source, message, data) {
  const sourceStyle  = STYLES[source]  ?? STYLES.DEFAULT;
  const levelStyle   = LEVEL_STYLES[level] ?? LEVEL_STYLES.info;
  const timestamp    = _timestamp();
  const prefix       = `%c[${source}]%c ${message} %c${timestamp}`;

  const args = [prefix, sourceStyle, levelStyle, 'color: #4d6475; font-size: 10px;'];

  if (data !== undefined && data !== null) args.push(data);

  switch (level) {
    case 'warn':  console.warn(...args);  break;
    case 'error': console.error(...args); break;
    default:      console.log(...args);
  }
}

function _timestamp() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  const s   = String(now.getSeconds()).padStart(2, '0');
  const ms  = String(now.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

//#endregion