/**
 * availabilityController.js — availability component controller
 * @version 1.0.0
 *
 * Handles all availability input interactions:
 * - Mode switching (single date / date range)
 * - Date selection
 * - Slot add / remove / edit
 * - Validation
 * - Save / cancel / clear / change request
 *
 * Never writes to Firestore — fires onSave with a complete
 * AvailabilityEntry for the consuming feature to persist.
 *
 * Mounts inside Modal.getBody() — does not own the modal shell.
 *
 * Target path: src/shared/components/time/availability/availabilityController.js
 */

//#region Imports

import {
  availabilityState,
  resetAvailabilityState,
  hydrateFromEntry,
  setAvailabilityMode,
  setAvailabilityDate,
  setAvailabilityFromDate,
  setAvailabilityToDate,
  setAvailabilityError,
  setAvailabilitySubmitting,
  setAvailabilityReady,
  addSlot,
  removeSlot,
  updateSlotFrom,
  updateSlotUntil,
  getRangeDates,
  getSlotsForDate,
  hasAnySlots,
}                              from './availabilityState.js';

import { renderAvailability }  from './availabilityRenderer.js';

import {
  AVAILABILITY_MODE,
  createAvailabilityEntry,
  isSlotValid,
}                              from '../../../data/availabilityModel.js';

import { toDate }              from '../../../../utils/dateHelpers.js';

//#endregion

//#region Callbacks

let _onSave          = null;
let _onCancel        = null;
let _onChangeRequest = null;

//#endregion

//#region Container

let _container = null;

//#endregion

//#region Init / Destroy

/**
 * Initializes the availability component in the given container.
 * Typically the container is Modal.getBody().
 *
 * @param {HTMLElement} container
 * @param {object}      options
 * @param {string}      [options.mode]          - AVAILABILITY_MODE (default: SINGLE)
 * @param {string}      [options.date]          - ISO date for single mode pre-select
 * @param {string}      [options.fromDate]      - ISO date for range mode pre-select
 * @param {string}      [options.toDate]        - ISO date for range mode pre-select
 * @param {object}      [options.existingEntry] - AvailabilityEntry to pre-fill
 * @param {boolean}     [options.readOnly]      - lock inputs for history view
 * @param {Date}        [options.deadline]      - deadline Date for countdown display
 */
export function init(container, options = {}) {
  destroy();

  _container = container;

  resetAvailabilityState();

  availabilityState.readOnly = options.readOnly ?? false;
  availabilityState.deadline = options.deadline ? toDate(options.deadline) : null;

  if (options.existingEntry) {
    hydrateFromEntry(options.existingEntry);
  } else {
    if (options.mode)     setAvailabilityMode(options.mode);
    if (options.date)     setAvailabilityDate(options.date);
    if (options.fromDate) setAvailabilityFromDate(options.fromDate);
    if (options.toDate)   setAvailabilityToDate(options.toDate);
  }

  _rerender();
  _bindEvents();
  setAvailabilityReady();
}

/**
 * Tears down the component — clears state and listeners.
 */
export function destroy() {
  _unbindEvents();
  resetAvailabilityState();
  _onSave          = null;
  _onCancel        = null;
  _onChangeRequest = null;
  _container       = null;
}

//#endregion

//#region Public API — Callbacks

/**
 * Registers the save callback.
 * Fires with a complete AvailabilityEntry when the user saves.
 * @param {Function} callback
 */
export function onSave(callback) {
  _onSave = callback;
}

/**
 * Registers the cancel callback.
 * Fires when the user cancels without saving.
 * @param {Function} callback
 */
export function onCancel(callback) {
  _onCancel = callback;
}

/**
 * Registers the change request callback.
 * Fires with the current entry when player reports a change.
 * @param {Function} callback
 */
export function onChangeRequest(callback) {
  _onChangeRequest = callback;
}

//#endregion

//#region Interaction Handlers

/**
 * Switches between single date and date range mode.
 * Clears all slot data on switch.
 * @param {string} mode - AVAILABILITY_MODE
 */
export function handleModeSwitch(mode) {
  if (mode === availabilityState.mode) return;
  setAvailabilityMode(mode);
  _rerender();
}

/**
 * Handles date input change for single mode.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function handleDateChange(isoDate) {
  setAvailabilityDate(isoDate);
  _rerender();
}

/**
 * Handles from-date input change for range mode.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function handleFromDateChange(isoDate) {
  setAvailabilityFromDate(isoDate);
  _rerender();
}

/**
 * Handles to-date input change for range mode.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function handleToDateChange(isoDate) {
  setAvailabilityToDate(isoDate);
  _rerender();
}

/**
 * Adds a new empty slot to a day.
 * @param {string} isoDate - 'YYYY-MM-DD'
 */
export function handleAddSlot(isoDate) {
  addSlot(isoDate);
  _rerender();
}

/**
 * Removes a slot from a day.
 * @param {string} isoDate - 'YYYY-MM-DD'
 * @param {number} index
 */
export function handleRemoveSlot(isoDate, index) {
  removeSlot(isoDate, index);
  _rerender();
}

/**
 * Updates the from time on a slot.
 * No re-render — input manages its own value.
 * @param {string} isoDate
 * @param {number} index
 * @param {string} value - 'HH:mm'
 */
export function handleSlotFromChange(isoDate, index, value) {
  updateSlotFrom(isoDate, index, value);
}

/**
 * Updates the until time on a slot.
 * No re-render — input manages its own value.
 * @param {string} isoDate
 * @param {number} index
 * @param {string} value - 'HH:mm'
 */
