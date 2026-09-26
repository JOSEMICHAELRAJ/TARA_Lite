---
doc: spec
status: approved
---

# TARA Lite — Technical Spec

## How This Works, In Plain Language

TARA Lite is a **single HTML page** — one file the browser opens. Everything the user sees (the home screen, the threat rating screen, the confirmation panel) is already loaded; JavaScript just shows and hides the right parts at the right time. There is no server, no login, no database, and no page reloads.

The threat data — all the components, threats, explanations, categories, and mitigations — lives in a single JSON file (`data/threats.json`). When the app starts, it reads that file once and keeps the data in memory for the rest of the session.

When the user rates a threat, their choices are stored in a JavaScript object in memory (not on disk). That object is what the live summary bar reads, what turns the card colours, and what the PDF is built from. When the user leaves or refreshes, that object is gone — which is why we show a warning first.

The PDF is built by creating a hidden HTML section (invisible to the user) that is formatted exactly like the report, then passing it to a small library called **html2pdf.js** that converts it into a downloadable PDF file. No server is involved.

The whole app is three JavaScript files and one CSS file. That's it. Every line of code serves a behavior you can point to in the PRD.

## The Core Journey Through the System

Implements `prd.md → The Core Journey`.

1. **Browser opens `index.html`** → JS runs, fetches `data/threats.json`, stores all component and threat data in memory. Home screen `<div>` is shown; all others are hidden.
2. **User clicks a component card** → JS stores the selected component ID in the state object, hides the home screen, populates the threat rating screen with cards from the JSON data, shows the threat screen.
3. **User moves a step-selector on a threat card** → JS updates the state object (`ratings["tcu-1"].impact = "Severe"`). If both impact and feasibility are set, `risk.js` looks up the result in the matrix table and returns "Low", "Medium", or "High". JS updates the badge colour and card border immediately. If the result is Medium or High, JS reveals the mitigations section inside that card. Summary bar and progress counter re-render from the state object.
4. **All threats rated** → Export button's `disabled` attribute is removed.
5. **User clicks Export** → `export.js` reads the current state, builds a hidden HTML report `<div>`, calls `html2pdf.js` which converts it and triggers a download with the correct filename. The confirmation panel `<div>` is shown.
6. **User clicks "Assess another component"** → State object is reset, all card colours reset, home screen shown. OR clicks "Keep editing" → panel is hidden, rating screen stays as-is.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Structure | HTML5 | One file, no build step, runs anywhere |
| Styling | Vanilla CSS | Full control, no dependencies, learnable |
| Logic | Vanilla JavaScript (ES2020) | No framework overhead; every line is readable |
| PDF export | [html2pdf.js v0.10](https://github.com/eKoopmans/html2pdf.js) (CDN) | Browser-only auto-download with controllable filename and layout; no server required |
| Data | JSON file (`fetch` API) | Hardcoded, human-readable, editable before build |
| Hosting | [GitHub Pages](https://pages.github.com/) | Free, static, deploys directly from the repo needed for submission |

**No build step.** No `npm install`. No compilation. Open `index.html` in a browser and it runs.

**html2pdf.js note:** Loaded via a CDN `<script>` tag. The PDF renders from a hidden HTML `<div>` — colours and layout are controlled by CSS, not by drawing code. *(Verify CDN URL and version at build time: [https://cdnjs.com/libraries/html2pdf.js](https://cdnjs.com/libraries/html2pdf.js).)*

## Where It Runs and How Someone Tries It

- **Runtime:** Any modern browser (Chrome, Firefox, Edge, Safari). No install required.
- **Local dev:** Open `index.html` directly in a browser, **or** run a simple local server (`npx serve .` or VS Code Live Server) — required for `fetch()` to load `threats.json` due to browser security rules on local files.
- **Demo recording:** Run locally, record the full flow: home → pick component → rate all threats (including one that goes red) → click Export → show the downloaded PDF.
- **Deployed URL (for others to try):** GitHub Pages — push to `main`, enable Pages in the repository settings, share the `https://[username].github.io/TARA_Lite/` URL. Deploy steps in `6-ship`.
- **Submission requires:** A short demo video + a public GitHub repository. The deployed URL is a bonus, not a substitute.

## Look and Feel

Carries forward `prd.md → Look and Feel` and `scope.md → Inspiration & Identity`.

- **Base palette:** White (`#ffffff`) background, light neutral surface (`#f7f8fa`) for cards and screen background. No colour in structural chrome (nav, headers, buttons outside of risk).
- **Risk colours — reserved and meaningful:**
  - Low / green: `#22c55e` (badge), `#bbf7d0` (card border / left accent)
  - Medium / amber: `#f59e0b` (badge), `#fde68a` (card border)
  - High / red: `#ef4444` (badge), `#fecaca` (card border)
  - Not rated: `#94a3b8` (grey)
- **Typography:** [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts). Clean, readable, professional. Body 16px, threat titles 17px semi-bold, headings 24–28px.
- **Density:** Spacious. Cards have generous padding. One action at a time. No visual clutter.
- **Motion:** Card hover: `transform: translateY(-4px)` + subtle shadow, `transition: 0.2s ease`. Badge and border colour: `transition: background-color 0.3s, border-color 0.3s`. Mitigations reveal: `max-height` animation (`transition: max-height 0.3s ease`).
- **Step selectors:** Four labelled buttons per rating dimension (styled as a pill-button strip). No thumb selected by default — the "unset" state is visually obvious. Avoids the `<input type="range">` unset-state problem.
- **Copy tone:** Calm, plain English, first-person guidance ("Pick a component to start", "What you can do"). Never compliance-speak.

## Components

### `index.html` — App Shell
Implements `prd.md → Screens and Layout`.

Contains three top-level `<div>` sections (screens): `#screen-home`, `#screen-rating`, `#screen-home` (hidden at start by CSS `display: none`). Also contains the `#panel-confirmation` overlay and `#modal-risk-grid` (the "How is risk calculated?" popup). All are present in the DOM at load; JavaScript shows and hides them.

Loads: Google Fonts (Inter), html2pdf.js (CDN), `style.css`, `js/risk.js`, `js/app.js`, `js/export.js`.

### `style.css` — All Styles
Implements `prd.md → Look and Feel`.

Contains: CSS custom properties (colour tokens, spacing), screen layout, component cards, threat cards, step-selector buttons, risk badge variants (`.badge--low`, `.badge--medium`, `.badge--high`, `.badge--unrated`), card border variants, mitigations reveal animation, confirmation panel overlay, risk grid modal, responsive mobile stack (`@media (max-width: 640px)`).

### `js/risk.js` — Risk Matrix and Lookup
Implements `prd.md → Risk Calculation`.

Contains: the `RISK_MATRIX` constant (a nested JS object, exactly the 4×4 table from the PRD), and a single exported function `getRisk(impact, feasibility)` that returns `"Low"`, `"Medium"`, or `"High"`. No side effects. Easy to read and verify against the table.

```js
// Example — the full table is in the file
const RISK_MATRIX = {
  "Negligible": { "Very hard": "Low", "Hard": "Low", "Moderate": "Low",    "Easy": "Low"    },
  "Moderate":   { "Very hard": "Low", "Hard": "Low", "Moderate": "Medium", "Easy": "Medium" },
  "Major":      { "Very hard": "Low", "Hard": "Medium","Moderate":"High",  "Easy": "High"   },
  "Severe":     { "Very hard": "Medium","Hard":"Medium","Moderate":"High",  "Easy": "High"   }
};
function getRisk(impact, feasibility) {
  return RISK_MATRIX[impact][feasibility];
}
```

### `js/app.js` — Main Logic and State
Implements `prd.md → Component Selection`, `prd.md → Threat Rating`, `prd.md → States and Boundaries`.

Responsibilities:
- Fetches and stores `data/threats.json` on load
- Manages the in-memory state object: `{ selectedComponent: null, ratings: {} }`
- Renders component cards onto the home screen
- Renders threat cards onto the rating screen
- Handles step-selector clicks → updates state → calls `getRisk()` → updates badge and border colour
- Handles mitigations reveal/hide based on risk level
- Updates summary bar and progress counter after every rating change
- Enables/disables the Export button based on whether all threats are rated
- Handles ← Back click with conditional leave-warning
- Registers `window.beforeunload` handler when ratings exist
- Handles "Assess another component" (reset state, show home) and "Keep editing" (hide panel)
- Handles "How is risk calculated?" link — shows risk grid modal, highlights the current cell

### `js/export.js` — PDF Builder
Implements `prd.md → Export`, `prd.md → PDF Report Content`.

Responsibilities:
- Reads current state from `app.js`
- Sorts threats High → Medium → Low
- Builds a hidden `<div id="pdf-template">` in the DOM with the full PDF layout: header, summary, threat table, mitigations section, method section + small risk grid, footer disclaimer
- Generates the filename: `TARA_[ComponentName]_[YYYY-MM-DD].pdf`
- Calls `html2pdf().from(element).set(options).save()` to trigger the download
- After download, shows the `#panel-confirmation` overlay

## Data Model

### `data/threats.json` — Threat Data
Implements `prd.md → What We're Building` (hardcoded data).

Written by the learner before the build. Shape:

```json
{
  "components": [
    {
      "id": "tcu",
      "name": "Telematics Unit (TCU)",
      "description": "The car's connection to the outside world.",
      "threatCount": 5,
      "threats": [
        {
          "id": "tcu-1",
          "title": "Attacker takes control remotely over the cellular connection",
          "explanation": "A remote attacker exploits the cellular interface to send unauthorised commands to the vehicle.",
          "annex5Category": "External connectivity",
          "mitigations": [
            "Authenticate every message from the back-end server",
            "Encrypt all cellular traffic using TLS",
            "Implement rate limiting on remote command interfaces"
          ]
        }
      ]
    }
  ]
}
```

### In-Memory State Object (in `app.js`)
Lives only for the duration of the session. Reset on navigation back to home or on "Assess another component."

```js
let state = {
  selectedComponent: null,   // component id string, e.g. "tcu"
  ratings: {
    // keyed by threat id; null until the user sets that selector
    "tcu-1": { impact: null, feasibility: null },
    "tcu-2": { impact: "Severe", feasibility: "Easy" }
  }
};
```

A rating is "complete" when both `impact` and `feasibility` are non-null. The Export button is enabled when every threat in `state.ratings` is complete.

## File Structure

```
TARA_Lite/
├── index.html              # App shell — all screens, overlays, and templates in one file
├── style.css               # All styles, including risk colour tokens and animations
├── js/
│   ├── risk.js             # RISK_MATRIX constant + getRisk(impact, feasibility)
│   ├── app.js              # State, event handling, screen rendering, all UI logic
│   └── export.js           # PDF template builder + html2pdf.js integration
├── data/
│   └── threats.json        # All threat data — written by learner before build
├── assets/
│   └── icons/              # SVG icons for the three component cards
├── devpost/                # Planning docs (scope, PRD, spec, learner profile)
└── README.md               # How to run, what it does, link to deployed URL
```

## External Services and Dependencies

| Dependency | Use | Where | Cost | Verify at build |
|---|---|---|---|---|
| [html2pdf.js v0.10](https://github.com/eKoopmans/html2pdf.js) | PDF generation | CDN `<script>` tag | Free | Check CDN URL is live; check v0.10.x is current |
| [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) | Typography | CSS `@import` | Free | Fallback: `system-ui, sans-serif` if offline |
| [GitHub Pages](https://pages.github.com/) | Static hosting | Repo settings | Free | Enable in repo settings after push |

No API keys. No accounts required to run locally. No paid dependencies.

## Important Failure Modes

- **`threats.json` fails to load (e.g. opened as a local file without a server)** → App shows a plain error message: "Could not load threat data. Try opening the app through a local server." Startup instruction in README covers this.
- **html2pdf.js CDN is unreachable (offline)** → Export button click produces no download and no crash (html2pdf is undefined). Export button gets a fallback message: "Export unavailable — check your internet connection." *(Add a CDN availability check early in the build.)*
- **User rates a threat then navigates back** → Leave warning fires (`prd.md → States and Boundaries`). If they confirm Leave, state is reset. No data is silently lost.

## What Was Simplified and Why

- **Step-selector buttons instead of `<input type="range">`** — Four labelled `<button>` elements per dimension, styled as a pill strip. A range input has no clean "unset" state (it always has a value at one end). Buttons make the unset state obvious and require zero workarounds. The PRD describes "four labelled steps" — this delivers exactly that.
- **Single HTML file for all screens** — A real app might use a router and separate pages. For this PoC, showing and hiding `<div>` sections is equivalent to the user and far simpler to build and explain.
- **SVG icons for components** — Simple inline SVGs (car antenna, update arrows, key). No icon library dependency. Drawn or sourced at build time.

## Decisions and Open Issues

**Learner-made decisions:**
- **Vanilla HTML/CSS/JS (no framework)** — Chosen to keep every line of code readable and explainable. Tradeoff: DOM updates are manual; no automatic re-rendering when state changes.
- **html2pdf.js for PDF** — Chosen for auto-download with controlled filename and layout. Tradeoff: one CDN dependency; requires an internet connection for the first load of the library.

**Implementation details derived from learner decisions:**
- Step-selector buttons (not range inputs) — solves the unset-state problem without learner-facing complexity.
- Single HTML file with show/hide screens — simplest routing pattern for vanilla JS.
- JSON loaded via `fetch()` — requires a local server for development (not just file open). Documented in README.

**One genuine uncertainty clarified:**
- *"How does a vanilla JS app manage multiple screens without React?"* — Answer: each "screen" is a `<div>` that starts hidden (`display: none`). JavaScript adds or removes a `.hidden` class (or sets `style.display`) to switch between them. The URL doesn't change; the user sees a smooth transition. This is the pattern `5-build` will implement first, before any threat cards are built — so it's visible and testable early.

**Open issues (from `prd.md → Open Questions`):**
- **Component icons** — Style (line-art SVG) decided; specific artwork to be sourced or drawn at build time. Does not block the build.
- **html2pdf.js CDN URL** — Verify the exact CDN URL and version at the start of the build step that implements Export. Does not block earlier steps.
