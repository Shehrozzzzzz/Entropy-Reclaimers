/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — Focus Quest Timer
// ======================================================

const FocusTimer = (() => {
  let totalSeconds = 1 * 60;
  let remaining = totalSeconds;
  let running = false;
  let intervalId = null;
  let mode = 1; // minutes (default 1 for demo)
  let sessionCount = 0;
  let xpEarned = 0;

  const XP_PER_SESSION = { 1: 30, 25: 60, 50: 130, 90: 240 };

  // ── Session history tracking ──
  // Each entry: { mode, xp, coins, completedAt }
  let sessionHistory = JSON.parse(localStorage.getItem('er_focus_sessions') || '[]');

  function getSessionHistory() { return sessionHistory; }
  function getSessionCount() { return sessionHistory.length; }
  function getTodaySessions() {
    const today = new Date().toDateString();
    return sessionHistory.filter(s => new Date(s.completedAt).toDateString() === today);
  }
  function getTotalFocusMinutesToday() {
    return getTodaySessions().reduce((sum, s) => sum + s.mode, 0);
  }
  function getTotalXPToday() {
    return getTodaySessions().reduce((sum, s) => sum + s.xp, 0);
  }

  function setMode(minutes) {
    if (running) return;
    mode = minutes;
    totalSeconds = minutes * 60;
    remaining = totalSeconds;
    updateDisplay();
    document.querySelectorAll('.session-mode-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.minutes) === minutes);
    });
  }

  function start() {
    if (running) return;
    running = true;
    document.getElementById('timer-start-btn').textContent = '⏸ Pause';
    document.getElementById('timer-start-btn').onclick = pause;
    showToast('🎯 Focus Quest Started! Stay in the zone!', 'success');

    // Simulate app blocking
    document.getElementById('blocked-apps-notice').style.display = 'flex';

    intervalId = setInterval(() => {
      remaining--;
      updateDisplay();
      if (remaining <= 0) complete();
    }, 1000);
  }

  function pause() {
    if (!running) return;
    running = false;
    clearInterval(intervalId);
    document.getElementById('timer-start-btn').textContent = '▶ Resume';
    document.getElementById('timer-start-btn').onclick = start;
    showToast('⏸ Paused — Keep going!', 'warning');
  }

  function reset() {
    running = false;
    clearInterval(intervalId);
    remaining = totalSeconds;
    updateDisplay();
    document.getElementById('timer-start-btn').textContent = '▶ Start Focus';
    document.getElementById('timer-start-btn').onclick = start;
    document.getElementById('blocked-apps-notice').style.display = 'none';
  }

  function complete() {
    running = false;
    clearInterval(intervalId);
    sessionCount++;
    xpEarned = XP_PER_SESSION[mode] || 60;
    const coinsEarned = Math.floor(xpEarned / 6);

    // Update global XP
    AppData.student.xp += xpEarned;
    AppData.student.coins += coinsEarned;

    // ── Save session to history ──
    const session = {
      mode: mode,
      xp: xpEarned,
      coins: coinsEarned,
      completedAt: new Date().toISOString()
    };
    sessionHistory.push(session);
    localStorage.setItem('er_focus_sessions', JSON.stringify(sessionHistory));

    document.getElementById('blocked-apps-notice').style.display = 'none';
    showCompletionModal(xpEarned);
    updateXPDisplay();

    remaining = totalSeconds;
    updateDisplay();
    document.getElementById('timer-start-btn').textContent = '▶ Start Focus';
    document.getElementById('timer-start-btn').onclick = start;
  }

  function showCompletionModal(xp) {
    showToast(`🏆 Session Complete! +${xp} XP, +${Math.floor(xp/6)} Coins!`, 'success');
    // Confetti burst
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('div');
      const emojis = ['⭐','🎯','💰','🏆','✨','💪','🧠','🔥'];
      el.style.cssText = `
        position:fixed; z-index:9999; font-size:${18 + Math.random()*16}px;
        top:${30+Math.random()*20}%; left:${10+Math.random()*80}%;
        animation:particleFly 1.5s ease forwards;
        --tx:${(Math.random()-0.5)*300}px; --ty:${-100-Math.random()*150}px;
        animation-delay:${i*0.06}s; pointer-events:none;
      `;
      el.textContent = emojis[i % emojis.length];
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  }

  function updateDisplay() {
    const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
    const secs = (remaining % 60).toString().padStart(2, '0');
    const el = document.getElementById('timer-display');
    if (el) el.textContent = `${mins}:${secs}`;

    // SVG ring
    const progress = document.getElementById('timer-progress');
    if (progress) {
      const pct = 1 - (remaining / totalSeconds);
      const circumference = 628;
      progress.style.strokeDashoffset = circumference - pct * circumference;
    }
  }

  function updateXPDisplay() {
    const xpEl = document.getElementById('sidebar-xp');
    const coinEl = document.getElementById('sidebar-coins');
    if (xpEl) xpEl.textContent = AppData.student.xp.toLocaleString();
    if (coinEl) coinEl.textContent = AppData.student.coins;

    // Animate XP bar
    const pct = (AppData.student.xp / AppData.student.xpNext) * 100;
    const bar = document.querySelector('.user-xp-fill');
    if (bar) bar.style.width = pct + '%';
  }

  function isRunning() { return running; }

  return { start, pause, reset, setMode, updateDisplay, isRunning, getSessionHistory, getSessionCount, getTodaySessions, getTotalFocusMinutesToday, getTotalXPToday };
})();
