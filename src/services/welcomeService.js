import { EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

// In-memory cache to prevent duplicate welcome greetings (15-second debounce per member)
const welcomedMembersCache = new Map();
const DEBOUNCE_WINDOW_MS = 15000;

export const registerWelcomeDebounce = (guildId, memberId) => {
  if (guildId && memberId) {
    welcomedMembersCache.set(`${guildId}_${memberId}`, Date.now());
  }
};

/**
 * Master dispatcher to send welcome message on member join
 * Formats customized greeting string and dispatches single clean embed
 */
export const sendWelcomeMessage = async (member) => {
  if (!member || !member.guild) return false;

  // 🛡️ Debounce protection: Prevent duplicate greetings within 15 seconds
  const cacheKey = `${member.guild.id}_${member.id}`;
  const now = Date.now();
  if (welcomedMembersCache.has(cacheKey)) {
    const lastWelcomed = welcomedMembersCache.get(cacheKey);
    if (now - lastWelcomed < DEBOUNCE_WINDOW_MS) {
      logger.warn(`Duplicate welcome prevented for member ${member.id} in guild ${member.guild.id} (last sent ${Math.round((now - lastWelcomed) / 1000)}s ago)`);
      return false;
    }
  }
  welcomedMembersCache.set(cacheKey, now);

  // Periodically clean cache entries older than 5 minutes
  if (welcomedMembersCache.size > 500) {
    for (const [key, timestamp] of welcomedMembersCache.entries()) {
      if (now - timestamp > 300000) {
        welcomedMembersCache.delete(key);
      }
    }
  }

  const guildConfig = await getGuildConfig(member.guild.id);
  if (!guildConfig.welcomeChannelId || guildConfig.welcomeEnabled === false) {
    return false;
  }

  const channel = member.guild.channels.cache.get(guildConfig.welcomeChannelId);
  if (!channel || !channel.isTextBased()) {
    logger.warn(`Welcome channel ${guildConfig.welcomeChannelId} not found or not text-based.`);
    return false;
  }

  const botMember = member.guild.members.me || await member.guild.members.fetchMe().catch(() => null);
  const perms = channel.permissionsFor(botMember);
  if (!perms || !perms.has('SendMessages') || !perms.has('EmbedLinks')) {
    logger.warn(`Bot lacks SendMessages or EmbedLinks permission in welcome channel ${channel.id}`);
    return false;
  }

  try {
    const rawMsg = guildConfig.welcomeMessage || 'Welcome {user} to the {server} matrix!';
    const formattedMsg = rawMsg
      .replace(/{user}/g, member.toString())
      .replace(/{server}/g, member.guild.name)
      .replace(/{member_count}/g, member.guild.memberCount.toString());

    const accountAge = member.user?.createdAt ? member.user.createdAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) : 'Unknown';

    // 1. Single Clean Onboarding Embed (No second message, no extra invite links)
    const embed = new EmbedBuilder()
      .setTitle('✨ New Connection Established')
      .setDescription(formattedMsg)
      .setColor(0x9b59b6)
      .setThumbnail(member.user?.displayAvatarURL?.({ dynamic: true }) || null)
      .addFields(
        { name: 'Account Age Identity', value: accountAge, inline: true },
        { name: 'Guild Member Count', value: `\`${member.guild.memberCount}\` Total`, inline: true }
      )
      .setFooter({ text: `User ID: ${member.id}` })
      .setTimestamp();

    if (guildConfig.welcomeBannerUrl) {
      embed.setImage(guildConfig.welcomeBannerUrl);
    }

    await channel.send({ embeds: [embed] });
    logger.info(`Sent onboarding welcome greeting for member ${member.user?.tag || member.id} in guild ${member.guild.name}`);

    // 2. Direct Message Delivery (Only if specifically enabled in /welcome message send_dm: True)
    if (guildConfig.welcomeSendDm) {
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`✨ Welcome to ${member.guild.name}!`)
          .setDescription(formattedMsg)
          .setColor(0x9b59b6)
          .setThumbnail(member.guild.iconURL?.({ dynamic: true }) || member.user?.displayAvatarURL?.({ dynamic: true }) || null)
          .setFooter({ text: `Onboarding Portal • ${member.guild.name}` })
          .setTimestamp();

        if (guildConfig.welcomeBannerUrl) {
          dmEmbed.setImage(guildConfig.welcomeBannerUrl);
        }

        await member.send({ embeds: [dmEmbed] });
      } catch (dmErr) {
        logger.warn(`Could not send welcome DM to member ${member.id}: ${dmErr.message}`);
      }
    }

    return true;
  } catch (err) {
    logger.error(`Error sending welcome message in guild ${member.guild.id}: ${err.message}`);
    return false;
  }
};

/**
 * Handle interactive button clicks for legacy Welcome buttons if clicked
 */
export const handleWelcomeButton = async (interaction) => {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply({
      content: 'ℹ️ This button action is no longer active. Welcome settings are managed via `/welcome`.',
      ephemeral: true
    }).catch(() => {});
  }
};
