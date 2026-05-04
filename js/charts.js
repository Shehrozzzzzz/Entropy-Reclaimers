// ======================================================
// ENTROPY RECLAIMERS — Canvas Charts (Feature 2 + Dashboard)
// ======================================================

const Charts = (() => {

  // ── Donut / Ring Chart ──────────────────────────────
  function drawDonut(canvasId, segments, centerLabel, centerSub) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.offsetWidth || 280;
    canvas.width = size; canvas.height = size;
    const cx = size / 2, cy = size / 2, r = size * 0.38, inner = r * 0.62;
    ctx.clearRect(0, 0, size, size);

    let start = -Math.PI / 2;
    const total = segments.reduce((s, seg) => s + seg.value, 0);

    segments.forEach((seg, i) => {
      const angle = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.arc(cx, cy, inner, start + angle, start, true);
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, r);
      grad.addColorStop(0, seg.color + 'BB');
      grad.addColorStop(1, seg.color);
      ctx.fillStyle = grad;
      ctx.fill();
      // Gap
      start += angle + 0.02;
    });

    // Center text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F0EEFF';
    ctx.font = `bold ${size * 0.11}px 'Space Grotesk', sans-serif`;
    ctx.fillText(centerLabel, cx, cy + size * 0.04);
    ctx.fillStyle = '#9B9BC4';
    ctx.font = `${size * 0.065}px Inter, sans-serif`;
    ctx.fillText(centerSub, cx, cy + size * 0.12);
  }

  // ── Bar Chart ───────────────────────────────────────
  function drawBar(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400, H = canvas.offsetHeight || 200;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 20, right: 16, bottom: 40, left: 48 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
    const barW = (chartW / data.length) * 0.55;
    const gap = (chartW / data.length) * 0.45;
    const limit = options.limit;

    // Grid lines
    const gridCount = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridCount; i++) {
      const y = pad.top + (chartH / gridCount) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const val = Math.round(maxVal - (maxVal / gridCount) * i);
      ctx.fillStyle = '#5A5A80'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText(val + 'm', pad.left - 6, y + 4);
    }

    // Limit line
    if (limit) {
      const ly = pad.top + chartH * (1 - limit / maxVal);
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(pad.left, ly); ctx.lineTo(W - pad.right, ly); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#EF4444'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'left';
      ctx.fillText('Limit', pad.left + 4, ly - 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = pad.left + i * (barW + gap) + gap / 2;
      const barH = (d.value / maxVal) * chartH;
      const y = pad.top + chartH - barH;

      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      const col = d.color || (d.value > (limit || 999) ? '#EF4444' : '#7C3AED');
      grad.addColorStop(0, col);
      grad.addColorStop(1, col + '66');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = '#9B9BC4'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, H - pad.bottom + 16);
    });
  }

  // ── Line Chart ──────────────────────────────────────
  function drawLine(canvasId, datasets, labels) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 500, H = canvas.offsetHeight || 180;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 16, right: 20, bottom: 36, left: 48 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const allVals = datasets.flatMap(ds => ds.data);
    const maxVal = Math.max(...allVals) * 1.15;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#5A5A80'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * (1 - i / 4)) + '', pad.left - 6, y + 4);
    }

    datasets.forEach(ds => {
      const pts = ds.data.map((v, i) => ({
        x: pad.left + (i / (ds.data.length - 1)) * chartW,
        y: pad.top + chartH - (v / maxVal) * chartH
      }));

      // Fill area
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, ds.color + '33');
      grad.addColorStop(1, ds.color + '00');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pad.top + chartH);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const cp1x = (pts[i - 1].x + pts[i].x) / 2, cp1y = pts[i - 1].y;
        const cp2x = cp1x, cp2y = pts[i].y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = ds.color; ctx.lineWidth = 2.5; ctx.stroke();

      // Dots
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ds.color; ctx.fill();
        ctx.strokeStyle = '#0A0A14'; ctx.lineWidth = 2; ctx.stroke();
      });
    });

    // X labels
    labels.forEach((lbl, i) => {
      const x = pad.left + (i / (labels.length - 1)) * chartW;
      ctx.fillStyle = '#9B9BC4'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x, H - 10);
    });
  }

  // ── Render All Charts ──────────────────────────────
  function renderAll() {
    // Donut — usage by category
    const donutSegs = [
      { value: 88, color: '#E1306C', label: 'Social' },
      { value: 35, color: '#FF0000', label: 'Video' },
      { value: 22, color: '#F5A623', label: 'Games' },
      { value: 24, color: '#7C3AED', label: 'Study' },
      { value: 18, color: '#4285F4', label: 'Browse' },
    ];
    drawDonut('usage-donut', donutSegs, '3h 7m', 'Today');

    // Daily bar chart
    const dailyData = AppData.weeklyUsage.map(d => ({
      label: d.day, value: d.minutes,
      color: d.minutes > 120 ? '#EF4444' : '#7C3AED'
    }));
    drawBar('weekly-bar', dailyData, { limit: 120 });

    // App usage line chart (parent view)
    drawLine('parent-trend', [
      { data: AppData.weeklyUsage.map(d => d.minutes), color: '#7C3AED', label: 'Total' },
      { data: [45, 55, 40, 60, 70, 48, 55], color: '#EF4444', label: 'Social' },
      { data: [24, 28, 30, 25, 20, 24, 22], color: '#10B981', label: 'Study' },
    ], AppData.weeklyUsage.map(d => d.day));

    // Parent donut — same data
    drawDonut('parent-donut', donutSegs, '3h 7m', 'Today');
  }

  return { drawDonut, drawBar, drawLine, renderAll };
})();
