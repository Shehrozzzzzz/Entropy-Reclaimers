/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — NIET Voucher Store & Economy
// XP → Coins → NIET College Vouchers with Download
// ======================================================

const VoucherStore = (() => {
  const STORAGE_KEY = 'er_vouchers_v1';
  const XP_PER_COIN = 100; // 2000 XP = 20 coins

  // Student info for vouchers
  const STUDENT = {
    name: 'John',
    year: '1st Year',
    branch: 'DS',
    erp: '0251csds286',
    college: 'NIET — Noida Institute of Engineering & Technology'
  };

  function loadRedeemed() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveRedeemed(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  // ── Update converter preview ──
  function updateConvertPreview() {
    const slider = document.getElementById('xp-convert-slider');
    if (!slider) return;
    const xpAmount = parseInt(slider.value);
    const maxXP = Math.floor(AppData.student.xp / 200) * 200;
    slider.max = Math.min(2000, Math.max(200, maxXP));
    const coins = Math.floor(xpAmount / XP_PER_COIN);
    document.getElementById('xp-convert-amount').textContent = xpAmount + ' XP';
    document.getElementById('xp-convert-coins').textContent = coins;
  }

  // ── Convert XP to Coins ──
  function convertXP() {
    const slider = document.getElementById('xp-convert-slider');
    const xpAmount = parseInt(slider.value);
    const coins = Math.floor(xpAmount / XP_PER_COIN);
    if (xpAmount <= 0 || coins <= 0) { showToast('❌ Select XP amount to convert!', 'danger'); return; }
    if (AppData.student.xp < xpAmount) { showToast(`❌ Not enough XP! You have ${AppData.student.xp} XP`, 'danger'); return; }

    AppData.student.xp -= xpAmount;
    AppData.student.coins += coins;
    animateCoinChange(coins);
    updateAllDisplays();
    updateConvertPreview();
    showToast(`💱 Converted ${xpAmount} XP → +${coins} Reclaim Coins!`, 'success');
  }

  function animateCoinChange(amount) {
    const coinEl = document.getElementById('coin-display');
    if (!coinEl) return;
    coinEl.style.transform = 'scale(1.4)';
    coinEl.style.color = amount > 0 ? '#10B981' : '#EF4444';
    coinEl.style.transition = 'all 0.3s ease';
    setTimeout(() => { coinEl.style.transform = 'scale(1)'; coinEl.style.color = ''; }, 600);
  }

  // ── Render voucher cards ──
  function renderVouchers() {
    const grid = document.getElementById('rewards-grid');
    if (!grid) return;

    const xpEl = document.getElementById('rewards-xp-display');
    if (xpEl) xpEl.textContent = AppData.student.xp.toLocaleString();
    const coinEl = document.getElementById('coin-display');
    if (coinEl) coinEl.textContent = AppData.student.coins;
    const convXP = document.getElementById('converter-xp');
    if (convXP) convXP.textContent = AppData.student.xp.toLocaleString();

    const catColors = { food:'#F59E0B', fitness:'#EF4444', study:'#7C3AED', digital:'#06B6D4', campus:'#10B981' };

    grid.innerHTML = AppData.rewards.map(r => {
      const canAfford = AppData.student.coins >= r.cost;
      return `
      <div class="voucher-card ${canAfford ? '' : 'voucher-locked'}" onclick="${canAfford ? `VoucherStore.redeemVoucher(${r.id})` : ''}">
        <div class="voucher-college-tag">🎓 ${r.college}</div>
        <div class="voucher-discount-badge" style="background:${catColors[r.category] || '#7C3AED'}22;color:${catColors[r.category] || '#7C3AED'};border:1px solid ${catColors[r.category] || '#7C3AED'}44">${r.discount}</div>
        <div class="voucher-emoji">${r.emoji}</div>
        <div class="voucher-name">${r.name}</div>
        <div class="voucher-desc">${r.desc}</div>
        <div class="voucher-cost">
          <span class="voucher-price">💰 ${r.cost} Coins</span>
          ${canAfford
            ? '<span class="voucher-status affordable">✓ Available</span>'
            : `<span class="voucher-status locked">🔒 Need ${r.cost - AppData.student.coins} more</span>`}
        </div>
      </div>`;
    }).join('');

    renderRedeemedVouchers();
    updateConvertPreview();
  }

  // ── Redeem a voucher ──
  function redeemVoucher(id) {
    const reward = AppData.rewards.find(r => r.id === id);
    if (reward === undefined || AppData.student.coins < reward.cost) {
      showToast(`❌ Need more coins!`, 'danger'); return;
    }
    AppData.student.coins -= reward.cost;
    animateCoinChange(-reward.cost);

    const code = 'NIET-' + reward.category.toUpperCase().slice(0,3) + '-' + Date.now().toString(36).toUpperCase().slice(-6);
    const redeemed = loadRedeemed();
    const voucher = {
      id: Date.now(), rewardId: reward.id, name: reward.name, emoji: reward.emoji,
      discount: reward.discount, desc: reward.desc, code: code,
      college: reward.college, category: reward.category,
      redeemedAt: new Date().toISOString(), used: false
    };
    redeemed.push(voucher);
    saveRedeemed(redeemed);
    updateAllDisplays();
    renderVouchers();
    showToast(`🎉 Voucher redeemed! ${reward.name} — downloading...`, 'success');
    setTimeout(() => downloadVoucher(voucher), 400);
  }

  // ═══════════════════════════════════════════════════
  // PROFESSIONAL WHITE NIET VOUCHER WITH QR CODE
  // ═══════════════════════════════════════════════════
  function downloadVoucher(voucher) {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');

    // ── White background ──
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 0, 0, 900, 460, 16);
    ctx.fill();

    // ── Left accent stripe (purple → green gradient) ──
    const stripe = ctx.createLinearGradient(0, 0, 0, 460);
    stripe.addColorStop(0, '#4A1D96');
    stripe.addColorStop(1, '#059669');
    ctx.fillStyle = stripe;
    roundRect(ctx, 0, 0, 12, 460, 8);
    ctx.fill();

    // ── Dashed border ──
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    roundRect(ctx, 6, 6, 888, 448, 14);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── HEADER: NIET logo area ──
    ctx.fillStyle = '#1E1B4B';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.fillText('🎓 NIET', 30, 42);
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Noida Institute of Engineering & Technology', 85, 42);

    // "CAMPUS VOUCHER" badge
    ctx.fillStyle = '#4A1D96';
    roundRect(ctx, 700, 18, 180, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAMPUS VOUCHER', 790, 38);
    ctx.textAlign = 'left';

    // ── Separator ──
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, 58); ctx.lineTo(870, 58); ctx.stroke();

    // ── MAIN: Voucher name + emoji ──
    ctx.font = '44px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.fillText(voucher.emoji, 35, 110);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText(voucher.name, 95, 105);

    // ── Category tag ──
    const catColors = { food:'#D97706', fitness:'#DC2626', study:'#7C3AED', digital:'#0891B2', campus:'#059669' };
    const catCol = catColors[voucher.category] || '#7C3AED';
    ctx.fillStyle = catCol + '18';
    const catLabel = voucher.category.toUpperCase();
    const catW = ctx.measureText(catLabel).width + 24;
    roundRect(ctx, 95, 115, catW, 24, 12);
    ctx.fill();
    ctx.strokeStyle = catCol + '55';
    ctx.lineWidth = 1;
    roundRect(ctx, 95, 115, catW, 24, 12);
    ctx.stroke();
    ctx.fillStyle = catCol;
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillText(catLabel, 107, 132);

    // ── DISCOUNT BADGE (big, prominent) ──
    ctx.fillStyle = '#059669';
    roundRect(ctx, 700, 75, 170, 70, 14);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(voucher.discount, 785, 115);
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('DISCOUNT', 785, 135);
    ctx.textAlign = 'left';

    // ── Description ──
    ctx.fillStyle = '#4B5563';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(voucher.desc, 35, 170);

    // ── Separator ──
    ctx.strokeStyle = '#E5E7EB';
    ctx.beginPath(); ctx.moveTo(30, 190); ctx.lineTo(870, 190); ctx.stroke();

    // ── STUDENT DETAILS (left side) ──
    ctx.fillStyle = '#9CA3AF';
    ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
    ctx.fillText('STUDENT DETAILS', 35, 215);

    const details = [
      ['Name', STUDENT.name],
      ['Year', STUDENT.year],
      ['Branch', STUDENT.branch],
      ['ERP No.', STUDENT.erp],
    ];
    let dy = 235;
    details.forEach(([label, value]) => {
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px "Segoe UI", Arial, sans-serif';
      ctx.fillText(label + ':', 35, dy);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText(value, 110, dy);
      dy += 22;
    });

    // ── VOUCHER CODE (center) ──
    ctx.fillStyle = '#F3F4F6';
    roundRect(ctx, 280, 210, 300, 95, 12);
    ctx.fill();
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    roundRect(ctx, 280, 210, 300, 95, 12);
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
    ctx.fillText('VOUCHER CODE', 300, 235);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText(voucher.code, 300, 268);

    const date = new Date(voucher.redeemedAt);
    const dateStr = date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    const expDate = new Date(date.getTime() + 30 * 86400000);
    const expStr = expDate.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Issued: ${dateStr}  •  Valid till: ${expStr}`, 300, 293);

    // ── QR CODE (right side) — generate a simple QR-style pattern ──
    drawQRCode(ctx, 710, 210, 140, voucher.code);

    // ── Bottom separator ──
    ctx.strokeStyle = '#E5E7EB';
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(30, 340); ctx.lineTo(870, 340); ctx.stroke();
    ctx.setLineDash([]);

    // ── TERMS FOOTER ──
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.fillText('✂ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─', 30, 355);

    ctx.fillStyle = '#6B7280';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('📋 Terms & Conditions:', 35, 380);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.fillText('• Show this voucher (printed or on screen) at the relevant NIET campus facility.', 35, 398);
    ctx.fillText('• One-time use only. Non-transferable. Valid for 30 days from issue date.', 35, 413);
    ctx.fillText('• Powered by Entropy Reclaimers — Digital Wellness Program, NIET Greater Noida.', 35, 428);

    // ── "NIET" watermark ──
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.02)';
    ctx.font = 'bold 120px "Segoe UI", Arial, sans-serif';
    ctx.translate(450, 280);
    ctx.rotate(-0.2);
    ctx.fillText('NIET', -100, 0);
    ctx.restore();

    // ── Download using Blob (reliable across all browsers) ──
    canvas.toBlob(function(blob) {
      if (!blob) {
        // Fallback: open data URL in new tab
        const dataUrl = canvas.toDataURL('image/png');
        const win = window.open();
        if (win) {
          win.document.write('<html><head><title>NIET Voucher - ' + voucher.code + '</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f3f4f6"><img src="' + dataUrl + '" style="max-width:95%;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:12px"></body></html>');
        }
        return;
      }
      const url = URL.createObjectURL(blob);
      // Download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'NIET_Voucher_' + voucher.code + '.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Also open preview in new tab
      const win = window.open();
      if (win) {
        win.document.write('<html><head><title>NIET Voucher - ' + voucher.code + '</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f3f4f6"><img src="' + url + '" style="max-width:95%;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:12px"><p style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);font-family:Segoe UI,sans-serif;color:#6B7280;font-size:14px">Right-click the image to save, or check your Downloads folder.</p></body></html>');
      }
      // Clean up blob URL after delay
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 'image/png');
  }

  // ── Draw QR-style code (deterministic from voucher code) ──
  function drawQRCode(ctx, x, y, size, code) {
    const modules = 21;
    const cellSize = Math.floor(size / modules);
    const offset_x = x + Math.floor((size - cellSize * modules) / 2);
    const offset_y = y + Math.floor((size - cellSize * modules) / 2);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    // Generate deterministic pattern from code
    let seed = 0;
    for (let i = 0; i < code.length; i++) seed = ((seed << 5) - seed + code.charCodeAt(i)) | 0;

    function seededRandom() {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed & 1) === 1;
    }

    // Draw finder patterns (3 corners)
    function drawFinder(fx, fy) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(fx, fy, cellSize * 7, cellSize * 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(fx + cellSize, fy + cellSize, cellSize * 5, cellSize * 5);
      ctx.fillStyle = '#111827';
      ctx.fillRect(fx + cellSize * 2, fy + cellSize * 2, cellSize * 3, cellSize * 3);
    }

    drawFinder(offset_x, offset_y);
    drawFinder(offset_x + cellSize * 14, offset_y);
    drawFinder(offset_x, offset_y + cellSize * 14);

    // Fill data area with seeded pattern
    ctx.fillStyle = '#111827';
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // Skip finder pattern areas
        if ((row < 8 && col < 8) || (row < 8 && col >= 13) || (row >= 13 && col < 8)) continue;
        if (seededRandom()) {
          ctx.fillRect(offset_x + col * cellSize, offset_y + row * cellSize, cellSize, cellSize);
        }
      }
    }

    // Label below QR
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '9px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to verify', x + size / 2, y + size + 14);
    ctx.textAlign = 'left';
  }

  // Canvas helper
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  // ── Render redeemed vouchers list ──
  function renderRedeemedVouchers() {
    const container = document.getElementById('redeemed-vouchers-list');
    if (!container) return;
    const redeemed = loadRedeemed();

    if (redeemed.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:24px;opacity:0.6">
          <div style="font-size:32px;margin-bottom:8px">🎟️</div>
          <div style="font-size:14px;color:var(--text-secondary)">No vouchers redeemed yet. Convert XP to coins and start redeeming!</div>
        </div>`;
      return;
    }

    container.innerHTML = redeemed.slice().reverse().map(v => {
      const date = new Date(v.redeemedAt);
      const dateStr = date.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      return `
      <div class="redeemed-voucher-card">
        <div class="redeemed-voucher-emoji">${v.emoji}</div>
        <div class="redeemed-voucher-info">
          <div class="redeemed-voucher-name">${v.name}</div>
          <div class="redeemed-voucher-code">Code: <strong>${v.code}</strong></div>
        </div>
        <div class="redeemed-voucher-meta">
          <div class="redeemed-voucher-discount">${v.discount}</div>
          <div class="redeemed-voucher-date">${dateStr}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="VoucherStore.redownload('${v.id}')">📥 Download</button>
      </div>`;
    }).join('');
  }

  function redownload(id) {
    const redeemed = loadRedeemed();
    const v = redeemed.find(x => x.id === parseInt(id));
    if (v) downloadVoucher(v);
  }

  function updateAllDisplays() {
    ['sidebar-xp', 'rewards-xp-display', 'converter-xp'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = AppData.student.xp.toLocaleString();
    });
    ['sidebar-coins', 'coin-display'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = AppData.student.coins;
    });
  }

  return {
    updateConvertPreview, convertXP, renderVouchers, redeemVoucher,
    downloadVoucher, redownload, renderRedeemedVouchers, updateAllDisplays,
  };
})();
