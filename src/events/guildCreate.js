import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export const name = 'guildCreate';

export const execute = async (guild) => {
  logger.info(`🎉 Riya was added to a new server: ${guild.name} (${guild.id})!`);

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    // Clear any per-guild command overrides so global commands take effect cleanly without double entries
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, guild.id),
      { body: [] }
    );
    logger.info(`✨ Ensured clean single command list for ${guild.name}!`);
  } catch (error) {
    logger.error(`Failed to clean guild commands for new guild ${guild.id}:`, error);
  }
};
