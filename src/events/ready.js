import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { loadAllCommands } from '../utils/commandLoader.js';

export const name = 'ready';
export const once = true;

export const execute = async (client) => {
  logger.info(`Logged in successfully as ${client.user.tag}! Riya is ready to chat! 💕`);

  const { commandsJSON } = await loadAllCommands();
  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    logger.info(`Cleanly registering ${commandsJSON.length} global slash commands...`);
    
    // 1. Register Global Application Commands (Single Source of Truth)
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandsJSON }
    );
    logger.info('Successfully registered all global slash commands cleanly! ✨');

    // 2. Clear any duplicate per-guild command overrides to eliminate double command list in Discord UI
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(config.clientId, guildId),
          { body: [] }
        );
        logger.info(`Cleared per-guild command duplicates for server: ${guild.name} (${guildId}) ✨`);
      } catch (gErr) {
        logger.error(`Failed to clear per-guild commands for guild ${guildId}:`, gErr);
      }
    }
  } catch (error) {
    logger.error('Failed to register slash commands:', error);
  }
};
