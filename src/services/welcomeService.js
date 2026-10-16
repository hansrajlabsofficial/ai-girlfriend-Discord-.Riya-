import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../assets');

const BRAND_FOOTER = '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.';
const EMBLEM_ICON = 'https://cdn.discordapp.com/attachments/1450771986031706214/1560613901396086904/Global_Fishing_Emblem_1.png?ex=6ad35a74&is=6ad208f4&hm=c0756eb02f2652d908a466b51026a18c45165dcdd6aad2abf5645b29728cf52c&';

export const WELCOME_TEMPLATES = {
  haoc: 'HANSRAJ AYAN Official Community (HAOC)',
  socials: 'Socials & Invite Your Friends Hub',
  all_in_one: 'Complete All-in-One Community Suite'
};

/**
 * Resolves channel mention safely
 */
const resolveChannelMention = (guild, channelId, fallbackName) => {
  if (channelId && guild?.channels?.cache?.get) {
    const ch = guild.channels.cache.get(channelId);
    if (ch) return `<#${ch.id}>`;
  }
  // Try to find channel by keyword
  if (guild?.channels?.cache?.find) {
    const found = guild.channels.cache.find(c =>
      c.isTextBased && c.isTextBased() && c.name?.toLowerCase().includes(fallbackName.toLowerCase())
    );
    if (found) return `<#${found.id}>`;
  }
  return `# ${fallbackName}`;
};

/**
 * Build the HAOC Community Welcome Embed (matching user reference image 2)
 */
export const buildHAOCWelcomeEmbed = (member, guildConfig) => {
  const guild = member.guild;
  const memberCount = guild.memberCount || 1;

  const rulesMention = resolveChannelMention(guild, guildConfig.welcomeRulesChannelId, 'rules');
  const chatMention = resolveChannelMention(guild, guildConfig.welcomeChatChannelId, 'general-chat');
  const ytMention = resolveChannelMention(guild, guildConfig.welcomeYtChannelId, 'ayanbhai2-yt');
  const supportMention = resolveChannelMention(guild, guildConfig.welcomeSupportChannelId, 'create-a-ticket');

  const avatarUrl = member.user?.displayAvatarURL?.() || EMBLEM_ICON;

  const description = [
    `✨ Welcome to **HANSRAJ AYAN OFFICIAL COMMUNITY**`,
    `Description: > *"A place where the community comes together."*`,
    ``,
    `Welcome home. We've built this space for fans and friends of **HANSRAJ AYAN** to relax and connect. Please make yourself comfortable, respect others, and enjoy your stay.`,
    ``,
    `**Links:**`,
    `📜 Guidelines: ${rulesMention}`,
    `💬 Main Hub: ${chatMention}`,
    `🎀 | AYANBHAI2-YT: ${ytMention}`,
    `🤝 Support: ${supportMention}`
  ].join('\n');

  const embed = new EmbedBuilder()
    .setColor('#00E5FF')
    .setAuthor({
      name: 'HANSRAJ DEV',
      iconURL: EMBLEM_ICON
    })
    .setThumbnail(avatarUrl)
    .setDescription(description)
    .setFooter({ text: BRAND_FOOTER, iconURL: EMBLEM_ICON })
    .setTimestamp();

  // Handle bottom banner: Custom URL (if configured) or animated HAOC GIF banner or fallback PNG
  let attachment = null;
  if (guildConfig?.welcomeBannerUrl) {
    embed.setImage(guildConfig.welcomeBannerUrl);
  } else {
    const gifFile = path.join(assetsDir, 'welcome_haoc_banner.gif');
    if (fs.existsSync(gifFile)) {
      attachment = new AttachmentBuilder(gifFile, { name: 'hansraj_ayan_official_community.gif' });
      embed.setImage('attachment://hansraj_ayan_official_community.gif');
    } else {
      const bannerFile = path.join(assetsDir, 'welcome_haoc_card.png');
      if (fs.existsSync(bannerFile)) {
        attachment = new AttachmentBuilder(bannerFile, { name: 'hindi_english_bengali.png' });
        embed.setImage('attachment://hindi_english_bengali.png');
      }
    }
  }

  // Interactive quick navigation buttons
  const buttons = [];
  if (guildConfig.welcomeRulesChannelId) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('📜 Rules')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`welcome_nav_rules_${guildConfig.welcomeRulesChannelId}`)
    );
  }
  if (guildConfig.welcomeChatChannelId) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('💬 Main Chat')
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`welcome_nav_chat_${guildConfig.welcomeChatChannelId}`)
    );
  }
  if (guildConfig.welcomeSupportChannelId) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('🤝 Support Ticket')
        .setStyle(ButtonStyle.Success)
        .setCustomId(`welcome_nav_ticket_${guildConfig.welcomeSupportChannelId}`)
    );
  }
  buttons.push(
    new ButtonBuilder()
      .setLabel('🌐 Socials & Invites')
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('welcome_nav_socials')
  );

  const row = buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons.slice(0, 5)) : null;

  const contentText = `⚜️ **New family member** <@${member.id}> age \`${memberCount}\``;

  return { content: contentText, embed, attachment, row };
};