export function handleSlotUntilChange(isoDate, index, value) {
  updateSlotUntil(isoDate, index, value);
}

/**
 * Clears all slot data without closing.
 */
export function handleClear() {
  Object.keys(availabilityState.days).forEach(date => {
    availabilityState.days[date] = [];
  });
  setAvailabilityError(null);
  _rerender();
}

/**
 * Validates and fires onSave with a complete AvailabilityEntry.
 */
export function handleSave() {
  const error = _validate();
  if (error) {
    setAvailabilityError(error);
    _rerender();
    return;
  }

  setAvailabilityError(null);
  const entry = _buildEntry();

  if (typeof _onSave === 'function') {
    _onSave(entry);
  }
}

/**
 * Fires onCancel without saving.
 */
export function handleCancel() {
  if (typeof _onCancel === 'function') {
    _onCancel();
  }
}

/**
 * Fires onChangeRequest with the current entry.
 * Used by players to report a change to submitted availability.
 */
export function handleChangeRequest() {
  const entry = _buildEntry();
  if (typeof _onChangeRequest === 'function') {
    _onChangeRequest(entry);
  }
}

//#endregion

//#region Private — Event Binding

/**
 * Binds delegated events on the container.
 * All interactions use data attributes — no per-element listeners.
 */
function _bindEvents() {
  if (!_container) return;

  _container._availHandler = (e) => {
    const target = e.target;

    // ── Mode toggle ───────────────────────────────────
    const modeBtn = target.closest('[data-avail-mode]');
    if (modeBtn) {
      handleModeSwitch(modeBtn.dataset.availMode);
      return;
    }

    // ── Add slot ──────────────────────────────────────
    const addBtn = target.closest('[data-avail-add-slot]');
    if (addBtn) {
      handleAddSlot(addBtn.dataset.availAddSlot);
      return;
    }

    // ── Remove slot ───────────────────────────────────
    const removeBtn = target.closest('[data-avail-remove-slot]');
    if (removeBtn) {
      handleRemoveSlot(
        removeBtn.dataset.availRemoveSlot,
        parseInt(removeBtn.dataset.availSlotIndex, 10),
      );
      return;
    }

    // ── Action buttons ────────────────────────────────
    if (target.closest('[data-avail-save]'))          { handleSave();          return; }
    if (target.closest('[data-avail-cancel]'))        { handleCancel();        return; }
    if (target.closest('[data-avail-clear]'))         { handleClear();         return; }
    if (target.closest('[data-avail-change-request]')){ handleChangeRequest(); return; }
  };

  _container._availChangeHandler = (e) => {
    const target = e.target;

    // ── Date inputs ───────────────────────────────────
    if (target.matches('[data-avail-date]')) {
      handleDateChange(target.value);
      return;
    }
    if (target.matches('[data-avail-from-date]')) {
      handleFromDateChange(target.value);
      return;
    }
    if (target.matches('[data-avail-to-date]')) {
      handleToDateChange(target.value);
      return;
    }

    // ── Slot time inputs ──────────────────────────────
    if (target.matches('[data-avail-slot-from]')) {
      handleSlotFromChange(
        target.dataset.availSlotDate,
        parseInt(target.dataset.availSlotIndex, 10),
        target.value,
      );
      return;
    }
    if (target.matches('[data-avail-slot-until]')) {
      handleSlotUntilChange(
        target.dataset.availSlotDate,
        parseInt(target.dataset.availSlotIndex, 10),
        target.value,
      );
      return;
    }
  };

  _container.addEventListener('click',  _container._availHandler);
  _container.addEventListener('change', _container._availChangeHandler);
}

function _unbindEvents() {
  if (!_container) return;
  if (_container._availHandler) {
    _container.removeEventListener('click',  _container._availHandler);
    _container.removeEventListener('change', _container._availChangeHandler);
    delete _container._availHandler;
    delete _container._availChangeHandler;
  }
}

//#endregion

//#region Private — Validation

/**
 * Validates the current state before saving.
 * Returns an error string if invalid, null if valid.
 * @returns {string | null}
 */
function _validate() {
  const { mode, date, fromDate, toDate, days } = availabilityState;

  if (mode === AVAILABILITY_MODE.SINGLE) {
    if (!date) return 'Please select a date.';
  }

  if (mode === AVAILABILITY_MODE.RANGE) {
    if (!fromDate) return 'Please select a start date.';
    if (!toDate)   return 'Please select an end date.';
    if (fromDate > toDate) return 'Start date must be before end date.';
  }

  // Validate all slots that have been partially filled
  for (const [isoDate, slots] of Object.entries(days)) {
    for (const slot of slots) {
      if ((slot.from && !slot.until) || (!slot.from && slot.until)) {
        return 'Please complete all time slots — both start and end times are required.';
      }
      if (slot.from && slot.until && !isSlotValid(slot)) {
        return 'End time must be after start time.';
      }
    }
  }

  return null;
}

//#endregion

//#region Private — Entry Builder

/**
 * Builds a complete AvailabilityEntry from current state.
 * @returns {object} AvailabilityEntry
 */
function _buildEntry() {
  const { mode, date, fromDate, toDate, days } = availabilityState;

  if (mode === AVAILABILITY_MODE.SINGLE) {
    return createAvailabilityEntry({
      mode,
      date,
      slots: days[date] ?? [],
    });
  }

  return createAvailabilityEntry({
    mode,
    fromDate,
    toDate,
    days: { ...days },
  });
}

//#endregion

//#region Private — Render

function _rerender() {
  if (!_container) return;
  renderAvailability(_container, availabilityState);
}

//#endregion