/* © 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS - AI Chatbot (RECO for Parents)
// Multi-tier AI Engine: Local Storage Key -> Serverless API -> Local Engine
// ======================================================

const ParentAIChatbot = (() => {
  let isOpen = false;
  let hasGreeted = false;

  // Toggle chatbot modal
  function toggle() {
    isOpen = !isOpen;
    const modal = document.getElementById('ai-chatbot-modal');
    if (isOpen) {
      modal.classList.add('active');
      if (!hasGreeted) {
        hasGreeted = true;
        setTimeout(() => sendBotGreeting(), 400);
      }
    } else {
      modal.classList.remove('active');
    }
  }

  // Show/hide FAB
  function showFab() {
    const fab = document.getElementById('ai-chatbot-fab');
    if (fab) fab.classList.add('visible');
  }
  function hideFab() {
    const fab = document.getElementById('ai-chatbot-fab');
    if (fab) fab.classList.remove('visible');
    const modal = document.getElementById('ai-chatbot-modal');
    modal.classList.remove('active');
    isOpen = false;
  }

  // Greeting
  function sendBotGreeting() {
    const total = AppData.usageToday.total;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    const topApp = [...AppData.usageToday.breakdown].sort((a, b) => b.minutes - a.minutes)[0];

    addBotMessage(`👋 <strong>Hello!</strong><br><br>I'm <span class="chat-highlight">RECO AI</span>, your personal focus coach. I've analyzed your screen time and focus activity for today.<br><br>📊 Today's screen time: <span class="chat-danger">${hours}h ${mins}m</span><br>📱 Most used app: <span class="chat-gold">${topApp ? topApp.app : 'N/A'} (${topApp ? topApp.minutes : 0}m)</span><br><br>Ask me anything about improving your focus, study routines, or reducing distraction! 💡`);
  }

  // Build analytics data snapshot
  function getAnalytics() {
    const bd = AppData.usageToday.breakdown;
    const total = AppData.usageToday.total;
    const sorted = [...bd].sort((a, b) => b.minutes - a.minutes);
    const topApp = sorted[0] || { app: 'None', minutes: 0, category: 'other' };

    const weeklyTotal = AppData.weeklyUsage.reduce((s, d) => s + d.minutes, 0);
    const weeklyAvg = Math.round(weeklyTotal / AppData.weeklyUsage.length);
    const sortedWeekly = [...AppData.weeklyUsage].sort((a, b) => a.minutes - b.minutes);
    const bestDay = sortedWeekly[0];
    const worstDay = sortedWeekly[sortedWeekly.length - 1];

    const social = bd.filter(a => a.category === 'social').reduce((s, a) => s + a.minutes, 0);
    const games = bd.filter(a => a.category === 'games').reduce((s, a) => s + a.minutes, 0);
    const study = bd.filter(a => a.category === 'study').reduce((s, a) => s + a.minutes, 0);
    const entertainment = bd.filter(a => a.category === 'entertainment').reduce((s, a) => s + a.minutes, 0);

    const socialPct = total > 0 ? Math.round((social / total) * 100) : 0;
    const studyPct = total > 0 ? Math.round((study / total) * 100) : 0;
    const gamesPct = total > 0 ? Math.round((games / total) * 100) : 0;

    const addictionScore = AppData.addictionScore;
    const limit = AppData.student.limit;
    const overLimit = total - limit;

    return {
      total, sorted, topApp, weeklyTotal, weeklyAvg,
      bestDay, worstDay, social, games, study, entertainment,
      socialPct, studyPct, gamesPct, addictionScore, limit, overLimit
    };
  }

  // Local Rule Engine (Runs if offline or no API key set)
  function getLocalResponse(questionType) {
    const a = getAnalytics();
    const totalH = Math.floor(a.total / 60);
    const totalM = a.total % 60;
    const weeklyH = Math.floor(a.weeklyTotal / 60);
    const weeklyM = a.weeklyTotal % 60;
    const avgH = Math.floor(a.weeklyAvg / 60);
    const avgM = a.weeklyAvg % 60;

    switch (questionType) {
      case 'summary':
        return `📊 <strong>Full Report Summary for John</strong><br><br>` +
          `⏰ <strong>Today's Screen Time:</strong> <span class="chat-danger">${totalH}h ${totalM}m</span> (Limit: ${a.limit}m)${a.overLimit > 0 ? ` — <span class="chat-danger">⚠️ ${a.overLimit}m OVER limit!</span>` : ` — <span class="chat-accent">✅ Within limit</span>`}<br><br>` +
          `📅 <strong>Weekly Total:</strong> <span class="chat-highlight">${weeklyH}h ${weeklyM}m</span><br>` +
          `📈 <strong>Daily Average:</strong> ${avgH}h ${avgM}m/day<br><br>` +
          `📱 <strong>Most Used:</strong> <span class="chat-gold">${a.topApp.app}</span> at ${a.topApp.minutes} minutes<br>` +
          `📚 <strong>Study Time:</strong> <span class="chat-accent">${a.study}m</span> (${a.studyPct}% of total)<br>` +
          `💬 <strong>Social Media:</strong> <span class="chat-danger">${a.social}m</span> (${a.socialPct}% of total)<br>` +
          `🎮 <strong>Gaming:</strong> ${a.games}m (${a.gamesPct}% of total)<br><br>` +
          `🧠 <strong>Addiction Score:</strong> <span class="chat-danger">${a.addictionScore}/100</span> — ${a.addictionScore > 70 ? '🚨 High Risk' : a.addictionScore > 40 ? '⚠️ Moderate' : '✅ Low'}<br><br>` +
          `💡 <em>Recommendation: ${a.socialPct > 40 ? 'Social media usage is excessive. Consider setting app-specific limits.' : a.studyPct < 20 ? 'Study app usage is low. Encourage more educational content.' : 'Usage pattern is moderate but could improve.'}</em>`;

      case 'most_used':
        let appList = a.sorted.map((app, i) => {
          const pct = Math.round((app.minutes / a.total) * 100);
          return `${i + 1}. ${app.icon || '📱'} <strong>${app.app}</strong> — <span class="chat-${app.category === 'study' ? 'accent' : app.category === 'social' ? 'danger' : 'gold'}">${app.minutes}m</span> (${pct}%)`;
        }).join('<br>');
        return `📱 <strong>App Usage Ranking (Today)</strong><br><br>${appList}<br><br>` +
          `⚠️ <strong>Top concern:</strong> <span class="chat-danger">${a.topApp.app}</span> alone accounts for <span class="chat-danger">${Math.round((a.topApp.minutes / a.total) * 100)}%</span> of total usage.<br><br>` +
          `💡 <em>${a.topApp.category === 'social' ? 'Social media is the #1 time consumer. Consider blocking during study hours.' : a.topApp.category === 'games' ? 'Gaming is dominating screen time. Set a 30-min daily gaming limit.' : 'Monitor closely and encourage balance.'}</em>`;

      case 'weekly':
        let weeklyChart = AppData.weeklyUsage.map(d => {
          const h = Math.floor(d.minutes / 60);
          const m = d.minutes % 60;
          const status = d.minutes > a.limit ? '<span class="chat-danger">⚠️ Over</span>' : '<span class="chat-accent">✅ Good</span>';
          return `<strong>${d.day}:</strong> ${h}h ${m}m ${status}`;
        }).join('<br>');
        const daysOver = AppData.weeklyUsage.filter(d => d.minutes > a.limit).length;
        return `📅 <strong>Weekly Usage Analysis</strong><br><br>${weeklyChart}<br><br>` +
          `📊 <strong>Weekly Total:</strong> <span class="chat-highlight">${weeklyH}h ${weeklyM}m</span><br>` +
          `📈 <strong>Daily Average:</strong> ${avgH}h ${avgM}m<br>` +
          `🌟 <strong>Best Day:</strong> <span class="chat-accent">${a.bestDay.day} (${a.bestDay.minutes}m)</span><br>` +
          `⚠️ <strong>Worst Day:</strong> <span class="chat-danger">${a.worstDay.day} (${a.worstDay.minutes}m)</span><br>` +
          `🚨 <strong>Days over limit:</strong> <span class="chat-danger">${daysOver}/7 days</span><br><br>` +
          `💡 <em>${daysOver >= 4 ? 'John exceeded the limit on most days this week. Consider stricter enforcement or a family conversation.' : daysOver >= 2 ? 'There are a few days over limit. Positive trend on low days — reinforce those habits.' : 'Great week! John is mostly within limits.'}</em>`;

      case 'concern':
        let concerns = [];
        if (a.socialPct > 35) concerns.push(`⚠️ <strong>High Social Media:</strong> ${a.socialPct}% of screen time is social media (<span class="chat-danger">${a.social}m</span>). 3+ hours daily increases anxiety risk.`);
        if (a.games > 45) concerns.push(`🎮 <strong>Excessive Gaming:</strong> <span class="chat-gold">${a.games}m</span> spent gaming today.`);
        if (a.studyPct < 15) concerns.push(`📚 <strong>Low Study Time:</strong> Only <span class="chat-accent">${a.studyPct}%</span> of screen time is educational.`);
        if (a.overLimit > 0) concerns.push(`🚨 <strong>Over Daily Limit:</strong> John is <span class="chat-danger">${a.overLimit}m over</span> daily limit.`);
        if (a.addictionScore > 60) concerns.push(`🧠 <strong>Addiction Risk:</strong> Score is <span class="chat-danger">${a.addictionScore}/100</span> (compulsive usage risk).`);
        if (concerns.length === 0) concerns.push(`✅ <span class="chat-accent">No major concerns detected!</span> John's usage looks healthy today.`);
        return `⚠️ <strong>Concern Areas for John</strong><br><br>${concerns.join('<br><br>')}`;

      case 'tips':
        return `💡 <strong>Actionable Improvement Tips</strong><br><br>` +
          `1. 📱 <strong>Block Social Media during study hours</strong> (4 PM - 8 PM).<br>` +
          `2. 🎮 <strong>Set a 30-min gaming cap</strong> using Custom App Limits.<br>` +
          `3. 🎯 <strong>Encourage Focus Quests:</strong> Each 25m Pomodoro earns XP & coins.<br>` +
          `4. 🌙 <strong>Enable Night Auto-Lock:</strong> Lock non-essential apps after 10 PM.`;

      case 'addiction':
        const score = a.addictionScore;
        const level = score > 75 ? 'HIGH RISK' : score > 50 ? 'MODERATE' : 'LOW';
        const levelColor = score > 75 ? 'danger' : score > 50 ? 'gold' : 'accent';
        return `🧠 <strong>Digital Addiction Risk Assessment</strong><br><br>` +
          `Score: <span class="chat-${levelColor}">${score}/100 — ${level}</span><br><br>` +
          `• Social media: ${a.socialPct}% (${a.social}m)<br>` +
          `• Total daily screen time: ${totalH}h ${totalM}m<br>` +
          `• Days over limit: ${AppData.weeklyUsage.filter(d => d.minutes > a.limit).length}/7`;

      default:
        return handleFreeForm(questionType);
    }
  }

  function handleFreeForm(text) {
    const lower = text.toLowerCase();
    const a = getAnalytics();

    if (lower.includes('instagram') || lower.includes('insta')) {
      const ig = AppData.usageToday.breakdown.find(x => x.app === 'Instagram');
      return `📷 <strong>Instagram Usage</strong><br><br>John spent <span class="chat-danger">${ig ? ig.minutes : 0}m</span> on Instagram today (${ig ? Math.round((ig.minutes / a.total) * 100) : 0}% of total time).<br><br>💡 Instagram uses infinite scroll. Consider setting a 20-minute daily limit.`;
    }
    if (lower.includes('youtube') || lower.includes('video')) {
      const yt = AppData.usageToday.breakdown.find(x => x.app === 'YouTube');
      return `▶️ <strong>YouTube Usage</strong><br><br>John spent <span class="chat-gold">${yt ? yt.minutes : 0}m</span> on YouTube today.<br><br>💡 Whitelist educational content and limit Shorts/Reels.`;
    }
    if (lower.includes('pubg') || lower.includes('game') || lower.includes('gaming')) {
      return `🎮 <strong>Gaming Analysis</strong><br><br>Total gaming time today: <span class="chat-gold">${a.games}m</span> (${a.gamesPct}% of total).<br><br>💡 Reward gaming time only after completing 1 Pomodoro study session.`;
    }
    if (lower.includes('sleep') || lower.includes('night') || lower.includes('bedtime')) {
      return `🌙 <strong>Sleep & Screen Time</strong><br><br>Late-night screen use disrupts REM sleep.<br><br>💡 Recommendation: Auto-lock device at 10 PM and enable Blue Light Filter.`;
    }
    if (lower.includes('study') || lower.includes('homework')) {
      return `📚 <strong>Study Time Analysis</strong><br><br>John spent <span class="chat-accent">${a.study}m</span> on educational apps today (${a.studyPct}% of screen time).`;
    }

    return `🤖 I analyzed your query about "<em>${text}</em>".<br><br>` +
      `• Today's screen time: <span class="chat-danger">${Math.floor(a.total / 60)}h ${a.total % 60}m</span><br>` +
      `• Top app: <span class="chat-gold">${a.topApp.app} (${a.topApp.minutes}m)</span><br>` +
      `• Addiction score: <span class="chat-${a.addictionScore > 60 ? 'danger' : 'accent'}">${a.addictionScore}/100</span><br><br>` +
      `Ask me about specific apps, bedtime rules, or study routines! 💡`;
  }

  // Direct Gemini REST API Call
  async function callGeminiDirect(userPrompt, apiKey) {
    const analytics = getAnalytics();
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are RECO AI, an intelligent digital wellbeing & focus coach for college students using the Entropy Reclaimers app (developed by Shehroz).
Mission: Help college students reduce screen addiction, build deep study habits, optimize focus, and earn campus vouchers.
Formatting: HTML tags <strong>, <br>, <em>, <span class="chat-accent">, <span class="chat-danger">, <span class="chat-gold">. Short & friendly with emojis.`;

    const userPayload = `Child Context Data: ${JSON.stringify(analytics, null, 2)}\nUser Question: "${userPrompt}"`;

    const res = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPayload}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      })
    });

    if (!res.ok) throw new Error('API Request Failed');
    const data = await res.json();
    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return reply.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // Multi-tier response selector
  async function fetchAIResponse(userPrompt, questionType = null) {
    const savedKey = localStorage.getItem('reco_gemini_key');

    // 1. Try Direct Gemini Call if user saved key locally
    if (savedKey) {
      try {
        const directReply = await callGeminiDirect(userPrompt, savedKey);
        if (directReply) return directReply;
      } catch (e) {
        console.warn("Direct Gemini call failed, trying serverless API.", e);
      }
    }

    // 2. Try Serverless Endpoint /api/chat
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, analytics: getAnalytics() })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reply) return data.reply;
      }
    } catch (e) {
      console.warn("Serverless AI endpoint unreachable, using local fallback.", e);
    }

    // 3. Fallback to Local Rule Engine
    return getLocalResponse(questionType || userPrompt);
  }

  // Ask a pre-built question
  async function askQuestion(type) {
    const labels = {
      summary: '📊 Show me the full report summary',
      most_used: '📱 Which apps are most used?',
      weekly: '📅 How was this week?',
      concern: '⚠️ What should I be concerned about?',
      tips: '💡 Give me improvement tips',
      addiction: '🧠 What\'s the addiction risk level?'
    };
    const userText = labels[type] || type;
    addUserMessage(userText);
    showTyping();

    const botReply = await fetchAIResponse(userText, type);
    removeTyping();
    addBotMessage(botReply);
  }

  // Send free-form user message
  async function sendMessage() {
    const input = document.getElementById('ai-chatbot-input');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';
    showTyping();

    const botReply = await fetchAIResponse(text);
    removeTyping();
    addBotMessage(botReply);
  }

  // Prompt user to store Gemini API Key directly in app localStorage if desired
  function promptKeySetup() {
    const currentKey = localStorage.getItem('reco_gemini_key') || '';
    const newKey = prompt('🔑 Enter your Gemini API Key to enable live AI responses:\n(Leave empty to clear)', currentKey);
    if (newKey !== null) {
      if (newKey.trim()) {
        localStorage.setItem('reco_gemini_key', newKey.trim());
        alert('✅ Gemini API Key saved locally on your device! RECO AI is now live!');
      } else {
        localStorage.removeItem('reco_gemini_key');
        alert('ℹ️ Gemini API Key cleared. RECO AI will use Vercel API or local smart responses.');
      }
    }
  }

  // DOM helpers
  function addBotMessage(html) {
    const container = document.getElementById('ai-chatbot-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot';
    msg.innerHTML = html;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function addUserMessage(text) {
    const container = document.getElementById('ai-chatbot-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    const container = document.getElementById('ai-chatbot-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg typing';
    msg.id = 'typing-indicator';
    msg.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  return {
    toggle, showFab, hideFab,
    askQuestion, sendMessage, promptKeySetup
  };
})();