/**
 * Build Socials & Invite Your Friends Panels (matching user reference image 1)
 */
export const buildSocialsInvitePanels = (guild, inviteUrl) => {
  const actualInvite = inviteUrl || 'https://discord.gg/gametester';

  // 1. Socials Embed
  const socialsEmbed = new EmbedBuilder()
    .setColor('#FFC107')
    .setTitle('🌟 Follow us all around the web!')
    .setDescription('Stay connected with our official channels and community updates:')
    .addFields(
      {
        name: '🔗 Links',
        value: [
          '😙 [Website](https://riya-ai-girlfriend-discord-bot-full.vercel.app/)',
          '💬 [Discord](' + actualInvite + ')',
          '🎮 [Steam](https://store.steampowered.com/)',
          '💼 [LinkedIn](https://linkedin.com/)',
          '🎵 [Spotify](https://spotify.com/)',
          '🕹️ [SideQuest](https://sidequestvr.com/)'
        ].join('\n'),
        inline: true
      },
      {
        name: '📱 Socials',
        value: [
          '🐦 [Twitter / X](https://twitter.com/)',
          '👥 [Facebook](https://facebook.com/)',
          '📸 [Instagram](https://instagram.com/)',
          '▶️ [YouTube](https://youtube.com/)',
          '📺 [Twitch](https://twitch.tv/)',
          '👽 [Reddit](https://reddit.com/)'
        ].join('\n'),
        inline: true
      }
    )
    .setFooter({ text: BRAND_FOOTER, iconURL: EMBLEM_ICON });

  // 2. Invite Your Friends Embed
  const inviteEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎉 Help us grow the family by sharing our server 🏳️‍🌈')
    .setDescription(`\`\`\`\n${actualInvite}\n\`\`\``)
    .setFooter({ text: 'Invite friends to earn bonus coins & special community badges! • ' + BRAND_FOOTER });

  const buttons = [
    new ButtonBuilder()
      .setLabel('🌐 Web Dashboard')
      .setStyle(ButtonStyle.Link)
      .setURL('https://riya-ai-girlfriend-discord-bot-full.vercel.app/'),
    new ButtonBuilder()
      .setLabel('💌 Share Discord Invite')
      .setStyle(ButtonStyle.Link)
      .setURL(actualInvite)
  ];
  const row = new ActionRowBuilder().addComponents(buttons);

  return { embeds: [socialsEmbed, inviteEmbed], attachment: null, row };
};

/**
 * Master dispatcher to send welcome message on member join
 */
export const sendWelcomeMessage = async (member) => {
  if (!member || !member.guild) return false;

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
    // ALWAYS send only the HAOC Community Welcome greeting (Socials are strictly on-demand via the button)
    const haoc = buildHAOCWelcomeEmbed(member, guildConfig);
    const sendOpts = { content: haoc.content, embeds: [haoc.embed] };
    if (haoc.row) sendOpts.components = [haoc.row];
    if (haoc.attachment) sendOpts.files = [haoc.attachment];

    await channel.send(sendOpts);
    logger.info(`Sent HAOC welcome greeting for member ${member.user?.tag || member.id} in guild ${member.guild.name}`);
    return true;
  } catch (err) {
    logger.error(`Error sending welcome message in guild ${member.guild.id}: ${err.message}`);
    return false;
  }
};

/**
 * Handle interactive button clicks for Welcome system
 */
