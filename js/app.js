// app.js — Main application logic and state
// Implements spec.md > js/app.js

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let state = {
  selectedComponent: null, // component object from threats.json
  ratings: {}              // { "tcu-1": { impact: null, feasibility: null }, ... }
};

// All component data loaded from threats.json at startup
let allComponents = [];

// IMPACT_LEVELS and FEASIBILITY_LEVELS are declared in risk.js (loaded first).

// ---------------------------------------------------------------------------
// Boot: fetch data and render home screen
// ---------------------------------------------------------------------------

async function init() {
  try {
    const response = await fetch('data/threats.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allComponents = data.components;
    renderHomeScreen();
  } catch (err) {
    showLoadError();
    console.error('Failed to load threats.json:', err);
  }
}

function showLoadError() {
  const home = document.getElementById('screen-home');
  home.innerHTML = `
    <div class="load-error">
      <p>Could not load threat data.</p>
      <p class="load-error__hint">Try opening the app through a local server — e.g. run <code>npx serve .</code> in the project folder, then open the URL it gives you.</p>
    </div>`;
}

// ---------------------------------------------------------------------------
// Home screen — component cards
// ---------------------------------------------------------------------------

function renderHomeScreen() {
  const grid = document.getElementById('component-grid');
  grid.innerHTML = '';

  allComponents.forEach(component => {
    const card = document.createElement('button');
    card.className = 'component-card';
    card.setAttribute('aria-label', `Assess ${component.name}`);
    card.setAttribute('role', 'listitem');

    const iconSrc = getIconSrc(component.id);
    card.innerHTML = `
      <div class="component-card__icon" aria-hidden="true">
        <img src="${iconSrc}" alt="" width="56" height="56">
      </div>
      <div class="component-card__body">
        <h2 class="component-card__name">${escapeHtml(component.name)}</h2>
        <p class="component-card__description">${escapeHtml(component.description)}</p>
        <span class="component-card__count">${component.threatCount} threat${component.threatCount !== 1 ? 's' : ''}</span>
      </div>`;

    card.addEventListener('click', () => selectComponent(component));
    grid.appendChild(card);
  });

  showScreen('screen-home');
}

function getIconSrc(componentId) {
  const map = {
    tcu:     'assets/icons/tcu.svg',
    ota:     'assets/icons/ota.svg',
    keyless: 'assets/icons/keyless.svg'
  };
  return map[componentId] ?? 'assets/icons/tcu.svg';
}

// ---------------------------------------------------------------------------
// Screen switching
// ---------------------------------------------------------------------------

function showScreen(id) {
  ['screen-home', 'screen-rating'].forEach(screenId => {
    document.getElementById(screenId).hidden = (screenId !== id);
  });
}

// ---------------------------------------------------------------------------
// Component selection → rating screen
// ---------------------------------------------------------------------------

function selectComponent(component) {
  state.selectedComponent = component;
  state.ratings = {};
  component.threats.forEach(threat => {
    state.ratings[threat.id] = { impact: null, feasibility: null };
  });
  renderRatingScreen();
  showScreen('screen-rating');
  // Scroll to top so heading is visible
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ---------------------------------------------------------------------------
// Rating screen — full render
// ---------------------------------------------------------------------------

function renderRatingScreen() {
  const comp = state.selectedComponent;

  // Heading and subheading
  document.getElementById('rating-heading').textContent =
    `${comp.name}: ${comp.threatCount} threat${comp.threatCount !== 1 ? 's' : ''} to assess`;
  document.getElementById('rating-subheading').textContent = comp.description;

  // Summary bar (initial empty state)
  updateSummaryBar();

  // Threat cards
  const stack = document.getElementById('threat-stack');
  stack.innerHTML = '';
  comp.threats.forEach(threat => {
    stack.appendChild(buildThreatCard(threat));
  });

  // Progress counter + export button
  updateProgressCounter();
  updateExportButton();

  // Wire ← Back button (leave warning added in slice 5)
  document.getElementById('btn-back').onclick = handleBack;

  // Wire Export button
  document.getElementById('btn-export').onclick = buildAndExportPDF;

  // Hide leave warning (in case it was visible from a previous session)
  document.getElementById('leave-warning').hidden = true;
}

// ---------------------------------------------------------------------------
// Build a single threat card DOM node
// ---------------------------------------------------------------------------

function buildThreatCard(threat) {
  const card = document.createElement('article');
  card.className = 'threat-card';
  card.id = `card-${threat.id}`;

  card.innerHTML = `
    <div class="threat-card__header">
      <h3 class="threat-card__title">${escapeHtml(threat.title)}</h3>
      <span class="badge badge--unrated" id="badge-${threat.id}" aria-live="polite">Not rated</span>
    </div>
    <p class="threat-card__explanation">${escapeHtml(threat.explanation)}</p>
    <span class="threat-card__category">${escapeHtml(threat.annex5Category)}</span>

    <div class="step-selectors">
      <div class="step-selector">
        <span class="step-selector__label" id="impact-label-${threat.id}">Impact</span>
        <div class="step-selector__buttons" role="group" aria-labelledby="impact-label-${threat.id}">
          ${IMPACT_LEVELS.map(level => `
            <button class="step-btn"
                    data-threat="${threat.id}"
                    data-dimension="impact"
                    data-value="${escapeHtml(level)}"
                    aria-pressed="false">
              ${escapeHtml(level)}
            </button>`).join('')}
        </div>
      </div>
      <div class="step-selector">
        <span class="step-selector__label" id="feasibility-label-${threat.id}">Attack feasibility</span>
        <div class="step-selector__buttons" role="group" aria-labelledby="feasibility-label-${threat.id}">
          ${FEASIBILITY_LEVELS.map(level => `
            <button class="step-btn"
                    data-threat="${threat.id}"
                    data-dimension="feasibility"
                    data-value="${escapeHtml(level)}"
                    aria-pressed="false">
              ${escapeHtml(level)}
            </button>`).join('')}
        </div>
      </div>
    </div>

    <button class="risk-grid-link" data-threat="${threat.id}" aria-haspopup="dialog">
      How is risk calculated?
    </button>

    <div class="mitigations" id="mitigations-${threat.id}" aria-hidden="true">
      <div class="mitigations__inner">
        <p class="mitigations__heading">What you can do</p>
        <ul class="mitigations__list">
          ${threat.mitigations.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
        </ul>
      </div>
    </div>`;

  // Wire step-selector button clicks
  card.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', handleStepSelect);
  });

  // Wire risk grid link (implemented fully in slice 4; no-op for now)
  card.querySelector('.risk-grid-link').addEventListener('click', handleRiskGridOpen);

  return card;
}

