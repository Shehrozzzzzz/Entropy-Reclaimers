/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — Main App Router & Init
// ======================================================

// ── Toast Helper ────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✅', warning: '⚠️', danger: '🔴', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

// ── Navigation ───────────────────────────────────────
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const navItem = document.querySelector(`[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');
  // Re-render charts when switching to chart pages
  if (['dashboard', 'analytics'].includes(pageId)) {
    setTimeout(() => Charts.renderAll(), 100);
  }
  if (typeof ParentAIChatbot !== 'undefined') ParentAIChatbot.showFab();
  if (pageId === 'rewards') renderRewards();
  if (pageId === 'leaderboard') LeaderboardEngine.render();
  if (pageId === 'quests') {
    if (typeof QuestSystem !== 'undefined') QuestSystem.renderQuests();
    const qxp = document.getElementById('quest-xp-display');
    const qc = document.getElementById('quest-coin-display');
    if (qxp) qxp.textContent = AppData.student.xp.toLocaleString();
    if (qc) qc.textContent = AppData.student.coins;
  }
}

// ── Leaderboard Engine ───────────────────────────────
const LeaderboardEngine = (() => {
  let currentFilter = 'all';
  let currentSort = 'xp';

  function getFiltered() {
    let data = [...AppData.leaderboard];
    const me = data.find(p => p.isMe);
    if (me) me.xp = AppData.student.xp;
    if (currentFilter !== 'all') data = data.filter(p => p.branch === currentFilter);
    data.sort((a, b) => b[currentSort] - a[currentSort]);
    data.forEach((p, i) => p.rank = i + 1);
    return data;
  }

  function render() {
    const data = getFiltered();
    render3DTower(data);
    renderPodium(data.slice(0, 3));
    renderList(data);
    renderMyStats(data);
    renderBranchStandings();
  }

  let previousLeader = null;

  function render3DTower(data) {
    const scene = document.getElementById('tower-scene');
    const starsEl = document.getElementById('tower-stars');
    if (!scene) return;

    // Generate stars once
    if (starsEl && !starsEl.children.length) {
      for (let i = 0; i < 40; i++) {
        const star = document.createElement('div');
        star.style.cssText = `position:absolute;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;background:white;border-radius:50%;top:${Math.random()*60}%;left:${Math.random()*100}%;opacity:${0.3+Math.random()*0.7};animation:twinkle ${1+Math.random()*3}s ease-in-out infinite ${Math.random()*2}s`;
        starsEl.appendChild(star);
      }
    }

    const maxXP = data[0] ? data[0].xp : 1;
    const stepWidth = 420 / data.length;
    const maxHeight = 240;
    const colors = ['#F59E0B', '#9CA3AF', '#CD7F32'];

    scene.innerHTML = data.map((p, i) => {
      const h = Math.max(30, (p.xp / maxXP) * maxHeight);
      const x = i * stepWidth;
      const isMe = p.isMe;
      const stepColor = i < 3 ? colors[i] : (isMe ? '#7C3AED' : '#3B3B5C');
      const glowColor = isMe ? '0 0 20px rgba(124,58,237,0.6)' : (i < 3 ? `0 0 15px ${colors[i]}44` : 'none');
      const climbDelay = (i * 0.12).toFixed(2);

      return `
        <div class="tower-step" style="
          position:absolute;
          bottom:0;left:${x}px;
          width:${stepWidth - 4}px;
          height:${h}px;
          transition:height 0.8s cubic-bezier(0.34,1.56,0.64,1), left 0.6s ease;
          cursor:pointer;
          z-index:${data.length - i};
        " 
        onmouseover="this.querySelector('.tower-label').style.opacity=1;this.style.filter='brightness(1.3)'"
        onmouseout="this.querySelector('.tower-label').style.opacity=${isMe||i<3?1:0};this.style.filter=''">
          <!-- 3D Step Block -->
          <div style="
            position:absolute;bottom:0;width:100%;height:100%;
            background:linear-gradient(180deg,${stepColor},${stepColor}88);
            border-radius:6px 6px 0 0;
            border:1px solid ${stepColor}88;
            box-shadow:${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1);
            transform:skewY(${i < data.length/2 ? -2 : 2}deg);
          "></div>
          <!-- Climbing Person -->
          <div class="climber" style="
            position:absolute;top:-32px;left:50%;transform:translateX(-50%);
            font-size:${isMe ? 28 : 22}px;
            filter:${isMe ? 'drop-shadow(0 0 8px #7C3AED)' : ''};
            animation:climb 0.8s ease ${climbDelay}s backwards, ${isMe ? 'float 2s ease-in-out infinite' : `sway ${2+Math.random()}s ease-in-out infinite`};
          ">${p.avatar}</div>
          <!-- Climbing Trail Dots -->
          <div style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;opacity:0.3">
            ${Array.from({length: Math.min(Math.floor(h/25), 6)}, (_,j) => `<div style="width:3px;height:3px;background:${stepColor};border-radius:50%;animation:trailDot 1.5s ease ${j*0.2}s infinite"></div>`).join('')}
          </div>
          <!-- Label -->
          <div class="tower-label" style="
            position:absolute;top:-56px;left:50%;transform:translateX(-50%);
            background:${isMe ? '#7C3AED' : (i===0 ? '#F59E0B' : 'rgba(0,0,0,0.8)')};
            color:white;padding:3px 8px;border-radius:6px;
            font-size:10px;font-weight:700;white-space:nowrap;
            opacity:${isMe || i < 3 ? 1 : 0};
            transition:opacity 0.2s;
            border:1px solid ${isMe ? '#A78BFA' : (i===0 ? '#F59E0B' : '#444')};
            ${i===0 ? 'animation:crownPulse 1.5s ease-in-out infinite;' : ''}
          ">${i===0 ? '👑 ' : ''}${isMe ? '⚡ YOU' : p.name.split(' ')[0]} #${p.rank}</div>
          <!-- XP label at base -->
          <div style="
            position:absolute;bottom:4px;width:100%;text-align:center;
            font-size:9px;font-weight:700;color:rgba(255,255,255,0.7);
          ">${(p.xp/1000).toFixed(1)}k</div>
        </div>
      `;
    }).join('');

    // Check if leader changed → play woohoo
    const newLeader = data[0] ? data[0].name : null;
    if (previousLeader && newLeader !== previousLeader) {
      playWoohoo();
      spawnCelebration(scene);
    }
    previousLeader = newLeader;
  }

  function playWoohoo() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Rising celebration chord
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.5);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.5);
      });

      // Speak woohoo
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('Woohoo! New number one!');
        u.rate = 1.2; u.pitch = 1.3; u.volume = 1;
        window.speechSynthesis.speak(u);
      }
    } catch(e) {}
  }

  function spawnCelebration(container) {
    const emojis = ['🎉', '🏆', '⭐', '🎊', '👑', '💥', '🔥', '✨'];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div');
      const tx = (Math.random() - 0.5) * 300;
      const ty = -80 - Math.random() * 120;
      p.style.cssText = `
        position:absolute;font-size:${16+Math.random()*12}px;pointer-events:none;z-index:999;
        top:30%;left:${20+Math.random()*60}%;
        animation:celebFly 1.5s ease forwards;
        --tx:${tx}px;--ty:${ty}px;
        animation-delay:${i*0.06}s;opacity:0;
      `;
      p.textContent = emojis[i % emojis.length];
      container.appendChild(p);
      setTimeout(() => p.remove(), 2000);
    }
  }

  function renderPodium(top3) {
    const podium = document.getElementById('lb-podium');
    if (!podium) return;
    const medals = ['🥇', '🥈', '🥉'];
    const colors = ['#F59E0B', '#9CA3AF', '#CD7F32'];
    const sizes = ['70px', '56px', '56px'];
    podium.innerHTML = top3.map((p, i) => `
      <div class="card" style="text-align:center;border-color:${colors[i]}44;background:linear-gradient(180deg,${colors[i]}08,transparent);position:relative;overflow:hidden;transition:transform 0.2s" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
        <div style="font-size:${sizes[i]};margin-bottom:6px">${p.avatar}</div>
        <div style="font-size:28px">${medals[i]}</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;margin:4px 0">${p.name}${p.isMe ? ' <span style="color:var(--primary-light)">(You)</span>' : ''}</div>
        <div style="font-size:11px;color:var(--text-muted)">${p.branch} • ${p.year}</div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:800;color:${colors[i]};margin-top:6px">${p[currentSort].toLocaleString()} ${currentSort === 'xp' ? 'XP' : currentSort === 'streak' ? 'days' : 'hrs'}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">🔥 ${p.streak} streak • ⏱ ${p.focusHrs}h focused</div>
      </div>
    `).join('');
  }

  function renderList(data) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    const sortLabel = currentSort === 'xp' ? 'XP' : currentSort === 'streak' ? 'day streak' : 'focus hours';
    list.innerHTML = data.map((p, i) => `
      <div class="leader-item ${p.rank <= 3 ? 'rank-' + p.rank : ''} ${p.isMe ? 'me' : ''}" style="animation:slideInUp 0.3s ease ${i * 0.05}s backwards">
        <div class="rank-num">${p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank-1] : p.rank}</div>
        <div class="leader-avatar">${p.avatar}</div>
        <div style="flex:1">
          <div class="leader-name">${p.name} ${p.isMe ? '<span class="badge badge-primary">YOU</span>' : ''}</div>
          <div style="font-size:11px;color:var(--text-muted)">${p.branch} • ${p.year} • 🔥${p.streak}d</div>
        </div>
        <div style="text-align:right">
          <div class="leader-xp">⚡ ${p[currentSort].toLocaleString()} ${sortLabel}</div>
          <div style="font-size:10px;color:var(--text-muted)">⏱ ${p.focusHrs}h focused</div>
        </div>
      </div>
    `).join('');
  }

  function renderMyStats(data) {
    const me = data.find(p => p.isMe);
    if (!me) return;
    const above = data.find(p => p.rank === me.rank - 1);
    const gap = above ? above.xp - me.xp : 0;
    const pct = above ? Math.round((me.xp / above.xp) * 100) : 100;
    const el = (id) => document.getElementById(id);
    if (el('lb-my-rank')) el('lb-my-rank').textContent = `#${me.rank} of ${data.length}`;
    if (el('lb-my-xp')) el('lb-my-xp').textContent = me.xp.toLocaleString() + ' XP';
    if (el('lb-my-streak')) el('lb-my-streak').textContent = me.streak + ' days';
    if (el('lb-xp-gap')) el('lb-xp-gap').textContent = gap > 0 ? gap.toLocaleString() + ' XP' : 'You are #1!';
    if (el('lb-xp-gap')) el('lb-xp-gap').style.color = gap > 0 ? 'var(--danger)' : 'var(--accent)';
    if (el('lb-rank-progress')) el('lb-rank-progress').style.width = Math.min(pct, 100) + '%';
  }

  function renderBranchStandings() {
    const branches = {};
    AppData.leaderboard.forEach(p => {
      if (!branches[p.branch]) branches[p.branch] = { xp: 0, members: 0, avgStreak: 0 };
      branches[p.branch].xp += p.xp;
      branches[p.branch].members++;
      branches[p.branch].avgStreak += p.streak;
    });
    Object.values(branches).forEach(b => b.avgStreak = Math.round(b.avgStreak / b.members));
    const sorted = Object.entries(branches).sort((a, b) => b[1].xp - a[1].xp);
    const maxXP = sorted[0] ? sorted[0][1].xp : 1;
    const branchEl = document.getElementById('lb-branch-list');
    if (!branchEl) return;
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    branchEl.innerHTML = sorted.map(([name, b], i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--surface-2);border-radius:12px;border:1px solid ${i === 0 ? 'rgba(245,158,11,0.3)' : 'var(--border)'}">
        <div style="font-size:20px">${medals[i] || ''}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700">${name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${b.members} students • avg ${b.avgStreak}d streak</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:var(--gold)">${b.xp.toLocaleString()} XP</div>
          <div style="width:80px;height:4px;background:var(--surface-3);border-radius:99px;margin-top:4px"><div style="height:100%;width:${Math.round(b.xp/maxXP*100)}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:99px"></div></div>
        </div>
      </div>
    `).join('');
  }

  function filter(branch, btn) {
    currentFilter = branch;
    document.querySelectorAll('.lb-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  }

  function sort(field, btn) {
    currentSort = field;
    document.querySelectorAll('.lb-sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  }

  function simulateLiveXP() {
    AppData.leaderboard.forEach(p => {
      if (!p.isMe) {
        p.xp += Math.floor(Math.random() * 120) + 10;
      }
    });
    render();
    showToast('⚡ Live XP updated! Other students just earned focus XP.', 'info');
  }

  return { render, filter, sort, simulateLiveXP };
})();


// ── Render Rewards (delegates to VoucherStore) ──────
function renderRewards() {
  if (typeof VoucherStore !== 'undefined') {
    VoucherStore.renderVouchers();
  }
}

// ── Render App Usage (Dashboard mini) ───────────────
function renderMiniUsage() {
  const list = document.getElementById('mini-usage-list');
  if (!list) return;
  list.innerHTML = AppData.usageToday.breakdown.slice(0, 5).map(app => `
    <div class="app-usage-item">
      <div class="app-icon-pill" style="background:${app.color}22;">${app.icon}</div>
      <div class="app-usage-info">
        <div class="app-usage-name">${app.app}</div>
        <div class="app-bar"><div class="app-bar-fill" style="width:${(app.minutes/48)*100}%;background:${app.color};"></div></div>
      </div>
      <div class="app-usage-time">${app.minutes}m</div>
    </div>
  `).join('');
}

// ── Addiction Score Ring ─────────────────────────────
function renderAddictionScore() {
  const canvas = document.getElementById('addiction-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const score = AppData.addictionScore;
  const size = 120;
  canvas.width = size; canvas.height = size;
  const cx = size/2, cy = size/2, r = 48;
  const color = score > 75 ? '#EF4444' : score > 50 ? '#F59E0B' : '#10B981';

  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 10; ctx.stroke();

  const angle = (score/100) * Math.PI * 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + angle);
  ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();

  ctx.textAlign = 'center'; ctx.fillStyle = color;
  ctx.font = 'bold 22px Space Grotesk, sans-serif'; ctx.fillText(score, cx, cy + 4);
  ctx.fillStyle = '#9B9BC4'; ctx.font = '10px Inter';
  ctx.fillText('/ 100', cx, cy + 18);
}

// ── App Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set sidebar user info
  document.getElementById('sidebar-xp').textContent = AppData.student.xp.toLocaleString();
  document.getElementById('sidebar-coins').textContent = AppData.student.coins;

  // Nav clicks
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Parent toggle
  document.querySelector('.parent-toggle')?.addEventListener('click', () => ParentDashboard?.showPINModal?.());

  // PIN modal
  document.querySelectorAll('.pin-key').forEach(key => {
    key.addEventListener('click', () => ParentDashboard.handlePINKey(key.dataset.key));
  });
  document.getElementById('pin-cancel-btn')?.addEventListener('click', () => ParentDashboard?.hidePINModal?.());
  document.getElementById('pin-overlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) ParentDashboard?.hidePINModal?.(); });

  // Timer controls
  document.getElementById('timer-start-btn').addEventListener('click', () => FocusTimer.start());
  document.getElementById('timer-reset-btn').addEventListener('click', () => FocusTimer.reset());
  document.querySelectorAll('.session-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => FocusTimer.setMode(parseInt(btn.dataset.minutes)));
  });

  // Lock screen
  document.getElementById('faceid-btn')?.addEventListener('click', () => FaceAuth?.startFaceVerification?.());
  document.getElementById('demo-lock-btn')?.addEventListener('click', () => ParentalLock?.triggerManualLock?.());

  // Avatar modal
  document.getElementById('avatar-close-btn').addEventListener('click', () => AvatarCoach.hide());
  document.getElementById('avatar-got-it-btn').addEventListener('click', () => AvatarCoach.hide());
  document.getElementById('avatar-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) AvatarCoach.hide();
  });
  document.getElementById('show-avatar-btn')?.addEventListener('click', () => AvatarCoach.show());

  // Tabs (analytics)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Initial render
  navigateTo('dashboard');
  if (typeof ParentAIChatbot !== 'undefined') ParentAIChatbot.showFab();
  renderMiniUsage();
  renderAddictionScore();

  // Staggered init — delay heavy work
  setTimeout(() => Charts.renderAll(), 500);
  if (typeof AvatarCoach !== "undefined") AvatarCoach.start();

  FocusTimer.updateDisplay();
  ParentalLock.updateUsageDisplay();

  // Sync parent limit setting to lock page slider
  const savedLimit = ParentDashboard.getDailyLimit();
  const lockSlider = document.getElementById('usage-limit-range');
  if (lockSlider) lockSlider.value = savedLimit;
  const lockVal = document.getElementById('limit-val');
  if (lockVal) lockVal.textContent = savedLimit + ' min';
});