export const handleWelcomeButton = async (interaction) => {
  const customId = interaction.customId;

  // 1. Post Socials Board directly to channel (Admin trigger)
  if (customId.startsWith('welcome_post_socials_')) {
    if (!interaction.memberPermissions?.has('ManageGuild') && !interaction.memberPermissions?.has('Administrator')) {
      return await interaction.reply({ content: '❌ You need Manage Server permission to do that!', ephemeral: true });
    }
    const channelId = customId.replace('welcome_post_socials_', '');
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      return await interaction.reply({ content: '❌ Channel not found!', ephemeral: true });
    }
    const guildConfig = await getGuildConfig(interaction.guildId);
    const socials = buildSocialsInvitePanels(interaction.guild, guildConfig.welcomeInviteUrl);
    const sendOpts = { embeds: socials.embeds, components: [socials.row] };
    if (socials.attachment) sendOpts.files = [socials.attachment];

    await channel.send(sendOpts);
    return await interaction.reply({ content: `✅ Successfully posted Socials & Invite board to <#${channelId}>!`, ephemeral: true });
  }

  // Toggle Disable Welcome (Admin)
  if (customId === 'welcome_toggle_disable') {
    if (!interaction.memberPermissions?.has('ManageGuild') && !interaction.memberPermissions?.has('Administrator')) {
      return await interaction.reply({ content: '❌ You need Manage Server permission to do that!', ephemeral: true });
    }
    const guildConfig = await getGuildConfig(interaction.guildId);
    guildConfig.welcomeEnabled = false;
    await saveGuildConfig(guildConfig);
    return await interaction.reply({
      content: '🔴 **Auto-Welcome Greetings Disabled!** Riya will no longer send welcome cards when new members join.\n*(Click below or run `/setup_welcome status: True` to re-enable anytime!)*',
      components: [
        new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setLabel('🟢 Re-Enable Welcome')
            .setStyle(ButtonStyle.Success)
            .setCustomId('welcome_toggle_enable')
        ])
      ],
      ephemeral: true
    });
  }

  // Toggle Enable Welcome (Admin)
  if (customId === 'welcome_toggle_enable') {
    if (!interaction.memberPermissions?.has('ManageGuild') && !interaction.memberPermissions?.has('Administrator')) {
      return await interaction.reply({ content: '❌ You need Manage Server permission to do that!', ephemeral: true });
    }
    const guildConfig = await getGuildConfig(interaction.guildId);
    guildConfig.welcomeEnabled = true;
    await saveGuildConfig(guildConfig);
    return await interaction.reply({
      content: `🟢 **Auto-Welcome Greetings Enabled!** New members will now receive greetings in ${guildConfig.welcomeChannelId ? `<#${guildConfig.welcomeChannelId}>` : 'the designated welcome channel'}!`,
      components: [
        new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setLabel('🔴 Disable Welcome')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('welcome_toggle_disable')
        ])
      ],
      ephemeral: true
    });
  }

  // 2. Test Welcome greeting
  if (customId.startsWith('welcome_test_join_')) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true }).catch(() => {});
    }
    const success = await sendWelcomeMessage(interaction.member);
    if (success) {
      return await interaction.editReply({ content: '🎉 **Test Welcome Sent!** Check the configured welcome channel to view the result!' }).catch(() => {});
    } else {
      return await interaction.editReply({ content: '⚠️ Could not send test welcome. Please verify bot channel permissions.' }).catch(() => {});
    }
  }

  // 3. Navigation shortcuts from welcome embed
  if (customId.startsWith('welcome_nav_rules_')) {
    const chId = customId.replace('welcome_nav_rules_', '');
    return await interaction.reply({
      content: `📜 **Server Guidelines:** Head over to <#${chId}> to read our community rules and guidelines!`,
      ephemeral: true
    });
  }

  if (customId.startsWith('welcome_nav_chat_')) {
    const chId = customId.replace('welcome_nav_chat_', '');
    return await interaction.reply({
      content: `💬 **Main Chat Hub:** Join the conversation in <#${chId}>! Come say hi, baka! ✨`,
      ephemeral: true
    });
  }

  if (customId.startsWith('welcome_nav_ticket_')) {
    const chId = customId.replace('welcome_nav_ticket_', '');
    return await interaction.reply({
      content: `🤝 **Support & Tickets:** Need help or have an issue? Create a support ticket in <#${chId}>!`,
      ephemeral: true
    });
  }

  if (customId === 'welcome_nav_socials') {
    const guildConfig = await getGuildConfig(interaction.guildId);
    const socials = buildSocialsInvitePanels(interaction.guild, guildConfig.welcomeInviteUrl);
    return await interaction.reply({
      embeds: socials.embeds,
      components: [socials.row],
      ephemeral: true
    });
  }
};
