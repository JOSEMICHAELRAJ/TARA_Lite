---
doc: scope
status: approved
---

# TARA Lite

A guided, browser-based tool that walks junior automotive engineers through a first-pass Threat Analysis and Risk Assessment (TARA) for a vehicle component and exports a clean PDF report.

## The Unique Kernel

The live risk colour that updates in real time as you move the sliders — green to amber to red — is the "aha moment" where abstract risk suddenly clicks. Without it, it's just a form.

## Why Now
UNECE R155 became mandatory for all new vehicles sold in the EU from July 2024, and TARA is its core requirement. Automotive suppliers are being pulled into compliance, but beginner-friendly tools don't exist — existing ones are expensive and built for experts.

## Who It's For

A first-month junior engineer at a small automotive supplier, handed a TARA deadline they've never done before. They've heard of R155 but never run one. They don't have access to expensive expert tools. They need a guided starting point that teaches the structure as they go, not a compliance system.

Also useful for: students studying automotive cybersecurity who want hands-on experience with TARA methodology.

## The Core Loop

They open the app → pick a vehicle component from three clean cards → review 4–5 pre-loaded threats (each with a plain-English explanation and an R155 Annex 5 category tag) → move two sliders per threat ("How bad would this be?" and "How easy is it to pull off?") → watch the risk colour update live → read 1–3 mitigations for any amber or red threat → hit Export and download a clean PDF they could hand to their manager as a starting point. The whole flow takes about 5 minutes.

## Inspiration & Identity

Calm and guided — like a wizard, one step at a time, not a giant form. Professional enough that someone could show the PDF to a manager, but approachable enough that a student isn't intimidated. Each step should feel like it's teaching something, not just collecting data.

## Why This Matters to the Learner

"I'm building the thing I wished existed when I was learning TARA." Moving towards automotive cybersecurity, found the regulation confusing at first, wanted something that teaches R155 structure as you use it.

## What "Working" Looks Like

A user picks "Telematics Unit," sees its threats with plain-English descriptions and R155 Annex 5 tags, moves the sliders for "cellular attack" until it turns red, reads what they'd do about it, then clicks Export and downloads a clean PDF — all in under 5 minutes. That sequence, end to end, is the proof.

**Success test:** Someone with no cybersecurity background can complete a TARA for one component and export the PDF in under 5 minutes.

## The PoC Boundary

**In:**
- 3 vehicle components: Telematics Unit (TCU), OTA Update Module, Keyless Entry System
- ~12–15 pre-loaded threats (4–5 per component), each with a plain-English description, R155 Annex 5 category tag, and 1–3 mitigations
- Two sliders per threat: Impact and Attack Feasibility (each 1–5 or similar scale)
- Live colour-coded risk level (green / amber / red) that updates as sliders move
- Mitigations shown for amber and red threats
- PDF export of the completed assessment
- Disclaimer: learning tool only, not a certified compliance output
- All threat data hardcoded in a single JSON file — written by the learner before build, dropped straight in. No login, no database, no backend, no API calls

**Out of scope for PoC:**
- Additional acomponents beyond the three above
- User-entered custom threats
- AI-generated content
- Any backend or server

## Later

- Infotainment system component
- OBD-II port component
- R156 cross-reference notes in the OTA module
- Save/resume session

## Explicitly Cut

- **Login / user accounts** — adds complexity with zero proof-of-concept value; nothing to persist
- **Backend / database** — all data is static; no server needed
- **AI API calls** — threats and mitigations are curated, not generated; keeps the tool trustworthy and offline-friendly
- **Custom threat entry** — learner scope, not expert tool
- **Multi-user / sharing** — out of scope for this hackathon
- **Certified compliance output** — explicitly disclaimed; a different product entirely
