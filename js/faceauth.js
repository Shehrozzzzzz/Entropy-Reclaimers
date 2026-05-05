/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — Real Face Recognition (face-api.js)
// Anti-Spoofing: Blink + Mouth Challenge
// FIXED: Phone detection disabled on mobile, better enrollment,
//        relaxed thresholds for reliable matching
// ======================================================

const FaceAuth = (() => {
  let modelsLoaded = false;
  let parentDescriptor = null;
  let stream = null;
  let detectionLoop = null;
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/';
  const STORAGE_KEY = 'er_parent_face_v1';
  let modelLoadPromise = null;
  let cocoModel = null;
  let isRunning = false;
  let enrolling = false;

  // ── Device detection ──
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // ── Thresholds — relaxed for mobile cameras ──
  const MATCH_THRESHOLD = isMobile ? 0.52 : 0.55; // Lower = stricter (euclidean distance)
  const ENROLL_SAMPLES = isMobile ? 4 : 5;
  const ENROLL_INPUT_SIZE = isMobile ? 224 : 320; // Bigger = better quality descriptors
  const VERIFY_INPUT_SIZE = isMobile ? 192 : 224;

  // ── Anti-spoofing constants (relaxed for usability) ──
  const BLINK_EAR_LOW = 0.20;
  const BLINK_EAR_HIGH = 0.26;
  const PASSIVE_FRAMES_NEEDED = 6;
  const MOTION_VARIANCE_THRESHOLD = 0.00003;
  const MAX_TOTAL_FRAMES = isMobile ? 200 : 150; // More time on mobile

  // ── Lazy script loader ──
  let scriptsLoaded = false;
  let scriptLoadPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ensureScriptsLoaded() {
    if (scriptsLoaded) return true;
    if (scriptLoadPromise) return scriptLoadPromise;
    scriptLoadPromise = (async () => {
      try {
        if (typeof tf === 'undefined') {
          showFaceStatus('⏳ Loading TensorFlow...', 'info');
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
        }
        const loads = [];
        if (typeof faceapi === 'undefined') {
          loads.push(loadScript('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js'));
        }
        // Only load COCO-SSD on desktop — on mobile it detects the user's own phone!
        if (!isMobile && typeof cocoSsd === 'undefined') {
          loads.push(loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd').catch(() => {
            console.warn('[FaceAuth] COCO-SSD failed to load, phone detection disabled.');
          }));
        }
        await Promise.all(loads);
        scriptsLoaded = true;
        return true;
      } catch (e) {
        console.error('[FaceAuth] Script load failed:', e);
        scriptLoadPromise = null;
        return false;
      }
    })();
    return scriptLoadPromise;
  }

  // ── Load face-api models ──
  async function loadModels() {
    if (modelsLoaded) return true;
    if (modelLoadPromise) return modelLoadPromise;
    modelLoadPromise = (async () => {
      try {
        const scriptsOk = await ensureScriptsLoaded();
        if (!scriptsOk) { modelLoadPromise = null; return false; }

        showFaceStatus('⏳ Loading face recognition models...', 'info');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        // COCO-SSD only on desktop
        if (!isMobile && typeof cocoSsd !== 'undefined' && !cocoModel) {
          try { cocoModel = await cocoSsd.load(); } catch(e) {
            console.warn('[FaceAuth] COCO-SSD model load failed.');
          }
        }
        modelsLoaded = true;
        showFaceStatus('✅ Models loaded. Ready.', 'success');
        return true;
      } catch (e) {
        modelLoadPromise = null;
        showFaceStatus('❌ Failed to load models. Check internet.', 'error');
        console.error(e);
        return false;
      }
    })();
    return modelLoadPromise;
  }

  function preloadModelsInBackground() {
    console.log('[FaceAuth] Models will load on-demand when needed.');
  }

  // ── Camera helpers ──
  async function startCamera(videoEl) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      videoEl.srcObject = stream;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Camera timeout')), 10000);
        videoEl.onloadedmetadata = () => {
          videoEl.play().catch(console.error);
        };
        videoEl.onplaying = () => {
          const checkReady = () => {
            if (videoEl.videoWidth > 0) { clearTimeout(timeout); resolve(); }
            else requestAnimationFrame(checkReady);
          };
          checkReady();
        };
      });

      await new Promise(r => setTimeout(r, 100)); // Extra buffer
      return true;
    } catch (e) {
      console.error("Camera error:", e);
      showFaceStatus('❌ Camera access denied. Please allow camera.', 'error');
      return false;
    }
  }

  function stopCamera() {
    isRunning = false;
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (detectionLoop) { clearInterval(detectionLoop); detectionLoop = null; }
  }

  // ── Face detection ──
  async function detectDescriptor(videoEl, inputSize) {
    const d = await detectFaceData(videoEl, inputSize);
    return d ? d.descriptor : null;
  }

  async function detectFaceData(videoEl, customInputSize) {
    const inputSize = customInputSize || VERIFY_INPUT_SIZE;
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: inputSize,
      scoreThreshold: isMobile ? 0.2 : 0.3
    });

    return await faceapi
      .detectSingleFace(videoEl, options)
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  // ── Geometry helpers ──
  function dist(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  function getEyeAspectRatio(landmarks) {
    const p = landmarks.positions;
    const leftEAR = (dist(p[37], p[41]) + dist(p[38], p[40])) / (2 * dist(p[36], p[39]));
    const rightEAR = (dist(p[43], p[47]) + dist(p[44], p[46])) / (2 * dist(p[42], p[45]));
    return (leftEAR + rightEAR) / 2;
  }

  // ── Anti-Spoofing: Micro-motion variance ──
  function computeRelativeVariance(history) {
    if (history.length < 6) return 999;
    const keys = [36, 39, 42, 45, 30, 48, 54, 62, 66];
    const frames = history.map(lm => {
      const p = lm.positions;
      const cx = p.reduce((s, pt) => s + pt.x, 0) / p.length;
      const cy = p.reduce((s, pt) => s + pt.y, 0) / p.length;
      const fw = dist(p[0], p[16]) || 1;
      return keys.map(i => ({ x: (p[i].x - cx) / fw, y: (p[i].y - cy) / fw }));
    });
    let totalVar = 0;
    for (let k = 0; k < keys.length; k++) {
      const xs = frames.map(f => f[k].x);
      const ys = frames.map(f => f[k].y);
      const xM = xs.reduce((a, b) => a + b, 0) / xs.length;
      const yM = ys.reduce((a, b) => a + b, 0) / ys.length;
      totalVar += xs.reduce((s, x) => s + (x - xM) ** 2, 0) / xs.length;
      totalVar += ys.reduce((s, y) => s + (y - yM) ** 2, 0) / ys.length;
    }
    return totalVar / keys.length;
  }

  // ── ENROLL parent face (improved: more samples, better quality) ──
  async function enrollParent() {
    if (enrolling) return;
    const modal = document.getElementById('enroll-modal');
    const getStatus = () => document.getElementById('enroll-status');
    const getBtn = () => document.getElementById('enroll-capture-btn');
    const getVideo = () => document.getElementById('enroll-video');
    const setStatus = (msg, color) => { const el = getStatus(); if (el) { el.textContent = msg; el.style.color = color || '#10B981'; } };
    const setBtn = (text, disabled) => { const el = getBtn(); if (el) { el.textContent = text; el.disabled = disabled; } };

    modal.style.display = 'flex';
    enrolling = true;
    setStatus('⏳ Loading AI models...', '#F59E0B');
    setBtn('⏳ Loading...', true);

    const ok = await loadModels();
    if (!ok) { setStatus('❌ Failed to load models.', '#EF4444'); setBtn('📸 Capture My Face', false); enrolling = false; return; }

    setStatus('🎥 Starting camera...', '#F59E0B');
    const camOk = await startCamera(getVideo());
    if (!camOk) { setStatus('❌ Camera denied.', '#EF4444'); setBtn('📸 Capture My Face', false); enrolling = false; return; }

    setStatus('📸 Position your face clearly and click Capture', '#10B981');
    setBtn('📸 Capture My Face', false);

    const captureBtn = getBtn();
    captureBtn.onclick = async () => {
      if (captureBtn.disabled) return;
      captureBtn.disabled = true;
      captureBtn.textContent = '⏳ Scanning...';
      setStatus('🔍 Hold still — capturing multiple angles...', '#F59E0B');

      // Capture multiple samples for robust enrollment
      const descriptors = [];
      for (let i = 0; i < ENROLL_SAMPLES; i++) {
        setStatus(`🔍 Scanning face... (${i + 1}/${ENROLL_SAMPLES})`, '#F59E0B');
        let d = null;
        try {
          d = await detectDescriptor(getVideo(), ENROLL_INPUT_SIZE);
        } catch (err) { console.error(err); }
        if (d) descriptors.push(d);
        // Wait between captures for slight head movement variation
        if (i < ENROLL_SAMPLES - 1) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

      if (descriptors.length < 2) {
        setStatus('❌ Could not detect face clearly. Try better lighting & face the camera directly.', '#EF4444');
        captureBtn.disabled = false;
        captureBtn.textContent = '📸 Capture My Face';
        return;
      }

      // Average all captured descriptors for a robust template
      const avgDescriptor = new Float32Array(descriptors[0].length);
      for (let i = 0; i < avgDescriptor.length; i++) {
        let sum = 0;
        for (const d of descriptors) sum += d[i];
        avgDescriptor[i] = sum / descriptors.length;
      }

      parentDescriptor = avgDescriptor;
      const stored = {
        average: Array.from(avgDescriptor),
        all: descriptors.map(d => Array.from(d)),
        capturedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      setStatus(`✅ Parent face registered! (${descriptors.length} samples captured)`, '#10B981');
      captureBtn.textContent = '✅ Enrolled!';
      captureBtn.disabled = true;
      console.log(`[FaceAuth] Enrolled with ${descriptors.length} samples.`);

      setTimeout(() => {
        stopCamera();
        modal.style.display = 'none';
        captureBtn.textContent = '📸 Capture My Face';
        captureBtn.disabled = false;
        captureBtn.onclick = null;
        enrolling = false;
        showToast('✅ Parent face registered! Only you can unlock now.', 'success');
      }, 1200);
    };
  }

  // ── VERIFY face — streamlined anti-spoofing ──
  async function startFaceVerification() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      showFaceStatus('⚠️ No parent face enrolled.', 'warn');
      showToast('⚠️ No parent face enrolled! Go to Lock Control.', 'warning');
      return;
    }

    // Load enrolled descriptors
    let enrolledDescriptors = [];
    try {
      const parsed = JSON.parse(saved);
      if (parsed.average) {
        enrolledDescriptors = parsed.all.map(arr => new Float32Array(arr));
        enrolledDescriptors.push(new Float32Array(parsed.average));
        parentDescriptor = new Float32Array(parsed.average);
      } else {
        parentDescriptor = new Float32Array(parsed);
        enrolledDescriptors = [parentDescriptor];
      }
    } catch(e) {
      parentDescriptor = new Float32Array(JSON.parse(saved));
      enrolledDescriptors = [parentDescriptor];
    }

    const video = document.getElementById('lock-video');
    const canvas = document.getElementById('lock-canvas');
    const container = document.getElementById('lock-camera-container');
    container.style.display = 'flex';

    const ok = await loadModels();
    if (!ok) return;

    showFaceStatus('🎥 Camera starting...', 'info');
    const camOk = await startCamera(video);
    if (!camOk) return;

    // Use all enrolled descriptors for robust matching
    const matcher = new faceapi.FaceMatcher(
      [new faceapi.LabeledFaceDescriptors('parent', enrolledDescriptors)],
      MATCH_THRESHOLD
    );
    console.log(`[FaceAuth] Matcher: ${enrolledDescriptors.length} refs, threshold=${MATCH_THRESHOLD}, mobile=${isMobile}`);

    // ── Anti-spoofing state ──
    let phase = 'BLINK';
    let frameCount = 0;
    const landmarkHistory = [];
    let blinkDetected = false;
    let lastEAR = null;
    let earDropFrame = -1;
    let consecutiveMatches = 0;
    const REQUIRED_MATCHES = isMobile ? 2 : 3;

    isRunning = true;

    async function processFrame() {
      if (!isRunning) return;
      frameCount++;

      if (frameCount > MAX_TOTAL_FRAMES) {
        isRunning = false;
        showFaceStatus('❌ Verification timed out. Try again with better lighting.', 'error');
        stopCamera();
        container.style.display = 'none';
        showToast('🔒 Verification timed out. Try again.', 'danger');
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        if (isRunning) requestAnimationFrame(processFrame);
        return;
      }

      const delay = isMobile ? 100 : 0;
      const next = () => isRunning && requestAnimationFrame(processFrame);

      // Detect face
      const detection = await detectFaceData(video, VERIFY_INPUT_SIZE);

      // Phone detection ONLY on desktop (mobile users ARE holding a phone!)
      if (!isMobile && cocoModel) {
        try {
          const objPreds = await cocoModel.detect(video);
          const phoneFound = objPreds.some(p => p.class === 'cell phone' && p.score > 0.50);
          if (phoneFound) {
            isRunning = false;
            showFaceStatus('📱 Phone/Screen Detected! Spoofing blocked.', 'error');
            drawMatchBox(canvas, video, 0, false, '📱 SPOOF BLOCKED');
            setTimeout(() => { stopCamera(); container.style.display = 'none'; showToast('🚫 Phone detected during scan.', 'danger'); }, 1500);
            return;
          }
        } catch(e) { /* ignore coco errors */ }
      }

      if (!detection) {
        consecutiveMatches = 0;
        const remaining = Math.ceil((MAX_TOTAL_FRAMES - frameCount) / (isMobile ? 3 : 4));
        showFaceStatus(`👀 Looking for face... (${remaining}s left)`, 'info');
        setTimeout(next, delay);
        return;
      }

      // Check identity match
      const match = matcher.findBestMatch(detection.descriptor);
      const confidence = Math.round((1 - match.distance) * 100);

      if (match.label !== 'parent') {
        consecutiveMatches = 0;
        showFaceStatus(`🔴 Not recognized (${confidence}%). Move closer with good light.`, 'warn');
        drawMatchBox(canvas, video, confidence, false, 'UNKNOWN');
        setTimeout(next, delay);
        return;
      }

      consecutiveMatches++;

      // ── PHASE 1: BLINK ──
      if (phase === 'BLINK') {
        landmarkHistory.push(detection.landmarks);
        const ear = getEyeAspectRatio(detection.landmarks);
        if (lastEAR !== null) {
          if (lastEAR >= BLINK_EAR_LOW && ear < BLINK_EAR_LOW) earDropFrame = landmarkHistory.length;
          if (earDropFrame > 0 && ear > BLINK_EAR_HIGH && (landmarkHistory.length - earDropFrame) < 12) blinkDetected = true;
        }
        lastEAR = ear;
        const collected = landmarkHistory.length;

        if (collected < PASSIVE_FRAMES_NEEDED) {
          showFaceStatus(`🔍 Matched! Blink naturally (${PASSIVE_FRAMES_NEEDED - collected})`, 'info');
          drawMatchBox(canvas, video, confidence, true, 'SCANNING...');
          setTimeout(next, delay);
          return;
        }

        const variance = computeRelativeVariance(landmarkHistory);

        // Accept if blink detected OR enough micro-motion OR enough consecutive matches
        if (blinkDetected || variance >= MOTION_VARIANCE_THRESHOLD || consecutiveMatches >= 8) {
          phase = 'MOUTH';
          showFaceStatus('✅ Liveness OK! Now OPEN YOUR MOUTH wide', 'success');
          drawMatchBox(canvas, video, confidence, true, '✅ LIVENESS OK');
          setTimeout(next, delay);
          return;
        }

        // On mobile, be more lenient — skip to mouth phase faster
        if (isMobile && collected >= 15 && consecutiveMatches >= 4) {
          phase = 'MOUTH';
          showFaceStatus('✅ Face matched! Now OPEN YOUR MOUTH', 'success');
          setTimeout(next, delay);
          return;
        }

        if (collected >= 50) {
          // Too many frames without liveness — likely a photo
          isRunning = false;
          showFaceStatus('🚫 Liveness check failed. Please blink your eyes.', 'error');
          drawMatchBox(canvas, video, confidence, false, '🚫 NO LIVENESS');
          setTimeout(() => { stopCamera(); container.style.display = 'none'; }, 2000);
          return;
        }
        showFaceStatus(`👁️ Please BLINK your eyes naturally (${confidence}%)`, 'warn');
        drawMatchBox(canvas, video, confidence, true, 'BLINK NOW');
        setTimeout(next, delay);
        return;
      }

      // ── PHASE 2: MOUTH ──
      if (phase === 'MOUTH') {
        const p = detection.landmarks.positions;
        const mouthRatio = dist(p[62], p[66]) / dist(p[48], p[54]);
        const mouthOpen = mouthRatio > 0.25; // Relaxed from 0.30

        if (mouthOpen) {
          isRunning = false;
          showFaceStatus(`✅ Identity Verified! (${confidence}% match)`, 'success');
          drawMatchBox(canvas, video, confidence, true, '✅ VERIFIED');
          setTimeout(() => { stopCamera(); container.style.display = 'none'; ParentalLock.unlock(); }, 1000);
          return;
        }
        showFaceStatus('👄 OPEN YOUR MOUTH WIDE to verify', 'warn');
        drawMatchBox(canvas, video, confidence, true, 'OPEN MOUTH');
        setTimeout(next, delay);
        return;
      }
      setTimeout(next, delay);
    }

    processFrame();
  }

  // ── Drawing ──
  function drawMatchBox(canvas, video, confidence, matched, labelOverride) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isChallenge = labelOverride && !['LIVENESS OK', 'UNKNOWN', '✅ VERIFIED', 'SCANNING...'].includes(labelOverride);
    const color = matched ? (isChallenge ? '#F59E0B' : '#10B981') : '#EF4444';

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = color;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    const text = labelOverride || (matched ? `✓ PARENT ${confidence}%` : `✗ UNKNOWN ${confidence}%`);
    ctx.fillText(text, canvas.width / 2, canvas.height - 8);
  }

  function showFaceStatus(msg, type) {
    const el = document.getElementById('lock-face-status');
    if (!el) return;
    const colors = { info: '#9B9BC4', success: '#10B981', error: '#EF4444', warn: '#F59E0B' };
    el.textContent = msg;
    el.style.color = colors[type] || '#9B9BC4';
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.average) {
          parentDescriptor = new Float32Array(parsed.average);
          console.log(`[FaceAuth] Parent descriptor loaded (${parsed.all.length} samples).`);
        } else {
          parentDescriptor = new Float32Array(parsed);
          console.log('[FaceAuth] Parent descriptor loaded (legacy single sample).');
        }
      } catch(e) {
        parentDescriptor = null;
        console.warn('[FaceAuth] Failed to load saved descriptor:', e);
      }
    }
    preloadModelsInBackground();
  }

  function hasEnrolledFace() { return !!localStorage.getItem(STORAGE_KEY); }

  function clearEnrolledFace() {
    localStorage.removeItem(STORAGE_KEY);
    parentDescriptor = null;
    showToast('🗑️ Parent face data cleared.', 'warning');
  }

  function cancelEnroll() {
    stopCamera();
    const modal = document.getElementById('enroll-modal');
    if (modal) modal.style.display = 'none';
    const btn = document.getElementById('enroll-capture-btn');
    if (btn) { btn.textContent = '📸 Capture My Face'; btn.disabled = false; btn.onclick = null; }
    const status = document.getElementById('enroll-status');
    if (status) { status.textContent = 'Starting camera...'; status.style.color = '#10B981'; }
    enrolling = false;
  }

  return { enrollParent, cancelEnroll, startFaceVerification, stopCamera, init, hasEnrolledFace, clearEnrolledFace };
})();

document.addEventListener('DOMContentLoaded', () => FaceAuth.init());
