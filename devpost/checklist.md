---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [ ] **1. Home screen loads with three component cards**
  Becomes usable: Open `index.html` via a local server and see the home screen — app name, tagline, three clickable component cards with names, descriptions, and threat counts, progress hint, and disclaimer. The data comes from `data/threats.json`.
  Why now: Proves the full data-load path (fetch → in-memory state → render) and the screen-switching skeleton first, so every later slice has a running shell to land in. Includes project scaffolding and placing `threats.json` in the correct location.
  PRD ref: `prd.md → The Core Journey` step 1, `prd.md → Screen 1 — Home`
  Spec ref: `spec.md → File Structure`, `spec.md → index.html`, `spec.md → js/app.js`, `spec.md → Data Model`
  Build: Create the full file structure (`index.html`, `style.css`, `js/risk.js`, `js/app.js`, `js/export.js` stubs, `data/threats.json`, `assets/icons/`). Move `devpost/data/threats.json` to `data/threats.json` (add missing `threatCount` fields). Build the home screen with Inter font, card layout, hover lift, progress hint, and disclaimer. Fetch and render from JSON on load. Show `#screen-home`; keep `#screen-rating` hidden.
  Verify (mechanical): Run `npx serve .` in the project root, open the served URL, confirm no console errors, all three cards render with correct names and threat counts.
  Learner check: Open the app in your browser. Do the three cards look like what you had in mind — names, counts, spacing? Does it feel calm and guided?
  Commit: `Scaffold project and render home screen from JSON`

