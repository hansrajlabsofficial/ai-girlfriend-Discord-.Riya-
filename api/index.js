import express from 'express';
import { config } from '../src/config.js';
import { getDashboardHtml } from '../src/web/dashboard.js';

import { getGuildConfig, saveGuildConfig } from '../src/database/models/GuildConfig.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  const clientId = config.clientId || '';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/auth/callback`;

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
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

export default app;
