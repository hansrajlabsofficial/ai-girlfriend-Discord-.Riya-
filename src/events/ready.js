import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { loadAllCommands } from '../utils/commandLoader.js';

export const name = 'ready';
export const once = true;

export const execute = async (client) => {
  logger.info(`Logged in successfully as ${client.user.tag}! Riya is ready to chat! 💕`);

  // 1. Instantly start rotating presence and status auto-updater
  try {
    const { start247StatusAutoUpdater } = await import('../services/statusService.js');
    start247StatusAutoUpdater(client);
  } catch (err) {
    logger.error('Failed to initialize 24/7 status auto updater service:', err);
  }

  // 2. Register slash commands asynchronously in background without blocking presence or responsiveness
  (async () => {
    try {
      const { commandsJSON } = await loadAllCommands();
      const rest = new REST({ version: '10' }).setToken(config.discordToken);

      logger.info(`Registering ${commandsJSON.length} global slash commands in background...`);
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandsJSON }
      );
      logger.info('Successfully registered global slash commands! ✨');
    } catch (error) {
      logger.warn(`Background slash command registration notice: ${error.message}`);
    }
  })();
};
