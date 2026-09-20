import { config } from '../config.js';

export const getDashboardHtml = (client = null, authData = null) => {
  const clientId = config.clientId || 'YOUR_CLIENT_ID';
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=51200&integration_type=0&scope=bot+applications.commands`;
  const oauthConnectUrl = `/connect`;

  const serverCount = client?.guilds?.cache?.size || 12;
  const userCount = client?.users?.cache?.size || 1500;
  const uptimeHours = Math.floor((process.uptime() || 3600) / 3600);

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
  <title>Riya AI Bot • Web Dashboard & Command Guide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  
  <!-- Firebase SDK & Analytics Setup -->
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
      --bg-dark: #0B0314;
      --bg-card: rgba(25, 10, 45, 0.75);
      --border-card: rgba(255, 20, 147, 0.25);
      --pink-primary: #FF1493;
      --purple-accent: #9B51E0;
      --cyan-neon: #00F0FF;
      --gold-star: #FFD700;
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
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(255, 20, 147, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(0, 240, 255, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(155, 81, 224, 0.1) 0%, transparent 60%);
      color: var(--text-main);
      min-height: 100vh;
      line-height: 1.6;
    }

    /* Header & Navigation */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(16px);
      background: rgba(11, 3, 20, 0.85);
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
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--pink-primary), var(--cyan-neon));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-decoration: none;
    }

    .brand img {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 2px solid var(--pink-primary);
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
    }

    .nav-links a:hover, .nav-links a.active {
      color: var(--pink-primary);
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

    /* Hero Banner */
    .hero-banner {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      margin-bottom: 2.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .hero-banner h1 {
      font-size: 2.8rem;
      font-weight: 800;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .hero-banner p {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 750px;
      margin-bottom: 2rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .stat-card {
      background: rgba(11, 3, 20, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.25rem;
      text-align: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 800;
      color: var(--cyan-neon);
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Discord Connect Profile Card */
    .user-profile-card {
      background: linear-gradient(135deg, rgba(88, 101, 242, 0.15), rgba(255, 20, 147, 0.15));
      border: 1px solid rgba(88, 101, 242, 0.4);
      border-radius: 20px;
      padding: 1.75rem;
      margin-bottom: 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 3px solid #5865F2;
    }

    .user-details h3 {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .user-details p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    /* Section Titles */
    .section-header {
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      font-size: 2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-header p {
      color: var(--text-muted);
    }

    /* Guides Grid */
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .guide-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 20px;
      padding: 1.75rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .guide-card:hover {
      transform: translateY(-4px);
      border-color: var(--pink-primary);
    }

    .guide-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .guide-card h3 {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .guide-card p {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 1rem;
    }

    .code-snippet {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      font-size: 0.85rem;
      color: var(--cyan-neon);
      margin-bottom: 0.5rem;
      display: block;
    }

    /* Filter & Search Bar for Commands */
    .search-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-input {
      font-family: 'Outfit', sans-serif;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid var(--border-card);
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-size: 1rem;
      width: 100%;
      max-width: 400px;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--cyan-neon);
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
    }

    .category-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-muted);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pill:hover, .pill.active {
      background: var(--pink-primary);
      color: #fff;
      border-color: var(--pink-primary);
    }

    /* Commands Grid */
    .commands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
      margin-bottom: 3rem;
    }

    .command-card {
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .command-card:hover {
      transform: translateY(-3px);
      border-color: var(--cyan-neon);
    }

    .cmd-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .cmd-name {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--pink-primary);
    }

    .cmd-badge {
      font-size: 0.75rem;
      background: rgba(155, 81, 224, 0.3);
      color: var(--purple-accent);
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
      font-weight: 600;
    }

    .cmd-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .cmd-usage {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      background: rgba(0, 0, 0, 0.6);
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      color: var(--cyan-neon);
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border-card);
      padding: 2.5rem 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  </style>
</head>
<body>

  <!-- Header Navigation -->
  <header>
    <div class="nav-container">
      <a href="/" class="brand">
        <img src="https://cdn-icons-png.flaticon.com/512/3081/3081840.png" alt="Riya Logo">
        Riya AI Hub
      </a>
      <div class="nav-links">
        <a href="#dashboard" class="active">Dashboard</a>
        <a href="#servers">Manage Servers</a>
        <a href="#guides">Setup Guide</a>
        <a href="#commands">Commands (85+)</a>
        ${authData?.connected ? `
        <a href="/logout" onclick="localStorage.removeItem('discord_auth');" class="btn-connect" style="background: rgba(255, 75, 75, 0.2); border: 1px solid #FF4B4B; color: #FF4B4B; text-decoration: none;">
          🚪 Logout
        </a>
        ` : `
        <a href="${oauthConnectUrl}" class="btn-connect">
          <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0,3.36,6.83A97.68,97.68,0,0,0,42.29,6.83,72.37,72.37,0,0,0,45.65,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a74.71,74.71,0,0,0,64.3,0c.87.68,1.76,1.36,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c3.09-27.87-5.19-51.52-18.88-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.92,53.86,53,48.78,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.08-12.74,11.44-12.74S96.2,45.92,96.07,53,91,65.69,84.69,65.69Z"/>
          </svg>
          Connect Discord
        </a>
        `}
        <a href="${inviteUrl}" target="_blank" class="btn-invite">Add Bot to Server</a>
      </div>
    </div>
  </header>

  <div class="main-content">

    <!-- Hero Banner -->
    <section id="dashboard" class="hero-banner">
      <h1>Amdavadi AI Girlfriend & Economy Bot Hub ☕💖</h1>
      <p>Manage your Discord servers, explore 85+ interactive commands, setting up Inter-Server Global Chat/Calls, Karuta Anime Card Collection, Lucky Box Game Master, and Advanced Metallic Banking Cards!</p>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">ONLINE</div>
          <div class="stat-label">Bot Status</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${serverCount}</div>
          <div class="stat-label">Connected Servers</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">85+</div>
          <div class="stat-label">Commands Available</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${uptimeHours}h</div>
          <div class="stat-label">Uptime</div>
        </div>
      </div>
    </section>

    <!-- Discord Account Connect Banner -->
    ${authData?.connected ? `
    <div class="user-profile-card" style="border-color: #00FF7F; background: linear-gradient(135deg, rgba(0, 255, 127, 0.15), rgba(88, 101, 242, 0.15));">
      <div class="user-info">
        <img src="https://cdn-icons-png.flaticon.com/512/3059/3059502.png" alt="Discord Avatar" class="user-avatar" style="border-color: #00FF7F;">
        <div class="user-details">
          <h3 style="color: #00FF7F;">✅ Discord Account Connected & Authorized!</h3>
          <p>Your Discord account has been authorized successfully. You are logged into Riya Bot Web Services.</p>
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <span class="btn-connect" style="background: #00FF7F; color: #0B0314;">
          ✓ Account Authorized
        </span>
        <a href="/logout" onclick="localStorage.removeItem('discord_auth');" class="btn-connect" style="background: rgba(255, 75, 75, 0.25); border: 1px solid #FF4B4B; color: #FF4B4B; text-decoration: none;">
          🚪 Logout
        </a>
      </div>
    </div>
    ` : `
    <div class="user-profile-card">
      <div class="user-info">
        <img src="https://cdn-icons-png.flaticon.com/512/3059/3059502.png" alt="Discord Avatar" class="user-avatar">
        <div class="user-details">
          <h3>Discord Account Connect</h3>
          <p>Connect your Discord account to manage server bindings, check global bank rank perks, and inspect stats online!</p>
        </div>
      </div>
      <a href="${oauthConnectUrl}" class="btn-connect">
        Login with Discord OAuth2
      </a>
    </div>
    `}

    <!-- Manage Servers & Configuration Section (Carl-bot / Dyno Style Circular Server Picker) -->
    <section id="servers" style="margin-bottom: 3.5rem; background: rgba(30, 27, 46, 0.85); border: 1px solid rgba(255, 20, 147, 0.3); border-radius: 24px; padding: 2.5rem; backdrop-filter: blur(16px); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);">
      
      <!-- Top Breadcrumb Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.75rem;">
        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
          ☰ Server picker
        </span>
        <button onclick="refreshServers()" class="btn-connect" style="background: rgba(155, 81, 224, 0.25); border: 1px solid var(--purple-accent); color: #fff; cursor: pointer; padding: 0.4rem 0.9rem; font-size: 0.85rem;">
          🔄 Refresh
        </button>
      </div>

      <!-- Greeting Title -->
      <div style="text-align: center; margin-bottom: 2.5rem;">
        <h2 style="font-size: 1.8rem; font-weight: 800; color: #FFFFFF; margin-bottom: 0.4rem;">
          Hello, <span id="userGreetingName" style="color: var(--pink-primary);">${authData?.username || 'Username'}</span>! Please select a server to get started
        </h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">
          Click any active server below to open configuration settings, or click an unjoined server to add Riya Bot.
        </p>
      </div>

      <!-- Circular Icons Flex-Wrap Grid -->
      <div id="serverGrid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1.75rem; max-width: 1100px; margin: 0 auto;">
        ${guildsList.map(g => `
        <div class="server-picker-item" onclick="openConfigModal('${g.id}', '${g.name.replace(/'/g, "\\'")}')" style="display: flex; flex-direction: column; align-items: center; width: 90px; cursor: pointer; transition: transform 0.2s ease;">
          <div class="picker-icon-ring" style="position: relative; width: 72px; height: 72px; border-radius: 50%; border: 3px solid #00FF7F; box-shadow: 0 0 16px rgba(0, 255, 127, 0.6); padding: 2px; background: rgba(0, 255, 127, 0.1); margin-bottom: 0.6rem; transition: all 0.2s ease;">
            <img src="${g.icon}" alt="${g.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
          </div>
          <span style="font-size: 0.75rem; font-weight: 600; color: #E2D9F3; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;" title="${g.name}">
            ${g.name}
          </span>
        </div>
        `).join('')}

        <!-- Add Server Plus Icon -->
        <div class="server-picker-item" onclick="window.open('${inviteUrl}', '_blank')" style="display: flex; flex-direction: column; align-items: center; width: 90px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s ease;">
          <div class="picker-icon-ring" style="position: relative; width: 72px; height: 72px; border-radius: 50%; border: 3px dashed rgba(255, 255, 255, 0.4); padding: 2px; margin-bottom: 0.6rem; display: flex; justify-content: center; align-items: center; background: rgba(255, 255, 255, 0.05); transition: all 0.2s ease;">
            <span style="font-size: 1.8rem; color: #fff;">+</span>
          </div>
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-align: center;">Add Server</span>
        </div>
      </div>

    </section>

    <!-- Setup Guide Section -->
    <section id="guides">
      <div class="section-header">
        <h2>📖 Bot Feature Setup & Usage Guide</h2>
        <p>Follow these quick step-by-step guides to unlock all features on your Discord server.</p>
      </div>

      <div class="guide-grid">
        <div class="guide-card">
          <div class="guide-icon">🌐</div>
          <h3>Inter-Server Global Chat</h3>
          <p>Link your server's text channel to talk live with members across every Discord server!</p>
          <span class="code-snippet">/setup_global setchannel</span>
          <span class="code-snippet">xsetup_global setchannel</span>
        </div>

        <div class="guide-card">
          <div class="guide-icon">📞</div>
          <h3>Global Hotline Calls & DM Calls</h3>
          <p>Dial out to connect live 1-on-1 server calls or private DM calls with an interactive 📵 End Call button!</p>
          <span class="code-snippet">/globalcall start ($100 fee + $10/min)</span>
          <span class="code-snippet">/globalprivatecall start (Private DM Hotline)</span>
        </div>

        <div class="guide-card">
          <div class="guide-icon">📦</div>
          <h3>Lucky Box Game Master</h3>
          <p>Open mystery Lucky Boxes with exact mathematical odds: 45% Lose, 15% Stake Back, 25% 2X, 12% 3X, 3% 5X Jackpot!</p>
          <span class="code-snippet">/luckybox amount:100</span>
          <span class="code-snippet">xopenbox 500</span>
        </div>

        <div class="guide-card">
          <div class="guide-icon">⛏️</div>
          <h3>Push-Your-Luck Cavern Mining</h3>
          <p>4x5 rock button grid (20 rocks). Mine gems and ores or click Leave Mine to cash out before a cavern collapse!</p>
          <span class="code-snippet">/mine</span>
          <span class="code-snippet">xmine</span>
        </div>

        <div class="guide-card">
          <div class="guide-icon">💳</div>
          <h3>Metallic Bank Card & Auto Signatures</h3>
          <p>Generate visual PNG metallic bank cards with automatic custom user signature generation (e.g. H.VAGHELA).</p>
          <span class="code-snippet">/bank user:@Hansraj</span>
          <span class="code-snippet">/deposit all | /withdraw 100%</span>
        </div>

        <div class="guide-card">
          <div class="guide-icon">🎴</div>
          <h3>Karuta-Style Anime Card Collection</h3>
          <p>Drop 4 anime cards with interactive 1️⃣ 2️⃣ 3️⃣ 4️⃣ grab buttons, inspect wishlist, trade cards, and burn cards!</p>
          <span class="code-snippet">/card_drop | xcard_drop</span>
          <span class="code-snippet">/card_view <code> | /card_trade</span>
        </div>
      </div>
    </section>

    <!-- Command Directory Section -->
    <section id="commands">
      <div class="section-header">
        <h2>📜 Complete Command Directory (85+ Commands)</h2>
        <p>Search or filter commands across 9 categories. Supports dual Slash (/) and Text Prefix (x / k!) commands.</p>
      </div>

      <div class="search-filter-bar">
        <input type="text" id="cmdSearch" class="search-input" placeholder="🔍 Search commands (e.g. luckybox, mine, bank)..." onkeyup="filterCommands()">
        <div class="category-pills">
          <button class="pill active" onclick="filterCategory('all', this)">All (85+)</button>
          <button class="pill" onclick="filterCategory('anime', this)">🎴 Anime Cards</button>
          <button class="pill" onclick="filterCategory('banking', this)">🏦 Banking & Economy</button>
          <button class="pill" onclick="filterCategory('casino', this)">📦 Casino & Games</button>
          <button class="pill" onclick="filterCategory('rpg', this)">⚔️ RPG & Stats</button>
          <button class="pill" onclick="filterCategory('mining', this)">⛏️ Mining & World</button>
          <button class="pill" onclick="filterCategory('global', this)">🌐 Global Chat/Call</button>
          <button class="pill" onclick="filterCategory('social', this)">💬 Social & Fun</button>
        </div>
      </div>

      <div class="commands-grid" id="commandsContainer">

        <!-- Command Cards -->
        <div class="command-card" data-category="casino">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/luckybox</span>
              <span class="cmd-badge">Casino</span>
            </div>
            <div class="cmd-desc">Open a mystery Lucky Box to win 2X, 3X, or 5X Jackpot cash! (45% Lose, 15% Break Even, 25% 2X, 12% 3X, 3% 5X).</div>
          </div>
          <div class="cmd-usage">xopenbox 100 • /luckybox amount:100</div>
        </div>

        <div class="command-card" data-category="global">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/globalcall</span>
              <span class="cmd-badge">Global</span>
            </div>
            <div class="cmd-desc">Connect two Discord servers in a live 1-on-1 hotline phone call with an interactive 📵 End Call button ($100 fee + $10/min rate).</div>
          </div>
          <div class="cmd-usage">xcall start • /globalcall hangup</div>
        </div>

        <div class="command-card" data-category="global">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/globalprivatecall</span>
              <span class="cmd-badge">Global</span>
            </div>
            <div class="cmd-desc">Connect two users in a 1-on-1 private hotline call directly in Riya Bot DMs with live DM message relaying.</div>
          </div>
          <div class="cmd-usage">xprivatecall • xprivhangup</div>
        </div>

        <div class="command-card" data-category="global">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/setup_global</span>
              <span class="cmd-badge">Global</span>
            </div>
            <div class="cmd-desc">Designate a text channel on your server to act as an inter-server Global Chat room.</div>
          </div>
          <div class="cmd-usage">xsetup_global setchannel</div>
        </div>

        <div class="command-card" data-category="banking">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/bank</span>
              <span class="cmd-badge">Banking</span>
            </div>
            <div class="cmd-desc">View visual metallic PNG bank card with custom automatic signature generation (e.g. H.VAGHELA).</div>
          </div>
          <div class="cmd-usage">xbank • /bank user:@Hansraj</div>
        </div>

        <div class="command-card" data-category="banking">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/globalbankbalance</span>
              <span class="cmd-badge">Banking</span>
            </div>
            <div class="cmd-desc">View Top 10 wealth leaderboard with tiered reward perks (+2.0% to +0.05% extra income).</div>
          </div>
          <div class="cmd-usage">xglobalbank • /globalbankbalance</div>
        </div>

        <div class="command-card" data-category="banking">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/deposit</span>
              <span class="cmd-badge">Banking</span>
            </div>
            <div class="cmd-desc">Deposit wallet cash into bank vault protection. Supports all, max, 100% keywords.</div>
          </div>
          <div class="cmd-usage">xdep all • /deposit amount:1000</div>
        </div>

        <div class="command-card" data-category="banking">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/withdraw</span>
              <span class="cmd-badge">Banking</span>
            </div>
            <div class="cmd-desc">Withdraw bank cash into wallet. Supports all, max, 100% keywords.</div>
          </div>
          <div class="cmd-usage">xwith max • /withdraw amount:500</div>
        </div>

        <div class="command-card" data-category="mining">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/mine</span>
              <span class="cmd-badge">Mining</span>
            </div>
            <div class="cmd-desc">Interactive 4x5 rock button grid (20 rocks). Mine ores or click Leave Mine to cash out before a collapse!</div>
          </div>
          <div class="cmd-usage">xmine • /mine</div>
        </div>

        <div class="command-card" data-category="banking">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/market</span>
              <span class="cmd-badge">Economy</span>
            </div>
            <div class="cmd-desc">Marketplace store with Buy Everything and Sell Everything features.</div>
          </div>
          <div class="cmd-usage">xstore • xbuyall • xsellall</div>
        </div>

        <div class="command-card" data-category="anime">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/card_drop</span>
              <span class="cmd-badge">Anime Cards</span>
            </div>
            <div class="cmd-desc">Drop 4 Karuta-style anime collection cards with interactive 1️⃣ 2️⃣ 3️⃣ 4️⃣ grab buttons.</div>
          </div>
          <div class="cmd-usage">xcard_drop • xdrop</div>
        </div>

        <div class="command-card" data-category="anime">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/card_view</span>
              <span class="cmd-badge">Anime Cards</span>
            </div>
            <div class="cmd-desc">Inspect high-resolution card details (character, print #, condition, star rating).</div>
          </div>
          <div class="cmd-usage">xv <code> • /card_view code:v18v</div>
        </div>

        <div class="command-card" data-category="anime">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/card_trade</span>
              <span class="cmd-badge">Anime Cards</span>
            </div>
            <div class="cmd-desc">Trade anime cards card-for-card with interactive Accept/Decline button UI.</div>
          </div>
          <div class="cmd-usage">xtrade @User codeA codeB</div>
        </div>

        <div class="command-card" data-category="casino">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/blackjack</span>
              <span class="cmd-badge">Casino</span>
            </div>
            <div class="cmd-desc">Play 21 Blackjack vs Riya the Dealer with Hit / Stand button controls.</div>
          </div>
          <div class="cmd-usage">xbj 1000 • /blackjack bet:1000</div>
        </div>

        <div class="command-card" data-category="casino">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/mines</span>
              <span class="cmd-badge">Casino</span>
            </div>
            <div class="cmd-desc">Interactive 5x5 Minefield grid. Uncover gems to raise multiplier or hit a bomb!</div>
          </div>
          <div class="cmd-usage">xmines 500 • /mines bet:500</div>
        </div>

        <div class="command-card" data-category="social">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/ship</span>
              <span class="cmd-badge">Social</span>
            </div>
            <div class="cmd-desc">Calculate love compatibility with high-res Canvas graphics & interactive Pair buttons.</div>
          </div>
          <div class="cmd-usage">xship @User • /ship user:@Target</div>
        </div>

        <div class="command-card" data-category="rpg">
          <div>
            <div class="cmd-header">
              <span class="cmd-name">/rob</span>
              <span class="cmd-badge">RPG</span>
            </div>
            <div class="cmd-desc">Attempt to rob cash from another player's wallet (50% fine on failure!). Bank cash cannot be robbed.</div>
          </div>
          <div class="cmd-usage">xrob @User • /rob user:@Target</div>
        </div>

      </div>
    </section>

  </div>

  <!-- Server Configuration Modal -->
  <div id="configModal" style="display: none; position: fixed; inset: 0; z-index: 1000; background: rgba(11, 3, 20, 0.85); backdrop-filter: blur(12px); justify-content: center; align-items: center; padding: 1.5rem;">
    <div style="background: var(--bg-dark); border: 1px solid var(--border-card); border-radius: 24px; padding: 2rem; max-width: 600px; width: 100%; box-shadow: 0 10px 40px rgba(255, 20, 147, 0.3); max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-card); padding-bottom: 1rem;">
        <h2 id="modalServerTitle" style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">⚙️ Configure Server</h2>
        <button onclick="closeConfigModal()" style="background: none; border: none; color: var(--text-muted); font-size: 1.8rem; cursor: pointer;">&times;</button>
      </div>

      <form id="configForm" onsubmit="saveServerConfig(event)">
        <input type="hidden" id="modalGuildId" name="guildId">

        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--pink-primary);">Command Prefix</label>
          <input type="text" id="cfgPrefix" placeholder="e.g. x, !, ?, ." style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(25, 10, 45, 0.9); border: 1px solid var(--border-card); color: #fff; font-family: 'JetBrains Mono', monospace;">
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--pink-primary);">AI Girlfriend Persona & Tone</label>
          <select id="cfgPersona" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(25, 10, 45, 0.9); border: 1px solid var(--border-card); color: #fff;">
            <option value="amdavadi">☕ Amdavadi Sweet Girlfriend (Default)</option>
            <option value="flirty">💖 Flirty & Romantic Girlfriend</option>
            <option value="tsundere">💢 Tsundere Anime Companion</option>
            <option value="wholesome">🌟 Wholesome Support Bestie</option>
          </select>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--pink-primary);">Global Cross-Server Chat Channel ID</label>
          <input type="text" id="cfgGlobalChat" placeholder="e.g. 123456789012345678" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(25, 10, 45, 0.9); border: 1px solid var(--border-card); color: #fff; font-family: 'JetBrains Mono', monospace;">
          <small style="color: var(--text-muted); font-size: 0.8rem;">Text channel ID where global messages will be relayed live across servers.</small>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--pink-primary);">Counting Minigame Channel ID</label>
          <input type="text" id="cfgCounting" placeholder="e.g. 987654321098765432" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(25, 10, 45, 0.9); border: 1px solid var(--border-card); color: #fff; font-family: 'JetBrains Mono', monospace;">
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--pink-primary);">Bot System Language</label>
          <select id="cfgLanguage" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(25, 10, 45, 0.9); border: 1px solid var(--border-card); color: #fff;">
            <option value="en">English (en)</option>
            <option value="gu">Gujarati (gu)</option>
            <option value="hi">Hindi (hi)</option>
          </select>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button type="button" onclick="closeConfigModal()" style="padding: 0.75rem 1.5rem; border-radius: 12px; background: rgba(255, 255, 255, 0.1); color: #fff; border: none; cursor: pointer;">Cancel</button>
          <button type="submit" class="btn-invite" style="padding: 0.75rem 1.5rem; border: none; cursor: pointer;">💾 Save Configuration</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <p>© 2026 Riya AI Bot • Built with Node.js & Discord.js • All Rights Reserved</p>
  </footer>

  <script>
    window.CLIENT_ID = '${clientId}';

    function filterCategory(cat, btn) {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      const cards = document.querySelectorAll('.command-card');
      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function filterCommands() {
      const query = document.getElementById('cmdSearch').value.toLowerCase().trim();
      const cards = document.querySelectorAll('.command-card');

      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    async function openConfigModal(guildId, serverName) {
      document.getElementById('modalGuildId').value = guildId;
      document.getElementById('modalServerTitle').innerText = '⚙️ Configure ' + serverName;
      document.getElementById('configModal').style.display = 'flex';

      try {
        const res = await fetch('/api/guilds/' + guildId + '/config');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('cfgPrefix').value = data.prefix || 'x';
          document.getElementById('cfgPersona').value = data.aiPersona || 'amdavadi';
          document.getElementById('cfgGlobalChat').value = data.globalChatChannelId || '';
          document.getElementById('cfgCounting').value = data.countingChannelId || '';
          document.getElementById('cfgLanguage').value = data.language || 'en';
        }
      } catch(e) { console.error('Error loading config:', e); }
    }

    function closeConfigModal() {
      document.getElementById('configModal').style.display = 'none';
    }

    async function saveServerConfig(event) {
      event.preventDefault();
      const guildId = document.getElementById('modalGuildId').value;
      const payload = {
        prefix: document.getElementById('cfgPrefix').value.trim(),
        aiPersona: document.getElementById('cfgPersona').value,
        globalChatChannelId: document.getElementById('cfgGlobalChat').value.trim() || null,
        countingChannelId: document.getElementById('cfgCounting').value.trim() || null,
        language: document.getElementById('cfgLanguage').value
      };

      try {
        const res = await fetch('/api/guilds/' + guildId + '/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('✅ Server configuration saved successfully!');
          closeConfigModal();
        } else {
          alert('❌ Failed to save configuration.');
        }
      } catch(e) {
        alert('❌ Error saving configuration: ' + e.message);
      }
    }

    async function initDiscordOAuth() {
      let token = null;
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        token = params.get('access_token');
        if (token) {
          localStorage.setItem('discord_access_token', token);
          history.replaceState(null, '', window.location.pathname);
        }
      }

      if (!token) {
        token = localStorage.getItem('discord_access_token');
      }

      if (!token) return;

      try {
        const userRes = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (userRes.status === 401) {
          localStorage.removeItem('discord_access_token');
          return;
        }

        if (!userRes.ok) return;

        const user = await userRes.json();
        const displayName = user.global_name || user.username || 'Authorized User';
        const avatarUrl = user.avatar 
          ? 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png'
          : 'https://cdn-icons-png.flaticon.com/512/3059/3059502.png';

        const greetingEl = document.getElementById('userGreetingName');
        if (greetingEl) greetingEl.innerText = displayName;

        const profileCardEl = document.getElementById('userProfileCard');
        if (profileCardEl) {
          profileCardEl.className = 'user-profile-card';
          profileCardEl.style.borderColor = '#00FF7F';
          profileCardEl.style.background = 'linear-gradient(135deg, rgba(0, 255, 127, 0.15), rgba(88, 101, 242, 0.15))';
          profileCardEl.innerHTML = '<div class="user-info">' +
            '<img src="' + avatarUrl + '" alt="' + displayName + '" class="user-avatar" style="border-color: #00FF7F;">' +
            '<div class="user-details">' +
              '<h3 style="color: #00FF7F;">✅ Connected as ' + displayName + '</h3>' +
              '<p style="color: var(--text-muted); font-size: 0.9rem;">Discord ID: ' + user.id + ' • Authorized for Dashboard Management</p>' +
            '</div>' +
          '</div>' +
          '<div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">' +
            '<span class="btn-connect" style="background: #00FF7F; color: #0B0314;">' +
              '✓ Connected' +
            '</span>' +
            '<button onclick="logoutDiscord()" class="btn-connect" style="background: rgba(255, 75, 75, 0.25); border: 1px solid #FF4B4B; color: #FF4B4B; cursor: pointer;">' +
              '🚪 Logout' +
            '</button>' +
          '</div>';
        }

        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!guildsRes.ok) return;

        const guilds = await guildsRes.json();
        const adminGuilds = guilds.filter(function(g) {
          const perms = BigInt(g.permissions || '0');
          const isAdmin = (perms & 0x8n) === 0x8n;
          const isManageGuild = (perms & 0x20n) === 0x20n;
          return g.owner || isAdmin || isManageGuild;
        });

        renderServerPickerGrid(adminGuilds);

      } catch(e) {
        console.error('Error in initDiscordOAuth:', e);
      }
    }

    function renderServerPickerGrid(guilds) {
      const grid = document.getElementById('serverGrid');
      if (!grid) return;

      const clientId = window.CLIENT_ID || '1479052475368607926';
      const inviteUrl = 'https://discord.com/oauth2/authorize?client_id=' + clientId + '&permissions=51200&integration_type=0&scope=bot+applications.commands';

      let html = '';

      if (guilds && guilds.length > 0) {
        html = guilds.map(function(g) {
          const iconUrl = g.icon 
            ? 'https://cdn.discordapp.com/icons/' + g.id + '/' + g.icon + '.' + (g.icon.startsWith('a_') ? 'gif' : 'png')
            : null;
          
          const safeName = g.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
          const initials = g.name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 3).toUpperCase();

          const iconContent = iconUrl 
            ? '<img src="' + iconUrl + '" alt="' + safeName + '" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">'
            : '<div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #FF1493, #9B51E0); display: flex; justify-content: center; align-items: center; color: #fff; font-weight: 800; font-size: 1.2rem;">' + initials + '</div>';

          return '<div class="server-picker-item" onclick="openConfigModal(\'' + g.id + '\', \'' + safeName + '\')" style="display: flex; flex-direction: column; align-items: center; width: 95px; cursor: pointer; transition: transform 0.2s ease;">' +
            '<div class="picker-icon-ring" style="position: relative; width: 72px; height: 72px; border-radius: 50%; border: 3px solid #00FF7F; box-shadow: 0 0 16px rgba(0, 255, 127, 0.6); padding: 2px; background: rgba(0, 255, 127, 0.1); margin-bottom: 0.6rem; transition: all 0.2s ease;">' +
              iconContent +
            '</div>' +
            '<span style="font-size: 0.78rem; font-weight: 600; color: #E2D9F3; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;" title="' + safeName + '">' +
              g.name +
            '</span>' +
          '</div>';
        }).join('');
      }

      html += '<div class="server-picker-item" onclick="window.open(\'' + inviteUrl + '\', \'_blank\')" style="display: flex; flex-direction: column; align-items: center; width: 95px; cursor: pointer; opacity: 0.85; transition: opacity 0.2s ease;">' +
        '<div class="picker-icon-ring" style="position: relative; width: 72px; height: 72px; border-radius: 50%; border: 3px dashed rgba(255, 20, 147, 0.6); padding: 2px; margin-bottom: 0.6rem; display: flex; justify-content: center; align-items: center; background: rgba(255, 20, 147, 0.1); transition: all 0.2s ease;">' +
          '<span style="font-size: 2rem; color: #FF1493; font-weight: 700;">+</span>' +
        '</div>' +
        '<span style="font-size: 0.78rem; font-weight: 600; color: var(--pink-primary); text-align: center;">Add Server</span>' +
      '</div>';

      grid.innerHTML = html;
    }

    function logoutDiscord() {
      localStorage.removeItem('discord_access_token');
      window.location.href = '/';
    }

    function refreshServers() {
      initDiscordOAuth();
    }

    window.addEventListener('DOMContentLoaded', initDiscordOAuth);
  </script>
</body>
</html>`;
};
