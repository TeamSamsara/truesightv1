/**
 * Prospect workspace — transitional read-only integration.
 *
 * Uses the ProspectSystem Firebase adapter while the cross-project identity
 * strategy is being finalized. TrueSight route authorization is checked by the
 * parent scouting feature; ProspectSystem Firestore access still requires its
 * own authenticated Firebase user.
 */

import {
  signInToProspectData,
  signOutOfProspectData,
  onProspectDataAuthStateChanged,
  prospectFirebaseEnvironment,
} from '../../../../services/prospectData/prospectFirebase.js';

import {
  fetchProspects,
  fetchCombines,
  fetchCombineLobbies,
  fetchInterviews,
} from '../../../../services/prospectData/prospectRepository.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderSignedOut(container, error = '') {
  container.innerHTML = `
    <section class="f-scouting l-page">
      <header>
        <div class="f-scouting__label">SCOUTING</div>
        <h1>Prospect workspace</h1>
        <p>Connect to the existing ProspectSystem dataset.</p>
      </header>
      <p role="status">ProspectSystem environment: <strong>${escapeHtml(prospectFirebaseEnvironment)}</strong></p>
      <p>This is a temporary second authentication step. Your TrueSight session remains separate.</p>
      ${error ? `<p role="alert">${escapeHtml(error)}</p>` : ''}
      <form id="prospect-data-login">
        <label>
          ProspectSystem email
          <input name="email" type="email" autocomplete="username" required>
        </label>
        <label>
          ProspectSystem password
          <input name="password" type="password" autocomplete="current-password" required>
        </label>
        <button class="c-button c-button--primary" type="submit">Connect scouting data</button>
      </form>
    </section>
  `;
}

function renderLoading(container) {
  container.innerHTML = `
    <section class="f-scouting l-page">
      <div class="f-scouting__label">SCOUTING</div>
      <h1>Connecting to prospect data…</h1>
      <p>Loading the existing ProspectSystem records.</p>
    </section>
  `;
}

function renderAccessError(container, user, error) {
  container.innerHTML = `
    <section class="f-scouting l-page">
      <div class="f-scouting__label">SCOUTING</div>
      <h1>Prospect data unavailable</h1>
      <p>Authenticated as ${escapeHtml(user.email || user.uid)}, but the existing data could not be read.</p>
      <p role="alert">${escapeHtml(error?.message || 'A Firestore access error occurred.')}</p>
      <p>Check the ProspectSystem project, environment and Firestore rules. This integration will not bypass its security rules.</p>
      <button id="prospect-data-retry" type="button">Retry</button>
      <button id="prospect-data-disconnect" type="button">Disconnect scouting data</button>
    </section>
  `;
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }
  if (typeof value === 'object' && Number.isFinite(value.seconds)) {
    return new Date(value.seconds * 1000).toLocaleString();
  }
  return String(value);
}

