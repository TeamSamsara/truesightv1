/**
 * availabilityRenderer.js — availability component renderer
 * @version 1.0.0
 *
 * Renders the availability input UI.
 * Covers both single date and date range modes.
 * Produces the HTML injected into the consuming container
 * (typically Modal.getBody()).
 *
 * All interactive elements use data-avail-* attributes.
 * No inline handlers — controller's delegated listeners handle everything.
 *
 * Target path: src/shared/components/time/availability/availabilityRenderer.js
 */

//#region Imports

import {
  AVAILABILITY_MODE,
}                              from '../../../data/availabilityModel.js';

import {
  getRangeDates,
  getSlotsForDate,
}                              from './availabilityState.js';

import {
  formatDayLabel,
  formatShortDate,
  formatDeadlineCountdown,
  fromISODate,
}                              from '../../../../utils/dateHelpers.js';

import { escHtml }             from '../../../../utils/helpers.js';

//#endregion

//#region Public API

/**
 * Renders the full availability component into the container.
 * @param {HTMLElement} container
 * @param {object}      state - availabilityState
 */
export function renderAvailability(container, state) {
  container.innerHTML = `
    <div class="c-availability ${state.readOnly ? 'is-read-only' : ''}">
      ${_renderDeadline(state)}
      ${_renderError(state)}
      ${_renderModeToggle(state)}
      ${_renderDateInputs(state)}
      ${_renderDayRows(state)}
      ${_renderActions(state)}
    </div>
  `;
}

//#endregion

//#region Deadline

function _renderDeadline(state) {
  if (!state.deadline) return '';
  const countdown = formatDeadlineCountdown(state.deadline);
  return `
    <div class="c-availability__deadline">
      <span class="c-availability__deadline-label">Deadline</span>
      <span class="c-availability__deadline-value">${escHtml(countdown)}</span>
    </div>
  `;
}

//#endregion

//#region Error

function _renderError(state) {
  if (!state.error) return '';
  return `
    <div class="c-availability__error">${escHtml(state.error)}</div>
  `;
}

//#endregion

//#region Mode Toggle

function _renderModeToggle(state) {
  if (state.readOnly) return '';
  return `
    <div class="c-availability__mode-toggle">
      <button
        class="c-availability__mode-btn ${state.mode === AVAILABILITY_MODE.SINGLE ? 'is-active' : ''}"
        data-avail-mode="${AVAILABILITY_MODE.SINGLE}"
      >Single date</button>
      <button
        class="c-availability__mode-btn ${state.mode === AVAILABILITY_MODE.RANGE ? 'is-active' : ''}"
        data-avail-mode="${AVAILABILITY_MODE.RANGE}"
      >Date range</button>
    </div>
  `;
}

//#endregion

//#region Date Inputs

function _renderDateInputs(state) {
  if (state.mode === AVAILABILITY_MODE.SINGLE) {
    return `
      <div class="c-availability__date-row">
        <label class="c-availability__date-label">Date</label>
        <input
          class="c-availability__date-input"
          type="date"
          data-avail-date
          value="${escHtml(state.date ?? '')}"
          ${state.readOnly ? 'disabled' : ''}
        />
      </div>
    `;
  }

  return `
    <div class="c-availability__date-range">
      <div class="c-availability__date-row">
        <label class="c-availability__date-label">From</label>
        <input
          class="c-availability__date-input"
          type="date"
          data-avail-from-date
          value="${escHtml(state.fromDate ?? '')}"
          ${state.readOnly ? 'disabled' : ''}
        />
      </div>
      <div class="c-availability__date-row">
        <label class="c-availability__date-label">To</label>
        <input
          class="c-availability__date-input"
          type="date"
          data-avail-to-date
          value="${escHtml(state.toDate ?? '')}"
          ${state.readOnly ? 'disabled' : ''}
        />
      </div>
    </div>
  `;
}

//#endregion

//#region Day Rows

