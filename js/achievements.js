/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — Achievements & Badges System
// Unlockable badges with rarity tiers
// ======================================================

const AchievementSystem = (() => {
  const STORAGE_KEY = 'er_achievements_v1';

  // ── Badge Definitions ──
  const BADGES = [
    // 🟢 Common
    { id: 'b01', name: 'First Light',        icon: '🌅', desc: 'Complete your first focus session',             rarity: 'common',    xp: 50,   condition: 'focus_count >= 1' },
    { id: 'b02', name: 'Explorer',           icon: '🌍', desc: 'Complete your first offline mission',           rarity: 'common',    xp: 30,   condition: 'missions_completed >= 1' },
    { id: 'b03', name: 'Quest Starter',      icon: '📜', desc: 'Complete your first quest',                    rarity: 'common',    xp: 40,   condition: 'quests_done >= 1' },
    { id: 'b04', name: 'Screen Watcher',     icon: '👁️', desc: 'Check your screen time stats',                 rarity: 'common',    xp: 20,   condition: 'stats_viewed >= 1' },

    // 🔵 Uncommon
    { id: 'b05', name: 'Focus Warrior',      icon: '⚔️', desc: 'Complete 10 focus sessions',                   rarity: 'uncommon',  xp: 100,  condition: 'focus_count >= 10' },
    { id: 'b06', name: 'Mission Runner',     icon: '🏃', desc: 'Complete 10 offline missions',                 rarity: 'uncommon',  xp: 80,   condition: 'missions_completed >= 10' },
    { id: 'b07', name: 'Quest Hunter',       icon: '🗺️', desc: 'Complete 10 quests',                           rarity: 'uncommon',  xp: 80,   condition: 'quests_done >= 10' },
    { id: 'b08', name: 'Streak Builder',     icon: '🔥', desc: 'Reach a 3-day focus streak',                   rarity: 'uncommon',  xp: 60,   condition: 'streak >= 3' },
    { id: 'b09', name: 'Digital Minimalist', icon: '📵', desc: 'Stay under screen limit for a full day',       rarity: 'uncommon',  xp: 75,   condition: 'under_limit_days >= 1' },

    // 🟣 Rare
    { id: 'b10', name: 'Deep Worker',        icon: '💎', desc: 'Complete a 90-min Deep Work session',          rarity: 'rare',      xp: 200,  condition: 'deep_work >= 1' },
    { id: 'b11', name: 'Offline Hero',       icon: '🦸', desc: 'Spend 60+ minutes offline in missions',       rarity: 'rare',      xp: 150,  condition: 'offline_minutes >= 60' },
    { id: 'b12', name: 'All Explorer',       icon: '🧭', desc: 'Complete missions in all 5 categories',       rarity: 'rare',      xp: 150,  condition: 'unique_categories >= 5' },
    { id: 'b13', name: 'Helper Star',        icon: '⭐', desc: 'Complete 5 Helper Hero missions',             rarity: 'rare',      xp: 150,  condition: 'missions_completed >= 5' },
    { id: 'b14', name: 'Week Warrior',       icon: '🏅', desc: 'Maintain a 7-day streak',                      rarity: 'rare',      xp: 250,  condition: 'streak >= 7' },

    // 🟡 Epic
    { id: 'b15', name: 'Century Club',       icon: '💯', desc: 'Earn 100 total focus sessions',                rarity: 'epic',      xp: 500,  condition: 'focus_count >= 100' },
    { id: 'b16', name: 'XP Millionaire',     icon: '💰', desc: 'Accumulate 10,000 total XP',                   rarity: 'epic',      xp: 400,  condition: 'total_xp >= 10000' },
    { id: 'b17', name: 'Unstoppable',        icon: '🛡️', desc: '14-day unbroken streak',                       rarity: 'epic',      xp: 600,  condition: 'streak >= 14' },
    { id: 'b18', name: 'Real World Master',  icon: '🌟', desc: 'Complete 50 offline missions',                rarity: 'epic',      xp: 350,  condition: 'missions_completed >= 50' },

    // 🔴 Legendary
    { id: 'b19', name: 'Entropy Reclaimer',  icon: '👑', desc: 'Unlock 15 other badges',                       rarity: 'legendary', xp: 1000, condition: 'badges_unlocked >= 15' },
    { id: 'b20', name: 'The Chosen One',     icon: '🏆', desc: '30-day streak — master of discipline',         rarity: 'legendary', xp: 2000, condition: 'streak >= 30' },
  ];

  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const RARITY_COLORS = {
    common:    { bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)', text: '#9CA3AF', glow: 'none' },
    uncommon:  { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  text: '#60A5FA', glow: '0 0 20px rgba(59,130,246,0.2)' },
    rare:      { bg: 'rgba(124,58,237,0.12)',  border: 'rgba(124,58,237,0.3)',  text: '#A78BFA', glow: '0 0 20px rgba(124,58,237,0.25)' },
    epic:      { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  text: '#FBBF24', glow: '0 0 25px rgba(245,158,11,0.3)' },
    legendary: { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   text: '#F87171', glow: '0 0 30px rgba(239,68,68,0.35)' },
  };

  // ── State ──
  let state = loadState();

  function loadState() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) return JSON.parse(s);
    } catch(e) {}
    return {
      unlocked: [],
      stats: {
        focus_count: 0,
        missions_completed: 0,
        quests_done: 0,
        stats_viewed: 0,
        streak: 12,
        under_limit_days: 0,
        deep_work: 0,
        offline_minutes: 0,
        unique_categories: 0,
        mission_streak: 0,
        total_xp: 2840,
        badges_unlocked: 0,
      }
    };
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  // ── Increment a stat and check for new badges ──
  function recordStat(key, value) {
    if (typeof value === 'number') {
      state.stats[key] = Math.max(state.stats[key] || 0, value);
    } else {
      state.stats[key] = (state.stats[key] || 0) + 1;
    }
    state.stats.badges_unlocked = state.unlocked.length;
    state.stats.total_xp = AppData.student.xp;
    saveState();
    checkForNewBadges();
  }

  function incrementStat(key) {
    state.stats[key] = (state.stats[key] || 0) + 1;
    state.stats.badges_unlocked = state.unlocked.length;
    state.stats.total_xp = AppData.student.xp;
    saveState();
    checkForNewBadges();
  }

  // ── Check conditions ──
  function checkForNewBadges() {
    const s = state.stats;
    BADGES.forEach(badge => {
      if (state.unlocked.includes(badge.id)) return;
      const match = badge.condition.match(/(\w+)\s*(>=|<=)\s*(\d+)/);
      if (!match) return;
      const [_, key, op, val] = match;
      const current = s[key] || 0;
      const target = parseInt(val);
      const met = op === '>=' ? current >= target : current <= target;
      if (met) unlockBadge(badge);
    });
  }

  function unlockBadge(badge) {
    state.unlocked.push(badge.id);
    state.stats.badges_unlocked = state.unlocked.length;
    AppData.student.xp += badge.xp;
    saveState();
    const xpEl = document.getElementById('sidebar-xp');
    if (xpEl) xpEl.textContent = AppData.student.xp.toLocaleString();
    showBadgeUnlock(badge);
  }

  function showBadgeUnlock(badge) {
    const rc = RARITY_COLORS[badge.rarity];
    const notification = document.createElement('div');
    notification.className = 'badge-unlock-notification';
    notification.innerHTML = `
      <div class="badge-unlock-inner" style="border-color:${rc.border}; box-shadow:${rc.glow}">
        <div class="badge-unlock-sparkle">✨</div>
        <div class="badge-unlock-icon">${badge.icon}</div>
        <div class="badge-unlock-info">
          <div class="badge-unlock-label">BADGE UNLOCKED!</div>
          <div class="badge-unlock-name" style="color:${rc.text}">${badge.name}</div>
          <div class="badge-unlock-xp">+${badge.xp} XP</div>
        </div>
      </div>
    `;
    document.body.appendChild(notification);
    requestAnimationFrame(() => notification.classList.add('active'));
    setTimeout(() => {
      notification.classList.remove('active');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }

  // ── Render achievements page ──
  function renderAll() {
    state.stats.total_xp = AppData.student.xp;
    state.stats.badges_unlocked = state.unlocked.length;
    checkForNewBadges();

    const container = document.getElementById('achievements-grid');
    if (!container) return;

    const statsEl = document.getElementById('achievement-stats');
    if (statsEl) {
      const total = BADGES.length;
      const unlocked = state.unlocked.length;
      const pct = Math.round((unlocked / total) * 100);
      statsEl.innerHTML = `
        <div class="ach-stat-item">
          <div class="ach-stat-num" style="color:var(--gold)">${unlocked}/${total}</div>
          <div class="ach-stat-label">Badges</div>
        </div>
        <div class="ach-stat-item">
          <div class="ach-stat-num" style="color:var(--accent)">${pct}%</div>
          <div class="ach-stat-label">Complete</div>
        </div>
        <div class="ach-stat-item">
          <div class="ach-stat-num" style="color:var(--primary-light)">${state.stats.focus_count}</div>
          <div class="ach-stat-label">Focus Sessions</div>
        </div>
        <div class="ach-stat-item">
          <div class="ach-stat-num" style="color:var(--danger)">${state.stats.missions_completed}</div>
          <div class="ach-stat-label">Missions Done</div>
        </div>
      `;
    }

    const progEl = document.getElementById('achievement-progress');
    if (progEl) {
      const pct = Math.round((state.unlocked.length / BADGES.length) * 100);
      progEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
          <span style="color:var(--text-secondary)">Overall Progress</span>
          <span style="color:var(--gold);font-weight:700">${pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill gold" style="width:${pct}%"></div></div>
      `;
    }

    let html = '';
    RARITY_ORDER.forEach(rarity => {
      const badges = BADGES.filter(b => b.rarity === rarity);
      const rc = RARITY_COLORS[rarity];
      html += `<div class="ach-rarity-section">
        <div class="ach-rarity-label" style="color:${rc.text}">
          ${rarity === 'common' ? '🟢' : rarity === 'uncommon' ? '🔵' : rarity === 'rare' ? '🟣' : rarity === 'epic' ? '🟡' : '🔴'} 
          ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}
          <span class="ach-rarity-count">${badges.filter(b => state.unlocked.includes(b.id)).length}/${badges.length}</span>
        </div>
        <div class="ach-badges-grid">`;
      badges.forEach(badge => {
        const unlocked = state.unlocked.includes(badge.id);
        html += `
          <div class="ach-badge ${unlocked ? 'unlocked' : 'locked'}" style="
            background:${unlocked ? rc.bg : 'var(--surface-2)'};
            border-color:${unlocked ? rc.border : 'var(--border)'};
            box-shadow:${unlocked ? rc.glow : 'none'};
          ">
            <div class="ach-badge-icon ${unlocked ? '' : 'grayscale'}">${badge.icon}</div>
            <div class="ach-badge-name" style="color:${unlocked ? rc.text : 'var(--text-muted)'}">${badge.name}</div>
            <div class="ach-badge-desc">${badge.desc}</div>
            <div class="ach-badge-reward">${unlocked ? '✅ Unlocked' : `⚡ ${badge.xp} XP`}</div>
          </div>
        `;
      });
      html += `</div></div>`;
    });
    container.innerHTML = html;
  }

  return { renderAll, recordStat, incrementStat, checkForNewBadges, BADGES, state };
})();
