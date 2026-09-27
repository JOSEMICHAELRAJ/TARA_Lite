// export.js — PDF builder using jsPDF + jspdf-autotable
// Draws the report directly with PDF primitives — no HTML screenshot.
// Implements spec.md > js/export.js, prd.md > Export, prd.md > PDF Report Content

// ---------------------------------------------------------------------------
// Colour constants (RGB arrays for jsPDF)
// ---------------------------------------------------------------------------

const PDF_COLORS = {
  high:       { fill: [254, 202, 202], text: [153,  27,  27] }, // #fecaca / #991b1b
  medium:     { fill: [253, 230, 138], text: [146,  64,  14] }, // #fde68a / #92400e
  low:        { fill: [187, 247, 208], text: [ 21, 128,  61] }, // #bbf7d0 / #15803d
  headerBg:   [247, 248, 250],                                   // #f7f8fa
  border:     [226, 232, 240],                                   // #e2e8f0
  textMain:   [ 30,  41,  59],                                   // #1e293b
  textMuted:  [100, 116, 139],                                   // #64748b
  textSubtle: [148, 163, 184],                                   // #94a3b8
  white:      [255, 255, 255],
  ruleDark:   [ 30,  41,  59],                                   // header rule
};

// Risk matrix — same source of truth as risk.js (read-only here)
const PDF_RISK_MATRIX = {
  'Negligible': { 'Very hard': 'Low',    'Hard': 'Low',    'Moderate': 'Low',    'Easy': 'Low'    },
  'Moderate':   { 'Very hard': 'Low',    'Hard': 'Low',    'Moderate': 'Medium', 'Easy': 'Medium' },
  'Major':      { 'Very hard': 'Low',    'Hard': 'Medium', 'Moderate': 'High',   'Easy': 'High'   },
  'Severe':     { 'Very hard': 'Medium', 'Hard': 'Medium', 'Moderate': 'High',   'Easy': 'High'   },
};

// ---------------------------------------------------------------------------
// Entry point — called from the Export button click handler in app.js
// ---------------------------------------------------------------------------

