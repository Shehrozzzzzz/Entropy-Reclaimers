// ======================================================
// ENTROPY RECLAIMERS — Side Quests & XP System
// Daily/Weekly challenges, online & offline quests
// ======================================================

const QuestSystem = (() => {
  const STORAGE_KEY = 'er_quests_v1';

  // ── Quest definitions ──
  const DAILY_QUESTS = [
    { id: 'dq1', title: '🧘 Mindful Morning', desc: 'Complete a 25-min Focus Session before 10 AM', xp: 80, coins: 8, type: 'online', icon: '🌅', category: 'focus' },
    { id: 'dq2', title: '📵 Digital Detox Hour', desc: 'Stay off all social media for 1 full hour', xp: 60, coins: 6, type: 'offline', icon: '📵', category: 'detox' },
    { id: 'dq3', title: '🌍 Mission Explorer', desc: 'Complete any Offline Mission and earn XP', xp: 50, coins: 5, type: 'offline', icon: '🧩', category: 'missions' },
    { id: 'dq4', title: '📖 Read 20 Pages', desc: 'Read 20 pages of a physical book (honor system)', xp: 70, coins: 7, type: 'offline', icon: '📚', category: 'learning' },
    { id: 'dq5', title: '🏃 Move Your Body', desc: 'Do 15 minutes of exercise or stretching', xp: 60, coins: 6, type: 'offline', icon: '💪', category: 'health' },
    { id: 'dq6', title: '🎯 Double Focus', desc: 'Complete 2 Focus Sessions back-to-back', xp: 120, coins: 10, type: 'online', icon: '🔥', category: 'focus' },
    { id: 'dq7', title: '✍️ Journal Entry', desc: 'Write 3 things you are grateful for today', xp: 40, coins: 5, type: 'offline', icon: '📝', category: 'mindfulness' },
    { id: 'dq8', title: '🎨 Create Something', desc: 'Draw, build, or craft something with your hands', xp: 55, coins: 5, type: 'offline', icon: '🖍️', category: 'missions' },
  ];

  const WEEKLY_QUESTS = [
    { id: 'wq1', title: '🏆 Focus Champion', desc: 'Complete 10 Focus Sessions this week', xp: 300, coins: 10, type: 'online', icon: '🏅', category: 'focus', target: 10 },
    { id: 'wq2', title: '📱 Screen Slayer', desc: 'Stay under daily screen limit for 5 days', xp: 250, coins: 10, type: 'online', icon: '⚔️', category: 'detox', target: 5 },
    { id: 'wq3', title: '🌍 Mission Master', desc: 'Complete 5 different Offline Missions', xp: 150, coins: 8, type: 'offline', icon: '🎓', category: 'missions', target: 5 },
    { id: 'wq4', title: '🌿 Nature Walk', desc: 'Go for a 30-min walk outside 3 times', xp: 200, coins: 8, type: 'offline', icon: '🌳', category: 'health', target: 3 },
    { id: 'wq5', title: '📚 Knowledge Seeker', desc: 'Read for at least 1 hour total this week', xp: 200, coins: 8, type: 'offline', icon: '🔬', category: 'learning', target: 1 },
  ];

  const SIDE_QUESTS = [
    { id: 'sq1', title: '🌟 First Steps', desc: 'Complete your first ever Focus Session', xp: 100, coins: 10, type: 'online', icon: '⭐', oneTime: true },
    { id: 'sq2', title: '🌍 Real World Hero', desc: 'Complete missions in all 5 categories', xp: 80, coins: 8, type: 'offline', icon: '🧭', oneTime: true },
    { id: 'sq3', title: '🏋️ Iron Will', desc: 'Complete 5 focus sessions in a single day', xp: 200, coins: 10, type: 'online', icon: '💎', oneTime: true },
    { id: 'sq4', title: '📴 Off-Grid Hero', desc: 'Complete 10 offline missions total', xp: 150, coins: 10, type: 'offline', icon: '🦸', oneTime: true },
    { id: 'sq5', title: '🧘 Zen Master', desc: 'Spend 120+ minutes total offline in missions', xp: 250, coins: 10, type: 'offline', icon: '💯', oneTime: true },
  ];

  // ── State ──
  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      completedDaily: [],
      completedWeekly: [],
      completedSide: [],
      weeklyProgress: {},
      totalQuestsCompleted: 0,
      lastDailyReset: new Date().toDateString(),
      lastWeeklyReset: getWeekKey(),
    };
  }

  function saveState() {
    if (state.lastDailyReset !== new Date().toDateString()) {
      state.completedDaily = [];
      state.lastDailyReset = new Date().toDateString();
    }
    if (state.lastWeeklyReset !== getWeekKey()) {
      state.completedWeekly = [];
      state.weeklyProgress = {};
      state.lastWeeklyReset = getWeekKey();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getWeekKey() {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
  }

  // ── Complete a quest ──
  function completeQuest(questId, questType) {
    let quest;

    if (questType === 'daily') {
      quest = DAILY_QUESTS.find(q => q.id === questId);
      if (state.completedDaily.includes(questId)) { showToast('Already completed!', 'warning'); return; }
      state.completedDaily.push(questId);
    } else if (questType === 'weekly') {
      quest = WEEKLY_QUESTS.find(q => q.id === questId);
      if (state.completedWeekly.includes(questId)) { showToast('Already completed!', 'warning'); return; }
      state.completedWeekly.push(questId);
    } else {
      quest = SIDE_QUESTS.find(q => q.id === questId);
      if (state.completedSide.includes(questId)) { showToast('Already completed!', 'warning'); return; }
      state.completedSide.push(questId);
    }

    if (!quest) return;

    AppData.student.xp += quest.xp;
    AppData.student.coins += quest.coins;
    state.totalQuestsCompleted++;
    saveState();

    document.getElementById('sidebar-xp').textContent = AppData.student.xp.toLocaleString();
    document.getElementById('sidebar-coins').textContent = AppData.student.coins;

    showToast(`🎉 Quest Complete! +${quest.xp} XP, +${quest.coins} Coins`, 'success');
    renderQuests();
  }

  // ── Render all quests ──
  function renderQuests() {
    saveState();
    renderQuestList('daily-quest-list', DAILY_QUESTS, state.completedDaily, 'daily');
    renderQuestList('weekly-quest-list', WEEKLY_QUESTS, state.completedWeekly, 'weekly');
    renderQuestList('side-quest-list', SIDE_QUESTS, state.completedSide, 'side');

    const el = document.getElementById('quest-stats');
    if (el) {
      const totalDaily = DAILY_QUESTS.length;
      const doneDaily = state.completedDaily.length;
      el.innerHTML = `
        <div class="quest-stat-item">
          <div class="quest-stat-num" style="color:var(--primary-light)">${doneDaily}/${totalDaily}</div>
          <div class="quest-stat-label">Daily Done</div>
        </div>
        <div class="quest-stat-item">
          <div class="quest-stat-num" style="color:var(--accent)">${state.completedWeekly.length}/${WEEKLY_QUESTS.length}</div>
          <div class="quest-stat-label">Weekly Done</div>
        </div>
        <div class="quest-stat-item">
          <div class="quest-stat-num" style="color:var(--gold)">${state.totalQuestsCompleted}</div>
          <div class="quest-stat-label">Total Quests</div>
        </div>
        <div class="quest-stat-item">
          <div class="quest-stat-num" style="color:var(--cyan)">${state.completedSide.length}/${SIDE_QUESTS.length}</div>
          <div class="quest-stat-label">Side Quests</div>
        </div>
      `;
    }
  }

  function renderQuestList(containerId, quests, completed, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let displayQuests = quests;
    if (type === 'daily') {
      const seed = new Date().getDate() + new Date().getMonth() * 31;
      const shuffled = [...quests].sort((a, b) => {
        const ha = (seed * a.id.charCodeAt(2)) % 100;
        const hb = (seed * b.id.charCodeAt(2)) % 100;
        return ha - hb;
      });
      displayQuests = shuffled.slice(0, 4);
    }

    container.innerHTML = displayQuests.map(q => {
      const done = completed.includes(q.id);
      return `
        <div class="quest-card ${done ? 'completed' : ''} ${q.type}">
          <div class="quest-icon">${q.icon}</div>
          <div class="quest-info">
            <div class="quest-title">${q.title} <span class="quest-type-badge ${q.type}">${q.type === 'online' ? '🌐 Online' : '🏕️ Offline'}</span></div>
            <div class="quest-desc">${q.desc}</div>
            <div class="quest-rewards">
              <span class="quest-xp">⚡ ${q.xp} XP</span>
              <span class="quest-coins">💰 ${q.coins} Coins</span>
            </div>
          </div>
          <button class="btn ${done ? 'btn-outline' : 'btn-primary'} btn-sm quest-btn" 
            ${done ? 'disabled' : ''} 
            onclick="QuestSystem.completeQuest('${q.id}', '${type}')">
            ${done ? '✅ Done' : '🎯 Complete'}
          </button>
        </div>
      `;
    }).join('');
  }

  return { completeQuest, renderQuests };
})();
