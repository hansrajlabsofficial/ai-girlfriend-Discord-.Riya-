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

  const oauthConnectUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds`;
  res.redirect(oauthConnectUrl);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/');
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/auth/callback`;

    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId || '',
        client_secret: process.env.CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const userRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userData = userRes.ok ? await userRes.json() : null;

      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const guildsData = guildsRes.ok ? await guildsRes.json() : [];

      const userAdminGuilds = guildsData.filter(g => {
        const perms = BigInt(g.permissions || '0');
        const isAdmin = (perms & 0x8n) === 0x8n;
        const isManageGuild = (perms & 0x20n) === 0x20n;
        return g.owner || isAdmin || isManageGuild;
      }).map(g => {
        return {
          id: g.id,
          name: g.name,
          icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn-icons-png.flaticon.com/512/2913/2913990.png',
          memberCount: 'Admin Authorized',
          botActive: true
        };
      });

      return res.status(200).send(getDashboardHtml(null, {
        connected: true,
        user: userData,
        username: userData?.global_name || userData?.username || 'Authorized Discord User',
        userGuilds: userAdminGuilds
      }));
    }
  } catch (err) {
    console.error('Error in Vercel OAuth callback:', err);
  }

  res.status(200).send(getDashboardHtml(null, { connected: true, code }));
});

app.get('/logout', (req, res) => {
  res.redirect('/');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

export default app;
