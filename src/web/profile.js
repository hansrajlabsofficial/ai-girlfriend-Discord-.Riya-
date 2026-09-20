import { config } from '../config.js';

export const getProfileHtml = (client = null) => {
  const clientId = config.clientId || '1479052475368607926';
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=51200&integration_type=0&scope=bot+applications.commands+guilds.join+gdm.join`;
  const oauthConnectUrl = `/connect`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Profile • Riya AI Bot Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Georgia:ital,wght@1,700&display=swap" rel="stylesheet">
  
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
      try { getAnalytics(app); } catch(e) {}
    }
  </script>

  <style>
    :root {
      --bg-dark: #0B0314;
      --bg-card: rgba(25, 10, 45, 0.85);
      --border-card: rgba(255, 20, 147, 0.35);
      --pink-primary: #FF1493;
      --purple-accent: #9B51E0;
      --cyan-neon: #00F0FF;
      --emerald-green: #50FFB1;
      --gold-star: #FFD700;
      --discord-blue: #5865F2;
      --text-main: #FFFFFF;
      --text-muted: #B8B0C8;
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
      max-width: 1250px;
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

    /* Profile Main Container */
    .profile-container {
      max-width: 1200px;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
    }

    /* Banner Container */
    .profile-banner-wrapper {
      position: relative;
      width: 100%;
      height: 240px;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid var(--border-card);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
      background: linear-gradient(135deg, #1E0638, #3B0A45, #660F45);
    }

    .profile-banner-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(11, 3, 20, 0.9) 0%, transparent 60%);
    }

    /* Floating Avatar */
    .avatar-wrapper {
      position: absolute;
      bottom: -45px;
      left: 40px;
      z-index: 10;
    }

    .profile-avatar-img {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      border: 4px solid var(--pink-primary);
      box-shadow: 0 0 25px rgba(255, 20, 147, 0.7);
      object-fit: cover;
      background: #0B0314;
    }

    .status-badge {
      position: absolute;
      bottom: 8px;
      right: 6px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--emerald-green);
      border: 3px solid #0B0314;
      box-shadow: 0 0 10px var(--emerald-green);
    }

    /* User Header Info Card */
    .profile-header-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 0 0 24px 24px;
      padding: 4rem 2.5rem 2rem 2.5rem;
      margin-top: -30px;
      margin-bottom: 2.5rem;
      backdrop-filter: blur(20px);
      position: relative;
    }

    .user-name-title {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .name-block h1 {
      font-size: 2.2rem;
      font-weight: 800;
      color: #FFF;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .name-block p.username-tag {
      font-size: 1.1rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-top: 0.2rem;
    }

    .badges-row {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .badge-chip {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #E2D9F3;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .badge-chip.nitro {
      border-color: var(--pink-primary);
      color: var(--pink-primary);
      background: rgba(255, 20, 147, 0.15);
    }

    .badge-chip.partner {
      border-color: var(--gold-star);
      color: var(--gold-star);
      background: rgba(255, 215, 0, 0.15);
    }

    .badge-chip.verified {
      border-color: var(--cyan-neon);
      color: var(--cyan-neon);
      background: rgba(0, 240, 255, 0.15);
    }

    /* Action Buttons Row */
    .profile-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn-action {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #FFF;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      padding: 0.75rem 1.4rem;
      border-radius: 14px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.25s ease;
    }

    .btn-action:hover {
      background: rgba(255, 20, 147, 0.2);
      border-color: var(--pink-primary);
      transform: translateY(-2px);
    }

    .btn-action.primary {
      background: linear-gradient(135deg, var(--pink-primary), var(--purple-accent));
      border: none;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4);
    }

    .btn-action.primary:hover {
      box-shadow: 0 8px 25px rgba(255, 20, 147, 0.6);
    }

    /* Grid Layout for Stats Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.75rem;
      margin-bottom: 3rem;
    }

    .card-box {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 20px;
      padding: 1.75rem;
      backdrop-filter: blur(20px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    }

    .card-box h3.card-title {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .card-value {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 0.4rem;
    }

    .card-value.emerald {
      color: var(--emerald-green);
      text-shadow: 0 0 15px rgba(80, 255, 177, 0.4);
    }

    .card-value.pink {
      color: #FFB6C1;
    }

    .card-value.gold {
      color: var(--gold-star);
    }

    .card-subtext {
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    /* Progress Bar */
    .xp-progress-bar {
      width: 100%;
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
      margin: 1rem 0 0.5rem 0;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .xp-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--pink-primary), var(--cyan-neon));
      border-radius: 10px;
      transition: width 0.8s ease-in-out;
    }

    /* Signature Calligraphy Box */
    .signature-display-box {
      background: rgba(0, 0, 0, 0.4);
      border: 1.5px dashed var(--gold-star);
      border-radius: 14px;
      padding: 0.75rem 1.25rem;
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sig-text {
      font-family: 'Georgia', serif;
      font-style: italic;
      font-weight: 700;
      font-size: 1.4rem;
      color: var(--gold-star);
      letter-spacing: 1px;
    }

    /* Unauthenticated Login Prompt */
    .login-prompt-banner {
      background: linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(255, 20, 147, 0.2));
      border: 1px dashed rgba(88, 101, 242, 0.5);
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .login-prompt-banner h2 {
      font-size: 1.6rem;
      color: #5865F2;
      margin-bottom: 0.5rem;
    }

    .login-prompt-banner p {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }
  </style>
</head>
<body>

  <!-- Navigation Header -->
  <header>
    <div class="nav-container">
      <a href="/" class="brand">
        <img src="https://i.postimg.cc/63xkK4YM/HANSRAJ-AYAN-OFFICIAL-COMMUNITY-Global-Bank-discord-server.png" alt="Riya AI Logo">
        Riya AI Girlfriend
      </a>
      <nav class="nav-links">
        <a href="/">Home</a>
        <a href="/commands">Commands</a>
        <a href="/guide">Guide</a>
        <a href="/profile" class="active">👤 Profile</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/login" class="btn-connect">Connect Discord</a>
      </nav>
    </div>
  </header>

  <!-- Profile Main Content -->
  <main class="profile-container">

    <!-- Unauthenticated Banner (Hidden when logged in) -->
    <div id="unauthBanner" class="login-prompt-banner" style="display: none;">
      <h2>🔑 Connect Your Discord Account</h2>
      <p>Log in with Discord OAuth2 to view your real animated avatar, custom profile banner, bank vault savings, and affection card!</p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="${oauthConnectUrl}" class="btn-connect" style="padding: 0.85rem 1.75rem; font-size: 1rem;">Login with Discord OAuth2</a>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="text" id="manualUserId" placeholder="Or enter Discord User ID..." style="padding: 0.8rem 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #FFF; outline: none; width: 220px;">
          <button onclick="loadManualUserId()" class="btn-action">Inspect ID</button>
        </div>
      </div>
    </div>

    <!-- Banner & Header Section -->
    <div class="profile-banner-wrapper" id="bannerWrapper">
      <img id="profileBannerImg" src="" alt="User Banner" class="profile-banner-img" style="display: none;">
      <div class="banner-overlay"></div>
      
      <div class="avatar-wrapper">
        <img id="profileAvatarImg" src="https://cdn-icons-png.flaticon.com/512/3059/3059502.png" alt="User Avatar" class="profile-avatar-img">
        <div class="status-badge" title="Discord Online Status"></div>
      </div>
    </div>

    <!-- Header Info Box -->
    <div class="profile-header-card">
      <div class="user-name-title">
        <div class="name-block">
          <h1 id="userDisplayName">
            Loading Discord Profile...
          </h1>
          <p class="username-tag" id="userUsernameTag">@discord_user</p>

          <div class="badges-row" id="badgesRow">
            <span class="badge-chip verified">⚡ Discord Connected</span>
            <span class="badge-chip nitro">💎 Premium Member</span>
            <span class="badge-chip partner" id="partnerBadgeChip" style="display: none;">👑 Riya Partner</span>
          </div>
        </div>

        <div class="profile-actions">
          <button onclick="syncProfile()" class="btn-action primary">
            🔄 Sync Profile
          </button>
          <a href="/dashboard" class="btn-action">
            🌐 Server Picker
          </a>
          <button onclick="logoutDiscord()" class="btn-action" style="color: #FF4B4B; border-color: rgba(255, 75, 75, 0.4);">
            🚪 Disconnect
          </button>
        </div>
      </div>
    </div>

    <!-- Live Economy & RPG Stats Grid -->
    <div class="stats-grid">

      <!-- Bank Savings Vault -->
      <div class="card-box">
        <h3 class="card-title">🏦 Bank Savings Balance</h3>
        <div class="card-value emerald" id="bankSavingsVal">$0</div>
        <p class="card-subtext">Protected from robbery via <code style="color: var(--pink-primary);">/rob</code> command.</p>
      </div>

      <!-- Wallet Cash -->
      <div class="card-box">
        <h3 class="card-title">👛 Wallet Cash</h3>
        <div class="card-value pink" id="walletCashVal">$10,000</div>
        <p class="card-subtext">Liquid cash in pocket for shopping & gifts.</p>
      </div>

      <!-- Level & Relationship Title -->
      <div class="card-box">
        <h3 class="card-title">⭐ Level & Relationship Title</h3>
        <div class="card-value gold" id="levelTitleVal">Level 1 • Acquaintance</div>
        
        <div class="xp-progress-bar">
          <div class="xp-progress-fill" id="xpProgressFill" style="width: 15%;"></div>
        </div>
        <p class="card-subtext" id="xpTextSub">XP Progress: 0 / 100 XP</p>
      </div>

      <!-- Official Authorised Signature -->
      <div class="card-box">
        <h3 class="card-title">✒️ Official Banking Signature</h3>
        <p class="card-subtext">Cursive calligraphic signature string for banking certificates:</p>
        <div class="signature-display-box">
          <span class="sig-text" id="sigTextDisplay">H.VAGHELA</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Verified Card Holder</span>
        </div>
      </div>

    </div>

  </main>

  <!-- Client-Side OAuth & Profile Script -->
  <script>
    function formatMoney(amount) {
      return '$' + (amount || 0).toLocaleString('en-US');
    }

    function cleanCanvasText(str) {
      if (!str) return 'Valued Member';
      let norm = str.replace(/[\\u{1F1E6}-\\u{1F1FF}]/gu, ch => {
        const code = ch.codePointAt(0) - 0x1F1E6 + 65;
        return String.fromCharCode(code);
      }).normalize('NFKD');

      const smallCapsMap = {
        'ᴀ': 'A', 'ʙ': 'B', 'ᴄ': 'C', 'ᴅ': 'D', 'ᴇ': 'E', 'ꜰ': 'F', 'ɢ': 'G', 'ʜ': 'H', 'ɪ': 'I',
        'ᴊ': 'J', 'ᴋ': 'K', 'ʟ': 'L', 'ᴍ': 'M', 'ɴ': 'N', 'ᴏ': 'O', 'ᴘ': 'P', 'ǫ': 'Q', 'ʀ': 'R',
        'ꜱ': 'S', 'ᴛ': 'T', 'ᴜ': 'U', 'ᴠ': 'V', 'ᴡ': 'W', 'x': 'X', 'ʏ': 'Y', 'ᴢ': 'Z'
      };
      norm = norm.split('').map(ch => smallCapsMap[ch] || ch).join('');

      let cleaned = norm
        .replace(/[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{1F600}-\\u{1F64F}\\u{1F680}-\\u{1F6FF}\\u{2600}-\\u{27BF}\\u{2B50}]/gu, '')
        .replace(/[^\\x20-\\x7E\\u00C0-\\u024F]/g, '')
        .replace(/\\s+/g, ' ')
        .trim();

      if (cleaned && /^(?:[A-Za-z0-9]\\s+)+[A-Za-z0-9]$/.test(cleaned)) {
        cleaned = cleaned.replace(/\\s+/g, '');
      }

      return cleaned || 'Valued Member';
    }

    function generateSignature(displayName, username) {
      const raw = cleanCanvasText(displayName || username || 'HANSRAJ VAGHELA');
      const words = raw.split(/[\s._-]+/).filter(Boolean);
      if (words.length >= 2) {
        return words[0][0].toUpperCase() + '.' + words[words.length - 1].toUpperCase();
      } else if (words.length === 1) {
        const w = words[0].toUpperCase();
        return w.length > 1 ? w[0] + '.' + w : w + '.' + w;
      }
      return 'H.VAGHELA';
    }

    async function loadUserProfile() {
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

      if (!token) {
        document.getElementById('unauthBanner').style.display = 'block';
        loadFallbackProfile('118118716435');
        return;
      }

      try {
        const res = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.status === 401) {
          localStorage.removeItem('discord_access_token');
          document.getElementById('unauthBanner').style.display = 'block';
          loadFallbackProfile('118118716435');
          return;
        }

        if (!res.ok) return;

        const user = await res.json();
        renderUserData(user);

      } catch(err) {
        console.error('Error loading profile from Discord:', err);
      }
    }

    async function renderUserData(user) {
      const displayName = user.global_name || user.display_name || user.username || 'Discord Member';
      const username = '@' + (user.username || 'username');

      document.getElementById('userDisplayName').innerText = displayName;
      document.getElementById('userUsernameTag').innerText = username + ' • ID: ' + user.id;

      // Avatar Parsing (Supports GIF and PNG)
      let avatarUrl = 'https://cdn-icons-png.flaticon.com/512/3059/3059502.png';
      if (user.avatar) {
        const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
        avatarUrl = 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.' + ext + '?size=512';
      }
      document.getElementById('profileAvatarImg').src = avatarUrl;

      // Banner Parsing (Supports GIF, PNG, and Accent Gradient)
      const bannerWrapper = document.getElementById('bannerWrapper');
      const bannerImg = document.getElementById('profileBannerImg');

      if (user.banner) {
        const ext = user.banner.startsWith('a_') ? 'gif' : 'png';
        const bannerUrl = 'https://cdn.discordapp.com/banners/' + user.id + '/' + user.banner + '.' + ext + '?size=1024';
        bannerImg.src = bannerUrl;
        bannerImg.style.display = 'block';
      } else if (user.accent_color) {
        const hex = '#' + user.accent_color.toString(16).padStart(6, '0');
        bannerWrapper.style.background = 'linear-gradient(135deg, ' + hex + ', #1E0638)';
        bannerImg.style.display = 'none';
      } else {
        bannerWrapper.style.background = 'linear-gradient(135deg, #1E0638, #3B0A45, #660F45)';
        bannerImg.style.display = 'none';
      }

      // Generate Signature
      const sig = generateSignature(displayName, user.username);
      document.getElementById('sigTextDisplay').innerText = sig;

      // Fetch Bot Firestore Stats for User
      try {
        const statsRes = await fetch('/api/user/' + user.id + '/profile');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          document.getElementById('bankSavingsVal').innerText = formatMoney(stats.bank || 0);
          document.getElementById('walletCashVal').innerText = formatMoney(stats.balance !== undefined ? stats.balance : 10000);

          const lvl = stats.level || 1;
          const title = stats.title || 'Acquaintance';
          document.getElementById('levelTitleVal').innerText = 'Level ' + lvl + ' • ' + title;

          const xp = stats.xp || 0;
          const nextLvlXp = lvl * 200;
          const pct = Math.min(100, Math.floor((xp / nextLvlXp) * 100));
          document.getElementById('xpProgressFill').style.width = pct + '%';
          document.getElementById('xpTextSub').innerText = 'XP Progress: ' + xp + ' / ' + nextLvlXp + ' XP (' + pct + '%)';

          if (stats.signature) {
            document.getElementById('sigTextDisplay').innerText = stats.signature;
          }

          if (stats.isDailyPartner) {
            document.getElementById('partnerBadgeChip').style.display = 'inline-flex';
          }
        }
      } catch(e) {
        console.warn('Could not fetch bot Firestore stats:', e);
      }
    }

    function loadFallbackProfile(userId) {
      renderUserData({
        id: userId || '118118716435',
        username: 'hansraj1',
        global_name: 'A S H A N S R A J',
        avatar: null,
        banner: null
      });
    }

    function loadManualUserId() {
      const input = document.getElementById('manualUserId');
      if (input && input.value.trim()) {
        loadFallbackProfile(input.value.trim());
      }
    }

    function syncProfile() {
      loadUserProfile();
    }

    function logoutDiscord() {
      localStorage.removeItem('discord_access_token');
      window.location.href = '/login';
    }

    window.addEventListener('DOMContentLoaded', loadUserProfile);

    // Anti-DevTools Security Guard
    (function() {
      document.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
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
