import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('setup_welcome')
  .setDescription('Configure automatic welcome greetings with buttons, banner, and Raw JSON support')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(opt =>
    opt
      .setName('raw_json')
      .setDescription('Paste raw JSON code to automatically configure and apply all welcome settings')
      .setRequired(false)
  )
  .addChannelOption(opt =>
    opt
      .setName('channel')
      .setDescription('Channel where welcome messages will be posted')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt
      .setName('message')
      .setDescription('Custom greeting text ({user}, {server}, {member_count})')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt
      .setName('banner_url')
      .setDescription('Direct web URL to a welcome banner image or GIF')
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt
      .setName('send_dm')
      .setDescription('Should welcome greeting also be sent directly to user DM?')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt
      .setName('second_message')
      .setDescription('Custom text for second follow-up message')
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt
      .setName('second_message_as_embed')
      .setDescription('Send second message as an embed card box?')
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt
      .setName('second_message_enabled')
      .setDescription('Enable or disable sending second message')
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt
      .setName('status')
      .setDescription('Enable or disable welcome greeting broadcasts')
      .setRequired(false)
  );

export const execute = async (interaction) => {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ This command can only be used in a server!', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true }).catch(() => {});

  const guildConfig = await getGuildConfig(interaction.guild.id);
  const rawJsonInput = interaction.options.getString('raw_json');

  // 1. Process Raw JSON Input if provided
  if (rawJsonInput) {
    try {
      const cleaned = rawJsonInput.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleaned);

      if (parsed.channel_id || parsed.channelId || parsed.welcomeChannelId || parsed.channel) {
        const cId = String(parsed.channel_id || parsed.channelId || parsed.welcomeChannelId || parsed.channel).replace(/[<#>]/g, '').trim();
        guildConfig.welcomeChannelId = cId;
        guildConfig.welcomeEnabled = true;
      }
      if (parsed.message || parsed.welcomeMessage || parsed.text) {
        guildConfig.welcomeMessage = parsed.message || parsed.welcomeMessage || parsed.text;
      }
      if (parsed.banner_url || parsed.welcomeBannerUrl || parsed.image_url) {
        guildConfig.welcomeBannerUrl = parsed.banner_url || parsed.welcomeBannerUrl || parsed.image_url;
      }
      if (parsed.send_dm !== undefined || parsed.welcomeSendDm !== undefined) {
        guildConfig.welcomeSendDm = Boolean(parsed.send_dm ?? parsed.welcomeSendDm);
      }
      if (parsed.second_message || parsed.welcomeSecondMessage) {
        guildConfig.welcomeSecondMessage = parsed.second_message || parsed.welcomeSecondMessage;
      }
      if (parsed.second_message_enabled !== undefined || parsed.welcomeSecondMessageEnabled !== undefined) {
        guildConfig.welcomeSecondMessageEnabled = Boolean(parsed.second_message_enabled ?? parsed.welcomeSecondMessageEnabled);
      }
      if (parsed.second_message_as_embed !== undefined || parsed.welcomeSecondMessageAsEmbed !== undefined) {
        guildConfig.welcomeSecondMessageAsEmbed = Boolean(parsed.second_message_as_embed ?? parsed.welcomeSecondMessageAsEmbed);
      }
      if (parsed.welcome_enabled !== undefined || parsed.welcomeEnabled !== undefined) {
        guildConfig.welcomeEnabled = Boolean(parsed.welcome_enabled ?? parsed.welcomeEnabled);
      }

      await saveGuildConfig(guildConfig);

      const updatedConfig = {
        guildId: interaction.guild.id,
        guildName: interaction.guild.name,
        welcomeEnabled: guildConfig.welcomeEnabled ?? true,
        welcomeChannelId: guildConfig.welcomeChannelId || null,
        welcomeMessage: guildConfig.welcomeMessage || 'Welcome {user} to the {server} matrix!',
        welcomeBannerUrl: guildConfig.welcomeBannerUrl || null,
        welcomeSendDm: guildConfig.welcomeSendDm ?? false,
        welcomeSecondMessage: guildConfig.welcomeSecondMessage || null,
        welcomeSecondMessageEnabled: guildConfig.welcomeSecondMessageEnabled ?? false,
        welcomeSecondMessageAsEmbed: guildConfig.welcomeSecondMessageAsEmbed ?? false
      };

      const embed = new EmbedBuilder()
        .setTitle('✅ Welcome Setup Updated from Raw JSON!')
        .setDescription(
          `All welcome parameters have been automatically configured from your JSON code!\n\n` +
          `• **Target Channel:** ${guildConfig.welcomeChannelId ? `<#${guildConfig.welcomeChannelId}>` : '*(Not configured)*'}\n` +
          `• **Status:** ${guildConfig.welcomeEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}\n` +
          `• **DM Dispatch:** ${guildConfig.welcomeSendDm ? '✅ ENABLED' : '❌ DISABLED'}\n` +
          `• **Second Message:** ${guildConfig.welcomeSecondMessageEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\n` +
          `**Applied JSON Matrix:**\n\`\`\`json\n${JSON.stringify(updatedConfig, null, 2).slice(0, 3000)}\n\`\`\``
        )
        .setColor(0x2ecc71)
        .setFooter({ text: 'AHP Group Pvt. Ltd. • Riya Welcome Setup 💖' })
        .setTimestamp();

      if (guildConfig.welcomeBannerUrl) {
        embed.setImage(guildConfig.welcomeBannerUrl);
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (parseErr) {
      return interaction.editReply({
        content: `❌ **Invalid Raw JSON Syntax:** Please check your JSON format!\n\`\`\`\n${parseErr.message}\n\`\`\``
      });
    }
  }

  // 2. Process Individual Options
  let changesMade = false;

  const channelOpt = interaction.options.getChannel('channel');
  if (channelOpt) {
    guildConfig.welcomeChannelId = channelOpt.id;
    guildConfig.welcomeEnabled = true;
    changesMade = true;
  }

  const messageOpt = interaction.options.getString('message');
  if (messageOpt) {
    guildConfig.welcomeMessage = messageOpt;
    changesMade = true;
  }

  const bannerOpt = interaction.options.getString('banner_url');
  if (bannerOpt) {
    guildConfig.welcomeBannerUrl = bannerOpt;
    changesMade = true;
  }

  const dmOpt = interaction.options.getBoolean('send_dm');
  if (dmOpt !== null) {
    guildConfig.welcomeSendDm = dmOpt;
    changesMade = true;
  }

  const secondMsgOpt = interaction.options.getString('second_message');
  if (secondMsgOpt) {
    guildConfig.welcomeSecondMessage = secondMsgOpt;
    guildConfig.welcomeSecondMessageEnabled = true;
    changesMade = true;
  }

  const secondEmbedOpt = interaction.options.getBoolean('second_message_as_embed');
  if (secondEmbedOpt !== null) {
    guildConfig.welcomeSecondMessageAsEmbed = secondEmbedOpt;
    changesMade = true;
  }

  const secondEnabledOpt = interaction.options.getBoolean('second_message_enabled');
  if (secondEnabledOpt !== null) {
    guildConfig.welcomeSecondMessageEnabled = secondEnabledOpt;
    changesMade = true;
  }

  const statusOpt = interaction.options.getBoolean('status');
  if (statusOpt !== null) {
    guildConfig.welcomeEnabled = statusOpt;
    changesMade = true;
  }

  if (changesMade) {
    await saveGuildConfig(guildConfig);

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Welcome Setup Updated!')
      .setDescription(
        `Your welcome configuration changes have been saved!\n\n` +
        `• **Target Channel:** ${guildConfig.welcomeChannelId ? `<#${guildConfig.welcomeChannelId}>` : '*(Not configured)*'}\n` +
        `• **Status:** ${guildConfig.welcomeEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}\n` +
        `• **DM Dispatch:** ${guildConfig.welcomeSendDm ? '✅ ENABLED' : '❌ DISABLED'}\n` +
        `• **Second Message:** ${guildConfig.welcomeSecondMessageEnabled ? '✅ ENABLED' : '❌ DISABLED'}`
      )
      .setColor(0x2ecc71)
      .setFooter({ text: 'Use /setup_welcome raw_json: <code> to import full JSON matrix' })
      .setTimestamp();

    if (guildConfig.welcomeBannerUrl) {
      embed.setImage(guildConfig.welcomeBannerUrl);
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // 3. If no options provided, display current configuration and Raw JSON
  const currentConfig = {
    guild_id: interaction.guild.id,
    welcome_enabled: guildConfig.welcomeEnabled ?? true,
    channel_id: guildConfig.welcomeChannelId || null,
    message: guildConfig.welcomeMessage || 'Welcome {user} to the {server} matrix!',
    banner_url: guildConfig.welcomeBannerUrl || null,
    send_dm: guildConfig.welcomeSendDm ?? false,
    second_message: guildConfig.welcomeSecondMessage || null,
    second_message_enabled: guildConfig.welcomeSecondMessageEnabled ?? false,
    second_message_as_embed: guildConfig.welcomeSecondMessageAsEmbed ?? false
  };

  const jsonString = JSON.stringify(currentConfig, null, 2);
  const infoEmbed = new EmbedBuilder()
    .setTitle('⚙️ Current Welcome Setup • Raw JSON')
    .setDescription(
      `Here is the current live welcome configuration for **${interaction.guild.name}**.\n\n` +
      `💡 **To apply changes with Raw JSON:**\n` +
      `Run \`/setup_welcome raw_json: <your_json_code>\`\n\n` +
      `\`\`\`json\n${jsonString.slice(0, 3500)}\n\`\`\``
    )
    .setColor(0x9b59b6)
    .setFooter({ text: 'AHP Group Pvt. Ltd. • Riya Welcome Setup 💖' })
    .setTimestamp();

  if (guildConfig.welcomeBannerUrl) {
    infoEmbed.setImage(guildConfig.welcomeBannerUrl);
  }

  return interaction.editReply({ embeds: [infoEmbed] });
};