function renderData(container, user, summary) {
  const prospectRows = summary.prospects.slice(0, 100).map(({ id, data }) => `
    <tr data-search="${escapeHtml([data.candidateFullname, data.candidateUsername, data.role, data.region, data.currentTeam].join(' ').toLowerCase())}">
      <td>${escapeHtml(data.candidateFullname || data.candidateUsername || 'Unnamed prospect')}</td>
      <td>${escapeHtml(data.role || '—')}</td>
      <td>${escapeHtml(data.region || '—')}</td>
      <td>${escapeHtml(data.currentTeam || '—')}</td>
      <td><code>${escapeHtml(id)}</code></td>
    </tr>
  `).join('');

  const combineRows = summary.combines.map(({ id, data }) => `
    <tr>
      <td>${escapeHtml(data.name || data.title || 'Combine')}</td>
      <td>${escapeHtml(displayValue(data.status || '—'))}</td>
      <td>${escapeHtml(Array.isArray(data.participantIds) ? data.participantIds.length : '—')}</td>
      <td>${escapeHtml(displayValue(data.createdAt))}</td>
      <td><code>${escapeHtml(id)}</code></td>
    </tr>
  `).join('');

  const lobbyRows = summary.lobbies.map(({ id, data }) => `
    <tr>
      <td>${escapeHtml(data.lobbyLabel || data.lobbyNumber || id)}</td>
      <td>${escapeHtml(data.dayLabel || data.dayKey || '—')}</td>
      <td>${escapeHtml(data.timeLabel || '—')}</td>
      <td>${escapeHtml(data.status || '—')}</td>
      <td><code>${escapeHtml(data.combineId || '—')}</code></td>
    </tr>
  `).join('');

  const interviewRows = summary.interviews.map(({ id, data }) => `
    <tr>
      <td><code>${escapeHtml(id)}</code></td>
      <td>${escapeHtml(data.status || 'pending')}</td>
      <td>${escapeHtml(data.scheduledSlot || '—')}</td>
      <td>${escapeHtml(Array.isArray(data.availability) ? data.availability.length : 0)}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <section class="f-scouting l-page">
      <header>
        <div class="f-scouting__label">SCOUTING</div>
        <h1>Prospect workspace</h1>
        <p>Connected to the existing ProspectSystem dataset.</p>
      </header>
      <p role="status">Authenticated as ${escapeHtml(user.email || user.uid)} · ${escapeHtml(prospectFirebaseEnvironment)}</p>
      <div class="f-scouting__summary">
        <article><strong>${summary.prospects.length}</strong><span>Prospects</span></article>
        <article><strong>${summary.combines.length}</strong><span>Combines</span></article>
        <article><strong>${summary.lobbies.length}</strong><span>Combine lobbies</span></article>
        <article><strong>${summary.interviews.length}</strong><span>Interviews</span></article>
      </div>
      <div class="f-scouting__actions">
        <button id="prospect-data-refresh" type="button">Refresh records</button>
        <button id="prospect-data-disconnect" type="button">Disconnect scouting data</button>
      </div>
      <nav aria-label="Scouting data sections">
        <button type="button" data-data-tab="prospects" aria-pressed="true">Prospects</button>
        <button type="button" data-data-tab="combines" aria-pressed="false">Combines</button>
        <button type="button" data-data-tab="lobbies" aria-pressed="false">Lobbies</button>
        <button type="button" data-data-tab="interviews" aria-pressed="false">Interviews</button>
      </nav>
      <section data-data-panel="prospects">
        <h2>Existing prospects</h2>
        <label>Search prospects <input id="prospect-search" type="search" placeholder="Name, role, region or team"></label>
        <p>Showing up to 100 records. Source IDs are preserved.</p>
        <div class="f-scouting__table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Region</th><th>Current team</th><th>Source ID</th></tr></thead>
            <tbody>${prospectRows || '<tr><td colspan="5">No prospect records were returned.</td></tr>'}</tbody>
          </table>
        </div>
      </section>
      <section data-data-panel="combines" hidden>
        <h2>Combines</h2>
        <div class="f-scouting__table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Status</th><th>Participants</th><th>Created</th><th>Source ID</th></tr></thead>
            <tbody>${combineRows || '<tr><td colspan="5">No combines were returned.</td></tr>'}</tbody>
          </table>
        </div>
      </section>
      <section data-data-panel="lobbies" hidden>
        <h2>Combine lobbies</h2>
        <div class="f-scouting__table-wrap">
          <table>
            <thead><tr><th>Lobby</th><th>Day</th><th>Time</th><th>Status</th><th>Combine ID</th></tr></thead>
            <tbody>${lobbyRows || '<tr><td colspan="5">No combine lobbies were returned.</td></tr>'}</tbody>
          </table>
        </div>
      </section>
      <section data-data-panel="interviews" hidden>
        <h2>Interviews</h2>
        <div class="f-scouting__table-wrap">
          <table>
            <thead><tr><th>Prospect ID</th><th>Status</th><th>Scheduled slot</th><th>Availability slots</th></tr></thead>
            <tbody>${interviewRows || '<tr><td colspan="4">No interview records were returned.</td></tr>'}</tbody>
          </table>
        </div>
      </section>
      <p>Read-only integration preview. No source records have been changed.</p>
    </section>
  `;

  container.querySelectorAll('[data-data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      const active = button.dataset.dataTab;
      container.querySelectorAll('[data-data-tab]').forEach(tab => {
        tab.setAttribute('aria-pressed', String(tab === button));
      });
      container.querySelectorAll('[data-data-panel]').forEach(panel => {
        panel.hidden = panel.dataset.dataPanel !== active;
      });
    });
  });

  container.querySelector('#prospect-search')?.addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    container.querySelectorAll('[data-search]').forEach(row => {
      row.hidden = !row.dataset.search.includes(query);
    });
  });
}

export async function mountProspectWorkspace(container) {
  let disposed = false;
  let unsubscribe = () => {};
  let loadSequence = 0;

  async function loadData(user) {
    const sequence = ++loadSequence;
    renderLoading(container);

    try {
      const [prospects, combines, lobbies, interviews] = await Promise.all([
        fetchProspects(),
        fetchCombines(),
        fetchCombineLobbies(),
        fetchInterviews(),
      ]);

      if (disposed || sequence !== loadSequence) return;
      renderData(container, user, { prospects, combines, lobbies, interviews });

      container.querySelector('#prospect-data-refresh')?.addEventListener('click', () => loadData(user));
      container.querySelector('#prospect-data-disconnect')?.addEventListener('click', async () => {
        await signOutOfProspectData();
      });
    } catch (error) {
      if (disposed || sequence !== loadSequence) return;
      renderAccessError(container, user, error);
      container.querySelector('#prospect-data-retry')?.addEventListener('click', () => loadData(user));
      container.querySelector('#prospect-data-disconnect')?.addEventListener('click', async () => {
        await signOutOfProspectData();
      });
    }
  }

  renderLoading(container);

  unsubscribe = onProspectDataAuthStateChanged(user => {
    if (disposed) return;
    if (user) {
      loadData(user);
      return;
    }

    renderSignedOut(container);
    const form = container.querySelector('#prospect-data-login');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const email = form.elements.email.value;
      const password = form.elements.password.value;
      submit.disabled = true;
      submit.textContent = 'Connecting…';

      try {
        await signInToProspectData(email, password);
      } catch (error) {
        submit.disabled = false;
        submit.textContent = 'Connect scouting data';
        const message = document.createElement('p');
        message.setAttribute('role', 'alert');
        message.textContent = error?.message || 'Authentication failed.';
        form.querySelector('[role="alert"]')?.remove();
        form.append(message);
      }
    });
  });

  return () => {
    disposed = true;
    loadSequence += 1;
    unsubscribe();
  };
}