function _renderDayRows(state) {
  if (state.mode === AVAILABILITY_MODE.SINGLE) {
    if (!state.date) return '';
    return `
      <div class="c-availability__days">
        ${_renderDayRow(state.date, getSlotsForDate(state.date), state.readOnly)}
      </div>
    `;
  }

  const dates = getRangeDates();
  if (dates.length === 0) return '';

  return `
    <div class="c-availability__days">
      ${dates.map(isoDate =>
        _renderDayRow(isoDate, getSlotsForDate(isoDate), state.readOnly)
      ).join('')}
    </div>
  `;
}

function _renderDayRow(isoDate, slots, readOnly) {
  const date      = fromISODate(isoDate);
  const dayLabel  = formatDayLabel(date);
  const dateLabel = formatShortDate(date);
  const hasSlots  = slots.length > 0;

  return `
    <div class="c-availability__day-row" data-avail-day="${escHtml(isoDate)}">

      <div class="c-availability__day-label">
        <span class="c-availability__day-name">${escHtml(dayLabel)}</span>
        <span class="c-availability__day-date">${escHtml(dateLabel)}</span>
      </div>

      <div class="c-availability__day-slots">
        ${hasSlots
          ? slots.map((slot, i) => _renderSlotRow(isoDate, slot, i, readOnly)).join('')
          : _renderEmptyDay(isoDate, readOnly)
        }
        ${hasSlots && !readOnly ? `
          <button
            class="c-availability__add-slot"
            data-avail-add-slot="${escHtml(isoDate)}"
          >+ Add slot</button>
        ` : ''}
      </div>

      <div class="c-availability__day-status">
        ${hasSlots
          ? `<span class="c-availability__status-dot c-availability__status-dot--available"></span>`
          : `<span class="c-availability__status-dot c-availability__status-dot--off"></span>`
        }
      </div>

    </div>
  `;
}

function _renderSlotRow(isoDate, slot, index, readOnly) {
  return `
    <div class="c-availability__slot-row" data-avail-slot-index="${index}">
      <input
        class="c-availability__time-input"
        type="time"
        data-avail-slot-from
        data-avail-slot-date="${escHtml(isoDate)}"
        data-avail-slot-index="${index}"
        value="${escHtml(slot.from ?? '')}"
        ${readOnly ? 'disabled' : ''}
      />
      <span class="c-availability__slot-arrow">→</span>
      <input
        class="c-availability__time-input"
        type="time"
        data-avail-slot-until
        data-avail-slot-date="${escHtml(isoDate)}"
        data-avail-slot-index="${index}"
        value="${escHtml(slot.until ?? '')}"
        ${readOnly ? 'disabled' : ''}
      />
      ${!readOnly ? `
        <button
          class="c-availability__remove-slot"
          data-avail-remove-slot="${escHtml(isoDate)}"
          data-avail-slot-index="${index}"
          aria-label="Remove slot"
        >×</button>
      ` : ''}
    </div>
  `;
}

function _renderEmptyDay(isoDate, readOnly) {
  if (readOnly) {
    return `<span class="c-availability__off-label">Off</span>`;
  }
  return `
    <button
      class="c-availability__add-availability"
      data-avail-add-slot="${escHtml(isoDate)}"
    >+ Add availability</button>
  `;
}

//#endregion

//#region Actions

function _renderActions(state) {
  if (state.readOnly) {
    return `
      <div class="c-availability__actions">
        <button
          class="c-availability__btn c-availability__btn--ghost"
          data-avail-change-request
        >Report a change</button>
        <button
          class="c-availability__btn c-availability__btn--ghost"
          data-avail-cancel
        >Close</button>
      </div>
    `;
  }

  return `
    <div class="c-availability__actions">
      <button
        class="c-availability__btn c-availability__btn--ghost"
        data-avail-clear
      >Clear</button>
      <div class="c-availability__actions-right">
        <button
          class="c-availability__btn c-availability__btn--ghost"
          data-avail-cancel
        >Cancel</button>
        <button
          class="c-availability__btn c-availability__btn--primary"
          data-avail-save
          ${state.isSubmitting ? 'disabled' : ''}
        >${state.isSubmitting ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  `;
}

//#endregion