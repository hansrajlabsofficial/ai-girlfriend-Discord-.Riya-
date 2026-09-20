import { EmbedBuilder } from 'discord.js';
import { getGuildConfig, getAllGlobalChatChannels } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

// Cooldown tracker to prevent spam rate-limit hits (3 seconds per user)
const userCooldowns = new Map();
const COOLDOWN_MS = 3000;

// Simple blacklisted users / server IDs for moderation
const BLACKLISTED_USERS = new Set();
const BLACKLISTED_GUILDS = new Set();

export const handleGlobalChatBroadcast = async (message) => {
  try {
    // 1. Filter out bot messages, DMs, or empty messages without attachments
    if (message.author.bot || !message.guild || (!message.content && message.attachments.size === 0)) {
      return false;
    }

    // 2. Check Blacklists
    if (BLACKLISTED_USERS.has(message.author.id) || BLACKLISTED_GUILDS.has(message.guild.id)) {
      return false;
    }

    // 3. Verify if message was sent in the guild's designated Global Chat channel
    const guildConfig = await getGuildConfig(message.guild.id);
    if (!guildConfig.globalChatChannelId || guildConfig.globalChatChannelId !== message.channel.id) {
      return false;
    }

    // 4. Rate Limiting Check (3 seconds per user)
    const now = Date.now();
    const lastTime = userCooldowns.get(message.author.id) || 0;
    if (now - lastTime < COOLDOWN_MS) {
      const waitSec = ((COOLDOWN_MS - (now - lastTime)) / 1000).toFixed(1);
      message.reply({
        content: `⏳ **Global Chat Cooldown!** Please wait **${waitSec}s** before sending another global message!`,
        ephemeral: true
      }).catch(() => {});
      return true;
    }
    userCooldowns.set(message.author.id, now);

    // 5. Construct Rich Broadcast Embed
    const embed = new EmbedBuilder()
      .setColor('#FF1493')
      .setAuthor({
        name: `${message.author.username} (${message.author.tag})`,
        iconURL: message.author.displayAvatarURL({ extension: 'png', size: 128 })
      })
      .setTitle(`🌐 Global Chat Broadcast`)
      .setDescription(message.content || '*[Media Attachment]*')
      .setFooter({
        text: `Server: ${message.guild.name} • Server ID: ${message.guild.id}`,
        iconURL: message.guild.iconURL({ extension: 'png', size: 64 }) || undefined
      })
      .setTimestamp();

    // Attach image if sent in message
    const imageAttachment = message.attachments.find(a => a.contentType?.startsWith('image/'));
    if (imageAttachment) {
      embed.setImage(imageAttachment.url);
    }

    // 6. Fast Parallel Broadcast Across All Registered Global Channels
    const allChannels = await getAllGlobalChatChannels();
    if (allChannels.length === 0) return true;

    // React to origin message to confirm broadcast
    message.react('🌐').catch(() => {});

    // Broadcast asynchronously in parallel using Promise.allSettled to eliminate API lag
    const sendPromises = allChannels
      .filter(({ channelId }) => channelId !== message.channel.id)
      .map(async ({ channelId }) => {
        try {
          const targetChannel = message.client.channels.cache.get(channelId) ||
            await message.client.channels.fetch(channelId).catch(() => null);

          if (targetChannel && typeof targetChannel.send === 'function') {
            await targetChannel.send({ embeds: [embed] });
          }
        } catch (sendErr) {
          logger.warn(`Failed to relay global message to channel ${channelId}: ${sendErr.message}`);
        }
      });

    await Promise.allSettled(sendPromises);
    return true;

  } catch (error) {
    logger.error('Error handling global chat broadcast:', error);
    return false;
  }
};