- [ ] **2. Clicking a card opens the threat rating screen**
  Becomes usable: Click a component card → the home screen is replaced by the threat rating screen showing that component's threat cards, with a ← Back link.
  Why now: This is the screen-switching core. Without it nothing else can be tried end to end. The unique kernel (live risk colour) lands in the next slice; this gives it a place to live.
  PRD ref: `prd.md → The Core Journey` step 2, `prd.md → Screen 2 — Threat Rating Screen`
  Spec ref: `spec.md → js/app.js` (component selection, screen switching), `spec.md → index.html`
  Build: Wire card clicks to store selected component in state and switch to `#screen-rating`. Render the component heading and a vertical stack of threat cards — each showing title, explanation, Annex 5 category tag, empty step-selector strips (Impact / Feasibility), "Not rated" grey badge, and a neutral left border. ← Back navigates directly to home (no leave warning yet — that's slice 4).
  Verify (mechanical): Click each of the three cards and confirm the correct component name and correct number of threat cards appear. Click ← Back and confirm home screen returns.
  Learner check: Click "Telematics Unit", scroll through the threat cards. Does each one make sense? Does it feel like you're being guided, not overwhelmed?
  Commit: `Wire card navigation and render threat cards`

- [ ] **3. Sliders update risk live — the unique kernel**
  Becomes usable: On the threat rating screen, click Impact and Feasibility buttons on any threat card → the badge and card left border update instantly to green / amber / red (or stay grey if only one is set). Mitigations slide open for amber and red. Summary bar and progress counter update in real time.
  Why now: This is the unique kernel — the "aha moment" the whole app exists to deliver. It must be proved early, not last.
  PRD ref: `prd.md → Threat Rating`, `prd.md → Risk Calculation`, `prd.md → Look and Feel`
  Spec ref: `spec.md → js/risk.js`, `spec.md → js/app.js`, `spec.md → Look and Feel` (colour tokens, transitions)
  Build: Implement `RISK_MATRIX` and `getRisk()` in `risk.js`. In `app.js`, handle step-selector button clicks → update `state.ratings` → call `getRisk()` → apply `.badge--low/medium/high` and card border colour with CSS transitions. Slide mitigations open (`max-height` animation) for Medium/High, hide for Low. Render live summary bar ("N High · N Medium · N Low · N Not rated") and progress counter ("N of N threats rated"). Export button stays disabled.
  Verify (mechanical): Open the Telematics Unit. Set tcu-1 to Severe / Easy → confirm red badge and red border appear. Set tcu-2 to Negligible / Easy → confirm green badge, no mitigations. Set tcu-3 to Major / Moderate → confirm amber and mitigations visible. Check every cell of the 4×4 matrix against the PRD table (16 combinations).
  Learner check: Rate a few threats, including one that goes red. Does the colour click into place the way you imagined? Do the mitigations feel helpful?
  Commit: `Implement live risk rating — the unique kernel`

- [ ] **4. "How is risk calculated?" reveals the grid with current cell highlighted**
  Becomes usable: Clicking "How is risk calculated?" on any threat card opens the 4×4 risk grid, with the cell for that card's current Impact/Feasibility highlighted.
  Why now: Completes the teaching loop around the kernel before moving to export. Small, self-contained, and verifiable before the PDF complexity begins.
  PRD ref: `prd.md → Risk Calculation` (inline reveal, cell highlight)
  Spec ref: `spec.md → index.html` (`#modal-risk-grid`), `spec.md → js/app.js`
  Build: Add the `#modal-risk-grid` overlay with the full 4×4 table. Wire the "How is risk calculated?" link per threat card to open the modal, passing the current impact/feasibility so the correct cell gets a highlight class. Close button dismisses.
  Verify (mechanical): Set a threat to Major / Hard → open the grid → confirm the Major/Hard cell is highlighted. Change to Severe / Easy → reopen → confirm the new cell is highlighted. Open without ratings set → confirm no cell is highlighted.
  Learner check: Rate a threat to High, then click "How is risk calculated?" — does the red cell in the grid match where your ratings sit?
  Commit: `Add risk grid modal with live cell highlight`

- [ ] **5. Leave warning and beforeunload guard**
  Becomes usable: Clicking ← Back after rating at least one threat shows an in-app "Leave this assessment?" confirmation. Refreshing or closing the tab also triggers the browser's native leave prompt when ratings exist.
  Why now: Before export exists, this is the only honest protection for the user's work. It also completes the States and Boundaries spec so the full flow is correct before PDF is added.
  PRD ref: `prd.md → States and Boundaries` (back navigation, browser close)
  Spec ref: `spec.md → js/app.js` (beforeunload, leave warning)
  Build: In the ← Back handler, check if any ratings exist; if so, show an inline "Leave? / Stay" confirmation before clearing state and returning to home. Register `window.beforeunload` when `state.ratings` has at least one complete entry; deregister when state is cleared.
  Verify (mechanical): Rate one threat, click ← Back → confirm the leave prompt appears. Click "Stay" → confirm you remain on the rating screen with ratings intact. Click ← Back again → "Leave" → confirm home screen and all ratings cleared. Rate one threat, then press F5 → confirm the browser's native leave dialog fires.
  Learner check: Rate a threat, click Back. Did the warning feel right — not annoying, but clearly protecting your work?
  Commit: `Add leave warning and beforeunload guard`

- [ ] **6. Export downloads a PDF and shows the confirmation panel**
  Becomes usable: Rate all threats for a component → Export button becomes active → clicking it downloads `TARA_[Component]_[YYYY-MM-DD].pdf` → confirmation panel appears with a summary, "Assess another component", and "Keep editing".
  Why now: This completes the full core journey end to end.
  PRD ref: `prd.md → The Core Journey` steps 4–5, `prd.md → Export`, `prd.md → PDF Report Content`, `prd.md → Post-Export Confirmation Panel`
  Spec ref: `spec.md → js/export.js`, `spec.md → External Services` (html2pdf.js CDN URL)
  Build: Implement `export.js` — build a hidden `#pdf-template` div with: header (component name, date, "Generated with TARA Lite"), summary sentence, threat table sorted High→Medium→Low with coloured Risk Level labels, mitigations for High/Medium ("Accepted" line for Low), method section with small 4×4 grid, footer disclaimer. Verify CDN URL for html2pdf.js. Generate filename `TARA_[ComponentName]_[YYYY-MM-DD].pdf`. Call `html2pdf().from(el).set(opts).save()`. After download begins, show `#panel-confirmation` overlay with recap. Wire "Assess another component" (reset state, home screen) and "Keep editing" (close panel).
  Verify (mechanical): Rate all 5 TCU threats, click Export. Confirm: file downloads with correct name and today's date, PDF opens cleanly, threats are sorted High→Medium→Low, mitigations appear for High/Medium, "Accepted" appears for Low, risk grid appears, disclaimer in footer. Test "Assess another component" → home screen, ratings cleared. Test "Keep editing" → panel closes, ratings intact.
  Learner check: Export the TCU report and open the PDF. Would you hand this to a manager as a first-pass TARA? Does it look professional?
  Commit: `Add PDF export and post-export confirmation panel`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 3 (live risk colour working); learner rates threats and confirms the kernel lands as expected
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

