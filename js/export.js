// export.js — PDF builder
// Implements spec.md > js/export.js, prd.md > Export, prd.md > PDF Report Content

// ---------------------------------------------------------------------------
// Entry point — called by the Export button click handler in app.js
// ---------------------------------------------------------------------------

function buildAndExportPDF() {
  const comp    = state.selectedComponent;
  const ratings = state.ratings;

  // Sort threats: High → Medium → Low
  const RISK_ORDER = { High: 0, Medium: 1, Low: 2 };
  const sorted = [...comp.threats].sort((a, b) => {
    const ra = getRisk(ratings[a.id].impact, ratings[a.id].feasibility) || 'Low';
    const rb = getRisk(ratings[b.id].impact, ratings[b.id].feasibility) || 'Low';
    return (RISK_ORDER[ra] ?? 3) - (RISK_ORDER[rb] ?? 3);
  });

  // Counts for summary sentence
  const counts = { High: 0, Medium: 0, Low: 0 };
  sorted.forEach(t => {
    const r = getRisk(ratings[t.id].impact, ratings[t.id].feasibility);
    if (r) counts[r]++;
  });

  const total = sorted.length;
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // Filename: TARA_ComponentName_YYYY-MM-DD.pdf
  // Spaces replaced with underscores; strip parentheses
  const safeName = comp.name.replace(/[()]/g, '').replace(/\s+/g, '_');
  const filename  = `TARA_${safeName}_${dateStr}.pdf`;

  // Summary sentence
  const highCount = counts.High;
  let summarySentence = '';
  if (highCount > 0) {
    summarySentence = `${highCount} threat${highCount > 1 ? 's are' : ' is'} rated High and need${highCount > 1 ? '' : 's'} mitigation before further review.`;
  } else if (counts.Medium > 0) {
    summarySentence = `No High threats were identified; ${counts.Medium} Medium threat${counts.Medium > 1 ? 's' : ''} should be reviewed.`;
  } else {
    summarySentence = 'All threats are rated Low and can be accepted at this stage.';
  }

  // Display-friendly counts line
  const countParts = [];
  if (counts.High   > 0) countParts.push(`${counts.High} High`);
  if (counts.Medium > 0) countParts.push(`${counts.Medium} Medium`);
  if (counts.Low    > 0) countParts.push(`${counts.Low} Low`);
  const countsLine = `${total} threat${total !== 1 ? 's' : ''} assessed: ${countParts.join(' · ')}`;

  // Build the hidden PDF template element
  const el = buildPDFTemplate({ comp, sorted, ratings, dateStr, countsLine, summarySentence });
  document.body.appendChild(el);

  // html2pdf options
  const opt = {
    margin:       [12, 12, 12, 12], // mm: top, right, bottom, left
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.97 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };

  // Check html2pdf is available (CDN may be offline)
  if (typeof html2pdf === 'undefined') {
    document.body.removeChild(el);
    const btn = document.getElementById('btn-export');
    btn.textContent = 'Export unavailable — check your internet connection.';
    btn.disabled = true;
    return;
  }

  html2pdf().from(el).set(opt).save().then(() => {
    document.body.removeChild(el);
    showConfirmationPanel(filename, countsLine);
  });
}

// ---------------------------------------------------------------------------
// Build the hidden PDF template div
// ---------------------------------------------------------------------------

