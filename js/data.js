/* � 2026 Shehroz. All rights reserved. Licensed under AGPL-3.0. */
// ======================================================
// ENTROPY RECLAIMERS — App Data & Scientific Facts
// ======================================================

const AppData = {
  student: {
    name: "John",
    level: 15,
    xp: 100000,
    xpNext: 12000,
    coins: 500,
    streak: 12,
    focusScore: 74,
    todayUsage: 187, // minutes
    limit: 120, // minutes
    branch: "DS",
    year: "1st Year",
  },

  usageToday: {
    total: 187, // minutes
    breakdown: [
      { app: "Instagram",    icon: "📸", color: "#E1306C", minutes: 48, category: "social" },
      { app: "YouTube",      icon: "▶️", color: "#FF0000", minutes: 35, category: "entertainment" },
      { app: "WhatsApp",     icon: "💬", color: "#25D366", minutes: 28, category: "social" },
      { app: "PUBG Mobile",  icon: "🎮", color: "#F5A623", minutes: 22, category: "games" },
      { app: "Chrome",       icon: "🌐", color: "#4285F4", minutes: 18, category: "browse" },
      { app: "Study App",    icon: "📚", color: "#7C3AED", minutes: 24, category: "study" },
      { app: "Snapchat",     icon: "👻", color: "#FFFC00", minutes: 12, category: "social" },
    ]
  },

  weeklyUsage: [
    { day: "Mon", minutes: 145 },
    { day: "Tue", minutes: 210 },
    { day: "Wed", minutes: 98 },
    { day: "Thu", minutes: 175 },
    { day: "Fri", minutes: 230 },
    { day: "Sat", minutes: 187 },
    { day: "Sun", minutes: 120 },
  ],

  // For the App Blocker list
  apps: [
    { name: 'Instagram', icon: '📱', isBlocked: false },
    { name: 'YouTube', icon: '▶️', isBlocked: false },
    { name: 'WhatsApp', icon: '💬', isBlocked: false },
    { name: 'Snapchat', icon: '👻', isBlocked: false },
    { name: 'PUBG Mobile', icon: '🎮', isBlocked: false },
    { name: 'Chrome', icon: '🌐', isBlocked: false },
    { name: 'Edge', icon: '🧭', isBlocked: false }
  ],

  focusHistory: [
    { day: "Mon", sessions: 3, xp: 180 },
    { day: "Tue", sessions: 2, xp: 120 },
    { day: "Wed", sessions: 5, xp: 300 },
    { day: "Thu", sessions: 4, xp: 240 },
    { day: "Fri", sessions: 2, xp: 120 },
    { day: "Sat", sessions: 3, xp: 180 },
    { day: "Sun", sessions: 6, xp: 360 },
  ],

  leaderboard: [
    { rank: 1, name: "Aarav Khan",    avatar: "🦁", xp: 8820, branch: "CSE", year: "3rd Year", streak: 28, focusHrs: 64, isMe: false },
    { rank: 2, name: "Sara Ahmed",    avatar: "🦊", xp: 7340, branch: "DS",  year: "2nd Year", streak: 22, focusHrs: 52, isMe: false },
    { rank: 3, name: "Riya Patel",    avatar: "🐺", xp: 6890, branch: "IT",  year: "3rd Year", streak: 19, focusHrs: 48, isMe: false },
    { rank: 4, name: "You (John)",    avatar: "⚡", xp: 100000, branch: "DS",  year: "1st Year", streak: 12, focusHrs: 34, isMe: true  },
    { rank: 5, name: "Imran Malik",   avatar: "🐯", xp: 4610, branch: "ECE", year: "2nd Year", streak: 15, focusHrs: 31, isMe: false },
    { rank: 6, name: "Priya Singh",   avatar: "🦋", xp: 4280, branch: "CSE", year: "1st Year", streak: 18, focusHrs: 29, isMe: false },
    { rank: 7, name: "Ali Hassan",    avatar: "🔥", xp: 3990, branch: "ME",  year: "4th Year", streak: 14, focusHrs: 26, isMe: false },
    { rank: 8, name: "Nora Islam",    avatar: "🌙", xp: 3680, branch: "DS",  year: "2nd Year", streak: 11, focusHrs: 24, isMe: false },
    { rank: 9, name: "Vikram Joshi",  avatar: "🐉", xp: 3450, branch: "IT",  year: "3rd Year", streak: 10, focusHrs: 22, isMe: false },
    { rank: 10,name: "Sneha Rao",     avatar: "🌸", xp: 3120, branch: "CSE", year: "1st Year", streak: 9,  focusHrs: 20, isMe: false },
    { rank: 11,name: "Rohit Verma",   avatar: "🐻", xp: 2890, branch: "ECE", year: "4th Year", streak: 8,  focusHrs: 18, isMe: false },
    { rank: 12,name: "Zara Sheikh",   avatar: "🦚", xp: 2640, branch: "ME",  year: "2nd Year", streak: 7,  focusHrs: 16, isMe: false },
  ],

  rewards: [
    { id: 1, name: "Canteen Discount",    emoji: "🍔", cost: 120, discount: "20%", desc: "20% off on any canteen meal at NIET cafeteria", college: "NIET", category: "food" },
    { id: 2, name: "Gym Access Pass",     emoji: "💪", cost: 150, discount: "Free", desc: "1 free gym session at NIET fitness center", college: "NIET", category: "fitness" },
    { id: 3, name: "Library Extra Hours", emoji: "📚", cost: 100, discount: "+2hrs", desc: "2 extra hours in NIET library after closing time", college: "NIET", category: "study" },
    { id: 4, name: "Vending Machine",     emoji: "🥤", cost: 80,  discount: "Free", desc: "1 free drink from any NIET campus vending machine", college: "NIET", category: "food" },
    { id: 5, name: "Stationery Kit",      emoji: "✏️", cost: 100, discount: "30%", desc: "30% off on stationery at NIET campus store", college: "NIET", category: "study" },
    { id: 6, name: "WiFi Boost Pass",     emoji: "📶", cost: 200, discount: "2x Speed", desc: "24hr premium WiFi speed boost in NIET campus", college: "NIET", category: "digital" },
    { id: 7, name: "Print Credits",       emoji: "🖨️", cost: 100, discount: "50 pages", desc: "50 free prints at NIET computer lab", college: "NIET", category: "study" },
    { id: 8, name: "Parking Pass",        emoji: "🅿️", cost: 150, discount: "1 Week", desc: "1 week free parking at NIET campus lot", college: "NIET", category: "campus" },
  ],

  addictionScore: 67, // out of 100
};

