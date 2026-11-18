/**
 * devRenderer.js
 * @version 1.1.0
 *
 * All DOM rendering for the dev mode feature.
 * Renders the dev access door and the floating dev toolbar.
 * No fetch calls, no state writes, no side effects.
 *
 * Target path: src/shared/features/dev/devRenderer.js
 */

//#region Imports

import { escHtml }                                                from '../../../utils/helpers.js';
import { DEV_SWITCHABLE_SIMULATIONS, getTokenTimeRemainingLabel } from './devState.js';
import { ROUTES }                                                 from '../../../core/router.js';

//#endregion

//#region Dev Door

/**
 * Renders the dev access door into the mount point.
 */
export function renderDevDoor() {
  const mount = document.getElementById('app-mount');
  if (!mount) return;
  mount.innerHTML = _buildDevDoorHTML();
}

/**
 * Updates the dev door with an error message.
 * @param {string} message
 */
export function renderDevDoorError(message) {
  _updateDevDoorFeedback(message, 'error');
}

/**
 * Updates the dev door with a first setup message.
 * @param {string} message
 */
export function renderDevDoorFirstSetup(message) {
  _updateDevDoorFeedback(message, 'setup');
}

/**
 * Builds the dev access door HTML.
 * @returns {string}
 */
function _buildDevDoorHTML() {
  return `
    <div class="f-dev-door">
      <div class="f-dev-door__card">

        <div class="f-dev-door__header">
          <div class="f-dev-door__mark">TS</div>
          <div class="f-dev-door__title">DEV ACCESS</div>
          <div class="f-dev-door__sub">RESTRICTED · INTERNAL ONLY</div>
        </div>

        <div class="f-dev-door__body">

          <div id="js-dev-door-feedback" class="f-dev-door__feedback is-hidden"></div>

          <form id="js-dev-door-form" class="f-dev-door__form" novalidate>

            <div class="c-field">
              <label class="c-field__label c-field__label--required" for="js-dev-token-input">
                Dev Token
              </label>
              <input
                id="js-dev-token-input"
                class="c-input f-dev-door__input"
                type="text"
                placeholder="DEV-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                autocomplete="off"
                spellcheck="false"
                required
              />
              <span class="c-field__hint">
                Token available in Firebase Console → Firestore → /system/devAccess
              </span>
            </div>

            <button
              id="js-dev-token-submit"
              type="submit"
              class="c-button c-button--primary c-button--full"
            >
              Enter
            </button>

          </form>

        </div>

        <div class="f-dev-door__footer">
          <button id="js-dev-door-back" class="c-button c-button--ghost">
            ← Back to Login
          </button>
        </div>

      </div>
    </div>
  `;
}

/**
 * Updates the feedback area on the dev door.
 * @param {string} message
 * @param {'error' | 'setup'} type
 */
function _updateDevDoorFeedback(message, type) {
  const feedback = document.getElementById('js-dev-door-feedback');
  if (!feedback) return;

  feedback.className   = `f-dev-door__feedback f-dev-door__feedback--${type}`;
  feedback.textContent = message;
  feedback.classList.remove('is-hidden');
}

//#endregion

//#region Dev Toolbar

/**
 * Builds the full dev toolbar HTML string.
 * Horizontal pill design — floats at bottom center of screen.
 * @param {object} state - devState
 * @returns {string}
 */