// ---------------------------------------------------------------------------
// Step selector interaction (slice 2 — wires UI; slice 3 adds risk logic)
// ---------------------------------------------------------------------------

function handleStepSelect(e) {
  const btn       = e.currentTarget;
  const threatId  = btn.dataset.threat;
  const dimension = btn.dataset.dimension; // "impact" or "feasibility"
  const value     = btn.dataset.value;

  // Update state
  state.ratings[threatId][dimension] = value;

  // Update button pressed states within this group
  const group = btn.closest('.step-selector__buttons');
  group.querySelectorAll('.step-btn').forEach(b => {
    b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
  });

  // Update risk display for this card (implemented in slice 3)
  updateThreatCard(threatId);

  // Update summary and progress
  updateSummaryBar();
  updateProgressCounter();
  updateExportButton();

  // Register/clear beforeunload guard based on whether any ratings now exist
  updateBeforeUnload();
}

// ---------------------------------------------------------------------------
// Update a single threat card's badge, border, and mitigations
// (risk logic wired in slice 3 — returns null here, keeps "Not rated")
// ---------------------------------------------------------------------------

function updateThreatCard(threatId) {
  const rating = state.ratings[threatId];
  const risk   = getRisk(rating.impact, rating.feasibility); // from risk.js

  const card        = document.getElementById(`card-${threatId}`);
  const badge       = document.getElementById(`badge-${threatId}`);
  const mitigations = document.getElementById(`mitigations-${threatId}`);

  // Clear existing risk classes
  card.classList.remove('threat-card--low', 'threat-card--medium', 'threat-card--high');
  badge.classList.remove('badge--low', 'badge--medium', 'badge--high', 'badge--unrated');

  if (!risk) {
    // One or both selectors not yet set
    badge.classList.add('badge--unrated');
    badge.textContent = 'Not rated';
    mitigations.classList.remove('is-open');
    mitigations.setAttribute('aria-hidden', 'true');
    return;
  }

  const riskLower = risk.toLowerCase(); // "low" | "medium" | "high"
  card.classList.add(`threat-card--${riskLower}`);
  badge.classList.add(`badge--${riskLower}`);
  badge.textContent = risk;

  // Show mitigations for Medium and High; hide for Low
  if (risk === 'Low') {
    mitigations.classList.remove('is-open');
    mitigations.setAttribute('aria-hidden', 'true');
  } else {
    mitigations.classList.add('is-open');
    mitigations.setAttribute('aria-hidden', 'false');
  }
}

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

function updateSummaryBar() {
  const bar = document.getElementById('summary-bar');
  const counts = { High: 0, Medium: 0, Low: 0, unrated: 0 };

  Object.values(state.ratings).forEach(r => {
    const risk = getRisk(r.impact, r.feasibility);
    if (risk) counts[risk]++;
    else counts.unrated++;
  });

  const total = Object.values(state.ratings).length;
  if (counts.unrated === total) {
    bar.textContent = 'Rate each threat to see your summary.';
    return;
  }

  const parts = [];
  if (counts.High   > 0) parts.push(`${counts.High} High`);
  if (counts.Medium > 0) parts.push(`${counts.Medium} Medium`);
  if (counts.Low    > 0) parts.push(`${counts.Low} Low`);
  if (counts.unrated > 0) parts.push(`${counts.unrated} Not rated`);

  bar.textContent = parts.join(' · ');
}

