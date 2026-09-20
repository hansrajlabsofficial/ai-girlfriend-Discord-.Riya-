import { getAll247StatusChannels, getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';
import { buildStatusEmbed } from '../commands/status.js';
import { logger } from '../utils/logger.js';

let statusInterval = null;

export const start247StatusAutoUpdater = (client) => {
  if (statusInterval) clearInterval(statusInterval);

  logger.info('Starting 24/7 Live Status Channel Auto-Updater service...');

  const runUpdateCycle = async () => {
    try {
      const activeChannels = await getAll247StatusChannels();
      if (!activeChannels || activeChannels.length === 0) return;

      const statusData = buildStatusEmbed(client);

      for (const item of activeChannels) {
        const { guildId, channelId, messageId } = item;
        try {
          const channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
          if (!channel || !channel.isTextBased()) continue;

          let targetMsg = null;
          if (messageId) {
            targetMsg = await channel.messages.fetch(messageId).catch(() => null);
          }

          if (targetMsg) {
            await targetMsg.edit(statusData).catch(() => null);
          } else {
            const newMsg = await channel.send(statusData).catch(() => null);
            if (newMsg) {
              const guildConfig = await getGuildConfig(guildId);
              guildConfig.statusMessageId = newMsg.id;
              await saveGuildConfig(guildConfig);
            }
          }
        } catch (err) {
          logger.debug(`24/7 Status update failed for guild ${guildId}: ${err.message}`);
        }
      }
    } catch (e) {
      logger.warn(`Error in 24/7 status update cycle: ${e.message}`);
    }
  };

  runUpdateCycle();
  statusInterval = setInterval(runUpdateCycle, 30000);
};
