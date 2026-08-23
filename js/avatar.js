/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — Feature 3: AI Habit Coach Avatar
// ======================================================

const AvatarCoach = (() => {
  let factIndex = 0;
  let timerId = null;
  let isVisible = false;

  // ── CONFIGURABLE TIMING CONSTANTS ──
  const INTERVAL_MS = 60 * 60 * 1000; // 60 minutes between interventions
  const FIRST_LOAD_DELAY_MS = 10 * 1000; // 10 seconds delay on first session entry
  const LAST_SHOWN_KEY = 'er_last_reco_shown';

  function getLastShownTimestamp() {
    return parseInt(localStorage.getItem(LAST_SHOWN_KEY) || '0', 10);
  }

  function recordShownTimestamp() {
    localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString());
  }

  function isFocusSessionActive() {
    return typeof FocusTimer !== 'undefined' && FocusTimer.isRunning && FocusTimer.isRunning();
  } // 2 minutes

  function getNextFact() {
    const fact = AVATAR_FACTS[factIndex % AVATAR_FACTS.length];
    factIndex++;
    return fact;
  }

  function buildRECOSvg(mood) {
    let eyes = `
      <circle cx="34" cy="26" r="7" fill="#0A0A14"/>
      <circle cx="56" cy="26" r="7" fill="#0A0A14"/>
      <circle cx="34" cy="26" r="4" fill="#7C3AED" class="reco-eye-l"/>
      <circle cx="56" cy="26" r="4" fill="#10B981" class="reco-eye-r"/>
      <circle cx="35.5" cy="24.5" r="1.5" fill="white"/>
      <circle cx="57.5" cy="24.5" r="1.5" fill="white"/>
    `;
    let mouth = `<path id="reco-mouth" d="M33 37 Q45 44 57 37" stroke="#7C3AED" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    let eyebrows = '';

    if (mood === 'angry') {
      eyes = `
        <circle cx="34" cy="26" r="7" fill="#0A0A14"/>
        <circle cx="56" cy="26" r="7" fill="#0A0A14"/>
        <circle cx="34" cy="26" r="4" fill="#EF4444"/>
        <circle cx="56" cy="26" r="4" fill="#EF4444"/>
        <circle cx="35.5" cy="24.5" r="1.5" fill="white"/>
        <circle cx="57.5" cy="24.5" r="1.5" fill="white"/>
      `;
      eyebrows = `
        <line x1="26" y1="19" x2="42" y2="24" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
        <line x1="64" y1="19" x2="48" y2="24" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
      `;
      mouth = `<path d="M33 40 Q45 35 57 40" stroke="#EF4444" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    } 
    else if (mood === 'taunting') {
      eyebrows = `
        <line x1="26" y1="23" x2="42" y2="19" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
        <line x1="64" y1="19" x2="48" y2="23" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
      `;
      mouth = `<path d="M33 38 Q45 38 57 32" stroke="#7C3AED" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    }
    else if (mood === 'disappointed') {
      eyebrows = `
        <line x1="26" y1="22" x2="42" y2="19" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
        <line x1="64" y1="22" x2="48" y2="19" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>
      `;
      mouth = `<line x1="36" y1="39" x2="54" y2="39" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round"/>`;
    }

    return `
    <svg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <!-- Body -->
      <rect x="20" y="38" width="50" height="42" rx="12" fill="#1A1A38" stroke="#7C3AED" stroke-width="2"/>
      <!-- Head -->
      <rect x="22" y="10" width="46" height="38" rx="14" fill="#22224A" stroke="#7C3AED" stroke-width="2"/>
      <!-- Eyes & Eyebrows -->
      ${eyes}
      ${eyebrows}
      <!-- Mouth -->
      ${mouth}
      <!-- Antenna -->
      <line x1="45" y1="10" x2="45" y2="2" stroke="#7C3AED" stroke-width="2"/>
      <circle cx="45" cy="2" r="3" fill="#F59E0B"/>
      <!-- Arms -->
      <rect x="5" y="42" width="16" height="8" rx="4" fill="#22224A" stroke="#7C3AED" stroke-width="1.5"/>
      <rect x="69" y="42" width="16" height="8" rx="4" fill="#22224A" stroke="#7C3AED" stroke-width="1.5"/>
      <!-- Chest screen -->
      <rect x="30" y="50" width="30" height="18" rx="6" fill="#0D0D24" stroke="#10B981" stroke-width="1.5"/>
      <text x="45" y="63" text-anchor="middle" font-size="12" fill="#10B981">XP</text>
      <!-- Legs -->
      <rect x="28" y="80" width="12" height="10" rx="4" fill="#22224A" stroke="#7C3AED" stroke-width="1.5"/>
      <rect x="50" y="80" width="12" height="10" rx="4" fill="#22224A" stroke="#7C3AED" stroke-width="1.5"/>
      <!-- Glow effect -->
      <circle cx="45" cy="45" r="42" fill="none" stroke="#7C3AED" stroke-width="0.5" opacity="0.3"/>
    </svg>`;
  }

  const TAUNTS = [
    "Are you really going to let a piece of glass and metal control your entire future?",
    "Every minute you scroll, someone else is studying and stealing your dream job.",
    "Your brain is literally shrinking right now. Put the phone down.",
    "Oh look, another 5 minutes wasted. Your GPA isn't going to fix itself, you know.",
    "Keep scrolling. I'm sure that meme will look great on your resume.",
    "You’re playing into the algorithm's hands. Are you a student or just a data point?",
    "Congratulations! You've successfully accomplished absolutely nothing in the last 10 minutes.",
    "Is this really the best use of your time? Because it looks like you're losing the game of life."
  ];

  // ── Indian Mythology Rotating Characters (Raavan, God Avatar themes) ──
  const POPUP_CHARACTERS = [
    {
      label: 'DASHAANAN (RAAVAN)', title: '10 HEADS OF DISTRACTION!',
      color: '#EF4444', glow: 'rgba(239,68,68,0.5)',
      subtitle: 'I conquered the three worlds, but you cannot even conquer your phone?',
      badge: '👑 RECO — Raavan Encounter',
      cta: '🏹 FIRE THE BRAHMASTRA OF FOCUS',
      art: `<svg width="180" height="120" viewBox="0 0 200 120" style="filter:drop-shadow(0 0 15px rgba(239,68,68,0.6));">
              <!-- Shoulders -->
              <path d="M30 120 Q100 80 170 120" fill="#991b1b" stroke="#7f1d1d" stroke-width="3"/>
              <!-- Center Head -->
              <rect x="80" y="40" width="40" height="50" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
              <polygon points="80,40 85,15 100,30 115,15 120,40" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
              <circle cx="90" cy="55" r="4" fill="#ef4444"><animate attributeName="r" values="4;2;4" dur="2s" repeatCount="indefinite"/></circle>
              <circle cx="110" cy="55" r="4" fill="#ef4444"><animate attributeName="r" values="4;2;4" dur="2s" repeatCount="indefinite"/></circle>
              <path d="M85 75 Q100 65 115 75" fill="none" stroke="#1e293b" stroke-width="3"/>
              <path d="M90 78 L95 85 L105 85 L110 78" fill="white" stroke="#1e293b"/>
              <!-- Left Head -->
              <rect x="40" y="50" width="30" height="40" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
              <polygon points="40,50 45,30 55,40 65,30 70,50" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
              <circle cx="48" cy="65" r="3" fill="#ef4444"/>
              <circle cx="62" cy="65" r="3" fill="#ef4444"/>
              <path d="M45 75 Q55 70 65 75" fill="none" stroke="#1e293b" stroke-width="2"/>
              <!-- Right Head -->
              <rect x="130" y="50" width="30" height="40" fill="#fcd34d" stroke="#b45309" stroke-width="2"/>
              <polygon points="130,50 135,30 145,40 155,30 160,50" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
              <circle cx="138" cy="65" r="3" fill="#ef4444"/>
              <circle cx="152" cy="65" r="3" fill="#ef4444"/>
              <path d="M135 75 Q145 70 155 75" fill="none" stroke="#1e293b" stroke-width="2"/>
            </svg>`,
    },
    {
      label: 'KUMBHKARAN', title: 'WAKE UP FROM SLUMBER!',
      color: '#7C3AED', glow: 'rgba(124,58,237,0.5)',
      subtitle: 'I sleep for 6 months, but your scrolling feels like an eternity.',
      badge: '🛌 RECO — Kumbhkaran Alert',
      cta: '⚡ CHOOSE KARMA OVER SLUMBER',
      art: '😴📱💤',
    },
    {
      label: 'MAYA', title: 'BREAK THE ILLUSION!',
      color: '#F59E0B', glow: 'rgba(245,158,11,0.5)',
      subtitle: 'The algorithm is an illusion designed to trap your mind.',
      badge: '🌀 RECO — Maya Illusion',
      cta: '👁️ OPEN THE THIRD EYE OF FOCUS',
      art: '🌀👁️📱',
    },
    {
      label: 'CHAKRAVYUH', title: 'YOU ARE TRAPPED!',
      color: '#06B6D4', glow: 'rgba(6,182,212,0.5)',
      subtitle: 'You entered the infinite scroll Chakravyuh, but how will you exit?',
      badge: '🏹 RECO — Chakravyuh Warning',
      cta: '🗡️ BREAK THE FORMATION',
      art: '🕸️📱⚔️',
    }
  ];

  let charIndex = 0;

  function renderPopupCharacter() {
    const c = POPUP_CHARACTERS[charIndex % POPUP_CHARACTERS.length];
    charIndex++;
    const container = document.getElementById('popup-character');
    if (!container) return c;

    container.innerHTML = `
      <div style="position:relative;display:inline-block;margin-bottom:6px">
        <div style="font-size:64px;animation:demonFloat 2s ease-in-out infinite;filter:drop-shadow(0 0 20px ${c.glow});line-height:1">${c.art}</div>
        <div style="font-size:9px;color:${c.color};font-weight:800;letter-spacing:3px;margin-top:4px;animation:stopPulse 1s ease-in-out infinite">${c.label}</div>
      </div>
      <div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:900;color:${c.color};letter-spacing:3px;text-shadow:0 0 20px ${c.glow};animation:stopPulse 1.5s ease-in-out infinite">${c.title}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${c.subtitle}</div>
    `;

    // Update badge and CTA
    const badge = document.getElementById('popup-badge-text');
    if (badge) badge.textContent = c.badge;

    const cta = document.getElementById('avatar-got-it-btn');
    if (cta) cta.textContent = c.cta;

    // Update modal border color to match character
    const modal = document.getElementById('avatar-modal');
    if (modal) {
      modal.style.borderColor = c.color + '66';
      modal.style.boxShadow = `0 0 60px ${c.glow}, 0 0 120px ${c.glow.replace('0.4','0.08')}`;
    }

    return c;
  }

  // ── Emotional voice messages (Text-to-Speech) ──
  // NOTE: No contractions — Windows TTS glitches on apostrophes
  const VOICE_MESSAGES = [
    "Hey, you have been on your phone way too long. Think about your parents. They work hard every single day for your future. Do not waste it scrolling.",
    "Stop right now. Your parents did not send you to college to scroll Instagram. They believe in you. Put the phone down.",
    "Every minute on your phone is a minute your parents worked for nothing. They are counting on you. Do not let them down.",
    "Your mother wakes up early. Your father works overtime. All for you. And you are wasting it on a screen. Is that who you want to be?",
    "Wake up call. Your screen time is alarming. Your parents sacrificed everything for your education. Honor that. Go study now.",
    "While you scroll, someone else is studying and taking the opportunity you wanted. Your parents did not raise a quitter."
  ];

  let voiceIndex = 0;

  function speakMessage(text) {
    if (!('speechSynthesis' in window)) return;
    // Cancel any ongoing or queued speech
    window.speechSynthesis.cancel();
    
    // Small delay to let cancel complete
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // Pick the cleanest voice available (avoid glitchy ones)
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Zira'))
                     || voices.find(v => v.name.includes('David'))
                     || voices.find(v => v.name.includes('Mark'))
                     || voices.find(v => v.name.includes('Google US'))
                     || voices.find(v => v.lang === 'en-US');
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    }, 100);
  }

  function show() {
    if (isVisible) return;

    const fact = getNextFact();
    const overlay = document.getElementById('avatar-overlay');
    const modal = document.getElementById('avatar-modal');

    // Render random fun character
    renderPopupCharacter();
    
    document.getElementById('avatar-fact-title').textContent = fact.title;
    
    // Add random taunt
    const randomTaunt = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
    document.getElementById('avatar-taunt').textContent = `"${randomTaunt}"`;

    document.getElementById('avatar-fact-text').textContent = fact.fact;
    document.getElementById('avatar-fact-source').textContent = `📖 Source: ${fact.source}`;
    document.getElementById('avatar-slogan').textContent = `"${fact.slogan}"`;
    document.getElementById('avatar-fact-num').textContent = `Fact #${factIndex} of ${AVATAR_FACTS.length}`;

    // Reset timer bar
    const timerFill = document.getElementById('avatar-timer-fill');
    timerFill.style.animation = 'none';
    timerFill.offsetHeight;
    timerFill.style.animation = 'timerBarDrain 30s linear forwards';

    overlay.classList.add('active');
    isVisible = true;

    // ── DRAMATIC EFFECTS ──

    // 1. Screen shake
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 800);

    // 2. Red pulse flash
    const flash = document.createElement('div');
    flash.className = 'danger-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1500);

    // 3. Play Spiderman Sound for 6.5 seconds, THEN TEXT-TO-SPEECH
    const voiceMsg = VOICE_MESSAGES[voiceIndex % VOICE_MESSAGES.length];
    voiceIndex++;
    
    try {
      const memeAudio = new Audio('audio/spiderman.mp3');
      memeAudio.volume = 1.0;
      
      let speechTriggered = false;
      const triggerSpeech = () => {
        if (speechTriggered) return;
        speechTriggered = true;
        // Fade the music to the background when speaking
        let fadeInterval = setInterval(() => {
          if (memeAudio.volume > 0.1) {
            memeAudio.volume -= 0.1;
          } else {
            clearInterval(fadeInterval);
            memeAudio.volume = 0.05; // Keep it very quiet in background
          }
        }, 100);
        speakMessage(voiceMsg);
      };

      // Play music for 6.5 seconds, then drop volume and speak
      setTimeout(triggerSpeech, 6500);

      memeAudio.play().catch(e => {
        console.warn("Audio autoplay blocked by browser:", e);
        // Fallback: speak immediately if audio is blocked
        setTimeout(() => speakMessage(voiceMsg), 600);
      });
    } catch(e) { 
      console.error("Audio error:", e); 
      setTimeout(() => speakMessage(voiceMsg), 600);
    }

    // Particle burst
    spawnParticles(modal);

    // Auto-dismiss after 35s (longer to let voice finish)
    setTimeout(() => { 
      if (isVisible) hide(); 
      window.speechSynthesis.cancel(); // stop speech on dismiss
    }, 35000);
  }


  function hide() {
    const overlay = document.getElementById('avatar-overlay');
    overlay.classList.remove('active');
    isVisible = false;
  }

  function spawnParticles(container) {
    const emojis = ['⭐', '✨', '💫', '🎯', '🧠', '💡'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position:fixed; font-size:18px; pointer-events:none; z-index:9999;
        top: ${40 + Math.random() * 20}%;
        left: ${20 + Math.random() * 60}%;
        animation: particleFly 1.2s ease forwards;
        --tx: ${(Math.random() - 0.5) * 200}px;
        --ty: ${-60 - Math.random() * 80}px;
        animation-delay: ${i * 0.08}s;
      `;
      p.textContent = emojis[i % emojis.length];
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1500);
    }
  }

  function start() {
    if (intervalId) return;
    // Show after 45 seconds on first load (not immediately — avoids lag)
    setTimeout(show, 45000);
    intervalId = setInterval(show, INTERVAL_MS);
  }

  function stop() {
    clearInterval(intervalId);
    intervalId = null;
    hide();
  }

  return { show, hide, start, stop };
})();
