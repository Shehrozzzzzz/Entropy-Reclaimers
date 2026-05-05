/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — Feature 2: Parent Dashboard
// Full parental control: reports, stop screen, time limits,
// focus session tracking
// ======================================================

const ParentDashboard = (() => {
  let parentPIN = '1234';
  let isParentView = false;
  let pinBuffer = '';

  // ── Persistent parent settings (saved to localStorage) ──
  const SETTINGS_KEY = 'er_parent_settings';
  let settings = loadSettings();

  function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
    return {
      dailyLimitMinutes: 120,
      isScreenStopped: false,
      blockedApps: {},   // { appName: true/false }
      appLimits: {},     // { appName: minutes }
    };
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function getDailyLimit() { return settings.dailyLimitMinutes; }
  function isScreenStopped() { return settings.isScreenStopped; }

  // ── PIN Modal ──
  function showPINModal() {
    const overlay = document.getElementById('pin-overlay');
    overlay.classList.add('active');
    overlay.style.display = 'flex';
    pinBuffer = '';
    updatePINDots();
  }

  function hidePINModal() {
    const overlay = document.getElementById('pin-overlay');
    overlay.classList.remove('active');
    overlay.style.display = 'none';
    pinBuffer = '';
    updatePINDots();
  }

  function updatePINDots() {
    document.querySelectorAll('.pin-dot').forEach((dot, i) => {
      dot.classList.toggle('filled', i < pinBuffer.length);
    });
  }

  function handlePINKey(key) {
    if (key === 'DEL') {
      pinBuffer = pinBuffer.slice(0, -1);
      updatePINDots();
      return;
    }
    if (pinBuffer.length >= 4) return;
    pinBuffer += key;
    updatePINDots();

    if (pinBuffer.length === 4) {
      setTimeout(() => {
        if (pinBuffer === parentPIN) {
          hidePINModal();
          switchToParentView();
        } else {
          showToast('❌ Wrong PIN. Try 1-2-3-4 for demo.', 'danger');
          pinBuffer = '';
          updatePINDots();
          const dots = document.querySelector('.pin-dots');
          dots.style.animation = 'lockShake 0.5s ease';
          setTimeout(() => dots.style.animation = '', 600);
        }
      }, 200);
    }
  }

  // ── View switching ──
  function switchToParentView() {
    isParentView = true;
    document.getElementById('parent-view').style.display = 'block';
    document.getElementById('student-view').style.display = 'none';
    document.getElementById('sidebar').classList.add('parent-mode');
    document.querySelector('.parent-toggle').textContent = '🎓 Switch to Student';
    document.querySelector('.parent-toggle').onclick = switchToStudentView;
    navigateTo('parent');
    showToast('👨‍👩‍👧 Guardian Mode Active', 'info');
  }

  function switchToStudentView() {
    isParentView = false;
    document.getElementById('parent-view').style.display = 'none';
    document.getElementById('student-view').style.display = 'block';
    document.getElementById('sidebar').classList.remove('parent-mode');
    document.querySelector('.parent-toggle').textContent = '👨‍👩‍👧 Parent View';
    document.querySelector('.parent-toggle').onclick = showPINModal;
    navigateTo('dashboard');
    showToast('🎓 Switched to Student View', 'success');
  }

  // ── Refresh all parent data ──
  function refreshAllParentData() {
    Charts.renderAll();
    renderAppUsageList();
    renderAnalysisReport();
    renderAppRestrictions();
    renderAppLimits();
    renderFocusSessions();
    updateParentStats();
    updateParentLimitDisplay();
    updateStopScreenButton();
  }

  // ── Update live parent stats cards ──
  function updateParentStats() {
    const totalMin = AppData.usageToday.total;
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const limit = settings.dailyLimitMinutes;
    const overLimit = totalMin - limit;

    // Today Screen
    const screenEl = document.getElementById('parent-screen-time');
    if (screenEl) screenEl.textContent = `${hours}h ${mins}m`;

    const screenSub = document.getElementById('parent-screen-sub');
    if (screenSub) {
      if (overLimit > 0) {
        screenSub.textContent = `⚠ ${overLimit}m over limit`;
        screenSub.className = 'stat-change neg';
      } else {
        screenSub.textContent = `✅ ${Math.abs(overLimit)}m remaining`;
        screenSub.className = 'stat-change';
      }
    }

    // Focus Sessions
    const todaySessions = FocusTimer.getTodaySessions();
    const focusEl = document.getElementById('parent-focus-count');
    if (focusEl) focusEl.textContent = todaySessions.length;

    const focusSub = document.getElementById('parent-focus-sub');
    if (focusSub) focusSub.textContent = `+${FocusTimer.getTotalXPToday()} XP earned`;

    // Study App Use
    const studyApps = AppData.usageToday.breakdown.filter(a => a.category === 'study');
    const studyMin = studyApps.reduce((s, a) => s + a.minutes, 0);
    const studyPct = totalMin > 0 ? Math.round((studyMin / totalMin) * 100) : 0;

    const studyEl = document.getElementById('parent-study-time');
    if (studyEl) studyEl.textContent = `${studyMin}m`;

    const studySub = document.getElementById('parent-study-sub');
    if (studySub) studySub.textContent = `${studyPct}% of total`;

    // Daily limit display in alert settings
    const limitDisplay = document.getElementById('parent-limit-display');
    if (limitDisplay) limitDisplay.textContent = `${settings.dailyLimitMinutes} min`;
  }

  // ── Update parent limit slider ──
  function updateParentLimitDisplay() {
    const slider = document.getElementById('parent-limit-slider');
    const valDisplay = document.getElementById('parent-limit-val');
    if (slider) {
      slider.value = settings.dailyLimitMinutes;
      if (valDisplay) valDisplay.textContent = `${settings.dailyLimitMinutes} min`;
    }
  }

  function handleLimitChange(value) {
    const mins = parseInt(value);
    settings.dailyLimitMinutes = mins;
    saveSettings();

    // Update all displays
    const valDisplay = document.getElementById('parent-limit-val');
    if (valDisplay) valDisplay.textContent = `${mins} min`;

    const limitDisplay = document.getElementById('parent-limit-display');
    if (limitDisplay) limitDisplay.textContent = `${mins} min`;

    // Also update lock page slider if it exists
    const lockSlider = document.getElementById('usage-limit-range');
    if (lockSlider) lockSlider.value = mins;
    const lockVal = document.getElementById('limit-val');
    if (lockVal) lockVal.textContent = mins + ' min';

    // Update student dashboard limit display
    AppData.student.limit = mins;

    showToast(`⏱️ Daily limit updated to ${mins} minutes`, 'success');
    updateParentStats();
  }

  // ── STOP SCREEN button ──
  function toggleStopScreen() {
    settings.isScreenStopped = !settings.isScreenStopped;
    saveSettings();
    updateStopScreenButton();

    if (settings.isScreenStopped) {
      ParentalLock.lock('⛔ Parent has remotely stopped screen access');
      showToast('🛑 Screen STOPPED! Child\'s device is now locked.', 'danger');
    } else {
      ParentalLock.unlock();
      showToast('✅ Screen access restored.', 'success');
    }
  }

  function updateStopScreenButton() {
    const btn = document.getElementById('parent-stop-btn');
    if (!btn) return;
    if (settings.isScreenStopped) {
      btn.textContent = '✅ Restore Screen Access';
      btn.className = 'btn btn-accent';
      btn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
    } else {
      btn.textContent = '🛑 STOP SCREEN NOW';
      btn.className = 'btn btn-danger';
      btn.style.background = '';
    }
  }

  // ── App Usage List ──
  function renderAppUsageList() {
    const list = document.getElementById('app-usage-list');
    if (!list) return;
    list.innerHTML = AppData.usageToday.breakdown.map(app => `
      <div class="app-usage-item">
        <div class="app-icon-pill" style="background:${app.color}22;">${app.icon}</div>
        <div class="app-usage-info">
          <div class="app-usage-name">${app.app}</div>
          <div class="app-bar">
            <div class="app-bar-fill" style="width:${(app.minutes/48)*100}%; background:${app.color};"></div>
          </div>
        </div>
        <div class="app-usage-time">${app.minutes}m</div>
      </div>
    `).join('');
  }

  // ── Detailed Analysis Report ──
  function renderAnalysisReport() {
    const tbody = document.getElementById('analysis-table-body');
    if (!tbody) return;
    const total = AppData.usageToday.breakdown.reduce((sum, app) => sum + app.minutes, 0);
    
    tbody.innerHTML = AppData.usageToday.breakdown.map(app => {
      const percentage = ((app.minutes / total) * 100).toFixed(1);
      const limit = settings.appLimits[app.app] || (app.category === 'social' ? 30 : (app.category === 'games' ? 20 : 60));
      const isOver = app.minutes > limit;
      
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="app-icon-pill" style="background:${app.color}22;">${app.icon}</div>
              <strong>${app.app}</strong>
            </div>
          </td>
          <td><span class="badge" style="background:var(--surface-2);color:var(--text-secondary)">${app.category}</span></td>
          <td>${app.minutes} min</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="app-bar" style="width:100px;margin:0"><div class="app-bar-fill" style="width:${percentage}%;background:${app.color}"></div></div>
              <span>${percentage}%</span>
            </div>
          </td>
          <td>
            ${isOver ? '<span class="badge badge-danger">⚠️ Over Limit</span>' : '<span class="badge badge-accent">✅ Safe</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ── App Restrictions ──
  function renderAppRestrictions() {
    const list = document.getElementById('app-restrictions-list');
    if (!list) return;
    
    list.innerHTML = AppData.usageToday.breakdown.filter(app => ['social', 'entertainment', 'games'].includes(app.category)).map(app => {
      const isBlocked = settings.blockedApps[app.app] !== undefined ? settings.blockedApps[app.app] : (app.category === 'social');
      return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="app-icon-pill" style="background:${app.color}22;">${app.icon}</div>
          <div>
            <div style="font-weight:600;font-size:14px">${app.app}</div>
            <div style="font-size:12px;color:var(--text-muted)">Block during study time</div>
          </div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" onchange="ParentDashboard.toggleAppBlock('${app.app}', this.checked)" ${isBlocked ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>`;
    }).join('');
  }

  function toggleAppBlock(appName, blocked) {
    settings.blockedApps[appName] = blocked;
    saveSettings();
    showToast(`${blocked ? '🚫' : '✅'} ${appName} ${blocked ? 'blocked' : 'unblocked'}`, 'info');

    // === IRL Blocking API Call ===
    fetch('/api/toggle-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: appName, blocked: blocked })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        showToast(`⚠️ IRL Block Failed: ${data.error}`, 'warning');
      } else if (data.msg.includes('IRL Block')) {
        showToast(`⚡ IRL System Update: ${data.msg}`, 'success');
      }
    })
    .catch(err => console.warn("IRL block API failed:", err));
  }

  // ── Custom App Limits ──
  function renderAppLimits() {
    const list = document.getElementById('app-limits-list');
    if (!list) return;
    
    list.innerHTML = AppData.usageToday.breakdown.filter(app => ['social', 'games', 'entertainment'].includes(app.category)).map(app => {
      const defaultLimit = settings.appLimits[app.app] || (app.category === 'social' ? 30 : 20);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--surface-2);border-radius:12px;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="app-icon-pill" style="background:${app.color}22;">${app.icon}</div>
            <span style="font-weight:600;font-size:14px">${app.app}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="number" class="range-input" value="${defaultLimit}" style="width:60px;padding:4px;text-align:center" min="0" max="120"
              onchange="ParentDashboard.setAppLimit('${app.app}', this.value)">
            <span style="font-size:12px;color:var(--text-muted)">min</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function setAppLimit(appName, minutes) {
    settings.appLimits[appName] = parseInt(minutes);
    saveSettings();
  }

  function saveAllLimits() {
    saveSettings();
    renderAnalysisReport(); // Refresh status
    showToast('💾 App limits saved successfully!', 'success');
  }

  // ── Focus Sessions Card ──
  function renderFocusSessions() {
    const container = document.getElementById('parent-focus-list');
    if (!container) return;

    const todaySessions = FocusTimer.getTodaySessions();
    const totalMins = FocusTimer.getTotalFocusMinutesToday();
    const totalXP = FocusTimer.getTotalXPToday();

    if (todaySessions.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">
          <div style="font-size:32px;margin-bottom:8px">🎯</div>
          No focus sessions completed today yet.
        </div>`;
      return;
    }

    let html = `
      <div style="display:flex;justify-content:space-between;padding:10px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;margin-bottom:12px;">
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:700;color:var(--accent)">${todaySessions.length}</div>
          <div style="font-size:11px;color:var(--text-muted)">Sessions</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:700;color:var(--primary-light)">${totalMins}m</div>
          <div style="font-size:11px;color:var(--text-muted)">Total Focus</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:20px;font-weight:700;color:var(--gold)">+${totalXP}</div>
          <div style="font-size:11px;color:var(--text-muted)">XP Earned</div>
        </div>
      </div>
    `;

    html += todaySessions.map((s, i) => {
      const time = new Date(s.completedAt);
      const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const modeLabel = s.mode === 1 ? 'Demo' : (s.mode === 25 ? 'Pomodoro' : (s.mode === 50 ? 'Power' : 'Deep Work'));
      const modeColor = s.mode === 1 ? '#06B6D4' : (s.mode === 25 ? '#7C3AED' : (s.mode === 50 ? '#F59E0B' : '#10B981'));
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--surface-2);border-radius:10px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;border-radius:50%;background:${modeColor}22;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:${modeColor}">
              ${i + 1}
            </div>
            <div>
              <div style="font-weight:600;font-size:13px">${modeLabel} (${s.mode}m)</div>
              <div style="font-size:11px;color:var(--text-muted)">${timeStr}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:13px;font-weight:600;color:var(--accent)">+${s.xp} XP</div>
            <div style="font-size:11px;color:var(--gold)">+${s.coins} 💰</div>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = html;
  }

  // ── Smart Push Alerts ──
  const ALERT_KEY = 'er_alert_thresholds';
  let alertThresholds = loadAlertThresholds();

  function loadAlertThresholds() {
    const s = localStorage.getItem(ALERT_KEY);
    if (s) return JSON.parse(s);
    return { high: 180, critical: 300, lateNight: 22, gaming: 60 };
  }
  function saveAlertThresholds() { localStorage.setItem(ALERT_KEY, JSON.stringify(alertThresholds)); }
  function updateAlertThreshold(key, val) {
    alertThresholds[key] = parseInt(val);
    saveAlertThresholds();
    renderSmartAlerts();
    showToast('🔔 Alert threshold updated', 'success');
  }

  function renderSmartAlerts() {
    const list = document.getElementById('smart-alerts-list');
    const badge = document.getElementById('alert-count-badge');
    if (!list) return;
    const total = AppData.usageToday.total;
    const games = AppData.usageToday.breakdown.filter(a => a.category === 'games').reduce((s, a) => s + a.minutes, 0);
    const social = AppData.usageToday.breakdown.filter(a => a.category === 'social').reduce((s, a) => s + a.minutes, 0);
    const topApp = [...AppData.usageToday.breakdown].sort((a, b) => b.minutes - a.minutes)[0];
    const hour = new Date().getHours();
    const alerts = [];

    if (total >= alertThresholds.critical) {
      alerts.push({ type: 'critical', emoji: '🚨', title: `CRITICAL: ${Math.floor(total/60)}h ${total%60}m screen time!`, desc: `John has used the phone for ${Math.floor(total/60)}+ hours today. This far exceeds healthy limits. Immediate intervention recommended.`, time: 'Just now' });
    } else if (total >= alertThresholds.high) {
      alerts.push({ type: 'warning', emoji: '⚠️', title: `High Usage: ${Math.floor(total/60)}h ${total%60}m today`, desc: `Screen time has crossed ${alertThresholds.high} minutes. Consider reminding John to take a break.`, time: '5 min ago' });
    }
    if (total > settings.dailyLimitMinutes) {
      alerts.push({ type: 'critical', emoji: '🔒', title: 'Daily limit exceeded!', desc: `John is ${total - settings.dailyLimitMinutes}m over the ${settings.dailyLimitMinutes}m daily limit. Auto-lock should trigger.`, time: '12 min ago' });
    }
    if (games > alertThresholds.gaming) {
      alerts.push({ type: 'warning', emoji: '🎮', title: `Gaming: ${games}m (over ${alertThresholds.gaming}m limit)`, desc: `PUBG Mobile and other games exceeded the daily gaming cap.`, time: '20 min ago' });
    }
    if (social > 60) {
      alerts.push({ type: 'warning', emoji: '📱', title: `Social media: ${social}m today`, desc: `Instagram, WhatsApp & Snapchat combined usage is high. Studies show 60+ min increases anxiety risk.`, time: '35 min ago' });
    }
    if (hour >= alertThresholds.lateNight) {
      alerts.push({ type: 'info', emoji: '🌙', title: 'Late night usage detected', desc: `It's past ${alertThresholds.lateNight}:00. Blue light exposure affects sleep quality.`, time: 'Now' });
    }
    if (topApp) {
      alerts.push({ type: 'info', emoji: topApp.icon, title: `Most used: ${topApp.app} (${topApp.minutes}m)`, desc: `${topApp.app} accounts for ${Math.round((topApp.minutes/total)*100)}% of today's screen time.`, time: '1h ago' });
    }
    const focusSessions = FocusTimer.getTodaySessions();
    if (focusSessions.length > 0) {
      alerts.push({ type: 'success', emoji: '🎯', title: `${focusSessions.length} Focus Session(s) completed!`, desc: `John earned +${FocusTimer.getTotalXPToday()} XP today. Great discipline!`, time: '45 min ago' });
    } else {
      alerts.push({ type: 'warning', emoji: '📚', title: 'No focus sessions today', desc: 'John hasn\'t completed any study focus sessions. Encourage a Pomodoro!', time: '2h ago' });
    }

    if (badge) badge.textContent = `${alerts.filter(a => a.type === 'critical' || a.type === 'warning').length} alerts`;
    list.innerHTML = alerts.map(a => `
      <div class="smart-alert-item ${a.type}">
        <div class="smart-alert-emoji">${a.emoji}</div>
        <div class="smart-alert-content">
          <div class="smart-alert-title">${a.title}</div>
          <div class="smart-alert-desc">${a.desc}</div>
          <div class="smart-alert-time">${a.time}</div>
        </div>
      </div>`).join('');
  }

  // ── Weekly Summary Report ──
  function renderWeeklyReport() {
    const grid = document.getElementById('weekly-report-grid');
    const insights = document.getElementById('weekly-report-insights');
    if (!grid) return;
    const w = AppData.weeklyUsage;
    const totalMin = w.reduce((s, d) => s + d.minutes, 0);
    const avgMin = Math.round(totalMin / 7);
    const best = [...w].sort((a, b) => a.minutes - b.minutes)[0];
    const worst = [...w].sort((a, b) => b.minutes - a.minutes)[0];
    const daysOver = w.filter(d => d.minutes > settings.dailyLimitMinutes).length;
    const totalH = Math.floor(totalMin / 60), totalM = totalMin % 60;
    const avgH = Math.floor(avgMin / 60), avgM = avgMin % 60;

    grid.innerHTML = `
      <div class="weekly-stat-tile" style="--tile-glow:rgba(239,68,68,0.2)">
        <div class="weekly-stat-emoji">⏱</div>
        <div class="weekly-stat-value" style="color:var(--danger)">${totalH}h ${totalM}m</div>
        <div class="weekly-stat-label">Total This Week</div>
        <div class="weekly-stat-change up">↑ ${daysOver}/7 days over limit</div>
      </div>
      <div class="weekly-stat-tile" style="--tile-glow:rgba(124,58,237,0.2)">
        <div class="weekly-stat-emoji">📊</div>
        <div class="weekly-stat-value" style="color:var(--primary-light)">${avgH}h ${avgM}m</div>
        <div class="weekly-stat-label">Daily Average</div>
        <div class="weekly-stat-change ${avgMin > settings.dailyLimitMinutes ? 'up' : 'down'}">${avgMin > settings.dailyLimitMinutes ? '↑ Above' : '↓ Below'} limit</div>
      </div>
      <div class="weekly-stat-tile" style="--tile-glow:rgba(16,185,129,0.2)">
        <div class="weekly-stat-emoji">✅</div>
        <div class="weekly-stat-value" style="color:var(--accent)">${best.day}</div>
        <div class="weekly-stat-label">Best Day</div>
        <div class="weekly-stat-change down">${best.minutes}m — Great!</div>
      </div>
      <div class="weekly-stat-tile" style="--tile-glow:rgba(245,158,11,0.2)">
        <div class="weekly-stat-emoji">📱</div>
        <div class="weekly-stat-value" style="color:var(--gold)">${[...AppData.usageToday.breakdown].sort((a,b)=>b.minutes-a.minutes)[0].app}</div>
        <div class="weekly-stat-label">Most Used App</div>
        <div class="weekly-stat-change up">${[...AppData.usageToday.breakdown].sort((a,b)=>b.minutes-a.minutes)[0].minutes}m today</div>
      </div>`;

    const social = AppData.usageToday.breakdown.filter(a=>a.category==='social').reduce((s,a)=>s+a.minutes,0);
    const study = AppData.usageToday.breakdown.filter(a=>a.category==='study').reduce((s,a)=>s+a.minutes,0);
    if (insights) insights.innerHTML = `
      <div class="weekly-insight-card">
        <div class="weekly-insight-icon" style="background:rgba(239,68,68,0.1)">📉</div>
        <div class="weekly-insight-text"><strong>Worst day was ${worst.day}</strong> with ${worst.minutes}m of screen time. That's ${worst.minutes - settings.dailyLimitMinutes > 0 ? worst.minutes - settings.dailyLimitMinutes + 'm over' : Math.abs(worst.minutes - settings.dailyLimitMinutes) + 'm under'} the daily limit.</div>
      </div>
      <div class="weekly-insight-card">
        <div class="weekly-insight-icon" style="background:rgba(16,185,129,0.1)">📚</div>
        <div class="weekly-insight-text"><strong>Study time is ${study}m today</strong> (${AppData.usageToday.total > 0 ? Math.round((study/AppData.usageToday.total)*100) : 0}% of total). ${study < 30 ? 'Below recommended 30m. Encourage more focus sessions.' : 'Good engagement with educational content!'}</div>
      </div>
      <div class="weekly-insight-card">
        <div class="weekly-insight-icon" style="background:rgba(245,158,11,0.1)">📲</div>
        <div class="weekly-insight-text"><strong>Social media: ${social}m today</strong>. ${social > 60 ? 'JAMA research shows 60+ min/day raises depression risk by 60%. Consider tighter restrictions.' : 'Within acceptable range. Keep monitoring.'}</div>
      </div>
      <div class="weekly-insight-card">
        <div class="weekly-insight-icon" style="background:rgba(124,58,237,0.1)">🧠</div>
        <div class="weekly-insight-text"><strong>Addiction Score: ${AppData.addictionScore}/100</strong>. ${AppData.addictionScore > 60 ? 'High risk zone — compulsive patterns detected. Digital detox recommended.' : 'Moderate risk. Continue monitoring trends.'}</div>
      </div>`;
  }

  // ── Override refresh to include new features ──
  const _origRefresh = refreshAllParentData;
  function refreshAllParentDataV2() {
    _origRefresh();
    renderSmartAlerts();
    renderWeeklyReport();
  }
  refreshAllParentData = refreshAllParentDataV2;

  return {
    showPINModal, hidePINModal, handlePINKey,
    switchToParentView, switchToStudentView,
    renderAppUsageList, renderAnalysisReport, renderAppRestrictions, renderAppLimits,
    renderFocusSessions, updateParentStats,
    handleLimitChange, toggleStopScreen, toggleAppBlock, setAppLimit, saveAllLimits,
    getDailyLimit, isScreenStopped, refreshAllParentData: refreshAllParentDataV2,
    renderSmartAlerts, renderWeeklyReport, updateAlertThreshold
  };
})();
