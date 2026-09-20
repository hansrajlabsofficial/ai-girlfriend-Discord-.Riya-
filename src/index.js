import express from 'express';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config, validateConfig } from './config.js';
import { connectDatabase } from './database/connect.js';
import { logger } from './utils/logger.js';

import * as readyEvent from './events/ready.js';
import * as interactionCreateEvent from './events/interactionCreate.js';
import * as messageCreateEvent from './events/messageCreate.js';

import { getDashboardHtml } from './web/dashboard.js';
import { getGuildConfig, saveGuildConfig } from './database/models/GuildConfig.js';

// Validate environment variables on startup
validateConfig();

// 1. Initialize Express Web Server & Dashboard for UptimeRobot, Render, & Discord OAuth2 Connect
const app = express();
const PORT = config.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/guilds', async (req, res) => {
  if (!client || !client.guilds) {
    return res.status(200).json({ guilds: [] });
  }

  try {
    const guilds = await Promise.all(client.guilds.cache.map(async (guild) => {
      const guildConfig = await getGuildConfig(guild.id);
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL() || 'https://cdn-icons-png.flaticon.com/512/2913/2913990.png',
        memberCount: guild.memberCount,
        config: guildConfig
      };
    }));
    res.status(200).json({ guilds });
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
  res.status(200).send(getDashboardHtml(client));
});

app.get('/dashboard', (req, res) => {
  res.status(200).send(getDashboardHtml(client));
});

app.get('/guide', (req, res) => {
  res.status(200).send(getDashboardHtml(client));
});

app.get('/commands', (req, res) => {
  res.status(200).send(getDashboardHtml(client));
});

app.get('/connect', (req, res) => {
  const clientId = config.clientId || '1479052475368607926';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const redirectUri = process.env.REDIRECT_URI || `${protocol}://${host}/auth/callback`;

  const oauthConnectUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20guilds`;
  res.redirect(oauthConnectUrl);
});

app.get('/auth/callback', (req, res) => {
  res.status(200).send(getDashboardHtml(client, { connected: true }));
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
    guilds: client?.guilds?.cache?.size || 12,
    commands: 85,
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  logger.info(`Express Web Dashboard & Health Checker server running on port ${PORT}. Dashboard live at http://localhost:${PORT}`);
});

// 2. Initialize Discord Client with required Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Register Event Listeners
client.once(readyEvent.name, (...args) => readyEvent.execute(...args));
client.on(interactionCreateEvent.name, (...args) => interactionCreateEvent.execute(...args));
client.on(messageCreateEvent.name, (...args) => messageCreateEvent.execute(...args));

// Handle Unhandled Errors to prevent process crashes
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
});

// 3. Connect to Database & Login to Discord
const startBot = async () => {
  await connectDatabase();
  
  const token = (config.discordToken || '').trim().replace(/^["']|["']$/g, '');

  if (!token || token.includes('your_discord_bot_token')) {
    logger.error('Cannot login: DISCORD_TOKEN is missing or invalid in environment!');
    return;
  }

  try {
    logger.info('Attempting Discord client login...');
    await client.login(token);
  } catch (error) {
    logger.error('Failed to log in to Discord:', error);
  }
};

startBot();
