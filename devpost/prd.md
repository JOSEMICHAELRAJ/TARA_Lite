---
doc: prd
status: approved
---

# TARA Lite — Product Requirements

A guided, browser-based tool that walks junior automotive engineers and students through a first-pass Threat Analysis and Risk Assessment (TARA) for one vehicle component and exports a clean PDF report.
Source: `scope.md → One-line description`, `scope.md → Who It's For`

---

## The Core Journey

Source: `scope.md → The Core Loop`, `scope.md → What "Working" Looks Like`

1. **Land on the home screen.** The user sees the app name, a one-line promise ("Run your first threat analysis in 5 minutes"), a brief R155 context line, three component cards, a 3-step progress hint, and a disclaimer. No login, no setup.
2. **Pick a component.** The user clicks one of the three cards. The card lifts slightly on hover. Clicking takes them directly to the threat rating screen — no confirmation step.
3. **Rate the threats.** The user works down a vertical stack of threat cards, one per threat. For each, they move two sliders (impact and feasibility). As soon as both sliders are set, the card's left border and risk badge update live to green (Low), amber (Medium), or red (High). Mitigations appear automatically for amber and red. A live summary bar and progress counter track their progress.
4. **Export the report.** Once all threats are rated, the Export button enables. Clicking it downloads a PDF automatically. A confirmation panel appears on the same screen with two actions: start a new assessment, or keep the current ratings and revise.
5. **Success.** The user has a clean, dated PDF they can hand to their manager as a first-pass TARA. The whole flow takes about 5 minutes.

---

## Screens and Layout

### Screen 1 — Home (Component Selection)

- **App header:** "TARA Lite" (name) + "Run your first threat analysis in 5 minutes." (tagline) + "UNECE R155 requires a TARA for every connected vehicle system. Pick a component to start." (context line).
- **Component cards:** Three large cards arranged side by side on desktop, stacked vertically on mobile. Each card shows:
  - A simple icon representing the component
  - Component name
  - One-line plain-English description
  - A small tag: "N threats"
  - Hover state: card lifts slightly (visual affordance)
  - Click: navigates directly to the threat rating screen for that component
- **Progress hint:** Below the cards — "Pick component → Rate threats → Export report" — tells users the journey is three steps.
- **Disclaimer:** Footer, small and subtle — "A learning and first-pass tool, not a certified compliance tool."

The three components:
| Component | Plain-English description | Threats |
|---|---|---|
| Telematics Unit (TCU) | The car's connection to the outside world. | 5 |
| OTA Update Module | How the car receives software updates. | 4–5 |
| Keyless Entry System | How the car recognises its key. | 4–5 |

### Screen 2 — Threat Rating Screen

- **Navigation:** "← Back" link (top left) with conditional leave-warning behaviour (see States and Boundaries).
- **Component heading:** "[Component name]: N threats to assess" + plain-English description.
- **Live summary bar:** Updates in real time as threats are rated — e.g. "2 High · 1 Medium · 1 Low · 1 Not rated".
- **Threat cards:** Vertical stack, one card per threat. Each card contains:
  - **Threat title** — plain English (e.g. "Attacker takes control remotely over the cellular connection")
  - **Short explanation** — 1–2 sentences, no jargon
  - **R155 Annex 5 category tag** — small grey label (e.g. "External connectivity") — teaches structure quietly
  - **Impact slider** — four labelled steps: Negligible / Moderate / Major / Severe
  - **Feasibility slider** — four labelled steps: Very hard / Hard / Moderate / Easy
  - **Risk badge** — right side of card; starts grey "Not rated"; updates live once both sliders are set
  - **Card left border** — starts neutral; turns green / amber / red live as risk is calculated
  - **Mitigations section** — slides open inside the card for amber and red threats; lists 1–3 plain-English mitigations. Hidden for green threats (teaches: low risk can be accepted).
- **Risk matrix link:** "How is risk calculated?" — inline link that reveals the 4×4 grid (see Features → Risk Calculation) with the current threat's cell highlighted.
- **Progress counter:** Bottom of screen — "N of 5 threats rated."
- **Export button:** Disabled (grey) until all threats are rated; becomes active once the last threat is rated. This is a small reward moment.

### Post-Export Confirmation Panel (overlay on Screen 2)

Appears after the PDF downloads. Not a new screen — overlays the rating screen so ratings are not lost.

- **Success message:** "✓ Report downloaded: TARA_[Component]_[YYYY-MM-DD].pdf"
- **Recap line:** "5 threats assessed: 2 High · 2 Medium · 1 Low"
- **Two actions:**
  - "Assess another component" — clears all ratings, returns to home screen
  - "Keep editing" — closes the panel, ratings remain, user can adjust and export again

---

## Look and Feel

Source: `scope.md → Inspiration & Identity`, learner descriptions throughout the interview

