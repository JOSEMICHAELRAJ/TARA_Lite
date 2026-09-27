// risk.js — Risk matrix lookup
// Implements spec.md > js/risk.js and prd.md > Risk Calculation

const RISK_MATRIX = {
  "Negligible": { "Very hard": "Low",    "Hard": "Low",    "Moderate": "Low",    "Easy": "Low"    },
  "Moderate":   { "Very hard": "Low",    "Hard": "Low",    "Moderate": "Medium", "Easy": "Medium" },
  "Major":      { "Very hard": "Low",    "Hard": "Medium", "Moderate": "High",   "Easy": "High"   },
  "Severe":     { "Very hard": "Medium", "Hard": "Medium", "Moderate": "High",   "Easy": "High"   }
};

// Impact levels in order (for UI rendering)
const IMPACT_LEVELS = ["Negligible", "Moderate", "Major", "Severe"];

// Feasibility levels in order (for UI rendering)
const FEASIBILITY_LEVELS = ["Very hard", "Hard", "Moderate", "Easy"];

/**
 * Look up risk level from impact and feasibility strings.
 * Returns "Low", "Medium", or "High".
 * Returns null if either value is missing.
 */
function getRisk(impact, feasibility) {
  if (!impact || !feasibility) return null;
  return RISK_MATRIX[impact]?.[feasibility] ?? null;
}
