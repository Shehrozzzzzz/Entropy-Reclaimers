/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — Offline Missions
// Screen-to-Real Activity Converter with Voice Support
// Kids PUT THE DEVICE DOWN to earn XP (replaces games)
// ======================================================

const OfflineMissions = (() => {
  const STORAGE_KEY = 'er_missions_v1';
  let currentMission = null;
  let screenOffStart = null;
  let offlineTimer = null;
  let totalOfflineSeconds = 0;
  const synth = window.speechSynthesis;

  // ── Mission Database — designed for kids class 3+ ──
  const MISSIONS = [
    // 🎨 CREATE
    { id:'m01', cat:'create', icon:'🎨', emoji:'🖍️', title:'Draw Your Hero',
      desc:'Draw your favorite superhero or cartoon on paper!',
      voice:'Take a paper and colors. Draw your favorite superhero or cartoon character. Make it colorful and big!',
      minMin:5, xp:40, coins:8 },
    { id:'m02', cat:'create', icon:'🏗️', emoji:'🧱', title:'Build a Tower',
      desc:'Stack 10 books or things into the tallest tower!',
      voice:'Find 10 books or boxes. Stack them up and build the tallest tower you can. Be careful, dont let it fall!',
      minMin:3, xp:30, coins:6 },
    { id:'m03', cat:'create', icon:'✂️', emoji:'📄', title:'Paper Craft',
      desc:'Fold a paper airplane or boat and test it!',
      voice:'Take a piece of paper. Fold it into an airplane or a boat. Then test it! See how far your airplane flies!',
      minMin:5, xp:35, coins:7 },
    { id:'m04', cat:'create', icon:'🎭', emoji:'😊', title:'Story Teller',
      desc:'Make up a fun story and tell it to your family!',
      voice:'Think of a fun story about animals, space, or magic! Then go tell it to someone in your family. Use funny voices!',
      minMin:5, xp:45, coins:9 },
    { id:'m05', cat:'create', icon:'🎵', emoji:'🥁', title:'Music Maker',
      desc:'Make music with pots, pans or anything around you!',
      voice:'Find some pots, pans, spoons, or boxes. Make your own music by tapping them! Create a fun beat!',
      minMin:5, xp:35, coins:7 },

    // 🏃 MOVE
    { id:'m06', cat:'move', icon:'🏃', emoji:'💪', title:'Jump & Count',
      desc:'Do 20 jumping jacks! Count out loud!',
      voice:'Stand up and do 20 jumping jacks! Count each one out loud. One, two, three, all the way to twenty!',
      minMin:2, xp:25, coins:5 },
    { id:'m07', cat:'move', icon:'🕺', emoji:'💃', title:'Dance Party',
      desc:'Dance to your favorite song for 3 minutes!',
      voice:'Put on your favorite song and dance! Move your arms, jump, spin around. Dance for the whole song!',
      minMin:3, xp:30, coins:6 },
    { id:'m08', cat:'move', icon:'🤸', emoji:'🧘', title:'Stretch & Breathe',
      desc:'Touch your toes 10 times and stretch your arms high!',
      voice:'Stand up straight. Try to touch your toes 10 times. Then stretch your arms up high to the sky 5 times. Breathe deeply!',
      minMin:3, xp:30, coins:6 },
    { id:'m09', cat:'move', icon:'🏠', emoji:'🧹', title:'Helper Hero',
      desc:'Help clean or organize your room for 5 minutes!',
      voice:'Be a helper hero! Clean your room. Make your bed, arrange your books, or pick up toys. Help for 5 minutes!',
      minMin:5, xp:50, coins:10 },
    { id:'m10', cat:'move', icon:'⚽', emoji:'🏐', title:'Ball Challenge',
      desc:'Throw and catch a ball 20 times without dropping!',
      voice:'Find a ball or make one from socks. Throw it up and catch it 20 times. Try not to drop it!',
      minMin:3, xp:25, coins:5 },

    // 📚 LEARN
    { id:'m11', cat:'learn', icon:'📚', emoji:'📖', title:'Read 5 Pages',
      desc:'Read 5 pages of any book, or ask someone to read to you!',
      voice:'Find a book you like. Read 5 pages. If reading is hard, ask your mom, dad, or sibling to read to you!',
      minMin:5, xp:45, coins:9 },
    { id:'m12', cat:'learn', icon:'🔢', emoji:'🧮', title:'Count Everything',
      desc:'Count all chairs, windows, and doors in your house!',
      voice:'Walk around your house. Count all the chairs. Then count all the windows. Then count all the doors!',
      minMin:5, xp:35, coins:7 },
    { id:'m13', cat:'learn', icon:'✍️', emoji:'📝', title:'Write 5 Words',
      desc:'Write 5 new words and draw a picture for each!',
      voice:'Take a paper and pencil. Write 5 words. Draw a small picture next to each. Write SUN and draw a sun!',
      minMin:5, xp:40, coins:8 },
    { id:'m14', cat:'learn', icon:'🗣️', emoji:'🌍', title:'Teach Someone',
      desc:'Teach someone in your family one thing you learned today!',
      voice:'Think of something you learned. Go teach it to your family. Be the teacher today!',
      minMin:5, xp:50, coins:10 },
    { id:'m15', cat:'learn', icon:'🧩', emoji:'🤔', title:'Puzzle Time',
      desc:'Solve a puzzle or play a board game with family!',
      voice:'Find a puzzle, riddle book, or board game. Solve it with your family! Use your brain!',
      minMin:10, xp:55, coins:11 },

    // 🌿 EXPLORE
    { id:'m16', cat:'explore', icon:'🌿', emoji:'🌳', title:'Nature Detective',
      desc:'Go outside and find 5 different types of leaves!',
      voice:'Go outside to your garden or park. Find 5 different leaves or flowers. Look at their shapes and colors!',
      minMin:10, xp:50, coins:10 },
    { id:'m17', cat:'explore', icon:'☁️', emoji:'🌤️', title:'Cloud Watcher',
      desc:'Look at the clouds and find shapes for 5 minutes!',
      voice:'Go outside and look up at the sky. Watch the clouds for 5 minutes. What shapes do you see? A dog? A dragon?',
      minMin:5, xp:35, coins:7 },
    { id:'m18', cat:'explore', icon:'🐦', emoji:'🦜', title:'Bird Spotter',
      desc:'Sit quietly outside and count birds for 5 minutes!',
      voice:'Go outside and sit very quietly. Watch for birds for 5 minutes. Count how many you see!',
      minMin:5, xp:40, coins:8 },
    { id:'m19', cat:'explore', icon:'🏡', emoji:'🔍', title:'Color Hunt',
      desc:'Find 5 things in your home that are the same color!',
      voice:'Pick a color. Red, blue, or green. Walk around your home and find 5 things of that color!',
      minMin:3, xp:25, coins:5 },

    // 🧘 MINDFUL
    { id:'m20', cat:'mindful', icon:'🧘', emoji:'😌', title:'Breathing Buddy',
      desc:'Take 10 slow deep breaths. In through nose, out through mouth!',
      voice:'Sit comfortably and close your eyes. Breathe in slowly through your nose. 1, 2, 3. Breathe out through your mouth. Do this 10 times.',
      minMin:2, xp:25, coins:5 },
    { id:'m21', cat:'mindful', icon:'📝', emoji:'🙏', title:'Gratitude List',
      desc:'Say or write 3 things you are thankful for today!',
      voice:'Think about 3 things that made you happy today. Your food, your friends, your family. Say them out loud!',
      minMin:3, xp:30, coins:6 },
    { id:'m22', cat:'mindful', icon:'👂', emoji:'🔇', title:'Sound Safari',
      desc:'Close your eyes for 2 minutes and count every sound you hear!',
      voice:'Sit still and close your eyes. Listen carefully for 2 minutes. How many sounds can you hear? Birds? Cars? Wind?',
      minMin:2, xp:25, coins:5 },
    { id:'m23', cat:'mindful', icon:'🤗', emoji:'💝', title:'Kindness Quest',
      desc:'Do one kind thing for someone — help, share, or say thanks!',
      voice:'Do something kind! Help your parents. Share with a friend. Say something nice to someone. Kindness is a superpower!',
      minMin:3, xp:40, coins:8 },
    { id:'m24', cat:'mindful', icon:'🎨', emoji:'😊', title:'Feeling Colors',
      desc:'Draw how you feel today using only colors — no words needed!',
      voice:'Take colors and paper. Think about how you feel. Happy? Calm? Excited? Draw it using colors and shapes!',
      minMin:5, xp:35, coins:7 },
  ];

  // ── State ──
  let state = loadState();

  function loadState() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) return JSON.parse(s);
    } catch(e) {}
    return {
      completed: [],
      totalOfflineMinutes: 0,
      totalMissions: 0,
      streak: 0,
      lastDate: null,
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ── Voice (TTS for young kids) ──
  function speak(text) {
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 1.1;
    utter.lang = 'en-IN';
    const voices = synth.getVoices();
    const pref = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
              || voices.find(v => v.lang.startsWith('en'))
              || voices[0];
    if (pref) utter.voice = pref;
    synth.speak(utter);
  }

  function speakCurrentMission() {
    if (currentMission) {
      speak(currentMission.voice);
    } else {
      speak('Choose a mission! Put your device down and do something amazing in the real world!');
    }
  }

  // ── Screen-off tracking (Page Visibility API) ──
  function initVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (!currentMission || !screenOffStart) return;
      // We just track total elapsed from start — simpler and more reliable
    });
  }

  // ── Accept mission ──
  function acceptMission(id) {
    const mission = MISSIONS.find(m => m.id === id);
    if (!mission) return;

    currentMission = mission;
    screenOffStart = Date.now();
    totalOfflineSeconds = 0;

    speak(mission.voice);
    renderActiveMission();

    if (offlineTimer) clearInterval(offlineTimer);
    offlineTimer = setInterval(updateTimer, 1000);

    showToast('🌟 Mission accepted! Put your device down and GO!', 'success');
  }

  function renderActiveMission() {
    const area = document.getElementById('mission-active-area');
    if (!area || !currentMission) return;
    const m = currentMission;

    area.innerHTML = `
      <div class="mission-active-card">
        <div class="mission-active-pulse"></div>
        <div class="mission-active-header">
          <div class="mission-active-icon">${m.emoji}</div>
          <div class="mission-active-info">
            <div class="mission-active-label">🟢 ACTIVE MISSION</div>
            <div class="mission-active-title">${m.title}</div>
          </div>
          <button class="btn btn-outline btn-sm mission-voice-btn" onclick="OfflineMissions.speakCurrentMission()">🔊 Listen</button>
        </div>
        <div class="mission-active-desc">${m.desc}</div>
        <div class="mission-active-timer-area">
          <div class="mission-timer-ring">
            <div class="mission-timer-icon">⏱️</div>
            <div class="mission-timer-value" id="mission-elapsed">0:00</div>
            <div class="mission-timer-label">Time Away</div>
          </div>
          <div class="mission-timer-info">
            <div class="mission-timer-tip">💡 Put your device DOWN now!</div>
            <div class="mission-timer-tip">📱 Come back when you finish</div>
            <div class="mission-timer-tip">⚡ Min ${m.minMin} min for full XP</div>
          </div>
        </div>
        <div class="mission-active-actions">
          <button class="btn btn-accent btn-lg" onclick="OfflineMissions.completeMission()">✅ I Did It!</button>
          <button class="btn btn-outline btn-sm" onclick="OfflineMissions.cancelMission()">❌ Cancel</button>
        </div>
      </div>
    `;
    // Hide the grid
    const grid = document.getElementById('mission-grid');
    if (grid) grid.style.display = 'none';
    const tabs = document.getElementById('mission-category-tabs');
    if (tabs) tabs.style.display = 'none';
  }

  function updateTimer() {
    const el = document.getElementById('mission-elapsed');
    if (!el || !screenOffStart) return;
    const sec = Math.floor((Date.now() - screenOffStart) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ── Complete mission ──
  function completeMission() {
    if (!currentMission) return;
    if (offlineTimer) clearInterval(offlineTimer);

    const sec = Math.floor((Date.now() - screenOffStart) / 1000);
    const mins = Math.max(1, Math.floor(sec / 60));
    const met = mins >= currentMission.minMin;

    let xp = met ? currentMission.xp : Math.round(currentMission.xp * 0.5);
    let coins = met ? currentMission.coins : Math.round(currentMission.coins * 0.5);
    if (met) { xp += (mins - currentMission.minMin) * 2; coins += Math.floor((mins - currentMission.minMin) * 0.5); }

    // Award
    AppData.student.xp += xp;
    AppData.student.coins += coins;
    document.getElementById('sidebar-xp').textContent = AppData.student.xp.toLocaleString();
    document.getElementById('sidebar-coins').textContent = AppData.student.coins;

    // State
    state.completed.push({ id: currentMission.id, date: new Date().toISOString(), mins });
    state.totalOfflineMinutes += mins;
    state.totalMissions++;
    const today = new Date().toDateString();
    if (state.lastDate && state.lastDate !== today) {
      const yest = new Date(Date.now() - 86400000).toDateString();
      state.streak = (state.lastDate === yest) ? state.streak + 1 : 1;
    } else if (!state.lastDate) {
      state.streak = 1;
    }
    state.lastDate = today;
    saveState();

    // Achievements
    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.incrementStat('missions_completed');
      AchievementSystem.recordStat('offline_minutes', state.totalOfflineMinutes);
      AchievementSystem.recordStat('mission_streak', state.streak);
      const cats = new Set(state.completed.map(c => { const mm = MISSIONS.find(x => x.id === c.id); return mm ? mm.cat : null; }).filter(Boolean));
      AchievementSystem.recordStat('unique_categories', cats.size);
    }

    speak(`Amazing job! You spent ${mins} minutes away from the screen! You earned ${xp} experience points!`);

    const area = document.getElementById('mission-active-area');
    area.innerHTML = `
      <div class="mission-complete-card">
        <div class="mission-complete-stars">🌟 ⭐ 🌟</div>
        <div class="mission-complete-title">${met ? '🎉 Mission Complete!' : '👍 Good Try!'}</div>
        <div class="mission-complete-name">${currentMission.title}</div>
        <div class="mission-complete-time">
          <span class="mission-time-big">⏱️ ${mins} min offline</span>
        </div>
        <div class="mission-complete-rewards">
          <div class="mission-reward-pill xp">⚡ +${xp} XP</div>
          <div class="mission-reward-pill coin">💰 +${coins} Coins</div>
        </div>
        <div class="mission-complete-msg">${met
          ? '🌍 You chose the REAL WORLD over a screen. That takes real courage!'
          : `⏰ Stay offline ${currentMission.minMin}+ min for full rewards!`}</div>
        <button class="btn btn-primary btn-lg" onclick="OfflineMissions.resetView()" style="margin-top:16px">🌟 Another Mission</button>
      </div>
    `;

    showToast(`🌍 ${mins}min offline! +${xp} XP, +${coins} Coins!`, 'success');
    currentMission = null;
    screenOffStart = null;
  }

  function cancelMission() {
    if (offlineTimer) clearInterval(offlineTimer);
    currentMission = null;
    screenOffStart = null;
    synth && synth.cancel();
    resetView();
    showToast('Mission cancelled', 'warning');
  }

  function resetView() {
    const area = document.getElementById('mission-active-area');
    if (area) area.innerHTML = '';
    const grid = document.getElementById('mission-grid');
    if (grid) grid.style.display = '';
    const tabs = document.getElementById('mission-category-tabs');
    if (tabs) tabs.style.display = '';
    renderMissions('all');
    updateStats();
  }

  // ── Filter & Render ──
  function filterCategory(cat, btn) {
    document.querySelectorAll('.mission-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderMissions(cat);
  }

  function renderMissions(cat) {
    const grid = document.getElementById('mission-grid');
    if (!grid) return;
    const list = cat === 'all' ? MISSIONS : MISSIONS.filter(m => m.cat === cat);

    // Shuffle for variety (seed by day so consistent per day)
    const seed = new Date().getDate() + new Date().getMonth() * 31;
    const shuffled = [...list].sort((a, b) => {
      return ((seed * a.id.charCodeAt(2)) % 100) - ((seed * b.id.charCodeAt(2)) % 100);
    });
    const display = cat === 'all' ? shuffled.slice(0, 8) : shuffled;

    const catLabels = { create:'🎨 Create', move:'🏃 Move', learn:'📚 Learn', explore:'🌿 Explore', mindful:'🧘 Mindful' };
    const catColors = { create:'#F59E0B', move:'#EF4444', learn:'#7C3AED', explore:'#10B981', mindful:'#06B6D4' };

    grid.innerHTML = display.map(m => `
      <div class="mission-card" style="--mission-accent:${catColors[m.cat]}">
        <div class="mission-card-cat" style="color:${catColors[m.cat]}">${catLabels[m.cat]}</div>
        <div class="mission-card-emoji">${m.emoji}</div>
        <div class="mission-card-title">${m.title}</div>
        <div class="mission-card-desc">${m.desc}</div>
        <div class="mission-card-meta">
          <span class="mission-meta-time">⏱️ ${m.minMin}+ min</span>
          <span class="mission-meta-xp">⚡ ${m.xp} XP</span>
        </div>
        <div class="mission-card-actions">
          <button class="btn btn-accent btn-sm" onclick="OfflineMissions.acceptMission('${m.id}')">🚀 Start</button>
          <button class="btn btn-outline btn-sm mission-listen-btn" onclick="event.stopPropagation();OfflineMissions.speakMission('${m.id}')">🔊</button>
        </div>
      </div>
    `).join('');
  }

  function speakMission(id) {
    const m = MISSIONS.find(x => x.id === id);
    if (m) speak(m.voice);
  }

  function updateStats() {
    const el = document.getElementById('mission-streak');
    if (el) el.textContent = state.totalMissions;
    const offEl = document.getElementById('mission-offline-mins');
    if (offEl) offEl.textContent = state.totalOfflineMinutes;
  }

  // ── Show menu (called from nav) ──
  function showMenu() {
    if (currentMission) {
      renderActiveMission();
    } else {
      resetView();
    }
  }

  // ── Init ──
  function init() {
    initVisibilityTracking();
    // Preload voices
    if (synth) synth.getVoices();
  }

  init();

  return {
    showMenu, acceptMission, completeMission, cancelMission,
    speakCurrentMission, speakMission, filterCategory, resetView, updateStats,
    MISSIONS, state
  };
})();