function buildAndExportPDF() {
  // Guard: jsPDF must be loaded
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    const btn = document.getElementById('btn-export');
    btn.textContent = 'Export unavailable — library failed to load.';
    btn.disabled = true;
    return;
  }

  const { jsPDF } = window.jspdf;
  const comp    = state.selectedComponent;
  const ratings = state.ratings;

  // Sort threats High → Medium → Low
  const ORDER = { High: 0, Medium: 1, Low: 2 };
  const sorted = [...comp.threats].sort((a, b) => {
    const ra = PDF_RISK_MATRIX[ratings[a.id].impact]?.[ratings[a.id].feasibility] ?? 'Low';
    const rb = PDF_RISK_MATRIX[ratings[b.id].impact]?.[ratings[b.id].feasibility] ?? 'Low';
    return (ORDER[ra] ?? 3) - (ORDER[rb] ?? 3);
  });

  // Counts
  const counts = { High: 0, Medium: 0, Low: 0 };
  sorted.forEach(t => {
    const r = PDF_RISK_MATRIX[ratings[t.id].impact]?.[ratings[t.id].feasibility] ?? 'Low';
    counts[r]++;
  });

  const total   = sorted.length;
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = comp.name.replace(/[()]/g, '').replace(/\s+/g, '_');
  const filename  = `TARA_${safeName}_${dateStr}.pdf`;

  // Summary text
  const countParts = [];
  if (counts.High   > 0) countParts.push(`${counts.High} High`);
  if (counts.Medium > 0) countParts.push(`${counts.Medium} Medium`);
  if (counts.Low    > 0) countParts.push(`${counts.Low} Low`);
  const countsLine = `${total} threat${total !== 1 ? 's' : ''} assessed: ${countParts.join(' \u00b7 ')}`;

  let summarySentence;
  if (counts.High > 0) {
    summarySentence = `${counts.High} threat${counts.High > 1 ? 's are' : ' is'} rated High and need${counts.High > 1 ? '' : 's'} mitigation before further review.`;
  } else if (counts.Medium > 0) {
    summarySentence = `No High threats were identified. ${counts.Medium} Medium threat${counts.Medium > 1 ? 's' : ''} should be reviewed.`;
  } else {
    summarySentence = 'All threats are rated Low and can be accepted at this stage.';
  }

  // ---------------------------------------------------------------------------
  // Build PDF
  // ---------------------------------------------------------------------------

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W   = doc.internal.pageSize.getWidth();   // 210
  const H   = doc.internal.pageSize.getHeight();  // 297
  const ML  = 14;  // margin left
  const MR  = 14;  // margin right
  const CW  = W - ML - MR;  // content width = 182

  let y = 14; // current vertical cursor

  // Helper: add a new page and reset cursor
  function newPage() {
    doc.addPage();
    y = 16;
    drawFooter();
  }

  // Helper: ensure there's at least `needed` mm before next page break
  function ensureSpace(needed) {
    if (y + needed > H - 18) newPage();
  }

  // ---------------------------------------------------------------------------
  // Footer — draws on every page (called once per page)
  // ---------------------------------------------------------------------------

  function drawFooter() {
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(ML, pageH - 12, W - MR, pageH - 12);
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.textSubtle);
    doc.text(
      'This is a learning and first-pass assessment, not a certified R155 compliance document. Review with a qualified cybersecurity engineer.',
      ML, pageH - 8, { maxWidth: CW }
    );
    // Page number
    doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, W - MR, pageH - 8, { align: 'right' });
  }

  // Draw footer on page 1 immediately
  drawFooter();

  // ---------------------------------------------------------------------------
  // 1. Header
  // ---------------------------------------------------------------------------

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMain);
  doc.text(`TARA: ${comp.name}`, ML, y);
  y += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('First-pass Threat Analysis and Risk Assessment', ML, y);
  y += 5;

  // Date + generator line
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.textSubtle);
  doc.text(`Date: ${dateStr}   \u00b7   Generated with TARA Lite`, ML, y);
  y += 5;

  // Rule
  doc.setDrawColor(...PDF_COLORS.ruleDark);
  doc.setLineWidth(0.5);
  doc.line(ML, y, W - MR, y);
  y += 7;

  // ---------------------------------------------------------------------------
  // 2. Summary box
  // ---------------------------------------------------------------------------

  ensureSpace(22);

  // Box background
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 20, 2, 2, 'FD');

  // "SUMMARY" label
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('SUMMARY', ML + 4, y + 5);

  // Counts line
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMain);
  doc.text(countsLine, ML + 4, y + 10);

  // Summary sentence
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  const sentenceLines = doc.splitTextToSize(summarySentence, CW - 8);
  doc.text(sentenceLines, ML + 4, y + 16);

  y += 26;

  // ---------------------------------------------------------------------------
  // 3. Threat table
  // ---------------------------------------------------------------------------

  ensureSpace(20);

  // Section heading
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('THREAT ASSESSMENT', ML, y);
  y += 5;

  // Build table body
  const tableBody = sorted.map(t => {
    const r    = ratings[t.id];
    const risk = PDF_RISK_MATRIX[r.impact]?.[r.feasibility] ?? 'Low';
    return [t.title, t.annex5Category, r.impact, r.feasibility, risk];
  });

  doc.autoTable({
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Threat', 'Annex 5 Category', 'Impact', 'Feasibility', 'Risk']],
    body: tableBody,
    styles: {
      font:      'helvetica',
      fontSize:  9,
      cellPadding: 3,
      textColor:  PDF_COLORS.textMain,
      lineColor:  PDF_COLORS.border,
      lineWidth:  0.3,
      overflow:  'linebreak',
    },
    headStyles: {
      fillColor:  PDF_COLORS.headerBg,
      textColor:  PDF_COLORS.textMuted,
      fontStyle:  'bold',
      fontSize:   8.5,
    },
    columnStyles: {
      0: { cellWidth: 68 },   // Threat
      1: { cellWidth: 42 },   // Category
      2: { cellWidth: 22, halign: 'center' },  // Impact
      3: { cellWidth: 26, halign: 'center' },  // Feasibility
      4: { cellWidth: 24, halign: 'center' },  // Risk
    },
    // Colour the Risk cell per risk level
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 4) {
        const risk = data.cell.raw;
        const c = PDF_COLORS[risk.toLowerCase()];
        if (c) {
          data.cell.styles.fillColor = c.fill;
          data.cell.styles.textColor = c.text;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    // Track where the table ends
    didDrawPage() { drawFooter(); },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ---------------------------------------------------------------------------
  // 4. Mitigations
  // ---------------------------------------------------------------------------

  ensureSpace(16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('RECOMMENDED MITIGATIONS', ML, y);
  y += 5;

  const highMedium = sorted.filter(t => {
    const r = PDF_RISK_MATRIX[ratings[t.id].impact]?.[ratings[t.id].feasibility];
    return r === 'High' || r === 'Medium';
  });
  const lowThreats = sorted.filter(t => {
    const r = PDF_RISK_MATRIX[ratings[t.id].impact]?.[ratings[t.id].feasibility];
    return r === 'Low';
  });

  if (highMedium.length === 0) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text('No High or Medium threats identified.', ML, y);
    y += 7;
  }

  highMedium.forEach(t => {
    const risk = PDF_RISK_MATRIX[ratings[t.id].impact]?.[ratings[t.id].feasibility] ?? 'Low';
    const c    = PDF_COLORS[risk.toLowerCase()];

    ensureSpace(14);

    // Risk badge pill
    const badgeW = 16, badgeH = 5;
    doc.setFillColor(...c.fill);
    doc.roundedRect(ML, y - 3.5, badgeW, badgeH, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...c.text);
    doc.text(risk, ML + badgeW / 2, y, { align: 'center' });

    // Threat title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textMain);
    const titleLines = doc.splitTextToSize(t.title, CW - badgeW - 4);
    doc.text(titleLines, ML + badgeW + 4, y);
    y += titleLines.length * 5 + 2;

    // Mitigation bullets
    t.mitigations.forEach(m => {
      ensureSpace(7);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.textMuted);
      const bulletLines = doc.splitTextToSize(`\u2192  ${m}`, CW - 6);
      doc.text(bulletLines, ML + 4, y);
      y += bulletLines.length * 4.5 + 1.5;
    });

    y += 4;
  });

  // Low threats — "Accepted" line
  if (lowThreats.length > 0) {
    ensureSpace(10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text('Low-risk threats', ML, y);
    y += 5;

    lowThreats.forEach(t => {
      ensureSpace(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PDF_COLORS.textMuted);
      const line = doc.splitTextToSize(`${t.title} \u2014 Accepted: no mitigation required at this stage.`, CW - 4);
      doc.text(line, ML + 2, y);
      y += line.length * 4.5 + 2;
    });
  }

  y += 4;

  // ---------------------------------------------------------------------------
  // 5. Method + risk grid
  // ---------------------------------------------------------------------------

  ensureSpace(60);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('METHOD', ML, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  const methodText =
    'Risk is determined by a fixed 4\u00d74 lookup table (inspired by ISO/SAE 21434). ' +
    'Impact and attack feasibility are each rated on four levels. ' +
    'Their combination gives a risk level of Low, Medium, or High.';
  const methodLines = doc.splitTextToSize(methodText, CW);
  doc.text(methodLines, ML, y);
  y += methodLines.length * 4.5 + 4;

  // Scale labels
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMain);
  doc.text('Impact:', ML, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('Negligible \u00b7 Moderate \u00b7 Major \u00b7 Severe', ML + 16, y);
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.textMain);
  doc.text('Feasibility:', ML, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text('Very hard \u00b7 Hard \u00b7 Moderate \u00b7 Easy', ML + 22, y);
  y += 7;

  // 4x4 risk grid via autoTable
  const gridImpacts     = ['Negligible', 'Moderate', 'Major', 'Severe'];
  const gridFeasibility = ['Very hard', 'Hard', 'Moderate', 'Easy'];

  const gridBody = gridImpacts.map(imp =>
    [imp, ...gridFeasibility.map(f => PDF_RISK_MATRIX[imp][f])]
  );

  doc.autoTable({
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Impact \u2193 / Feasibility \u2192', ...gridFeasibility]],
    body: gridBody,
    styles: {
      font:       'helvetica',
      fontSize:   8,
      cellPadding: 2.5,
      lineColor:   PDF_COLORS.border,
      lineWidth:   0.3,
      halign:     'center',
    },
    headStyles: {
      fillColor: PDF_COLORS.headerBg,
      textColor: PDF_COLORS.textMuted,
      fontStyle: 'bold',
      fontSize:  7.5,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 32, textColor: PDF_COLORS.textMuted },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index > 0) {
        const risk = data.cell.raw;
        const c = PDF_COLORS[risk.toLowerCase()];
        if (c) {
          data.cell.styles.fillColor = c.fill;
          data.cell.styles.textColor = c.text;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage() { drawFooter(); },
  });

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  doc.save(filename);
  showConfirmationPanel(filename, countsLine);
}

// ---------------------------------------------------------------------------
// Confirmation panel
// ---------------------------------------------------------------------------

function showConfirmationPanel(filename, countsLine) {
  // Clear beforeunload — report is saved
  window.onbeforeunload = null;

  const msg = document.getElementById('panel-message');
  msg.textContent = `${filename}\n${countsLine}`;

  const panel = document.getElementById('panel-confirmation');
  panel.hidden = false;

  document.getElementById('btn-assess-another').addEventListener('click', () => {
    panel.hidden = true;
    goHome();
  }, { once: true });

  document.getElementById('btn-keep-editing').addEventListener('click', () => {
    panel.hidden = true;
    updateBeforeUnload(); // re-register guard since ratings still exist
  }, { once: true });
}
