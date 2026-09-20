import express from 'express';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config, validateConfig } from './config.js';
import { connectDatabase } from './database/connect.js';
import { logger } from './utils/logger.js';

import * as readyEvent from './events/ready.js';
import * as interactionCreateEvent from './events/interactionCreate.js';
import * as messageCreateEvent from './events/messageCreate.js';

import { getDashboardHtml } from './web/dashboard.js';

// Validate environment variables on startup
validateConfig();

// 1. Initialize Express Web Server & Dashboard for UptimeRobot, Render, & Discord OAuth2 Connect
const app = express();
const PORT = config.port;

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
  const clientId = config.clientId || '';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const redirectUri = `${protocol}://${host}/auth/callback`;

  const oauthConnectUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds%20bot%20applications.commands&permissions=51200&integration_type=0`;
  res.redirect(oauthConnectUrl);
});

app.get('/auth/callback', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/');
  }
  res.status(200).send(getDashboardHtml(client, { connected: true, code }));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date(), guilds: client?.guilds?.cache?.size || 0 });
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
