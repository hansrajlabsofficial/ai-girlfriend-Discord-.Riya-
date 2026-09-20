import { config } from '../config.js';

export const getLoginHtml = () => {
  const clientId = config.clientId || '1479052475368607926';
  const oauthConnectUrl = `/connect`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login • Riya AI Bot Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0B0314;
      --bg-card: rgba(25, 10, 45, 0.85);
      --border-card: rgba(255, 20, 147, 0.35);
      --pink-primary: #FF1493;
      --purple-accent: #9B51E0;
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
      background: radial-gradient(circle at top right, #2C0845, #0B0314 60%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
    }

    .login-container {
      width: 100%;
      max-width: 480px;
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 24px;
      padding: 2.5rem 2rem;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 20, 147, 0.2);
      text-align: center;
      position: relative;
    }

    .bot-logo {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 3px solid var(--pink-primary);
      box-shadow: 0 0 20px rgba(255, 20, 147, 0.6);
      margin-bottom: 1.25rem;
      object-fit: cover;
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #FFF, #FF1493);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    p.subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 2rem;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .btn-discord {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: var(--discord-blue);
      color: #FFF;
      font-size: 1.05rem;
      font-weight: 700;
      padding: 0.9rem 1.5rem;
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.25s ease;
      box-shadow: 0 8px 24px rgba(88, 101, 242, 0.4);
    }

    .btn-discord:hover {
      background: #4752C4;
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(88, 101, 242, 0.6);
    }

    .btn-skip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #E2D9F3;
      font-size: 0.95rem;
      font-weight: 600;
      padding: 0.85rem 1.5rem;
      border-radius: 14px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn-skip:hover {
      background: rgba(255, 20, 147, 0.15);
      border-color: var(--pink-primary);
      color: #FFF;
      transform: translateY(-2px);
    }

    .features-list {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 1.5rem;
      display: flex;
      justify-content: space-around;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
    }

    .feature-icon {
      font-size: 1.3rem;
    }

    footer {
      margin-top: 2rem;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <div class="login-container">
    <img src="https://cdn-icons-png.flaticon.com/512/3081/3081840.png" alt="Riya AI Logo" class="bot-logo">
    <h1>Welcome to Riya AI Hub ☕💖</h1>
    <p class="subtitle">Log in with your Discord account to manage server bindings, customize global chat settings, and access full server controls.</p>

    <div class="action-buttons">
      <a href="${oauthConnectUrl}" class="btn-discord">
        <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="currentColor">
          <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0,3.36,6.83A97.68,97.68,0,0,0,42.29,6.83,72.37,72.37,0,0,0,45.65,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a74.71,74.71,0,0,0,64.3,0c.87.68,1.76,1.36,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c3.09-27.87-5.19-51.52-18.88-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.92,53.86,53,48.78,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.08-12.74,11.44-12.74S96.2,45.92,96.07,53,91,65.69,84.69,65.69Z"/>
        </svg>
        Connect with Discord
      </a>

      <button onclick="skipLogin()" class="btn-skip">
        ⚡ Skip Login & Continue as Guest
      </button>
    </div>

    <div class="features-list">
      <div class="feature-item">
        <span class="feature-icon">🌐</span>
        <span>Global Chat</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">📞</span>
        <span>Private Calls</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🎮</span>
        <span>85+ Commands</span>
      </div>
    </div>
  </div>

  <footer>
    © 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.
  </footer>

  <script>
    function skipLogin() {
      localStorage.setItem('skip_login', 'true');
      window.location.href = '/dashboard';
    }

    function clearAuthSession() {
      localStorage.removeItem('discord_access_token');
      localStorage.removeItem('discord_auth');
      localStorage.removeItem('discord_user_cache');
      localStorage.removeItem('pre_login_redirect');
      localStorage.removeItem('skip_login');
    }

    function checkExistingSession() {
      const token = localStorage.getItem('discord_access_token') || localStorage.getItem('discord_auth');
      if (!token) return;

      const cachedRaw = localStorage.getItem('discord_user_cache');
      let cachedUser = null;
      if (cachedRaw) {
        try { cachedUser = JSON.parse(cachedRaw); } catch(e) {}
      }

      const container = document.querySelector('.login-container');
      if (!container) return;

      const name = cachedUser ? (cachedUser.displayName || cachedUser.username) : 'Valued Member';
      const avatar = cachedUser ? (cachedUser.avatar || 'https://cdn-icons-png.flaticon.com/512/3059/3059502.png') : 'https://cdn-icons-png.flaticon.com/512/3059/3059502.png';

      container.innerHTML = '<img src="' + avatar + '" alt="User Avatar" class="bot-logo" style="border-color: #00FF7F; box-shadow: 0 0 20px rgba(0, 255, 127, 0.6);">' +
        '<h1 style="background: linear-gradient(135deg, #00FF7F, #00F0FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Welcome back, ' + name + '! ☕💖</h1>' +
        '<p class="subtitle" style="margin-bottom: 1.5rem;">You are already logged in with your Discord account.</p>' +
        '<div class="action-buttons">' +
          '<a href="/profile" class="btn-discord" style="background: linear-gradient(135deg, #00FF7F, #00F0FF); color: #0B0314;">' +
            '👤 Go to My Profile' +
          '</a>' +
          '<a href="/dashboard" class="btn-skip" style="background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.3); color: #FFF;">' +
            '📊 Go to Web Dashboard' +
          '</a>' +
          '<button onclick="clearAuthSession(); location.reload();" class="btn-skip" style="color: #FF4B4B; border-color: rgba(255, 75, 75, 0.4); background: rgba(255, 75, 75, 0.1);">' +
            '🚪 Switch Account / Logout' +
          '</button>' +
        '</div>' +
        '<div class="features-list">' +
          '<div class="feature-item"><span class="feature-icon">🌐</span><span>Global Chat</span></div>' +
          '<div class="feature-item"><span class="feature-icon">📞</span><span>Private Calls</span></div>' +
          '<div class="feature-item"><span class="feature-icon">🎮</span><span>85+ Commands</span></div>' +
        '</div>';
    }

    document.addEventListener('DOMContentLoaded', checkExistingSession);

    (function() {
      // 1. Disable Right Click Context Menu
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      });

      // 2. Disable DevTools & Inspect Keyboard Shortcuts
      document.addEventListener('keydown', function(e) {
        if (e.keyCode === 123) { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
          e.preventDefault(); return false;
        }
        if (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83)) {
          e.preventDefault(); return false;
        }
      });

      // 3. DevTools Open Detection & Auto-Hide
      var hidden = false;
      function hideDetails() {
        if (hidden) return;
        hidden = true;
        document.body.innerHTML = '<div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #0B0314; color: #FF1493; font-family: sans-serif; text-align: center; padding: 2rem;">' +
          '<h1 style="font-size: 2.2rem; margin-bottom: 1rem;">🔒 Security Protection Active</h1>' +
          '<p style="font-size: 1.1rem; color: #E2D9F3; max-width: 500px; line-height: 1.6;">Developer Tools access is restricted on Riya AI Portal for privacy and security protection. Please close developer tools to return.</p>' +
        '</div>';
      }

      function checkDevTools() {
        var widthDiff = window.outerWidth - window.innerWidth;
        var heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > 160 || heightDiff > 160) {
          hideDetails();
        }
      }

      window.addEventListener('resize', checkDevTools);
      setInterval(checkDevTools, 800);

      setInterval(function() {
        var start = performance.now();
        (function(){})['constructor']('debugger')();
        var end = performance.now();
        if (end - start > 100) {
          hideDetails();
        }
      }, 800);

      // 4. Suppress Console Inspections
      try {
        var noop = function() {};
        console.log = noop;
        console.warn = noop;
        console.error = noop;
        console.dir = noop;
        console.table = noop;
      } catch(err) {}
    })();
  </script>

</body>
</html>`;
};
