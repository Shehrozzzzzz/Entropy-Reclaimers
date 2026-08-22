/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — College Onboarding & Multi-Campus
// ======================================================

const OnboardUI = (() => {
  const STORAGE_KEY = 'er_campus_login_v1';
  let selectedCollege = null;

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        applyBranding(data);
        hideOverlay();
        return;
      } catch(e) {}
    }
    // Show the onboarding overlay
    document.getElementById('onboard-overlay').style.display = 'flex';
  }

  function selectCollege(btn, name) {
    selectedCollege = name;
    // Highlight selected
    document.querySelectorAll('.college-btn').forEach(b => {
      b.style.borderColor = '#333';
      b.style.background = '#1a1a2e';
    });
    btn.style.borderColor = '#7C3AED';
    btn.style.background = 'rgba(124,58,237,0.15)';
    // Enable next button
    const nextBtn = document.getElementById('onboard-next-btn');
    nextBtn.disabled = false;
    nextBtn.style.background = 'linear-gradient(135deg,#7C3AED,#10B981)';
    nextBtn.style.color = 'white';
    nextBtn.style.cursor = 'pointer';
    nextBtn.textContent = `Continue with ${name} →`;
  }

  function addCustomCollege() {
    const input = document.getElementById('custom-college');
    const name = input.value.trim();
    if (!name) return;
    // Add button to grid
    const grid = document.getElementById('college-grid');
    const btn = document.createElement('button');
    btn.className = 'college-btn';
    btn.style.cssText = 'padding:14px 10px;border:1px solid #333;border-radius:12px;background:#1a1a2e;color:white;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s';
    btn.textContent = `🏫 ${name}`;
    btn.onclick = () => selectCollege(btn, name);
    grid.appendChild(btn);
    input.value = '';
    // Auto-select it
    selectCollege(btn, name);
  }

  function goStep2() {
    if (!selectedCollege) return;
    document.getElementById('onboard-step1').style.display = 'none';
    document.getElementById('onboard-step2').style.display = 'block';
    document.getElementById('onboard-college-label').textContent = `🎓 ${selectedCollege}`;
  }

  function goStep1() {
    document.getElementById('onboard-step1').style.display = 'block';
    document.getElementById('onboard-step2').style.display = 'none';
  }

  function login() {
    const name = document.getElementById('onboard-name').value.trim() || 'Student';
    const erp = document.getElementById('onboard-erp').value.trim() || 'N/A';
    const branch = document.getElementById('onboard-branch').value || 'CSE';
    const year = document.getElementById('onboard-year').value || '1st Year';

    const data = {
      college: selectedCollege,
      name: name,
      erp: erp,
      branch: branch,
      year: year,
      loginAt: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    applyBranding(data);
    hideOverlay();

    if (typeof showToast === 'function') {
      showToast(`🎓 Welcome to ${selectedCollege} Campus Hub, ${name}!`, 'success');
    }
  }

  function applyBranding(data) {
    const college = data.college || 'NIET';
    const name = data.name || 'Student';
    const branch = data.branch || 'CSE';
    const year = data.year || '1st Year';
    const erp = data.erp || 'N/A';

    // Update banner
    const bannerLogo = document.querySelector('.niet-banner-logo');
    if (bannerLogo) bannerLogo.textContent = `🎓 ${college}`;

    const bannerSlogan = document.querySelector('.niet-banner-slogan');
    if (bannerSlogan) bannerSlogan.innerHTML = `Born at <strong>${college}</strong> — Built to transform every campus. One college today, a national movement tomorrow.`;

    // Update sidebar user
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) userNameEl.textContent = name;

    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();

    // Update page titles with college name
    document.querySelectorAll('.page-title').forEach(el => {
      el.innerHTML = el.innerHTML.replace(/NIET/g, college);
    });

    // Update page subtitles
    document.querySelectorAll('.page-subtitle').forEach(el => {
      el.innerHTML = el.innerHTML.replace(/NIET/g, college);
    });

    // Update leaderboard title
    document.querySelectorAll('.card-title').forEach(el => {
      if (el.textContent.includes('NIET')) {
        el.textContent = el.textContent.replace(/NIET/g, college);
      }
    });

    // Update voucher descriptions
    if (typeof AppData !== 'undefined') {
      AppData.student.name = name;
      AppData.student.branch = branch;
      AppData.student.year = year;
      AppData.student.erp = erp;
      AppData.student.college = college;

      // Update reward descriptions
      AppData.rewards.forEach(r => {
        r.desc = r.desc.replace(/NIET/g, college);
        r.college = college;
      });
    }

    // Update dashboard hero if present
    const heroCollege = document.querySelector('[data-college-name]');
    if (heroCollege) heroCollege.textContent = college;
  }

  function hideOverlay() {
    const overlay = document.getElementById('onboard-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.display = 'none', 500);
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch(e) { return null; }
  }

  return { init, selectCollege, addCustomCollege, goStep2, goStep1, login, logout, getCurrentUser };
})();

document.addEventListener('DOMContentLoaded', () => OnboardUI.init());