export function renderDevToolbar(state) {
  return `
    <div class="f-dev-toolbar">

      <!-- ── Simulation Popup — hidden by default ── -->
      <div id="js-dev-simulation-popup" class="f-dev-popup is-hidden">
        <div class="f-dev-popup__header">Viewing As</div>
        <div class="f-dev-popup__body">
          <div class="f-dev-popup__simulations">
            ${_buildSimulationPopupHTML(state.activeSimulation)}
          </div>
        </div>
      </div>

      <!-- ── Route Popup — hidden by default ── -->
      <div id="js-dev-route-popup" class="f-dev-popup is-hidden">
        <div class="f-dev-popup__header">Jump To Route</div>
        <div class="f-dev-popup__body">
          <div class="f-dev-popup__routes">
            ${_buildRoutePopupHTML()}
          </div>
        </div>
      </div>

      <!-- ── Main Pill Bar ── -->
      <div class="f-dev-toolbar__bar">

        <!-- Identity + timer -->
        <div class="f-dev-toolbar__identity">
          <span class="f-dev-toolbar__dev-label">DEV</span>
          <span id="js-dev-token-timer" class="f-dev-toolbar__timer">
            ${escHtml(getTokenTimeRemainingLabel())}
          </span>
        </div>

        <!-- Simulation switcher -->
        <button
          id="js-dev-tool-simulation"
          class="f-dev-toolbar__tool"
          data-tip="Viewing As"
        >
          👤
        </button>

        <div class="f-dev-toolbar__sep"></div>

        <!-- Route jump -->
        <button
          id="js-dev-tool-route"
          class="f-dev-toolbar__tool"
          data-tip="Jump to Route"
        >
          ⚡
        </button>

        <!-- Force first login -->
        <button
          id="js-dev-force-first-login"
          class="f-dev-toolbar__tool"
          data-tip="Force First Login"
        >
          🔄
        </button>

        <!-- Log state -->
        <button
          id="js-dev-state-inspector"
          class="f-dev-toolbar__tool"
          data-tip="Log App State"
        >
          📋
        </button>

        <div class="f-dev-toolbar__sep"></div>

        <!-- Exit -->
        <button
          id="js-dev-exit"
          class="f-dev-toolbar__tool f-dev-toolbar__tool--exit"
        >
          ✕ Exit
        </button>

      </div>
    </div>
  `;
}

/**
 * Updates the active simulation display in the simulation popup.
 * @param {{ type: string, role: string | null, label: string }} simulation
 */
export function updateDevSimulationDisplay(simulation) {
  document.querySelectorAll('.js-dev-sim-btn').forEach((btn, index) => {
    const sim      = DEV_SWITCHABLE_SIMULATIONS[index];
    const isActive = sim && sim.type === simulation.type && sim.role === simulation.role;

    btn.classList.toggle('is-active', isActive);

    const check = btn.querySelector('.f-dev-popup__sim-check');
    if (check) check.style.display = isActive ? 'inline' : 'none';
  });
}

/**
 * Updates the token timer display in the toolbar.
 * @param {string} label
 */
export function updateDevTokenTimer(label) {
  const timer = document.getElementById('js-dev-token-timer');
  if (timer) timer.textContent = label;
}

//#endregion

//#region Private Helpers

/**
 * Builds the simulation popup buttons HTML.
 * Each button uses data-sim-index so the controller can look up
 * the full simulation object from DEV_SWITCHABLE_SIMULATIONS.
 *
 * @param {{ type: string, role: string | null }} activeSimulation
 * @returns {string}
 */
function _buildSimulationPopupHTML(activeSimulation) {
  return DEV_SWITCHABLE_SIMULATIONS.map((sim, index) => {
    const isActive = sim.type === activeSimulation.type && sim.role === activeSimulation.role;
    return `
      <button
        class="f-dev-popup__sim-btn js-dev-sim-btn ${isActive ? 'is-active' : ''}"
        data-sim-index="${index}"
      >
        ${escHtml(sim.label)}
        <span
          class="f-dev-popup__sim-check"
          style="display: ${isActive ? 'inline' : 'none'}"
        >✓</span>
      </button>
    `;
  }).join('');
}

/**
 * Builds the route popup buttons HTML.
 * @returns {string}
 */
function _buildRoutePopupHTML() {
  const routes = [
    { value: ROUTES.DASHBOARD,   label: 'Dashboard'   },
    { value: ROUTES.TRACKER,     label: 'Tracker'     },
    { value: ROUTES.PROSPECTS,   label: 'Database'    },
    { value: ROUTES.COMBINES,    label: 'Combines'    },
    { value: ROUTES.INTERVIEWS,  label: 'Interviews'  },
    { value: ROUTES.EVALUATION,  label: 'Evaluation'  },
    { value: ROUTES.ADMIN,       label: 'Admin'       },
    { value: ROUTES.FIRST_LOGIN, label: 'First Login' },
  ];

  return routes.map(r => `
    <button
      class="f-dev-popup__route-btn js-dev-route-btn"
      data-route="${escHtml(r.value)}"
    >
      ${escHtml(r.label)}
    </button>
  `).join('');
}

//#endregion