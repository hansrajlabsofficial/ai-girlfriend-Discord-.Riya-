import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';
import { buildHAOCWelcomeEmbed, buildSocialsInvitePanels, sendWelcomeMessage } from '../services/welcomeService.js';
import { logger } from '../utils/logger.js';

const BRAND_FOOTER = '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.';
const EMBLEM_ICON = 'https://cdn.discordapp.com/attachments/1450771986031706214/1560613901396086904/Global_Fishing_Emblem_1.png?ex=6ad35a74&is=6ad208f4&hm=c0756eb02f2652d908a466b51026a18c45165dcdd6aad2abf5645b29728cf52c&';

export const data = new SlashCommandBuilder()
  .setName('setup_welcome')
  .setDescription('Configure auto-welcome channel and deploy community welcome & socials boards')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(opt =>
    opt
      .setName('channel')
      .setDescription('Channel where new members are greeted upon joining')
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('template')
      .setDescription('Choose a welcome template design')
      .setRequired(false)
      .addChoices(
        { name: '👑 HAOC Community Welcome (Guidelines, Hub, Support & Animated Banner)', value: 'haoc' },
        { name: '🌐 Socials & Invite Friends Hub (Stationary Board Only)', value: 'socials' }
      )
  )
  .addChannelOption(opt =>
    opt
      .setName('rules_channel')
      .setDescription('Channel for guidelines and rules link')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addChannelOption(opt =>
    opt
      .setName('chat_channel')
      .setDescription('Channel for general chat main hub')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addChannelOption(opt =>
    opt
      .setName('support_channel')
      .setDescription('Channel for support or ticket creation')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addChannelOption(opt =>
    opt
      .setName('youtube_channel')
      .setDescription('Channel for creator / YouTube announcements')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt
      .setName('invite_url')
      .setDescription('Custom invite URL for the Invite Your Friends board (e.g. https://discord.gg/...)')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt
      .setName('banner_url')
      .setDescription('Custom image or GIF banner URL for the welcome card (e.g. animated GIF link)')
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt
      .setName('post_now')
      .setDescription('Post the welcome & socials board into the channel immediately (Default: True)')
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt
      .setName('status')
      .setDescription('Enable automatic welcome greeting for new member joins (Default: True)')
      .setRequired(false)
  );

export const execute = async (interaction) => {
  if (
    interaction.member?.permissions &&
    !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
    !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    return await interaction.reply({
      content: '❌ **Permission Denied!** You need the **Manage Server** permission to configure the Welcome system, baka!',
      ephemeral: true
    });
  }

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
  }

  const channel = interaction.options.getChannel('channel');
  const template = interaction.options.getString('template') || 'haoc';
  const rulesChannel = interaction.options.getChannel('rules_channel');
  const chatChannel = interaction.options.getChannel('chat_channel');
  const supportChannel = interaction.options.getChannel('support_channel');
  const ytChannel = interaction.options.getChannel('youtube_channel');
  const customInvite = interaction.options.getString('invite_url')?.trim();
  const bannerUrl = interaction.options.getString('banner_url')?.trim();
  const postNow = interaction.options.getBoolean('post_now') ?? true;
  const status = interaction.options.getBoolean('status') ?? true;

  try {
    const guildConfig = await getGuildConfig(interaction.guildId);
    guildConfig.welcomeChannelId = channel.id;
    guildConfig.welcomeEnabled = status;
    guildConfig.welcomeTemplate = template;

    if (rulesChannel) guildConfig.welcomeRulesChannelId = rulesChannel.id;
    if (chatChannel) guildConfig.welcomeChatChannelId = chatChannel.id;
    if (supportChannel) guildConfig.welcomeSupportChannelId = supportChannel.id;
    if (ytChannel) guildConfig.welcomeYtChannelId = ytChannel.id;
    if (customInvite) guildConfig.welcomeInviteUrl = customInvite;
    if (bannerUrl) guildConfig.welcomeBannerUrl = bannerUrl;

    await saveGuildConfig(guildConfig);

    // If post_now is requested, send the selected boards into the channel
    let postedNotice = '';
    if (postNow) {
      const botMember = interaction.guild.members.me || await interaction.guild.members.fetchMe().catch(() => null);
      const perms = channel.permissionsFor(botMember);

      if (!perms || !perms.has('SendMessages') || !perms.has('EmbedLinks')) {
        postedNotice = '\n⚠️ *Note: Bot lacks SendMessages or EmbedLinks in <#' + channel.id + '> to post immediately. Please verify permissions!*';
      } else {
        if (template === 'socials') {
          const socials = buildSocialsInvitePanels(interaction.guild, guildConfig.welcomeInviteUrl);
          const sendOpts = { embeds: socials.embeds, components: [socials.row] };
          if (socials.attachment) sendOpts.files = [socials.attachment];
          await channel.send(sendOpts);
          postedNotice = '\n✅ *Posted Socials & Invite Your Friends board to <#' + channel.id + '>!*';
        } else {
          // Default: HAOC Community Welcome card with animated GIF banner
          const haoc = buildHAOCWelcomeEmbed(interaction.member, guildConfig);
          const sendOpts = { content: haoc.content, embeds: [haoc.embed] };
          if (haoc.row) sendOpts.components = [haoc.row];
          if (haoc.attachment) sendOpts.files = [haoc.attachment];
          await channel.send(sendOpts);
          postedNotice = '\n✅ *Posted HAOC Community Welcome card to <#' + channel.id + '>!*';
        }
      }
    }

    const templateNames = {
      haoc: '👑 HAOC Community Welcome',
      socials: '🌐 Socials & Invite Friends Hub',
      all_in_one: '🚀 Complete All-in-One Suite'
    };

    const confirmEmbed = new EmbedBuilder()
      .setColor(status ? '#00E5FF' : '#FF5555')
      .setTitle('🎉 Welcome System Configured!')
      .setDescription(
        `Kem chhe! The server welcome system has been updated successfully! ✨${postedNotice}\n\n` +
        `• **Welcome Channel:** <#${channel.id}>\n` +
        `• **Auto-Join Greeting:** ${status ? '🟢 **Active & Enabled**' : '🔴 **Disabled**'}\n` +
        `• **Template:** \`${templateNames[template] || template}\`\n` +
        `• **Rules Link:** ${guildConfig.welcomeRulesChannelId ? `<#${guildConfig.welcomeRulesChannelId}>` : '*Auto-detected*'}\n` +
        `• **Main Chat:** ${guildConfig.welcomeChatChannelId ? `<#${guildConfig.welcomeChatChannelId}>` : '*Auto-detected*'}\n` +
        `• **Support Link:** ${guildConfig.welcomeSupportChannelId ? `<#${guildConfig.welcomeSupportChannelId}>` : '*Auto-detected*'}\n` +
        `• **Invite Link:** \`${guildConfig.welcomeInviteUrl || 'https://discord.gg/gametester'}\`\n` +
        `• **Banner:** ${guildConfig.welcomeBannerUrl ? `[Custom Banner URL](${guildConfig.welcomeBannerUrl})` : '`HAOC Animated GIF (Official)`'}`
      )
      .addFields(
        {
          name: '📋 What happens when members join?',
          value: 'Riya greets new members automatically with member counter (`age N`), guidelines links, support shortcuts, and direct socials panels!'
        }
      )
      .setThumbnail(EMBLEM_ICON)
      .setFooter({ text: BRAND_FOOTER, iconURL: EMBLEM_ICON })
      .setTimestamp();

    const buttons = [
      new ButtonBuilder()
        .setLabel('📢 Post Socials Board')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`welcome_post_socials_${channel.id}`),
      new ButtonBuilder()
        .setLabel('🧪 Test Join Greeting')
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`welcome_test_join_${channel.id}`)
    ];
    const row = new ActionRowBuilder().addComponents(buttons);

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [confirmEmbed], components: [row] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true }).catch(() => {});
    }
  } catch (err) {
    logger.error(`Error in /setup_welcome: ${err.message}`);
    const errMsg = { content: '❌ Arey thodi technical issue aavi gayi baka! Failed to save welcome configuration. Please try again.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errMsg).catch(() => {});
    } else {
      await interaction.reply(errMsg).catch(() => {});
    }
  }
};
