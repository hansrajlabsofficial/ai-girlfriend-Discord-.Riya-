import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('setup_global')
  .setDescription('Set or remove the designated Global Chat room for inter-server messaging')
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('The text channel to use as Global Chat room')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

export const execute = async (interaction) => {
  try {
    // Administrator permissions check
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ **Administrator Permission Required!** Only server admins can configure the Global Chat room.',
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const guildConfig = await getGuildConfig(interaction.guildId);

    // If channel is already set to targetChannel, toggle/unbind it
    if (guildConfig.globalChatChannelId === targetChannel.id && !interaction.options.getChannel('channel')) {
      guildConfig.globalChatChannelId = null;
      await saveGuildConfig(guildConfig);

      const unbindEmbed = new EmbedBuilder()
        .setColor('#FF4500')
        .setTitle('🌐 Global Chat Channel Removed')
        .setDescription(`✅ Successfully removed Global Chat binding for <#${targetChannel.id}>.`);

      return await interaction.reply({ embeds: [unbindEmbed] });
    }

    // Set new Global Chat channel
    guildConfig.globalChatChannelId = targetChannel.id;
    await saveGuildConfig(guildConfig);

    const embed = new EmbedBuilder()
      .setColor('#00FF7F')
      .setTitle('🌐 Global Chat Channel Bound Successfully!')
      .setDescription(
        `✅ Successfully designated <#${targetChannel.id}> as this server's official **Global Chat** room!\n\n` +
        `💬 **How it works:**\n` +
        `• Any message sent in <#${targetChannel.id}> will instantly broadcast to all linked Discord servers globally!\n` +
        `• Images, text, and user avatars are automatically formatted in a clean broadcast embed.\n` +
        `• 3-second spam rate limiting protection is active.`
      )
      .setFooter({ text: 'Riya Global Inter-Server Network ☕✨' });

    return await interaction.reply({ embeds: [embed] });

  } catch (error) {
    logger.error('Error executing /setup_global command:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Failed to configure Global Chat room.', ephemeral: true }).catch(() => {});
    }
  }
};
