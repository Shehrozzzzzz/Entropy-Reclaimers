// ======================================================
// ENTROPY RECLAIMERS — Feature 1: Parental Lock System
// ======================================================

const ParentalLock = (() => {
  let locked = false;
  let scanStage = 'idle';
  let currentUsageMinutes = 0;
  // Parent PIN stored here — in production this would be server-side biometric hash
  const PARENT_PIN = '1234';

  const getLimitMinutes = () => parseInt(document.getElementById('usage-limit-range')?.value || 120);

  function lock(reason = "Excessive screen time detected") {
    if (locked) return;
    locked = true;

    const overlay = document.getElementById('lock-overlay');
    overlay.classList.add('active');
    document.getElementById('lock-reason').textContent = reason;
    document.getElementById('lock-usage-display').textContent = `${currentUsageMinutes}m`;
    document.getElementById('lock-limit-display').textContent = `${getLimitMinutes()}m`;

    startLockClock();
    showToast('🔒 Device Locked — Excessive usage detected!', 'danger');

    // Notify parent (simulate)
    setTimeout(() => {
      showToast('📱 Parent notified via Guardian Mode', 'warning');
    }, 1500);
  }

  function startLockClock() {
    const el = document.getElementById('lock-time');
    function updateClock() {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  function triggerFaceID() {
    if (scanStage === 'scanning') return;

    // Show parent PIN prompt on lock screen
    const existing = document.getElementById('lock-pin-prompt');
    if (existing) { existing.remove(); }

    const prompt = document.createElement('div');
    prompt.id = 'lock-pin-prompt';
    prompt.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(16,185,129,0.3);border-radius:16px;padding:20px 28px;';
    prompt.innerHTML = `
      <div style="font-size:13px;color:#9B9BC4;margin-bottom:4px">&#128274; Parent PIN Required to Unlock</div>
      <input id="lock-pin-input" type="password" maxlength="4" placeholder="Enter 4-digit PIN"
        style="background:#0D0D24;border:1px solid rgba(124,58,237,0.4);color:white;border-radius:10px;padding:10px 16px;font-size:20px;text-align:center;width:160px;letter-spacing:8px;outline:none;"
        inputmode="numeric" pattern="[0-9]*">
      <div style="display:flex;gap:10px;margin-top:4px">
        <button onclick="ParentalLock.verifyPIN()" style="background:linear-gradient(135deg,#7C3AED,#5B21B6);color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">&#9989; Verify PIN</button>
        <button onclick="document.getElementById('lock-pin-prompt').remove()" style="background:rgba(255,255,255,0.05);color:#9B9BC4;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;">Cancel</button>
      </div>
      <div id="lock-pin-error" style="font-size:12px;color:#EF4444;min-height:16px;"></div>
    `;

    // Insert before the faceid-btn
    const btn = document.getElementById('faceid-btn');
    btn.parentNode.insertBefore(prompt, btn);
    document.getElementById('lock-pin-input').focus();

    // Allow Enter key
    document.getElementById('lock-pin-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') ParentalLock.verifyPIN();
    });
  }

  function verifyPIN() {
    const input = document.getElementById('lock-pin-input');
    const error = document.getElementById('lock-pin-error');
    if (!input) return;
    const entered = input.value.trim();

    if (entered !== PARENT_PIN) {
      error.textContent = '❌ Wrong PIN. Access denied.';
      input.value = '';
      input.style.borderColor = '#EF4444';
      setTimeout(() => { input.style.borderColor = 'rgba(124,58,237,0.4)'; error.textContent = ''; }, 2000);
      return;
    }

    // Correct PIN — run scan animation then unlock
    const prompt = document.getElementById('lock-pin-prompt');
    if (prompt) prompt.remove();
    scanStage = 'scanning';

    const scanner = document.getElementById('faceid-scanner');
    const label = document.getElementById('faceid-label');
    const progress = document.getElementById('faceid-progress-fill');
    const btn = document.getElementById('faceid-btn');

    scanner.classList.add('active');
    btn.disabled = true;
    label.textContent = 'PIN verified. Confirming parent identity...';
    progress.style.width = '0%';
    spawnFaceDots();

    let prog = 0;
    const interval = setInterval(() => {
      prog += 15; if (prog > 100) prog = 100;
      progress.style.width = prog + '%';
      if (prog < 50) label.textContent = 'Scanning biometrics...';
      else if (prog < 85) label.textContent = 'Matching parent profile...';
      else label.textContent = '&#9989; Parent Verified!';
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      progress.style.width = '100%';
      progress.style.background = 'linear-gradient(90deg,#10B981,#34D399)';
      scanStage = 'success';
      setTimeout(() => unlock(), 1000);
    }, 2000);
  }

  function spawnFaceDots() {
    const container = document.getElementById('faceid-dots');
    container.innerHTML = '';
    const positions = [
      [30,20],[50,18],[70,22],[25,40],[75,38],[20,60],[80,58],[30,75],[70,72],[50,80],
      [40,30],[60,28],[35,55],[65,52],[45,65],[55,42],[38,48],[62,46]
    ];
    positions.forEach(([left, top], i) => {
      const dot = document.createElement('div');
      dot.className = 'faceid-dot';
      dot.style.cssText = `left:${left}%;top:${top}%;animation-delay:${i * 0.08}s`;
      container.appendChild(dot);
    });
  }

  function unlock() {
    locked = false;
    scanStage = 'idle';
    currentUsageMinutes = 0;

    const overlay = document.getElementById('lock-overlay');
    overlay.classList.remove('active');

    // Reset scanner
    const scanner = document.getElementById('faceid-scanner');
    scanner.classList.remove('active');
    document.getElementById('faceid-progress-fill').style.width = '0%';
    document.getElementById('faceid-progress-fill').style.background = '';
    document.getElementById('faceid-label').textContent = 'Scan parent\'s face to unlock';
    document.getElementById('faceid-btn').disabled = false;
    document.getElementById('faceid-btn').textContent = '👤 Scan Parent Face ID';

    showToast('🔓 Device Unlocked by Parent Guardian', 'success');
    updateUsageDisplay();
  }

  function triggerManualLock() {
    currentUsageMinutes = getLimitMinutes() + 15;
    lock(`Screen time exceeded ${getLimitMinutes()} minute daily limit`);
  }

  function isLocked() { return locked; }

  // Update the usage counter on dashboard
  function updateUsageDisplay() {
    const el = document.getElementById('today-usage-minutes');
    if (el) el.textContent = currentUsageMinutes + 'm';

    const pct = Math.min((currentUsageMinutes / getLimitMinutes()) * 100, 100);
    const bar = document.getElementById('usage-progress-bar');
    if (bar) bar.style.width = pct + '%';

    // Change color based on usage
    if (bar) {
      if (pct > 90) bar.style.background = 'linear-gradient(90deg,#EF4444,#F87171)';
      else if (pct > 70) bar.style.background = 'linear-gradient(90deg,#F59E0B,#FCD34D)';
      else bar.style.background = 'linear-gradient(90deg,#10B981,#34D399)';
    }
  }

  return { lock, unlock, triggerFaceID, verifyPIN, triggerManualLock, isLocked, updateUsageDisplay };
})();