- **Emotion:** Relief. "Oh, this is manageable." Not a compliance system — a guide.
- **Base palette:** Clean, modern, lots of white space. Neutral base (off-white or light grey). No colour in the navigation, header, or structural chrome.
- **Risk colours are reserved:** Green, amber, and red appear **only** on risk badges, card borders, and the PDF. Nowhere else. This makes them feel meaningful when they appear.
- **Typography:** Clean, readable sans-serif. Accessible contrast throughout.
- **Motion:** Cards lift slightly on hover. Mitigations section slides open smoothly. Risk badge and border update with a smooth colour transition — not an abrupt flash.
- **Layout:** Wizard-style, one step at a time. No overwhelming forms. The user never sees more than they need.
- **Disclaimer:** Consistently visible but never dominant — small text, muted colour.

---

## Features and Behavior

### Component Selection

- Three components are available in the PoC: Telematics Unit, OTA Update Module, Keyless Entry System.
- All three are always visible; none are locked or require a sequence.
- There is no "Start" button — clicking the card is the action.
- **Acceptance criteria:**
  - [ ] All three cards display their icon, name, description, and threat count.
  - [ ] Hovering a card produces a visible lift effect.
  - [ ] Clicking a card navigates to the correct threat screen with no intermediate step.

### Threat Rating

- Each threat starts unrated (neutral grey badge, "Not rated").
- The risk level is calculated only when **both** sliders have been moved from their default position.
- Risk badge and card left border update in real time with every slider change.
- Mitigations are shown automatically for amber and red; hidden for green.
- **Acceptance criteria:**
  - [ ] All sliders start in a neutral (unset) position; badge shows "Not rated."
  - [ ] Moving both sliders calculates and displays the correct risk level immediately.
  - [ ] Moving one slider alone does not trigger a risk colour (badge stays "Not rated").
  - [ ] Card border and badge colour match (green / amber / red) for every combination.
  - [ ] Mitigations section is visible for amber and red; absent for green.
  - [ ] Summary bar counts update correctly after each threat is rated.
  - [ ] Progress counter reflects the number of fully rated threats.

### Risk Calculation

Source: `scope.md → The Unique Kernel`

Risk is determined by a fixed 4×4 lookup table — not a formula. Stored in the data file; not computed dynamically.

| Impact ↓ / Feasibility → | Very hard | Hard | Moderate | Easy |
|---|---|---|---|---|
| **Negligible** | Low | Low | Low | Low |
| **Moderate** | Low | Low | Medium | Medium |
| **Major** | Low | Medium | High | High |
| **Severe** | Medium | Medium | High | High |

Rules behind the table (for documentation, not surfaced as UI copy):
- Negligible impact is always Low — it doesn't matter how easy the attack is.
- Severe impact is never Low — even a very hard attack deserves attention.
- High requires at least Major impact **and** at least Moderate feasibility.

**"How is risk calculated?" inline reveal:**
- A link on the threat rating screen opens the 4×4 grid.
- The user's current Impact / Feasibility combination is highlighted in the grid.
- Teaches the logic instead of hiding it.
- **Acceptance criteria:**
  - [ ] The link opens the risk grid.
  - [ ] The correct cell is highlighted based on the current slider positions.
  - [ ] Every slider+slider combination produces the correct risk level from the table.

### Export

- The Export button is disabled (greyed out) while any threat remains unrated.
- Clicking Export triggers an automatic PDF download.
- Filename format: `TARA_[Component-name]_[YYYY-MM-DD].pdf`
- The confirmation panel appears immediately after download begins.
- **Acceptance criteria:**
  - [ ] Export button is disabled until all threats are rated.
  - [ ] Clicking Export downloads a file with the correct filename format.
  - [ ] The confirmation panel appears after download.
  - [ ] "Assess another component" clears ratings and returns to home.
  - [ ] "Keep editing" closes the panel with all ratings intact.

### PDF Report Content

The PDF should look like a professional first draft, not a web screenshot.

1. **Header:** "TARA: [Component name]" / "First-pass Threat Analysis and Risk Assessment" / Date / "Generated with TARA Lite"
2. **Summary:** Threat count by level (e.g. "5 threats assessed: 2 High · 2 Medium · 1 Low") + auto-generated sentence ("2 threats are rated High and need mitigation before further review.")
3. **Threat table:** One row per threat, sorted High → Medium → Low. Columns: Threat / Annex 5 Category / Impact / Feasibility / Risk Level (coloured label).
4. **Recommended mitigations:** For each High and Medium threat: threat name + 1–3 bullet mitigations. For each Low threat: "Accepted: no mitigation required at this stage."
5. **Method:** Brief explanation of the 4-level scales and the fixed 4×4 risk matrix (inspired by ISO/SAE 21434), with a small version of the grid.
6. **Footer disclaimer:** "This is a learning and first-pass assessment, not a certified R155 compliance document. Review with a qualified cybersecurity engineer."