// ---------------------------------------------------------------------------
// Progress counter
// ---------------------------------------------------------------------------

function updateProgressCounter() {
  const total  = Object.keys(state.ratings).length;
  const rated  = Object.values(state.ratings).filter(r => r.impact && r.feasibility).length;
  document.getElementById('progress-counter').textContent =
    `${rated} of ${total} threat${total !== 1 ? 's' : ''} rated`;
}

// ---------------------------------------------------------------------------
// Export button enable/disable
// ---------------------------------------------------------------------------

function updateExportButton() {
  const total  = Object.keys(state.ratings).length;
  const rated  = Object.values(state.ratings).filter(r => r.impact && r.feasibility).length;
  const btn    = document.getElementById('btn-export');
  const allDone = rated === total && total > 0;
  btn.disabled = !allDone;
  btn.setAttribute('aria-disabled', String(!allDone));
}

// ---------------------------------------------------------------------------
// Leave warning and beforeunload guard
// Implements prd.md → States and Boundaries
// ---------------------------------------------------------------------------

// Returns true if at least one threat has been rated (either dimension set)
function hasAnyRatings() {
  return Object.values(state.ratings).some(r => r.impact || r.feasibility);
}

// Register/deregister the browser-level leave guard
function updateBeforeUnload() {
  if (hasAnyRatings()) {
    window.onbeforeunload = (e) => {
      e.preventDefault();
      // Modern browsers ignore the return string but still show their own dialog
      return '';
    };
  } else {
    window.onbeforeunload = null;
  }
}

// ← Back handler
function handleBack() {
  if (hasAnyRatings()) {
    showLeaveWarning();
  } else {
    goHome();
  }
}

function showLeaveWarning() {
  const warning = document.getElementById('leave-warning');
  const text    = document.getElementById('leave-warning-text');
  const comp    = state.selectedComponent;

  text.textContent = `Leave this assessment? Your ratings for ${comp.name} will be lost.`;
  warning.hidden = false;

  // Wire buttons (use { once: true } so handlers don't stack on repeated clicks)
  document.getElementById('btn-stay').addEventListener('click', handleStay,  { once: true });
  document.getElementById('btn-leave').addEventListener('click', handleLeave, { once: true });
}

function handleStay() {
  document.getElementById('leave-warning').hidden = true;
}

function handleLeave() {
  goHome();
}

function goHome() {
  // Clear beforeunload before navigating so the guard doesn't fire on home actions
  window.onbeforeunload = null;
  state.selectedComponent = null;
  state.ratings = {};
  document.getElementById('leave-warning').hidden = true;
  renderHomeScreen();
}

// ---------------------------------------------------------------------------
// Risk grid modal
// ---------------------------------------------------------------------------

function handleRiskGridOpen(e) {
  const threatId = e.currentTarget.dataset.threat;
  openRiskGridModal(threatId);
}

function openRiskGridModal(threatId) {
  const modal   = document.getElementById('modal-risk-grid');
  const table   = document.getElementById('risk-grid-table');
  const rating  = state.ratings[threatId] || { impact: null, feasibility: null };

  // Clear any previous highlight
  table.querySelectorAll('td.cell--highlighted').forEach(td => {
    td.classList.remove('cell--highlighted');
  });

  // Highlight the current cell if both values are set
  if (rating.impact && rating.feasibility) {
    // Rows: Negligible=1, Moderate=2, Major=3, Severe=4 (0 is header)
    // Cols: Very hard=1, Hard=2, Moderate=3, Easy=4 (0 is row header)
    const rowIndex = IMPACT_LEVELS.indexOf(rating.impact);       // 0-based tbody row
    const colIndex = FEASIBILITY_LEVELS.indexOf(rating.feasibility) + 1; // 1-based (col 0 = <th>)
    const tbody = table.querySelector('tbody');
    const row   = tbody.rows[rowIndex];
    if (row) {
      // col 0 is the <th> row header, data cells start at index 1
      const cell = row.cells[colIndex];
      if (cell) cell.classList.add('cell--highlighted');
    }
  }

  modal.hidden = false;

  // Close handlers
  const closeBtn = document.getElementById('btn-close-risk-modal');
  const onClose  = () => closeRiskGridModal();
  closeBtn.addEventListener('click', onClose, { once: true });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeRiskGridModal();
  }, { once: true });

  // Close on Escape
  const onKeydown = (e) => {
    if (e.key === 'Escape') { closeRiskGridModal(); document.removeEventListener('keydown', onKeydown); }
  };
  document.addEventListener('keydown', onKeydown);
}

function closeRiskGridModal() {
  document.getElementById('modal-risk-grid').hidden = true;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init);