// ======================================================
// Scientific Facts for AI Avatar (RECO)
// ======================================================
const AVATAR_FACTS = [
  {
    title: "📱 Blue Light Destroys Your Sleep",
    fact: "Smartphone screens emit blue light that suppresses melatonin production by up to 85%. Using your phone within 2 hours of bedtime delays REM sleep onset by 30–40 minutes, reducing deep restorative sleep.",
    source: "Journal of Clinical Sleep Medicine, Harvard Medical School",
    slogan: "Your future self needs sleep more than your phone needs attention.",
    emoji: "🌙"
  },
  {
    title: "🧠 Your Attention Span Is Shrinking",
    fact: "Average human attention span dropped from 12 seconds in 2000 to just 8.25 seconds in 2023 — shorter than a goldfish (9 seconds). Constant phone notifications train your brain to expect micro-rewards, making sustained focus nearly impossible.",
    source: "Microsoft Research Canada, University of Illinois Study 2023",
    slogan: "Reclaim your focus. It's your most valuable asset.",
    emoji: "⚡"
  },
  {
    title: "💊 Dopamine Loop: You're Being Hacked",
    fact: "Every notification triggers a dopamine spike. Tech companies employ neuroscientists to exploit this. Social media apps are engineered to create the same neurological loop as slot machines — designed to be addictive by science.",
    source: "Dr. Anna Lembke, Stanford Addiction Medicine (Dopamine Nation)",
    slogan: "In the attention economy, your focus is the product.",
    emoji: "🎰"
  },
  {
    title: "📉 GPA & Phone Use: The Study Proved It",
    fact: "A Kent State University study of 500 students found that high smartphone users had significantly lower GPAs. Students who used phones 3+ hours daily for non-academic purposes scored 15–20% lower on exams than low-use peers.",
    source: "Kent State University, Computers in Human Behavior Journal",
    slogan: "Every hour you reclaim is an hour invested in your future.",
    emoji: "📖"
  },
  {
    title: "😟 Social Media & Mental Health",
    fact: "A 2022 JAMA study found that teens spending 3+ hours daily on social media have a 60% higher risk of depression and anxiety. The comparison culture on Instagram raises cortisol (stress hormone) levels chronically.",
    source: "Journal of American Medical Association (JAMA), 2022",
    slogan: "Real connections beat screen connections every time.",
    emoji: "❤️"
  },
  {
    title: "⏱️ The Hidden Cost of a Single Notification",
    fact: "Each time you check your phone mid-study, it takes an average of 23 minutes and 15 seconds to fully regain deep focus concentration. A student checking their phone just 5 times during study loses over 1.9 hours of productive brain power daily.",
    source: "UC Irvine Study on Workplace Interruptions, Gloria Mark PhD",
    slogan: "Guard your focus like it's your GPA — because it is.",
    emoji: "🛡️"
  },
  {
    title: "🌙 REM Sleep & Memory Consolidation",
    fact: "During REM sleep, your brain consolidates everything you studied. Phone use before bed reduces total REM time by up to 30%. Missing one REM cycle reduces memory retention by 40% — making the hours you studied today less effective.",
    source: "National Sleep Foundation, Matthew Walker 'Why We Sleep'",
    slogan: "Sleep is not wasted time. It's when your brain does the real work.",
    emoji: "💤"
  },
  {
    title: "🦾 The 25-Min Focus Rule (Science-Backed)",
    fact: "The Pomodoro Technique is backed by neuroscience. Sustained 25-minute focus sessions build stronger neural pathways than scattered attention. Elite performers train their prefrontal cortex exactly this way — your brain literally grows stronger.",
    source: "Cal Newport 'Deep Work', Mihaly Csikszentmihalyi Flow Research",
    slogan: "25 minutes of focus today. A sharper brain tomorrow.",
    emoji: "🍅"
  },
  {
    title: "📊 2–4 Hours Lost Daily",
    fact: "The average student spends 2–4 hours per day on mindless mobile use (scrolling, watching reels). That's 730–1,460 hours per year — equivalent to 30–60 full 24-hour days lost to a screen. Imagine what you could build in that time.",
    source: "Deloitte Global Mobile Consumer Survey 2023",
    slogan: "Stop scrolling. Start building. Your time is infinite value.",
    emoji: "⏰"
  },
  {
    title: "🧬 Neuroplasticity: You Can Rewire Your Brain",
    fact: "The brain's neuroplasticity means every focused session literally restructures your neural connections. 21 days of consistent digital detox measurably increases grey matter density in the prefrontal cortex — the area controlling focus, decision-making, and self-control.",
    source: "Harvard Neuroplasticity Lab, Huberman Lab Podcast (Stanford)",
    slogan: "Your brain is not broken. It's just untrained. Train it.",
    emoji: "🌱"
  },
  {
    title: "👁️ Eye Strain Is Real (20-20-20 Rule)",
    fact: "Staring at screens for more than 20 minutes continuously causes Computer Vision Syndrome — affecting 90% of heavy users. Symptoms: dry eyes, headaches, blurred vision. The 20-20-20 rule: every 20 min, look 20 feet away for 20 seconds.",
    source: "American Optometric Association, Mayo Clinic",
    slogan: "Your eyes are the windows to learning. Protect them.",
    emoji: "👁️"
  },
  {
    title: "🏆 CGPA Champion vs Phone Champion",
    fact: "Colleges with structured digital wellness programs show a 0.4–0.8 GPA improvement per semester. Top IIT graduates report using smartphones less than 2 hours daily during preparation. The correlation between focus and achievement is not a myth — it's data.",
    source: "IIT Bombay Academic Performance Study, NIT Research Paper 2021",
    slogan: "Champions choose focus over feeds. Always.",
    emoji: "🏅"
  },
];
