import express from 'express';
import { config } from '../src/config.js';
import { getDashboardHtml } from '../src/web/dashboard.js';
import { getLoginHtml } from '../src/web/login.js';
import { getProfileHtml } from '../src/web/profile.js';

import { getGuildConfig, saveGuildConfig } from '../src/database/models/GuildConfig.js';
import { saveUserSessionData, getUserData, getAggregatedUserData } from '../src/database/models/User.js';
import { getRealBotGuilds } from '../src/services/guildService.js';
import { getRelationshipTitle } from '../src/services/rpgService.js';
import { generateUserSignature } from '../src/services/economyService.js';

import { connectDatabase } from '../src/database/connect.js';

const app = express();
connectDatabase().catch(err => console.error('Database connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/guilds', async (req, res) => {
  try {
    const realGuilds = await getRealBotGuilds();
    const guildsList = await Promise.all(realGuilds.map(async (g) => {
      const guildConfig = await getGuildConfig(g.id);
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        config: guildConfig
      };
    }));
    res.status(200).json({ guilds: guildsList, count: guildsList.length });
  } catch (err) {
    res.status(500).json({ error: err.message, guilds: [] });
  }
});

app.get('/api/user/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const userDoc = await getAggregatedUserData(userId);
    const level = userDoc.level || 1;
    const title = getRelationshipTitle(level);
    const sig = generateUserSignature({ displayName: userDoc.username || 'Member', username: userDoc.username });
    res.status(200).json({
      userId: userId,
      bank: userDoc.bank || 0,
      balance: userDoc.balance !== undefined ? userDoc.balance : 10000,
      level: level,
      xp: userDoc.xp || 0,
      title: title,
      isDailyPartner: userDoc.isDailyPartner || false,
      partnerId: userDoc.partnerId || null,
      signature: sig
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/session', async (req, res) => {
  const { userId, username, displayName, avatar, banner, accentColor, accessToken, connectedServerCount, adminServerCount } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User Discord ID is required' });
  }

  try {
    const saved = await saveUserSessionData({
      userId,
      username,
      displayName,
      avatar,
      banner,
      accentColor,
      accessToken,
      connectedServerCount,
      adminServerCount
    });
    res.status(200).json({ success: true, session: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/guilds/:guildId/config', async (req, res) => {
  const { guildId } = req.params;
  const guildConfig = await getGuildConfig(guildId);
  res.status(200).json(guildConfig);
});

app.post('/api/guilds/:guildId/config', async (req, res) => {
  const { guildId } = req.params;
  const { prefix, aiPersona, globalChatChannelId, countingChannelId, language, boundChannelId } = req.body;

  const guildConfig = await getGuildConfig(guildId);
  if (prefix !== undefined) guildConfig.prefix = prefix;
  if (aiPersona !== undefined) guildConfig.aiPersona = aiPersona;
  if (globalChatChannelId !== undefined) guildConfig.globalChatChannelId = globalChatChannelId;
  if (countingChannelId !== undefined) guildConfig.countingChannelId = countingChannelId;
  if (language !== undefined) guildConfig.language = language;
  if (boundChannelId !== undefined) guildConfig.boundChannelId = boundChannelId;

  await saveGuildConfig(guildConfig);
  res.status(200).json({ success: true, config: guildConfig });
});

app.get('/', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/login', (req, res) => {
  res.status(200).send(getLoginHtml());
});

app.get('/profile', (req, res) => {
  res.status(200).send(getProfileHtml());
});

app.get('/dashboard', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/guide', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/commands', (req, res) => {
  res.status(200).send(getDashboardHtml(null));
});

app.get('/connect', (req, res) => {
  const clientId = config.clientId || '1479052475368607926';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'riya-ai-girlfriend-discord-bot-full.vercel.app';
  const redirectUri = process.env.REDIRECT_URI || `${protocol}://${host}/auth/callback`;

  const oauthConnectUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20guilds`;
  res.redirect(oauthConnectUrl);
});

app.get('/auth/callback', (req, res) => {
  res.status(200).send(getDashboardHtml(null, { connected: true }));
});

app.get('/logout', (req, res) => {
  res.status(200).send(`<!DOCTYPE html><html><head><script>
    ['discord_access_token', 'discord_auth', 'discord_user_cache', 'discord_user_details', 'discord_user_id', 'discord_user_name', 'discord_username', 'discord_user_avatar', 'discord_user_bank', 'discord_user_balance', 'discord_user_level', 'discord_user_xp', 'discord_user_title', 'discord_user_signature', 'pre_login_redirect', 'skip_login'].forEach(function(k) {
      localStorage.removeItem(k);
    });
    window.location.href = '/';
  </script></head><body>Logging out...</body></html>`);
});

app.get('/health', async (req, res) => {
  const uptimeSec = Math.floor(process.uptime() || 0);
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = Math.floor(uptimeSec % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  const uptimeStr = parts.join(' ');
  const realGuilds = await getRealBotGuilds();
  const guildCount = realGuilds && realGuilds.length > 0 ? realGuilds.length : 12;

  res.status(200).json({
    status: 'online',
    uptime: uptimeSec,
    uptimeFormatted: uptimeStr,
    guilds: guildCount,
    commands: 85,
    timestamp: new Date()
  });
});

export default app;
