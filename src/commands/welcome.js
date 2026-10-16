import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Manage onboarding greetings and welcome configurations')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(sub =>
    sub
      .setName('channel')
      .setDescription('Configure the target channel where welcome messages will be posted')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Text channel to route user onboarding alerts')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('message')
      .setDescription('Configure customized greeting text pattern and DM settings')
      .addStringOption(opt =>
        opt
          .setName('text')
          .setDescription('Dynamic greeting text ({user}, {server}, {member_count})')
          .setRequired(true)
      )
      .addBooleanOption(opt =>
        opt
          .setName('send_dm')
          .setDescription('Should the welcome message also be sent directly to the user\'s DMs?')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('banner')
      .setDescription('Configure the image URL background design to showcase with the greeting')
      .addStringOption(opt =>
        opt
          .setName('image_url')
          .setDescription('A direct web URL to a JPEG/PNG welcome banner image')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('test')
      .setDescription('Dispatches a mockup greeting to test the current welcome configuration')
  );

export const execute = async (interaction) => {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ This command can only be used in a server!', ephemeral: true });
  }

  const subcommand = interaction.options.getSubcommand();
  const guildConfig = await getGuildConfig(interaction.guild.id);

  // --- 1. /welcome channel ---
  if (subcommand === 'channel') {
    const channel = interaction.options.getChannel('channel', true);
    guildConfig.welcomeChannelId = channel.id;
    guildConfig.welcomeEnabled = true;
    await saveGuildConfig(guildConfig);

    const embed = new EmbedBuilder()
      .setTitle('👋 Onboarding Channel Configured')
      .setDescription(`Welcome greeting broadcasts have been routed to <#${channel.id}>.`)
      .setColor(0x2ecc71)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // --- 2. /welcome message ---
  if (subcommand === 'message') {
    const text = interaction.options.getString('text', true);
    const sendDm = interaction.options.getBoolean('send_dm') ?? false;

    guildConfig.welcomeMessage = text;
    guildConfig.welcomeSendDm = sendDm;
    guildConfig.welcomeEnabled = true;
    await saveGuildConfig(guildConfig);

    const statusDm = sendDm ? '✅ **ENABLED**' : '❌ **DISABLED**';

    const embed = new EmbedBuilder()
      .setTitle('📝 Onboarding Template Updated')
      .setDescription(`Welcome text string successfully configured to:\n\`\`\`\n${text}\n\`\`\`\n• **Direct Message (DM) Delivery:** ${statusDm}`)
      .setColor(0x3498db)
      .setFooter({ text: 'Tags verified: {user}, {server}, {member_count}' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // --- 3. /welcome banner ---
  if (subcommand === 'banner') {
    const imageUrl = interaction.options.getString('image_url', true);

    if (!imageUrl.toLowerCase().startsWith('http://') && !imageUrl.toLowerCase().startsWith('https://')) {
      return interaction.reply({
        content: '❌ Verification Error: Please provide a valid web URL starting with `http://` or `https://`.',
        ephemeral: true
      });
    }

    guildConfig.welcomeBannerUrl = imageUrl;
    await saveGuildConfig(guildConfig);

    const embed = new EmbedBuilder()
      .setTitle('🖼️ Onboarding Banner Saved')
      .setDescription('Your custom welcome banner has been configured successfully.')
      .setImage(imageUrl)
      .setColor(0x9b59b6)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // --- 4. /welcome test ---
  if (subcommand === 'test') {
    const channelId = guildConfig.welcomeChannelId;
    if (!channelId) {
      return interaction.reply({
        content: '❌ Execution Block: Please configure an onboarding text channel first using `/welcome channel`.',
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      return interaction.reply({
        content: '❌ Route Error: Configured channel could not be found. Please update `/welcome channel`.',
        ephemeral: true
      });
    }

    // Dynamic replacement
    const rawMsg = guildConfig.welcomeMessage || 'Welcome {user} to the {server} matrix!';
    const formattedMsg = rawMsg
      .replace(/{user}/g, interaction.user.toString())
      .replace(/{server}/g, interaction.guild.name)
      .replace(/{member_count}/g, interaction.guild.memberCount.toString());

    const accountAge = interaction.user.createdAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const embed = new EmbedBuilder()
      .setTitle('✨ New Connection Established (Mockup Test)')
      .setDescription(formattedMsg)
      .setColor(0x9b59b6)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Account Age Identity', value: accountAge, inline: true },
        { name: 'Guild Member Count', value: `\`${interaction.guild.memberCount}\` Total`, inline: true }
      )
      .setFooter({ text: `User ID: ${interaction.user.id}` })
      .setTimestamp();

    if (guildConfig.welcomeBannerUrl) {
      embed.setImage(guildConfig.welcomeBannerUrl);
    }

    let channelSuccess = false;
    try {
      await channel.send({ embeds: [embed] });
      channelSuccess = true;
    } catch (err) {
      logger.warn(`Failed to send test welcome embed to channel: ${err.message}`);
    }

    // Direct Message Test if enabled
    let dmStatus = '';
    if (guildConfig.welcomeSendDm) {
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`✨ Welcome to ${interaction.guild.name}! (Mockup DM)`)
          .setDescription(formattedMsg)
          .setColor(0x9b59b6)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Sent dynamically via welcome configurations' })
          .setTimestamp();

        if (guildConfig.welcomeBannerUrl) {
          dmEmbed.setImage(guildConfig.welcomeBannerUrl);
        }

        await interaction.user.send({ embeds: [dmEmbed] });
        dmStatus = '\n📩 **DM Mockup Dispatch:** Sent successfully to your direct messages!';
      } catch {
        dmStatus = '\n⚠️ **DM Mockup Dispatch Failed:** Your direct messages are locked; cannot send welcome mockup.';
      }
    }

    if (channelSuccess) {
      return interaction.reply({
        content: `✅ Dynamic Test Broadcast: Onboarding greeting sent successfully to <#${channel.id}>.${dmStatus}`,
        ephemeral: true
      });
    } else {
      return interaction.reply({
        content: `❌ Permissions Error: Missing permission settings to send embeds inside configured channel.${dmStatus}`,
        ephemeral: true
      });
    }
  }
};