- **Acceptance criteria:**
  - [ ] PDF downloads with correct filename including component name and date.
  - [ ] Threat table is sorted High → Medium → Low.
  - [ ] All rated threats appear in the table with correct Impact, Feasibility, and Risk values.
  - [ ] Mitigations for High/Medium threats appear; Low threats show the "accepted" line.
  - [ ] Risk grid appears in the Method section.
  - [ ] Disclaimer appears in the footer.

---

## States and Boundaries

- **First load:** Home screen shows all three component cards. No ratings, no state.
- **During assessment — nothing rated:** Sliders at default, all badges "Not rated," Export disabled.
- **During assessment — partially rated:** Rated cards show live colours; unrated cards remain grey. Summary bar and progress counter reflect partial state.
- **During assessment — all rated:** Export button becomes active.
- **Post-export panel open:** Ratings are preserved behind the panel. "Keep editing" restores access with ratings intact.
- **Back navigation — nothing rated:** Navigate to home immediately, no warning.
- **Back navigation — at least one threat rated:** Show an in-app confirmation: "Leave this assessment? Your ratings for [Component] will be lost." Two buttons: **Stay** (default, visually highlighted) and **Leave**.
- **Browser close or refresh — at least one threat rated:** Browser's native "Leave site?" prompt fires (via `beforeunload` event). If nothing is rated, this prompt does not appear.
- **No persistence:** Ratings exist only in memory. There is no save/resume. The leave warnings are the honest substitute.
- **Mobile layout:** Component cards stack vertically. Threat cards remain full-width. Sliders remain usable at thumb size.

---

## Product Decisions

- **Risk as a lookup table, not a formula** — auditable, readable, and easy to change. The table can be updated without touching logic.
- **"How is risk calculated?" grid with highlight** — teaches the logic visibly rather than treating it as a black box.
- **Green threats hide mitigations** — explicitly teaches that low risk can be accepted, not just left empty.
- **Export disabled until all threats rated** — ensures the PDF is always complete. No partial reports.
- **Post-export panel on the same screen** — lets the user adjust a slider and export again without starting over.
- **Back-navigation warning only when work exists** — no annoying prompt on a blank screen; honest protection when it matters.
- **Green/amber/red reserved for risk only** — makes the risk colours feel significant when they appear.
- **Disclaimer present everywhere** — home screen footer, PDF footer, never hidden.
- **All data hardcoded in a single JSON file** — written by the learner before build; no backend needed.

---

## What We're Building

- Home screen with 3 component cards (icon, name, description, threat count, hover lift)
- Threat rating screen per component (back link, heading, live summary bar, threat cards, sliders, live risk colour, mitigation reveal, progress counter, Export button)
- Risk calculation via 4×4 lookup table
- "How is risk calculated?" inline grid reveal with current cell highlighted
- Post-export confirmation panel (download confirmation, "Assess another" / "Keep editing")
- In-app leave warning (conditional on rated threats)
- Browser beforeunload warning (conditional on rated threats)
- PDF export: header, summary, threat table sorted H→M→L, mitigations, method + grid, footer disclaimer
- Filename format: `TARA_[Component]_[YYYY-MM-DD].pdf`

---

## Deferred From the PoC

- **Save/resume session** — ratings are in-memory only. Leave warnings are the honest substitute.
- **Infotainment system and OBD-II port** — additional components; stretch goals after the core three work.
- **R156 cross-reference notes for OTA module** — useful but not needed to prove the core loop.

---

## Possible Later Enhancements

- Additional components (Infotainment, OBD-II port, Gateway ECU)
- R156 cross-references in the OTA module
- Save/resume via browser local storage (no backend required)
- Custom threat entry for expert users
- Shareable summary link

---

## Non-Goals

- **Certified R155 compliance output** — explicitly disclaimed everywhere; a different product entirely.
- **Login or user accounts** — nothing to persist in this version.
- **Backend or database** — all data is static and hardcoded.
- **AI-generated threats or mitigations** — content is curated; keeps the tool trustworthy and offline-friendly.
- **Multi-component assessment in a single session** — one component at a time; start fresh for the next.
- **Custom threat entry** — this is a learning tool, not an expert system.

---

## Open Questions

- **PDF rendering library** — browser print-to-PDF vs. a JS library (e.g. jsPDF, html2pdf). Consequence: affects how well colours and layout survive in the PDF. *(Resolve in `4-spec` — does not block PRD approval.)*
- **Component icons** — style (line art, emoji, SVG illustration) not yet specified. *(Resolve at build time — does not block spec.)*
- **Slider default position** — whether sliders start visually centred or at the lowest end. Unset state must be distinguishable from "Negligible / Very hard". *(Resolve in `4-spec` or at build.)*
