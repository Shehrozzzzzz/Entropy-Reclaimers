// ======================================================
// ENTROPY RECLAIMERS — Brain Games
// Memory Match, Math Sprint, Reaction Time, Word Scramble
// ======================================================

const BrainGames = (() => {
  let currentGame = null;
  let gameTimer = null;
  let gamesPlayedThisSession = new Set();

  // ═══════════════════════════════════════════
  // 1. MEMORY MATCH
  // ═══════════════════════════════════════════
  const MemoryMatch = (() => {
    const EMOJIS = ['🧠','⚡','🎯','🔥','💎','🌟','🚀','🎮','🏆','💡','🧬','🎨'];
    let cards = [], flipped = [], matched = 0, moves = 0, startTime = 0, pairs = 6;

    function start(difficulty = 6) {
      pairs = difficulty;
      const selected = EMOJIS.slice(0, pairs);
      const deck = [...selected, ...selected];
      cards = deck.sort(() => Math.random() - 0.5);
      flipped = []; matched = 0; moves = 0;
      startTime = Date.now();
      currentGame = 'memory';
      render();
    }

    function render() {
      const area = document.getElementById('game-play-area');
      const cols = pairs <= 6 ? 4 : 5;
      area.innerHTML = `
        <div class="game-active-header">
          <div class="game-stat"><span class="game-stat-label">Moves</span><span class="game-stat-val" id="memory-moves">${moves}</span></div>
          <div class="game-stat"><span class="game-stat-label">Matched</span><span class="game-stat-val" id="memory-matched">${matched}/${pairs}</span></div>
          <div class="game-stat"><span class="game-stat-label">Time</span><span class="game-stat-val" id="memory-time">0s</span></div>
        </div>
        <div class="memory-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
          ${cards.map((emoji, i) => `
            <div class="memory-card ${flipped.includes(i) || cards[i] === 'MATCHED' ? 'flipped' : ''}" 
                 data-index="${i}" onclick="BrainGames.memoryFlip(${i})">
              <div class="memory-card-inner">
                <div class="memory-card-front">?</div>
                <div class="memory-card-back">${emoji}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      // Timer update
      if (gameTimer) clearInterval(gameTimer);
      gameTimer = setInterval(() => {
        const el = document.getElementById('memory-time');
        if (el) el.textContent = Math.floor((Date.now() - startTime) / 1000) + 's';
      }, 1000);
    }

    function flip(index) {
      if (flipped.length >= 2 || flipped.includes(index) || cards[index] === 'MATCHED') return;
      flipped.push(index);
      
      // Show card
      const cardEl = document.querySelector(`.memory-card[data-index="${index}"]`);
      if (cardEl) cardEl.classList.add('flipped');

      if (flipped.length === 2) {
        moves++;
        document.getElementById('memory-moves').textContent = moves;

        if (cards[flipped[0]] === cards[flipped[1]]) {
          // Match found
          matched++;
          document.getElementById('memory-matched').textContent = `${matched}/${pairs}`;
          const m0 = flipped[0], m1 = flipped[1];
          cards[m0] = 'MATCHED'; cards[m1] = 'MATCHED';
          flipped = [];
          
          if (matched === pairs) {
            clearInterval(gameTimer);
            const time = Math.floor((Date.now() - startTime) / 1000);
            const score = Math.max(0, 100 - moves * 2 - time);
            const xp = Math.round(score * 1.5);
            setTimeout(() => showGameResult('Memory Match', score, xp, `${moves} moves in ${time}s`), 500);
          }
        } else {
          // No match — flip back
          setTimeout(() => {
            document.querySelectorAll('.memory-card.flipped').forEach(c => {
              const idx = parseInt(c.dataset.index);
              if (cards[idx] !== 'MATCHED') c.classList.remove('flipped');
            });
            flipped = [];
          }, 600);
        }
      }
    }

    return { start, flip };
  })();

  // ═══════════════════════════════════════════
  // 2. MATH SPRINT
  // ═══════════════════════════════════════════
  const MathSprint = (() => {
    let score = 0, total = 0, currentAnswer = 0, timeLeft = 30;

    function start() {
      score = 0; total = 0; timeLeft = 30;
      currentGame = 'math';
      generateProblem();
      if (gameTimer) clearInterval(gameTimer);
      gameTimer = setInterval(() => {
        timeLeft--;
        const el = document.getElementById('math-timer');
        if (el) el.textContent = timeLeft + 's';
        const bar = document.getElementById('math-timer-bar');
        if (bar) bar.style.width = (timeLeft / 30) * 100 + '%';
        if (timeLeft <= 0) {
          clearInterval(gameTimer);
          const xp = score * 8;
          showGameResult('Math Sprint', score, xp, `${score}/${total} correct in 30s`);
        }
      }, 1000);
    }

    function generateProblem() {
      const ops = ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b;

      if (op === '+') { a = Math.floor(Math.random() * 50) + 5; b = Math.floor(Math.random() * 50) + 5; currentAnswer = a + b; }
      else if (op === '-') { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * a); currentAnswer = a - b; }
      else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; currentAnswer = a * b; }

      // Generate 4 choices (one correct)
      const choices = new Set([currentAnswer]);
      while (choices.size < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        if (offset !== 0) choices.add(currentAnswer + offset);
      }
      const shuffled = [...choices].sort(() => Math.random() - 0.5);

      const area = document.getElementById('game-play-area');
      area.innerHTML = `
        <div class="game-active-header">
          <div class="game-stat"><span class="game-stat-label">Score</span><span class="game-stat-val" style="color:var(--accent)" id="math-score">${score}</span></div>
          <div class="game-stat"><span class="game-stat-label">Time</span><span class="game-stat-val" style="color:var(--danger)" id="math-timer">${timeLeft}s</span></div>
        </div>
        <div class="math-timer-wrap"><div class="math-timer-bar" id="math-timer-bar" style="width:${(timeLeft/30)*100}%"></div></div>
        <div class="math-problem">
          <span class="math-num">${a}</span>
          <span class="math-op">${op}</span>
          <span class="math-num">${b}</span>
          <span class="math-eq">=</span>
          <span class="math-q">?</span>
        </div>
        <div class="math-choices">
          ${shuffled.map(c => `
            <button class="math-choice-btn" onclick="BrainGames.mathAnswer(${c})">${c}</button>
          `).join('')}
        </div>
        <div class="math-streak" id="math-streak">${score > 0 ? '🔥'.repeat(Math.min(score, 5)) + ' Streak!' : 'Solve as many as you can!'}</div>
      `;
    }

    function answer(val) {
      total++;
      if (val === currentAnswer) {
        score++;
        showToast(`✅ Correct! +1`, 'success');
      } else {
        showToast(`❌ Wrong! Answer was ${currentAnswer}`, 'danger');
      }
      if (timeLeft > 0) generateProblem();
    }

    return { start, answer };
  })();

  // ═══════════════════════════════════════════
  // 3. REACTION TIME
  // ═══════════════════════════════════════════
  const ReactionTime = (() => {
    let phase = 'waiting', startTs = 0, results = [], round = 0;
    const TOTAL_ROUNDS = 5;

    function start() {
      phase = 'waiting'; results = []; round = 0;
      currentGame = 'reaction';
      nextRound();
    }

    function nextRound() {
      round++;
      if (round > TOTAL_ROUNDS) {
        clearTimeout(gameTimer);
        const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
        const score = Math.max(0, 100 - Math.floor(avg / 5));
        const xp = Math.round(score * 1.2);
        showGameResult('Reaction Time', score, xp, `Avg: ${avg}ms over ${TOTAL_ROUNDS} rounds`);
        return;
      }
      phase = 'waiting';
      const area = document.getElementById('game-play-area');
      area.innerHTML = `
        <div class="game-active-header">
          <div class="game-stat"><span class="game-stat-label">Round</span><span class="game-stat-val">${round}/${TOTAL_ROUNDS}</span></div>
          <div class="game-stat"><span class="game-stat-label">Best</span><span class="game-stat-val" style="color:var(--accent)">${results.length ? Math.min(...results) + 'ms' : '--'}</span></div>
        </div>
        <div class="reaction-box waiting" id="reaction-box" onclick="BrainGames.reactionTap()">
          <div class="reaction-text">⏳ Wait for GREEN...</div>
          <div class="reaction-sub">Round ${round} of ${TOTAL_ROUNDS}</div>
        </div>
      `;

      // Random delay 1.5-5 seconds
      const delay = 1500 + Math.random() * 3500;
      gameTimer = setTimeout(() => {
        phase = 'ready';
        startTs = Date.now();
        const box = document.getElementById('reaction-box');
        if (box) {
          box.className = 'reaction-box ready';
          box.innerHTML = '<div class="reaction-text">🟢 TAP NOW!</div><div class="reaction-sub">Click as fast as you can!</div>';
        }
      }, delay);
    }

    function tap() {
      if (phase === 'waiting') {
        // Too early
        clearTimeout(gameTimer);
        phase = 'early';
        const box = document.getElementById('reaction-box');
        if (box) {
          box.className = 'reaction-box early';
          box.innerHTML = '<div class="reaction-text">❌ Too Early!</div><div class="reaction-sub">Click to retry this round</div>';
        }
        setTimeout(() => { round--; nextRound(); }, 1200);
      } else if (phase === 'ready') {
        const time = Date.now() - startTs;
        results.push(time);
        phase = 'done';
        const box = document.getElementById('reaction-box');
        if (box) {
          box.className = 'reaction-box done';
          box.innerHTML = `<div class="reaction-text">⚡ ${time}ms</div><div class="reaction-sub">${time < 200 ? 'Incredible!' : time < 300 ? 'Great!' : time < 400 ? 'Good!' : 'Keep practicing!'}</div>`;
        }
        setTimeout(nextRound, 1500);
      }
    }

    return { start, tap };
  })();

  // ═══════════════════════════════════════════
  // 4. WORD SCRAMBLE
  // ═══════════════════════════════════════════
  const WordScramble = (() => {
    const WORDS = [
      { word: 'FOCUS', hint: 'The ability to concentrate' },
      { word: 'BRAIN', hint: 'Organ that controls your body' },
      { word: 'STUDY', hint: 'To learn something deeply' },
      { word: 'TIMER', hint: 'Counts down seconds' },
      { word: 'QUEST', hint: 'A mission or challenge' },
      { word: 'HABIT', hint: 'A regular practice' },
      { word: 'DETOX', hint: 'Removing harmful substances' },
      { word: 'SCORE', hint: 'Points you earn' },
      { word: 'LEVEL', hint: 'A stage of progress' },
      { word: 'POWER', hint: 'Strength or ability' },
      { word: 'ENERGY', hint: 'Fuel for your body and mind' },
      { word: 'MENTAL', hint: 'Related to the mind' },
      { word: 'HEALTH', hint: 'State of well-being' },
      { word: 'GROWTH', hint: 'Getting stronger over time' },
      { word: 'REWARD', hint: 'Something earned for good work' },
      { word: 'STREAM', hint: 'Continuous flow' },
      { word: 'SHIELD', hint: 'Protection from harm' },
      { word: 'WISDOM', hint: 'Deep knowledge and judgment' },
    ];

    let current = null, scrambled = '', score = 0, round = 0, timeLeft = 60;
    const TOTAL_ROUNDS = 8;

    function scrambleWord(word) {
      const arr = word.split('');
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      const result = arr.join('');
      return result === word ? scrambleWord(word) : result;
    }

    function start() {
      score = 0; round = 0; timeLeft = 60;
      currentGame = 'word';
      if (gameTimer) clearInterval(gameTimer);
      gameTimer = setInterval(() => {
        timeLeft--;
        const el = document.getElementById('word-timer');
        if (el) el.textContent = timeLeft + 's';
        if (timeLeft <= 0) {
          clearInterval(gameTimer);
          const xp = score * 12;
          showGameResult('Word Scramble', score * 12, xp, `${score}/${TOTAL_ROUNDS} words solved`);
        }
      }, 1000);
      nextWord();
    }

    function nextWord() {
      round++;
      if (round > TOTAL_ROUNDS) {
        clearInterval(gameTimer);
        const xp = score * 12;
        showGameResult('Word Scramble', score * 12, xp, `${score}/${TOTAL_ROUNDS} words solved`);
        return;
      }
      const available = WORDS.filter(w => w !== current);
      current = available[Math.floor(Math.random() * available.length)];
      scrambled = scrambleWord(current.word);

      const area = document.getElementById('game-play-area');
      area.innerHTML = `
        <div class="game-active-header">
          <div class="game-stat"><span class="game-stat-label">Score</span><span class="game-stat-val" style="color:var(--accent)">${score}</span></div>
          <div class="game-stat"><span class="game-stat-label">Round</span><span class="game-stat-val">${round}/${TOTAL_ROUNDS}</span></div>
          <div class="game-stat"><span class="game-stat-label">Time</span><span class="game-stat-val" style="color:var(--danger)" id="word-timer">${timeLeft}s</span></div>
        </div>
        <div class="word-scramble-area">
          <div class="word-hint">💡 Hint: ${current.hint}</div>
          <div class="word-scrambled">${scrambled.split('').map(c => `<span class="word-letter">${c}</span>`).join('')}</div>
          <div class="word-input-wrap">
            <input type="text" id="word-input" class="word-input" placeholder="Type the word..." maxlength="${current.word.length}" autocomplete="off" autofocus
              onkeydown="if(event.key==='Enter')BrainGames.wordSubmit()">
            <button class="btn btn-primary" onclick="BrainGames.wordSubmit()">✓</button>
          </div>
          <button class="btn btn-outline btn-sm" onclick="BrainGames.wordSkip()" style="margin-top:10px">⏭️ Skip</button>
        </div>
      `;
      setTimeout(() => document.getElementById('word-input')?.focus(), 100);
    }

    function submit() {
      const input = document.getElementById('word-input');
      if (!input) return;
      const guess = input.value.trim().toUpperCase();
      if (guess === current.word) {
        score++;
        showToast(`✅ Correct! "${current.word}"`, 'success');
        nextWord();
      } else {
        showToast(`❌ Wrong! Try again...`, 'danger');
        input.value = '';
        input.focus();
      }
    }

    function skip() {
      showToast(`⏭️ Skipped! The word was "${current.word}"`, 'warning');
      nextWord();
    }

    return { start, submit, skip };
  })();

  // ═══════════════════════════════════════════
  // GAME RESULT SCREEN
  // ═══════════════════════════════════════════
  function showGameResult(gameName, score, xp, detail) {
    currentGame = null;
    if (gameTimer) { clearInterval(gameTimer); clearTimeout(gameTimer); }
    const coins = Math.round(xp / 4);

    // Award XP and coins
    AppData.student.xp += xp;
    AppData.student.coins += coins;
    document.getElementById('sidebar-xp').textContent = AppData.student.xp.toLocaleString();
    document.getElementById('sidebar-coins').textContent = AppData.student.coins;



    const area = document.getElementById('game-play-area');
    const grade = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
    const gradeColor = score >= 90 ? 'var(--gold)' : score >= 75 ? 'var(--accent)' : score >= 60 ? 'var(--primary-light)' : score >= 40 ? 'var(--text-secondary)' : 'var(--danger)';

    area.innerHTML = `
      <div class="game-result">
        <div class="game-result-grade" style="color:${gradeColor}; border-color:${gradeColor}">${grade}</div>
        <div class="game-result-title">${gameName} Complete!</div>
        <div class="game-result-detail">${detail}</div>
        <div class="game-result-rewards">
          <div class="game-reward-item"><span class="game-reward-icon">⚡</span><span class="game-reward-val">+${xp} XP</span></div>
          <div class="game-reward-item"><span class="game-reward-icon">💰</span><span class="game-reward-val">+${coins} Coins</span></div>
        </div>
        <div class="game-result-actions">
          <button class="btn btn-primary" onclick="BrainGames.showMenu()">🎮 Play Again</button>
          <button class="btn btn-outline" onclick="navigateTo('dashboard')">🏠 Dashboard</button>
        </div>
      </div>
    `;

    showToast(`🎮 ${gameName}: +${xp} XP, +${coins} Coins!`, 'success');
  }

  // ═══════════════════════════════════════════
  // GAME MENU
  // ═══════════════════════════════════════════
  function showMenu() {
    if (gameTimer) { clearInterval(gameTimer); clearTimeout(gameTimer); }
    currentGame = null;
    const area = document.getElementById('game-play-area');
    if (!area) return;
    area.innerHTML = `
      <div class="game-menu">
        <div class="game-menu-card" onclick="BrainGames.startMemory()">
          <div class="game-menu-icon">🧩</div>
          <div class="game-menu-name">Memory Match</div>
          <div class="game-menu-desc">Find matching pairs. Train your memory and concentration.</div>
          <div class="game-menu-reward">⚡ Up to 150 XP</div>
        </div>
        <div class="game-menu-card" onclick="BrainGames.startMath()">
          <div class="game-menu-icon">🧮</div>
          <div class="game-menu-name">Math Sprint</div>
          <div class="game-menu-desc">Solve as many math problems as you can in 30 seconds!</div>
          <div class="game-menu-reward">⚡ Up to 200 XP</div>
        </div>
        <div class="game-menu-card" onclick="BrainGames.startReaction()">
          <div class="game-menu-icon">⚡</div>
          <div class="game-menu-name">Reaction Time</div>
          <div class="game-menu-desc">Test your reflexes! Tap when the screen turns green.</div>
          <div class="game-menu-reward">⚡ Up to 120 XP</div>
        </div>
        <div class="game-menu-card" onclick="BrainGames.startWord()">
          <div class="game-menu-icon">📝</div>
          <div class="game-menu-name">Word Scramble</div>
          <div class="game-menu-desc">Unscramble focus-related words against the clock!</div>
          <div class="game-menu-reward">⚡ Up to 96 XP</div>
        </div>
      </div>
    `;
  }

  // ── Public API ──
  function startMemory() { MemoryMatch.start(6); }
  function startMath() { MathSprint.start(); }
  function startReaction() { ReactionTime.start(); }
  function startWord() { WordScramble.start(); }
  function memoryFlip(i) { MemoryMatch.flip(i); }
  function mathAnswer(v) { MathSprint.answer(v); }
  function reactionTap() { ReactionTime.tap(); }
  function wordSubmit() { WordScramble.submit(); }
  function wordSkip() { WordScramble.skip(); }

  return { showMenu, startMemory, startMath, startReaction, startWord, memoryFlip, mathAnswer, reactionTap, wordSubmit, wordSkip };
})();

