import express from 'express';
import { config } from '../src/config.js';
import { getDashboardHtml } from '../src/web/dashboard.js';

import { getGuildConfig, saveGuildConfig } from '../src/database/models/GuildConfig.js';
import { saveUserSessionData } from '../src/database/models/User.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/user/session', async (req, res) => {
  const { userId, username, accessToken, connectedServerCount, adminServerCount } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User Discord ID is required' });
  }

  try {
    const saved = await saveUserSessionData({
      userId,
      username,
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
  res.redirect('/');
});

app.get('/health', (req, res) => {
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
  res.status(200).json({
    status: 'online',
    uptime: uptimeSec,
    uptimeFormatted: uptimeStr,
    guilds: 12,
    commands: 85,
    timestamp: new Date()
  });
});

export default app;
