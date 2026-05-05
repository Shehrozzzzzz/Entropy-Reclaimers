/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — AI Chatbot (RECO for Parents)
// Analyzes child's usage data and provides intelligent
// parental insights and recommendations
// ======================================================

const ParentAIChatbot = (() => {
  let isOpen = false;
  let hasGreeted = false;

  // ── Toggle chatbot ──
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

  // ── Show/hide FAB ──
  function showFab() {
    document.getElementById('ai-chatbot-fab').classList.add('visible');
  }
  function hideFab() {
    document.getElementById('ai-chatbot-fab').classList.remove('visible');
    const modal = document.getElementById('ai-chatbot-modal');
    modal.classList.remove('active');
    isOpen = false;
  }

  // ── Greeting ──
  function sendBotGreeting() {
    const total = AppData.usageToday.total;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    const topApp = [...AppData.usageToday.breakdown].sort((a, b) => b.minutes - a.minutes)[0];

    addBotMessage(`👋 <strong>Hello, Guardian!</strong><br><br>I'm <span class="chat-highlight">RECO AI</span>, your parental assistant. I've analyzed <strong>John's</strong> device activity.<br><br>📱 Today's screen time: <span class="chat-danger">${hours}h ${mins}m</span><br>🏆 Most used app: <span class="chat-gold">${topApp.app} (${topApp.minutes}m)</span><br><br>Ask me anything about your child's usage, or tap a quick question below! 👇`);
  }

  // ── Build analytics data ──
  function getAnalytics() {
    const bd = AppData.usageToday.breakdown;
    const total = bd.reduce((s, a) => s + a.minutes, 0);
    const sorted = [...bd].sort((a, b) => b.minutes - a.minutes);
    const topApp = sorted[0];

    const weeklyTotal = AppData.weeklyUsage.reduce((s, d) => s + d.minutes, 0);
    const weeklyAvg = Math.round(weeklyTotal / 7);
    const bestDay = [...AppData.weeklyUsage].sort((a, b) => a.minutes - b.minutes)[0];
    const worstDay = [...AppData.weeklyUsage].sort((a, b) => b.minutes - a.minutes)[0];

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

  // ── Pre-built Q&A ──
  function getResponse(questionType) {
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
          `📱 <strong>Today's Screen Time:</strong> <span class="chat-danger">${totalH}h ${totalM}m</span> (Limit: ${a.limit}m)${a.overLimit > 0 ? ` — <span class="chat-danger">⚠ ${a.overLimit}m OVER limit!</span>` : ` — <span class="chat-accent">✅ Within limit</span>`}<br><br>` +
          `📅 <strong>Weekly Total:</strong> <span class="chat-highlight">${weeklyH}h ${weeklyM}m</span><br>` +
          `📈 <strong>Daily Average:</strong> ${avgH}h ${avgM}m/day<br><br>` +
          `🏆 <strong>Most Used:</strong> <span class="chat-gold">${a.topApp.app}</span> at ${a.topApp.minutes} minutes<br>` +
          `📚 <strong>Study Time:</strong> <span class="chat-accent">${a.study}m</span> (${a.studyPct}% of total)<br>` +
          `📲 <strong>Social Media:</strong> <span class="chat-danger">${a.social}m</span> (${a.socialPct}% of total)<br>` +
          `🎮 <strong>Gaming:</strong> ${a.games}m (${a.gamesPct}% of total)<br><br>` +
          `🧠 <strong>Addiction Score:</strong> <span class="chat-danger">${a.addictionScore}/100</span> — ${a.addictionScore > 70 ? '🔴 High Risk' : a.addictionScore > 40 ? '🟡 Moderate' : '🟢 Low'}<br><br>` +
          `💡 <em>Recommendation: ${a.socialPct > 40 ? 'Social media usage is excessive. Consider setting app-specific limits.' : a.studyPct < 20 ? 'Study app usage is low. Encourage more educational content.' : 'Usage pattern is moderate but could improve.'}</em>`;

      case 'most_used':
        let appList = a.sorted.map((app, i) => {
          const pct = Math.round((app.minutes / a.total) * 100);
          const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
          return `${i + 1}. ${app.icon} <strong>${app.app}</strong> — <span class="chat-${app.category === 'study' ? 'accent' : app.category === 'social' ? 'danger' : 'gold'}">${app.minutes}m</span> (${pct}%)`;
        }).join('<br>');
        return `📱 <strong>App Usage Ranking (Today)</strong><br><br>${appList}<br><br>` +
          `⚠️ <strong>Top concern:</strong> <span class="chat-danger">${a.topApp.app}</span> alone accounts for <span class="chat-danger">${Math.round((a.topApp.minutes / a.total) * 100)}%</span> of total usage.<br><br>` +
          `💡 <em>${a.topApp.category === 'social' ? 'Social media is the #1 time consumer. Consider blocking during study hours.' : a.topApp.category === 'games' ? 'Gaming is dominating screen time. Set a 30-min daily gaming limit.' : 'Monitor closely and encourage balance.'}</em>`;

      case 'weekly':
        let weeklyChart = AppData.weeklyUsage.map(d => {
          const h = Math.floor(d.minutes / 60);
          const m = d.minutes % 60;
          const bars = '▓'.repeat(Math.round(d.minutes / 15));
          const status = d.minutes > a.limit ? '<span class="chat-danger">⚠ Over</span>' : '<span class="chat-accent">✅ Good</span>';
          return `<strong>${d.day}:</strong> ${h}h ${m}m ${status}`;
        }).join('<br>');
        const daysOver = AppData.weeklyUsage.filter(d => d.minutes > a.limit).length;
        return `📅 <strong>Weekly Usage Analysis</strong><br><br>${weeklyChart}<br><br>` +
          `📊 <strong>Weekly Total:</strong> <span class="chat-highlight">${weeklyH}h ${weeklyM}m</span><br>` +
          `📈 <strong>Daily Average:</strong> ${avgH}h ${avgM}m<br>` +
          `✅ <strong>Best Day:</strong> <span class="chat-accent">${a.bestDay.day} (${a.bestDay.minutes}m)</span><br>` +
          `🔴 <strong>Worst Day:</strong> <span class="chat-danger">${a.worstDay.day} (${a.worstDay.minutes}m)</span><br>` +
          `⚠️ <strong>Days over limit:</strong> <span class="chat-danger">${daysOver}/7 days</span><br><br>` +
          `💡 <em>${daysOver >= 4 ? '🚨 John exceeded the limit on most days this week. Consider a stricter enforcement or a family conversation about screen habits.' : daysOver >= 2 ? 'There are a few days over limit. Positive trend on low days — reinforce those behaviors.' : 'Great week! John is mostly within limits. Keep encouraging this pattern.'}</em>`;

      case 'concern':
        let concerns = [];
        if (a.socialPct > 35) concerns.push(`🔴 <strong>High Social Media:</strong> ${a.socialPct}% of screen time is social media (<span class="chat-danger">${a.social}m</span>). Research shows 3+ hours of social media increases depression risk by 60%.`);
        if (a.games > 45) concerns.push(`🟡 <strong>Excessive Gaming:</strong> <span class="chat-gold">${a.games}m</span> spent on games today. WHO recommends under 60m/day for teenagers.`);
        if (a.studyPct < 15) concerns.push(`🟡 <strong>Low Study Time:</strong> Only <span class="chat-accent">${a.studyPct}%</span> of screen time is educational. Try blocking entertainment during homework hours.`);
        if (a.overLimit > 0) concerns.push(`🔴 <strong>Over Daily Limit:</strong> John is <span class="chat-danger">${a.overLimit}m over</span> the ${a.limit}m daily limit. Auto-lock should have triggered.`);
        if (a.addictionScore > 60) concerns.push(`🔴 <strong>Addiction Risk:</strong> Score is <span class="chat-danger">${a.addictionScore}/100</span>. This indicates compulsive usage patterns. Consider a digital detox challenge.`);

        const now = new Date();
        if (now.getHours() >= 22) concerns.push(`🟡 <strong>Late Night Usage:</strong> Device is being used after 10 PM. Sleep quality is affected by blue light exposure.`);

        if (concerns.length === 0) concerns.push(`✅ <span class="chat-accent">No major concerns detected!</span> John's usage looks healthy today. Keep monitoring.`);

        return `⚠️ <strong>Concern Areas for John</strong><br><br>${concerns.join('<br><br>')}<br><br>💡 <em>These insights are generated from real-time usage data. Tap "Improvement Tips" for actionable advice.</em>`;

      case 'tips':
        const tips = [];
        if (a.socialPct > 30) tips.push(`📵 <strong>Block social media during study hours</strong> (4 PM – 8 PM) using the App Restrictions panel.`);
        if (a.games > 30) tips.push(`🎮 <strong>Set a 30-minute gaming cap</strong> using Custom App Limits. Reward completion of homework with gaming time.`);
        tips.push(`🎯 <strong>Encourage Focus Sessions:</strong> Each Pomodoro (25m) earns XP and coins — gamification makes studying feel rewarding.`);
        tips.push(`📊 <strong>Weekly Review Ritual:</strong> Review this dashboard with John every Sunday. Transparency builds trust.`);
        if (a.studyPct < 20) tips.push(`📚 <strong>Incentivize study apps:</strong> Offer bonus coins for using educational apps 30+ minutes daily.`);
        tips.push(`🌙 <strong>Night Mode:</strong> Consider auto-locking the device after 10 PM to protect sleep quality.`);
        tips.push(`🏆 <strong>Positive Reinforcement:</strong> Praise John on low-usage days. The ${a.bestDay.day} pattern (${a.bestDay.minutes}m) shows he CAN control usage.`);

        return `💡 <strong>Improvement Tips for John</strong><br><br>${tips.join('<br><br>')}<br><br>🧠 <em>Tip: Focus on positive reinforcement over punishment. Research shows reward-based systems reduce screen addiction 3x faster than restriction alone.</em>`;

      case 'addiction':
        const score = a.addictionScore;
        const level = score > 75 ? '🔴 HIGH RISK' : score > 50 ? '🟡 MODERATE' : score > 25 ? '🟢 LOW' : '💚 HEALTHY';
        const levelColor = score > 75 ? 'danger' : score > 50 ? 'gold' : 'accent';

        return `🧠 <strong>Digital Addiction Risk Assessment</strong><br><br>` +
          `📊 <strong>Addiction Score:</strong> <span class="chat-${levelColor}">${score}/100 — ${level}</span><br><br>` +
          `<strong>Contributing Factors:</strong><br>` +
          `• Social media: ${a.socialPct}% of usage ${a.socialPct > 40 ? '<span class="chat-danger">(High)</span>' : '<span class="chat-accent">(OK)</span>'}<br>` +
          `• Daily usage: ${totalH}h ${totalM}m ${a.total > 180 ? '<span class="chat-danger">(Excessive)</span>' : '<span class="chat-accent">(Moderate)</span>'}<br>` +
          `• Gaming time: ${a.games}m ${a.games > 60 ? '<span class="chat-danger">(High)</span>' : '<span class="chat-accent">(OK)</span>'}<br>` +
          `• Study ratio: ${a.studyPct}% ${a.studyPct < 15 ? '<span class="chat-danger">(Too Low)</span>' : '<span class="chat-accent">(Good)</span>'}<br>` +
          `• Days over limit this week: ${AppData.weeklyUsage.filter(d => d.minutes > a.limit).length}/7<br><br>` +
          `<strong>🔬 Scientific Context:</strong><br>` +
          `A score above 60 correlates with <span class="chat-danger">dopamine loop dependency</span> (Stanford Addiction Medicine). The prefrontal cortex — responsible for self-control — is still developing until age 25.<br><br>` +
          `💡 <em>Recommendation: ${score > 70 ? 'Urgent intervention needed. Schedule a family meeting and implement structured digital detox.' : score > 50 ? 'Monitor closely. Set incremental reduction goals — reduce 15m per week.' : 'Good trajectory! Maintain current habits and reinforce positivity.'}</em>`;

      default:
        return handleFreeForm(questionType);
    }
  }

  // ── Free-form text matching ──
  function handleFreeForm(text) {
    const lower = text.toLowerCase();
    const a = getAnalytics();

    if (lower.includes('instagram') || lower.includes('insta')) {
      const ig = AppData.usageToday.breakdown.find(x => x.app === 'Instagram');
      return `📸 <strong>Instagram Usage</strong><br><br>John spent <span class="chat-danger">${ig ? ig.minutes : 0}m</span> on Instagram today. That's ${ig ? Math.round((ig.minutes / a.total) * 100) : 0}% of total screen time.<br><br>💡 Instagram is designed to be addictive using infinite scroll and dopamine triggers. Consider setting a ${ig && ig.minutes > 30 ? '20-minute' : '30-minute'} daily cap.`;
    }
    if (lower.includes('youtube') || lower.includes('video')) {
      const yt = AppData.usageToday.breakdown.find(x => x.app === 'YouTube');
      return `▶️ <strong>YouTube Usage</strong><br><br>John spent <span class="chat-gold">${yt ? yt.minutes : 0}m</span> on YouTube today.<br><br>💡 Not all YouTube is bad — educational channels can be whitelisted. Check if usage is shorts/reels (addictive) vs. longer educational content.`;
    }
    if (lower.includes('pubg') || lower.includes('game') || lower.includes('gaming')) {
      return `🎮 <strong>Gaming Analysis</strong><br><br>Total gaming time today: <span class="chat-gold">${a.games}m</span> (${a.gamesPct}% of total).<br><br>WHO recommends under 60 min/day for adolescents. ${a.games > 60 ? '<span class="chat-danger">⚠ John is exceeding this recommendation.</span>' : '<span class="chat-accent">✅ Currently within healthy limits.</span>'}<br><br>💡 Try tying gaming rewards to study completion — "Earn 30m gaming by completing 1 Pomodoro session."`;
    }
    if (lower.includes('sleep') || lower.includes('night') || lower.includes('bedtime')) {
      return `🌙 <strong>Sleep & Screen Time</strong><br><br>Research shows phone use within 2 hours of bedtime reduces REM sleep by 30% (Harvard Medical School).<br><br>💡 <strong>Recommendations:</strong><br>• Auto-lock device at 10 PM<br>• Enable night mode/blue light filter after 8 PM<br>• Place phone outside bedroom during sleep<br><br>Current late-night alert threshold is set to <span class="chat-gold">10 PM</span>. Adjust in the Smart Alerts panel.`;
    }
    if (lower.includes('study') || lower.includes('education') || lower.includes('homework')) {
      return `📚 <strong>Study Time Analysis</strong><br><br>John spent <span class="chat-accent">${a.study}m</span> on study apps today — that's <span class="chat-${a.studyPct < 15 ? 'danger' : 'accent'}">${a.studyPct}%</span> of total screen time.<br><br>${a.studyPct < 20 ? '⚠️ Study usage is below recommended 20%. Consider blocking entertainment apps during homework hours (4-8 PM).' : '✅ Study engagement is healthy!'}<br><br>💡 Tip: Focus Quest sessions gamify studying — each 25m Pomodoro earns XP and coins that John can redeem in the Rewards Store!`;
    }
    if (lower.includes('social') || lower.includes('whatsapp') || lower.includes('snapchat')) {
      return `📲 <strong>Social Media Analysis</strong><br><br>Total social media today: <span class="chat-danger">${a.social}m</span> (${a.socialPct}% of total)<br><br><strong>Breakdown:</strong><br>${AppData.usageToday.breakdown.filter(x => x.category === 'social').map(x => `• ${x.icon} ${x.app}: ${x.minutes}m`).join('<br>')}<br><br>📖 <em>JAMA 2022: Teens spending 3+ hours on social media have 60% higher depression risk.</em><br><br>💡 Use the App Restrictions panel to block social media during study hours.`;
    }
    if (lower.includes('help') || lower.includes('what can you')) {
      return `🤖 <strong>I can help you with:</strong><br><br>• 📊 Full usage reports and summaries<br>• 📱 App-by-app analysis<br>• 📅 Weekly trends and patterns<br>• ⚠️ Risk assessment and concern areas<br>• 💡 Personalized improvement tips<br>• 🧠 Addiction risk evaluation<br>• 🌙 Sleep and screen advice<br>• 📚 Study habit analysis<br><br>Just ask me anything, or tap the quick buttons below!`;
    }
    if (lower.includes('good') || lower.includes('positive') || lower.includes('well')) {
      return `🌟 <strong>Positive Highlights for John</strong><br><br>` +
        `✅ Best day this week: <span class="chat-accent">${a.bestDay.day} (${a.bestDay.minutes}m)</span> — that's great discipline!<br>` +
        `✅ Study time: <span class="chat-accent">${a.study}m</span> invested in learning<br>` +
        `✅ Focus sessions completed: Building strong neural pathways<br>` +
        `✅ Day streak: <span class="chat-gold">${AppData.student.streak} days</span> of consistent app usage<br><br>` +
        `💡 <em>Positive reinforcement works 3x better than punishment for building healthy digital habits. Celebrate these wins with John!</em>`;
    }

    // Default fallback
    return `🤖 I analyzed your question about "<em>${text}</em>".<br><br>Based on John's data:<br>` +
      `• Screen time today: <span class="chat-danger">${Math.floor(a.total / 60)}h ${a.total % 60}m</span><br>` +
      `• Most used: <span class="chat-gold">${a.topApp.app} (${a.topApp.minutes}m)</span><br>` +
      `• Addiction score: <span class="chat-${a.addictionScore > 60 ? 'danger' : 'accent'}">${a.addictionScore}/100</span><br><br>` +
      `Try asking about specific apps, weekly trends, concern areas, or tips for improvement! 💡`;
  }

  // ── Ask a pre-built question ──
  function askQuestion(type) {
    const labels = {
      summary: '📊 Show me the full report summary',
      most_used: '📱 Which apps are most used?',
      weekly: '📅 How was this week?',
      concern: '⚠️ What should I be concerned about?',
      tips: '💡 Give me improvement tips',
      addiction: '🧠 What\'s the addiction risk level?'
    };
    addUserMessage(labels[type] || type);
    showTyping();
    setTimeout(() => {
      removeTyping();
      addBotMessage(getResponse(type));
    }, 800 + Math.random() * 700);
  }

  // ── Send free-form message ──
  function sendMessage() {
    const input = document.getElementById('ai-chatbot-input');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';
    showTyping();

    setTimeout(() => {
      removeTyping();
      addBotMessage(getResponse(text));
    }, 900 + Math.random() * 800);
  }

  // ── DOM helpers ──
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
    askQuestion, sendMessage
  };
})();
