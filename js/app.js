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
  const map = { tcu: 'assets/icons/tcu.svg', ota: 'assets/icons/ota.svg', keyless: 'assets/icons/keyless.svg' };
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
// Component selection — navigates to rating screen (slice 2+)
// ---------------------------------------------------------------------------

function selectComponent(component) {
  state.selectedComponent = component;
  // Initialise ratings for every threat in this component
  state.ratings = {};
  component.threats.forEach(threat => {
    state.ratings[threat.id] = { impact: null, feasibility: null };
  });
  renderRatingScreen();
  showScreen('screen-rating');
}

// Stub — implemented fully in slice 2
function renderRatingScreen() {
  const heading = document.getElementById('rating-heading');
  if (heading && state.selectedComponent) {
    heading.textContent = `${state.selectedComponent.name}: ${state.selectedComponent.threatCount} threats to assess`;
  }
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
