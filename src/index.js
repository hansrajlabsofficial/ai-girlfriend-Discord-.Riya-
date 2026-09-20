import express from 'express';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config, validateConfig } from './config.js';
import { connectDatabase } from './database/connect.js';
import { logger } from './utils/logger.js';

import * as readyEvent from './events/ready.js';
import * as interactionCreateEvent from './events/interactionCreate.js';
import * as messageCreateEvent from './events/messageCreate.js';

// Validate environment variables on startup
validateConfig();

// 1. Initialize Express Health Checker Web Server for UptimeRobot & Render
const app = express();
const PORT = config.port;

app.get('/', (req, res) => {
  res.status(200).send('Bot is alive');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

app.listen(PORT, () => {
  logger.info(`Express Health Checker server running on port ${PORT}. Ready for UptimeRobot pings at /`);
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