function buildPDFTemplate({ comp, sorted, ratings, dateStr, countsLine, summarySentence }) {
  const el = document.createElement('div');
  el.id = 'pdf-template';
  el.setAttribute('aria-hidden', 'true');

  // Risk badge colour for inline styles (PDF rendering honours inline styles most reliably)
  function riskStyle(risk) {
    if (risk === 'High')   return 'background:#fecaca;color:#991b1b;';
    if (risk === 'Medium') return 'background:#fde68a;color:#92400e;';
    return 'background:#bbf7d0;color:#15803d;'; // Low
  }

  // Threat rows
  const threatRows = sorted.map(t => {
    const r   = ratings[t.id];
    const risk = getRisk(r.impact, r.feasibility) || 'Low';
    return `
      <tr>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:12px;line-height:1.4;">${escPDF(t.title)}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;color:#64748b;">${escPDF(t.annex5Category)}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${escPDF(r.impact)}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${escPDF(r.feasibility)}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;">
          <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;${riskStyle(risk)}">${risk}</span>
        </td>
      </tr>`;
  }).join('');

  // Mitigations section (High and Medium only)
  const mitigationThreats = sorted.filter(t => {
    const r = getRisk(ratings[t.id].impact, ratings[t.id].feasibility);
    return r === 'High' || r === 'Medium';
  });
  const lowThreats = sorted.filter(t => {
    const r = getRisk(ratings[t.id].impact, ratings[t.id].feasibility);
    return r === 'Low';
  });

  const mitigationBlocks = mitigationThreats.map(t => {
    const risk = getRisk(ratings[t.id].impact, ratings[t.id].feasibility);
    const items = t.mitigations.map(m => `<li style="margin:4px 0;font-size:12px;color:#374151;">${escPDF(m)}</li>`).join('');
    return `
      <div style="margin-bottom:16px;">
        <p style="font-size:13px;font-weight:600;margin:0 0 6px 0;">
          <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;margin-right:8px;${riskStyle(risk)}">${risk}</span>${escPDF(t.title)}
        </p>
        <ul style="padding-left:18px;margin:0;">${items}</ul>
      </div>`;
  }).join('');

  const lowBlock = lowThreats.length > 0 ? `
    <div style="margin-top:8px;">
      <p style="font-size:12px;font-weight:600;color:#374151;margin:0 0 6px 0;">Low-risk threats</p>
      ${lowThreats.map(t => `<p style="font-size:12px;color:#64748b;margin:4px 0;">
        <strong>${escPDF(t.title)}</strong> — Accepted: no mitigation required at this stage.</p>`).join('')}
    </div>` : '';

  // Small risk grid for Method section
  const gridCells = [
    ['Negligible','Low','Low','Low','Low'],
    ['Moderate',  'Low','Low','Medium','Medium'],
    ['Major',     'Low','Medium','High','High'],
    ['Severe',    'Medium','Medium','High','High'],
  ];
  const gridRows = gridCells.map(row => {
    const [label, ...cells] = row;
    const tds = cells.map(c => `<td style="padding:4px 6px;border:1px solid #e2e8f0;text-align:center;font-size:10px;font-weight:600;${riskStyle(c)}">${c}</td>`).join('');
    return `<tr><th style="padding:4px 8px;border:1px solid #e2e8f0;background:#f7f8fa;font-size:10px;text-align:left;">${label}</th>${tds}</tr>`;
  }).join('');

  el.innerHTML = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:720px;margin:0 auto;padding:0;">

      <!-- Header -->
      <div style="border-bottom:2px solid #1e293b;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="font-size:22px;font-weight:700;margin:0 0 4px 0;">TARA: ${escPDF(comp.name)}</h1>
        <p style="font-size:13px;color:#64748b;margin:0 0 2px 0;">First-pass Threat Analysis and Risk Assessment</p>
        <p style="font-size:12px;color:#94a3b8;margin:0;">Date: ${dateStr} &nbsp;·&nbsp; Generated with TARA Lite</p>
      </div>

      <!-- Summary -->
      <div style="background:#f7f8fa;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
        <h2 style="font-size:14px;font-weight:700;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Summary</h2>
        <p style="font-size:14px;font-weight:600;margin:0 0 6px 0;">${escPDF(countsLine)}</p>
        <p style="font-size:13px;color:#374151;margin:0;">${escPDF(summarySentence)}</p>
      </div>

      <!-- Threat Table -->
      <h2 style="font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Threat Assessment</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
        <thead>
          <tr style="background:#f7f8fa;">
            <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:left;font-weight:700;">Threat</th>
            <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:left;font-weight:700;">Annex 5 Category</th>
            <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:center;font-weight:700;">Impact</th>
            <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:center;font-weight:700;">Feasibility</th>
            <th style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;text-align:center;font-weight:700;">Risk</th>
          </tr>
        </thead>
        <tbody>${threatRows}</tbody>
      </table>

      <!-- Mitigations -->
      <h2 style="font-size:14px;font-weight:700;margin:0 0 16px 0;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Recommended Mitigations</h2>
      ${mitigationBlocks || '<p style="font-size:13px;color:#64748b;">No Medium or High threats identified.</p>'}
      ${lowBlock}
      <div style="margin-bottom:32px;"></div>

      <!-- Method -->
      <h2 style="font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Method</h2>
      <p style="font-size:12px;color:#374151;margin:0 0 10px 0;">Risk is determined by a fixed 4×4 lookup table (inspired by ISO/SAE 21434). Impact and attack feasibility are each rated on a four-level scale. The combination of the two gives a risk level of Low, Medium, or High.</p>
      <p style="font-size:12px;color:#374151;margin:0 0 12px 0;"><strong>Impact:</strong> Negligible / Moderate / Major / Severe &nbsp;·&nbsp; <strong>Feasibility:</strong> Very hard / Hard / Moderate / Easy</p>
      <table style="border-collapse:collapse;margin-bottom:32px;">
        <thead>
          <tr style="background:#f7f8fa;">
            <th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:10px;text-align:left;">Impact ↓ / Feasibility →</th>
            <th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:10px;text-align:center;">Very hard</th>
            <th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:10px;text-align:center;">Hard</th>
            <th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:10px;text-align:center;">Moderate</th>
            <th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:10px;text-align:center;">Easy</th>
          </tr>
        </thead>
        <tbody>${gridRows}</tbody>
      </table>

      <!-- Footer disclaimer -->
      <div style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:8px;">
        <p style="font-size:10px;color:#94a3b8;margin:0;line-height:1.5;">This is a learning and first-pass assessment, not a certified R155 compliance document. Review with a qualified cybersecurity engineer.</p>
      </div>

    </div>`;

  // Position off-screen so it doesn't flash
  el.style.cssText = 'position:fixed;left:-9999px;top:0;width:760px;background:#fff;';

  return el;
}

// ---------------------------------------------------------------------------
// Confirmation panel
// ---------------------------------------------------------------------------

function showConfirmationPanel(filename, countsLine) {
  // Clear beforeunload — export is complete, ratings are safe in the PDF
  window.onbeforeunload = null;

  document.getElementById('panel-message').textContent =
    `✓ Report downloaded: ${filename}\n${countsLine}`;

  const panel = document.getElementById('panel-confirmation');
  panel.hidden = false;

  // "Assess another component"
  document.getElementById('btn-assess-another').addEventListener('click', () => {
    panel.hidden = true;
    // goHome is defined in app.js
    goHome();
  }, { once: true });

  // "Keep editing"
  document.getElementById('btn-keep-editing').addEventListener('click', () => {
    panel.hidden = true;
    // Re-register beforeunload since ratings still exist
    updateBeforeUnload();
  }, { once: true });
}

// ---------------------------------------------------------------------------
// HTML escaping for PDF template strings
// ---------------------------------------------------------------------------

function escPDF(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
