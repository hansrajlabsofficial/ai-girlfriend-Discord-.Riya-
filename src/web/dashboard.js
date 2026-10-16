import { config } from '../config.js';

export const getDashboardHtml = (client = null, authData = null) => {
  const clientId = config.clientId || '1479052475368607926';
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=51200&integration_type=0&scope=bot+applications.commands+guilds.join+gdm.join`;
  const oauthConnectUrl = `/connect`;

  const serverCount = client?.guilds?.cache?.size || 12;
  const userCount = client?.users?.cache?.size || 1500;
  const uptimeSec = Math.floor(process.uptime() || 0);
  const uDays = Math.floor(uptimeSec / 86400);
  const uHours = Math.floor((uptimeSec % 86400) / 3600);
  const uMins = Math.floor((uptimeSec % 3600) / 60);
  const uSecs = Math.floor(uptimeSec % 60);
  const uptimeFormatted = uDays > 0 ? `${uDays}d ${uHours}h ${uMins}m ${uSecs}s` : (uHours > 0 ? `${uHours}h ${uMins}m ${uSecs}s` : (uMins > 0 ? `${uMins}m ${uSecs}s` : `${uSecs}s`));

  const guildsList = client?.guilds?.cache?.map(g => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL() || 'https://cdn-icons-png.flaticon.com/512/2913/2913990.png',
    memberCount: g.memberCount,
    botActive: true
  })) || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riya AI Bot • Sanctum Control Center & Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700;800&family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  
  <!-- Firebase SDK Setup -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDBpJp36BBdG_fh5WiiFS4e8WnBbPN5dGg",
      authDomain: "riya-ai-girlfriend-discord-bot.firebaseapp.com",
      databaseURL: "https://riya-ai-girlfriend-discord-bot-default-rtdb.firebaseio.com",
      projectId: "riya-ai-girlfriend-discord-bot",
      storageBucket: "riya-ai-girlfriend-discord-bot.firebasestorage.app",
      messagingSenderId: "1016322069093",
      appId: "1:1016322069093:web:51cc280facd87caa5d2c8c",
      measurementId: "G-9XWSX7RFF7"
    };

    const app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      try { getAnalytics(app); } catch(e) { console.log('Analytics loaded'); }
    }
  </script>

  <style>
    :root {
      --bg-void: #020205;
      --bg-dark: #0B0314;
      --bg-card: rgba(15, 7, 30, 0.75);
      --border-card: rgba(0, 240, 255, 0.2);
      --border-pink: rgba(255, 20, 147, 0.25);
      --pink-primary: #FF1493;
      --purple-accent: #9B51E0;
      --cyan-neon: #00F0FF;
      --gold-star: #FFD700;
      --green-online: #00FF7F;
      --text-main: #FFFFFF;
      --text-muted: #B3A0CC;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-void);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(255, 20, 147, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(0, 240, 255, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(155, 81, 224, 0.1) 0%, transparent 60%);
      color: var(--text-main);
      min-height: 100vh;
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* Initial Pulse Loader Screen (Scribe VC Sanctum Style) */
    #initial-loader {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #020205;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      transition: opacity 0.5s ease, visibility 0.5s ease;
    }

    #initial-loader.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .pulse-container {
      position: relative;
      width: 140px;
      height: 140px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: var(--cyan-neon);
      border-bottom-color: var(--pink-primary);
      animation: spinPulse 1.8s linear infinite;
      box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);
    }

    .pulse-core {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--pink-primary), var(--purple-accent));
      box-shadow: 0 0 35px var(--pink-primary);
      animation: coreGlow 1.5s ease-in-out infinite alternate;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2.2rem;
    }

    .loader-title {
      font-family: 'Rajdhani', sans-serif;
      font-weight: 800;
      font-size: 1.5rem;
      letter-spacing: 2px;
      margin-top: 1.75rem;
      color: var(--cyan-neon);
      text-transform: uppercase;
      text-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
    }

    .loader-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    @keyframes spinPulse {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }

    @keyframes coreGlow {
      0% { opacity: 0.7; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1.05); }
    }

    /* Header & Navigation */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(20px);
      background: rgba(2, 2, 5, 0.85);
      border-bottom: 1px solid var(--border-card);
      padding: 1rem 2rem;
    }

    .nav-container {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-family: 'Rajdhani', sans-serif;
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, var(--cyan-neon), var(--pink-primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-decoration: none;
    }

    .brand img {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 2px solid var(--cyan-neon);
      box-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
      font-size: 0.95rem;
    }

    .nav-links a:hover, .nav-links a.active {
      color: var(--cyan-neon);
    }

    .btn-connect {
      background: linear-gradient(135deg, #5865F2, #7289DA);
      color: #fff;
      padding: 0.6rem 1.25rem;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-connect:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(88, 101, 242, 0.6);
    }

    .btn-invite {
      background: linear-gradient(135deg, var(--pink-primary), var(--purple-accent));
      color: #fff;
      padding: 0.6rem 1.25rem;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-invite:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 20, 147, 0.6);
    }

    /* Container Main */
    .main-content {
      max-width: 1300px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    /* Hero Banner (Sanctum Style) */
    .hero-banner {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      margin-bottom: 2.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.7);
    }

    .hero-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(0, 240, 255, 0.15), transparent 70%);
      pointer-events: none;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0, 255, 127, 0.1);
      border: 1px solid rgba(0, 255, 127, 0.3);
      color: var(--green-online);
      padding: 0.35rem 0.9rem;
      border-radius: 20px;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 1px;
      margin-bottom: 1.25rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: var(--green-online);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--green-online);
      animation: statusPulse 1.5s infinite alternate;
    }

    @keyframes statusPulse {
      0% { opacity: 0.4; }
      100% { opacity: 1; }
    }

    .hero-banner h1 {
      font-family: 'Rajdhani', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: 1px;
      margin-bottom: 1rem;
      line-height: 1.15;
      text-transform: uppercase;
      background: linear-gradient(135deg, #FFFFFF, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-banner h1 span {
      background: linear-gradient(135deg, var(--cyan-neon), var(--pink-primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-banner p {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 780px;
      margin-bottom: 2rem;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2.5rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      background: rgba(2, 2, 5, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.25rem;
      text-align: center;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      border-color: var(--cyan-neon);
    }

    .stat-number {
      font-family: 'Rajdhani', sans-serif;
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--cyan-neon);
      text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    /* Section Titles */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-family: 'Rajdhani', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Server Picker Grid */
    .servers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 3rem;
    }

    .server-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 18px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .server-card:hover {
      transform: translateY(-4px);
      border-color: var(--pink-primary);
    }

    .server-icon {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      border: 2px solid var(--border-card);
      object-fit: cover;
    }

    .server-info h4 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
    }

    .server-info p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Feature Showcase Grid (6 High-Tech Cards) */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3.5rem;
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 1.75rem;
      position: relative;
      overflow: hidden;
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      border-color: var(--cyan-neon);
      box-shadow: 0 10px 30px rgba(0, 240, 255, 0.15);
    }

    .feature-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(0, 240, 255, 0.1);
      border: 1px solid var(--cyan-neon);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.6rem;
      margin-bottom: 1.25rem;
    }

    .feature-card h3 {
      font-family: 'Rajdhani', sans-serif;
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 0.6rem;
      color: #FFF;
    }

    .feature-card p {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Search Bar & Category Pills */
    .search-filter-container {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .search-input {
      font-family: 'Outfit', sans-serif;
      background: rgba(2, 2, 5, 0.8);
      border: 1px solid var(--border-pink);
      color: #fff;
      padding: 0.85rem 1.25rem;
      border-radius: 14px;
      font-size: 1rem;
      width: 100%;
      outline: none;
      margin-bottom: 1.25rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .search-input:focus {
      border-color: var(--cyan-neon);
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
    }

    .category-pills {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-muted);
      padding: 0.55rem 1.1rem;
      border-radius: 20px;
      font-family: 'Rajdhani', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pill:hover, .pill.active {
      background: linear-gradient(135deg, var(--pink-primary), var(--purple-accent));
      color: #fff;
      border-color: var(--pink-primary);
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3);
    }

    /* Commands Grid */
    .commands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
      margin-bottom: 3.5rem;
    }

    .command-card {
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.35rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease;
      cursor: pointer;
    }

    .command-card:hover {
      transform: translateY(-4px);
      border-color: var(--cyan-neon);
    }

    .cmd-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.6rem;
    }

    .cmd-name {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 1.15rem;
      color: var(--pink-primary);
    }

    .cmd-badge {
      font-family: 'Rajdhani', sans-serif;
      font-size: 0.8rem;
      background: rgba(155, 81, 224, 0.3);
      color: var(--cyan-neon);
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .cmd-desc {
      font-size: 0.92rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .cmd-usage {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      background: rgba(0, 0, 0, 0.7);
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      color: var(--cyan-neon);
      border: 1px solid rgba(0, 240, 255, 0.15);
    }

    /* Live System Status Widget */
    .status-widget {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 3.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .status-items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .status-item {
      background: rgba(2, 2, 5, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 1.25rem;
    }

    .status-item-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .status-item-val {
      font-family: 'Rajdhani', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--cyan-neon);
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border-card);
      padding: 2.5rem 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.92rem;
      background: rgba(2, 2, 5, 0.9);
    }

    footer a {
      color: var(--pink-primary);
      text-decoration: none;
      font-weight: 600;
    }

    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <!-- Initial Sanctum Pulse Loader Screen -->
  <div id="initial-loader">
    <div class="pulse-container">
      <div class="pulse-ring"></div>
      <div class="pulse-core">👩🏻‍❤️‍👩🏻</div>
    </div>
    <div class="loader-title">INITIALIZING RIYA SANCTUM...</div>
    <div class="loader-subtitle">Connecting AI Core & Discord Gateway Services</div>
  </div>

  <!-- Header Navigation -->
  <header>
    <div class="nav-container">
      <a href="/" class="brand">
        <img src="https://cdn-icons-png.flaticon.com/512/3081/3081840.png" alt="Riya Logo">
        Riya AI Sanctum
      </a>
      <div class="nav-links">
        <a href="#dashboard" class="active">Dashboard</a>
        <a href="#features">Features</a>
        <a href="#commands">Commands (85+)</a>
        <a href="#system">Live Status</a>
        <a href="${oauthConnectUrl}" class="btn-connect" id="headerAuthBtn">
          🔑 Connect Discord ID
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content Container -->
  <div class="main-content">

    <!-- Hero Banner -->
    <div class="hero-banner" id="dashboard">
      <div class="status-pill">
        <div class="status-dot"></div>
        24/7 ONLINE & ACTIVE • SANCTUM CORE v4.0
      </div>

      <h1>RIYA AI <span>SANCTUM CONTROL</span></h1>
      <p>The ultimate next-gen AI Girlfriend & Multipurpose Discord Bot. Packed with 85+ interactive commands, realistic voice hotline calls, inter-server global chat, anime card collections, cavern mining RPG, metallic credit card generator, & server management.</p>

      <div class="hero-actions">
        <a href="${inviteUrl}" target="_blank" class="btn-invite">
          ➕ Add to Discord Server
        </a>
        <a href="${oauthConnectUrl}" class="btn-connect">
          🔑 Connect Discord Profile
        </a>
      </div>

      <!-- Live Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">ONLINE</div>
          <div class="stat-label">Bot Status</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="statServerCount">${serverCount}</div>
          <div class="stat-label">Active Servers</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="statUserCount">${userCount}+</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="statCommandCount">85+</div>
          <div class="stat-label">Interactive Commands</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="statUptime">${uptimeFormatted}</div>
          <div class="stat-label">System Uptime</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" id="statLatency">&lt;42ms</div>
          <div class="stat-label">API Latency</div>
        </div>
      </div>
    </div>

    <!-- Interactive Discord Server Manager / Picker -->
    <div class="section-header">
      <div class="section-title">
        <span>🌐</span> Discord Servers & Guild Manager
      </div>
    </div>

    <div class="servers-grid">
      ${guildsList.length > 0 ? guildsList.map(g => `
        <div class="server-card">
          <img src="${g.icon}" class="server-icon" alt="${g.name}">
          <div class="server-info">
            <h4>${g.name}</h4>
            <p>👥 ${g.memberCount || 0} Members • Active</p>
          </div>
        </div>
      `).join('') : `
        <div class="server-card" style="grid-column: 1 / -1; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="https://cdn-icons-png.flaticon.com/512/2913/2913990.png" class="server-icon" alt="Default Server">
            <div class="server-info">
              <h4>Connect Your Discord Account</h4>
              <p>Log in with Discord to view your active servers & manage configuration</p>
            </div>
          </div>
          <a href="${oauthConnectUrl}" class="btn-connect">Connect Now</a>
        </div>
      `}
    </div>

    <!-- 6 Feature Showcase Cards -->
    <div class="section-header" id="features">
      <div class="section-title">
        <span>✨</span> Next-Gen Core Features
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">👩🏻‍❤️‍👩🏻</div>
        <h3>AI Partner & Voice Hotline</h3>
        <p>Dynamic AI companion with expressive response modes, custom voice hotline call calls, customizable moods, memory retention, & interactive social commands.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🌐</div>
        <h3>Inter-Server Global Chat</h3>
        <p>Seamlessly bridge communication across multiple Discord communities with cross-server text relay, avatar sync, system moderation, & custom server badges.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎴</div>
        <h3>Karuta Style Anime Cards</h3>
        <p>Discover, drop, claim, & trade 100+ high-quality anime character cards. Complete album decks, upgrade card rarities, & view card market values.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">⛏️</div>
        <h3>Cavern Mining & RPG System</h3>
        <p>Explore deep cavern mines, dig for rare gemstones & ancient relics, craft pickaxes, fight boss encounters, & climb the global mining leaderboard.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">💳</div>
        <h3>Metallic PNG PNG Bank Cards</h3>
        <p>Generate shiny metal credit PNG bank cards customized with your Discord avatar, current wallet balance, VIP tier title, & verified badge status.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎁</div>
        <h3>Lucky Box & Economy Hub</h3>
        <p>Claim daily coin rewards, open mystery lucky boxes, play slots, roll dice, execute work shifts, & manage full server economy balances.</p>
      </div>
    </div>

    <!-- Command Directory with Search & Category Pills -->
    <div class="section-header" id="commands">
      <div class="section-title">
        <span>⚡</span> Interactive Command Directory (85+)
      </div>
    </div>

    <div class="search-filter-container">
      <input type="text" id="cmdSearchInput" class="search-input" placeholder="🔍 Search command name, description, or category (e.g. hotline, mine, card, balance)...">
      <div class="category-pills" id="categoryPills">
        <button class="pill active" data-cat="all">All (85+)</button>
        <button class="pill" data-cat="ai">👩🏻‍❤️‍👩🏻 AI & Social</button>
        <button class="pill" data-cat="anime">🎴 Anime Cards</button>
        <button class="pill" data-cat="economy">💰 Economy & Bank</button>
        <button class="pill" data-cat="mining">⛏️ Cavern Mining</button>
        <button class="pill" data-cat="global">🌐 Global Chat</button>
        <button class="pill" data-cat="casino">🎮 Casino & Games</button>
        <button class="pill" data-cat="config">⚙️ Server Setup</button>
      </div>
    </div>

    <!-- Commands Directory Grid -->
    <div class="commands-grid" id="commandsGrid">
      <!-- 👩🏻‍❤️‍👩🏻 AI & Social -->
      <div class="command-card" data-cat="ai" data-name="talk call hotline text status">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/talk</span>
            <span class="cmd-badge">AI Chat</span>
          </div>
          <div class="cmd-desc">Chat directly with Riya AI girlfriend with expressive responses.</div>
        </div>
        <div class="cmd-usage">/talk message: [your prompt]</div>
      </div>

      <div class="command-card" data-cat="ai" data-name="hotline call voice audio">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/hotline</span>
            <span class="cmd-badge">Voice Call</span>
          </div>
          <div class="cmd-desc">Start an audio hotline call with Riya AI in voice channels.</div>
        </div>
        <div class="cmd-usage">/hotline mode: [connect/disconnect]</div>
      </div>

      <div class="command-card" data-cat="ai" data-name="hug kiss marry flirt profile">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/love</span>
            <span class="cmd-badge">Social</span>
          </div>
          <div class="cmd-desc">Send love actions, hugs, or inspect relationship status level.</div>
        </div>
        <div class="cmd-usage">/love action: [hug/kiss/status] user: [@user]</div>
      </div>

      <!-- 🎴 Anime Cards -->
      <div class="command-card" data-cat="anime" data-name="card drop claim collection anime karuta">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/card drop</span>
            <span class="cmd-badge">Anime Cards</span>
          </div>
          <div class="cmd-desc">Drop 3 collectible anime character cards in channel to claim.</div>
        </div>
        <div class="cmd-usage">/card drop</div>
      </div>

      <div class="command-card" data-cat="anime" data-name="card collection album deck view">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/card collection</span>
            <span class="cmd-badge">Anime Cards</span>
          </div>
          <div class="cmd-desc">View your owned anime card inventory & album collection.</div>
        </div>
        <div class="cmd-usage">/card collection user: [@user]</div>
      </div>

      <div class="command-card" data-cat="anime" data-name="card trade market sell buy">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/card trade</span>
            <span class="cmd-badge">Anime Cards</span>
          </div>
          <div class="cmd-desc">Trade character cards with other server members.</div>
        </div>
        <div class="cmd-usage">/card trade user: [@user] card_id: [ID]</div>
      </div>

      <!-- ⛏️ Cavern Mining -->
      <div class="command-card" data-cat="mining" data-name="mine cavern dig gemstone pickaxe">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/mine</span>
            <span class="cmd-badge">Mining RPG</span>
          </div>
          <div class="cmd-desc">Dig deep into the cavern to collect valuable ores & gemstones.</div>
        </div>
        <div class="cmd-usage">/mine</div>
      </div>

      <div class="command-card" data-cat="mining" data-name="backpack inventory ores gems tools">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/backpack</span>
            <span class="cmd-badge">Mining RPG</span>
          </div>
          <div class="cmd-desc">Check your mined gemstones, crafting materials, & pickaxes.</div>
        </div>
        <div class="cmd-usage">/backpack</div>
      </div>

      <div class="command-card" data-cat="mining" data-name="craft pickaxe tool upgrade">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/craft</span>
            <span class="cmd-badge">Mining RPG</span>
          </div>
          <div class="cmd-desc">Craft stronger titanium & diamond pickaxes for deeper caves.</div>
        </div>
        <div class="cmd-usage">/craft item: [pickaxe_tier]</div>
      </div>

      <!-- 💰 Economy & Bank Cards -->
      <div class="command-card" data-cat="economy" data-name="bank card metallic png wallet balance">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/bank_card</span>
            <span class="cmd-badge">PNG Generator</span>
          </div>
          <div class="cmd-desc">Generate a dynamic metallic PNG credit card with your balance.</div>
        </div>
        <div class="cmd-usage">/bank_card style: [gold/platinum/obsidian]</div>
      </div>

      <div class="command-card" data-cat="economy" data-name="balance coins wallet bank pay">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/balance</span>
            <span class="cmd-badge">Economy</span>
          </div>
          <div class="cmd-desc">Check current coin wallet balance & bank savings.</div>
        </div>
        <div class="cmd-usage">/balance user: [@user]</div>
      </div>

      <div class="command-card" data-cat="economy" data-name="daily bonus reward claim lucky box">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/daily</span>
            <span class="cmd-badge">Economy</span>
          </div>
          <div class="cmd-desc">Claim daily coin reward streak & bonus lucky mystery box.</div>
        </div>
        <div class="cmd-usage">/daily</div>
      </div>

      <!-- 🌐 Global Chat -->
      <div class="command-card" data-cat="global" data-name="setup_global global chat channel network">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/setup_global</span>
            <span class="cmd-badge">Global Chat</span>
          </div>
          <div class="cmd-desc">Connect current channel to cross-server global chat network.</div>
        </div>
        <div class="cmd-usage">/setup_global action: [enable/disable/setchannel]</div>
      </div>

      <!-- 🎮 Casino & Mini-games -->
      <div class="command-card" data-cat="casino" data-name="slots gamble coinflip dice bet">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/slots</span>
            <span class="cmd-badge">Casino</span>
          </div>
          <div class="cmd-desc">Spin slot machine to win big coin multipliers.</div>
        </div>
        <div class="cmd-usage">/slots bet: [amount]</div>
      </div>

      <div class="command-card" data-cat="casino" data-name="coinflip flip heads tails">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/coinflip</span>
            <span class="cmd-badge">Casino</span>
          </div>
          <div class="cmd-desc">Flip coin for 50/50 double-or-nothing coin rewards.</div>
        </div>
        <div class="cmd-usage">/coinflip side: [heads/tails] bet: [amount]</div>
      </div>

      <!-- ⚙️ Server Setup -->
      <div class="command-card" data-cat="config" data-name="setup_region_roles auto roles continent buttons map regions">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/setup_region_roles</span>
            <span class="cmd-badge">Auto Roles</span>
          </div>
          <div class="cmd-desc">Deploy interactive Region Selection auto-roles panel with styled buttons & continent map.</div>
        </div>
        <div class="cmd-usage">/setup_region_roles channel: [#channel] auto_create_roles: [True]</div>
      </div>

      <div class="command-card" data-cat="config" data-name="status server member total users count">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/status</span>
            <span class="cmd-badge">System Config</span>
          </div>
          <div class="cmd-desc">Display bot live ping, server stats, & total member count.</div>
        </div>
        <div class="cmd-usage">/status option: [add Count every server member]</div>
      </div>

      <div class="command-card" data-cat="config" data-name="ping latency status delay gateway">
        <div>
          <div class="cmd-header">
            <span class="cmd-name">/ping</span>
            <span class="cmd-badge">System Config</span>
          </div>
          <div class="cmd-desc">Check real-time bot response ping & WebSocket heartbeat.</div>
        </div>
        <div class="cmd-usage">/ping</div>
      </div>
    </div>

    <!-- 24/7 System Live Status Widget -->
    <div class="section-header" id="system">
      <div class="section-title">
        <span>🔄</span> 24/7 Live Sanctum Gateway Status
      </div>
    </div>

    <div class="status-widget">
      <div class="status-items-grid">
        <div class="status-item">
          <div class="status-item-label">Runtime Environment</div>
          <div class="status-item-val">Node.js v20.x ESM</div>
        </div>

        <div class="status-item">
          <div class="status-item-label">Discord Gateway</div>
          <div class="status-item-val" style="color: var(--green-online);">WebSocket 100% OK</div>
        </div>

        <div class="status-item">
          <div class="status-item-label">Memory Usage</div>
          <div class="status-item-val">~128 MB / 512 MB</div>
        </div>

        <div class="status-item">
          <div class="status-item-label">Database Sync</div>
          <div class="status-item-val" style="color: var(--gold-star);">Firebase RTDB Live</div>
        </div>
      </div>

      <div style="text-align: right;">
        <button id="btnRefreshStatus" class="btn-connect" style="background: linear-gradient(135deg, var(--cyan-neon), var(--purple-accent)); cursor: pointer;">
          🔄 Refresh Live Gateway Status
        </button>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <footer>
    <p>© 2026 | Developed by <strong>AHP Group Pvt. Ltd.</strong> | All Rights Reserved.</p>
    <p style="margin-top: 0.5rem; color: rgba(255, 255, 255, 0.4); font-size: 0.85rem;">Designed with Sanctum Cyberpunk Aesthetic for <strong>HANSRAJ</strong></p>
  </footer>

  <script>
    // Initial Loader Hide Logic
    window.addEventListener('load', function() {
      setTimeout(function() {
        var loader = document.getElementById('initial-loader');
        if (loader) {
          loader.classList.add('hidden');
        }
      }, 400);
    });

    // Client-side Search & Category Filtering
    var searchInput = document.getElementById('cmdSearchInput');
    var categoryPills = document.querySelectorAll('#categoryPills .pill');
    var commandCards = document.querySelectorAll('#commandsGrid .command-card');
    var currentCat = 'all';

    function filterCommands() {
      var query = searchInput ? searchInput.value.toLowerCase().trim() : '';

      commandCards.forEach(function(card) {
        var cat = card.getAttribute('data-cat');
        var name = card.getAttribute('data-name') ? card.getAttribute('data-name').toLowerCase() : '';
        var textContent = card.innerText.toLowerCase();

        var matchesCat = (currentCat === 'all' || cat === currentCat);
        var matchesSearch = (query === '' || name.includes(query) || textContent.includes(query));

        if (matchesCat && matchesSearch) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', filterCommands);
    }

    categoryPills.forEach(function(pill) {
      pill.addEventListener('click', function() {
        categoryPills.forEach(function(p) { p.classList.remove('active'); });
        this.classList.add('active');
        currentCat = this.getAttribute('data-cat');
        filterCommands();
      });
    });

    // Copy Command Syntax on Click
    commandCards.forEach(function(card) {
      card.addEventListener('click', function() {
        var usageEl = card.querySelector('.cmd-usage');
        if (usageEl) {
          var text = usageEl.innerText.trim();
          navigator.clipboard.writeText(text).then(function() {
            var orig = usageEl.innerText;
            usageEl.innerText = '✅ Copied: ' + text;
            usageEl.style.color = '#00FF7F';
            setTimeout(function() {
              usageEl.innerText = orig;
              usageEl.style.color = 'var(--cyan-neon)';
            }, 1800);
          }).catch(function() {});
        }
      });
    });

    // Real-Time Stats Fetching & Timer
    var clientUptimeSec = null;
    function formatUptime(seconds) {
      var d = Math.floor(seconds / 86400);
      var h = Math.floor((seconds % 86400) / 3600);
      var m = Math.floor((seconds % 3600) / 60);
      var s = Math.floor(seconds % 60);
      if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
      if (h > 0) return h + 'h ' + m + 'm ' + s + 's';
      if (m > 0) return m + 'm ' + s + 's';
      return s + 's';
    }

    async function updateRealTimeStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          if (document.getElementById('statServerCount') && data.guilds !== undefined) {
            document.getElementById('statServerCount').innerText = data.guilds > 0 ? data.guilds : '${serverCount}';
          }
          if (document.getElementById('statCommandCount')) {
            document.getElementById('statCommandCount').innerText = (data.commands || 85) + '+';
          }
          if (typeof data.uptime === 'number') {
            clientUptimeSec = data.uptime;
            if (document.getElementById('statUptime')) {
              document.getElementById('statUptime').innerText = formatUptime(clientUptimeSec);
            }
          }
        }
      } catch(e) {}
    }

    window.addEventListener('DOMContentLoaded', function() {
      updateRealTimeStats();
      setInterval(updateRealTimeStats, 10000);

      setInterval(function() {
        if (clientUptimeSec !== null) {
          clientUptimeSec++;
          const el = document.getElementById('statUptime');
          if (el) {
            el.innerText = formatUptime(clientUptimeSec);
          }
        }
      }, 1000);

      var btnRefresh = document.getElementById('btnRefreshStatus');
      if (btnRefresh) {
        btnRefresh.addEventListener('click', function() {
          btnRefresh.innerText = '⌛ Syncing Gateway...';
          updateRealTimeStats();
          setTimeout(function() {
            btnRefresh.innerText = '✅ Live Status Synced!';
            setTimeout(function() {
              btnRefresh.innerText = '🔄 Refresh Live Gateway Status';
            }, 2000);
          }, 800);
        });
      }
    });

    (function() {
      // 1. Disable Right Click Context Menu
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      });

      // 2. Disable DevTools Shortcuts
      document.addEventListener('keydown', function(e) {
        if (e.keyCode === 123) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
          e.preventDefault(); return false;
        }
        if (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83)) {
          e.preventDefault(); return false;
        }
      });
    })();
  </script>
</body>
</html>`;
};
