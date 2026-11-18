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

function renderData(container, user, summary) {
  const rows = summary.prospects.slice(0, 100).map(({ id, data }) => {
    const name = data.candidateFullname || data.candidateUsername || 'Unnamed prospect';
    const role = data.role || '—';
    const region = data.region || '—';
    const team = data.currentTeam || '—';
    return `
      <tr>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(role)}</td>
        <td>${escapeHtml(region)}</td>
        <td>${escapeHtml(team)}</td>
        <td><code>${escapeHtml(id)}</code></td>
      </tr>
    `;
  }).join('');

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
      <h2>Existing prospects</h2>
      <p>Showing up to 100 records. This integration is read-only; no source records have been changed.</p>
      <div class="f-scouting__table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Region</th><th>Current team</th><th>Source ID</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">No prospect records were returned.</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
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
      renderSignedOut(container, error?.message || 'Unable to load ProspectSystem data.');
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
        renderSignedOut(container, error?.message || 'Authentication failed.');
      }
    });
  });

  return () => {
    disposed = true;
    loadSequence += 1;
    unsubscribe();
  };
}
