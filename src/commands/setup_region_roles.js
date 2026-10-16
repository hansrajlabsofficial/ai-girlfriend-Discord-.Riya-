import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { REGIONS_CONFIG, buildRegionPanel, DEFAULT_REGION_DESCRIPTION } from '../services/regionRoleService.js';
import { getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('setup_region_roles')
  .setDescription('Deploy interactive Region Selection auto-roles panel with buttons and world map')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addChannelOption(opt =>
    opt.setName('channel')
      .setDescription('Channel where the region selection panel will be posted (defaults to current channel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt.setName('auto_create_roles')
      .setDescription('Automatically create missing region roles with matching colors (Default: True)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('north_america_role')
      .setDescription('Role to assign for North America (optional)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('south_america_role')
      .setDescription('Role to assign for South America (optional)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('east_europe_role')
      .setDescription('Role to assign for East Europe (optional)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('west_europe_role')
      .setDescription('Role to assign for West Europe (optional)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('oceania_role')
      .setDescription('Role to assign for Oceania (optional)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('asia_role')
      .setDescription('Role to assign for Asia (optional)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('africa_role')
      .setDescription('Role to assign for Africa (optional)')
      .setRequired(false)
  )
  .addRoleOption(opt =>
    opt.setName('rather_not_say_role')
      .setDescription('Role to assign for Rather not say (optional)')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('map_image_url')
      .setDescription('Custom world map image URL (optional, defaults to built-in region map)')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('custom_title')
      .setDescription('Custom title for the embed (Default: Region Selection)')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('custom_description')
      .setDescription('Custom description text for the embed (optional)')
      .setRequired(false)
  );

export const execute = async (interaction) => {
  // 1. Permission Check
  if (
    interaction.member?.permissions &&
    !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
    !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)
  ) {
    return await interaction.reply({
      content: '❌ **Manage Roles Permission Required!** Only administrators or server staff with Manage Roles can configure the Region Selection auto-roles.',
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
  const autoCreate = interaction.options.getBoolean('auto_create_roles') ?? true;
  const mapImageUrl = interaction.options.getString('map_image_url');
  const customTitle = interaction.options.getString('custom_title') || 'Region Selection';
  const customDescription = interaction.options.getString('custom_description') || DEFAULT_REGION_DESCRIPTION;

  // 2. Channel Permissions Check for Bot
  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
  const channelPerms = targetChannel.permissionsFor(botMember);

  if (!channelPerms || !channelPerms.has(PermissionFlagsBits.ViewChannel) || !channelPerms.has(PermissionFlagsBits.SendMessages) || !channelPerms.has(PermissionFlagsBits.EmbedLinks)) {
    return await interaction.editReply({
      content: `❌ **Channel Permission Error:** I need **View Channel**, **Send Messages**, and **Embed Links** permissions in <#${targetChannel.id}>.`
    });
  }

  // Check Manage Roles
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return await interaction.editReply({
      content: '❌ **Manage Roles Error:** I require the **Manage Roles** bot permission so that I can create and assign region roles to members.'
    });
  }

  // 3. Resolve Roles for Each Region
  const regionRolesMap = {};
  const createdRoles = [];
  const existingRoles = [];

  for (const reg of REGIONS_CONFIG) {
    const optionName = `${reg.key}_role`;
    let role = interaction.options.getRole(optionName);

    // If not explicitly provided, check existing guild roles by name
    if (!role) {
      role = guild.roles.cache.find(r => r.name.toLowerCase() === reg.name.toLowerCase());
    }

    // If still not found and auto-create is enabled, create the role
    if (!role && autoCreate) {
      try {
        role = await guild.roles.create({
          name: reg.name,
          color: reg.defaultColor,
          reason: `Riya Auto-Roles: Auto-created ${reg.name} continent role`
        });
        createdRoles.push(role);
      } catch (err) {
        logger.error(`Failed to auto-create role ${reg.name}:`, err);
      }
    } else if (role) {
      existingRoles.push(role);
    }

    if (role) {
      regionRolesMap[reg.key] = role.id;
    }
  }

  // 4. Save to Database (GuildConfig)
  try {
    const guildConfig = await getGuildConfig(guild.id);
    guildConfig.regionRoles = regionRolesMap;
    await saveGuildConfig(guildConfig);
  } catch (err) {
    logger.warn(`Could not save regionRoles to database: ${err.message}`);
  }

  // 5. Build and Send the Panel to the Target Channel
  try {
    const panelData = buildRegionPanel({
      title: customTitle,
      description: customDescription,
      mapImageUrl,
      regionRolesMap
    });

    const panelMessage = await targetChannel.send(panelData);

    // 6. Respond to Admin
    let statusText = `🎉 **Region Selection Panel successfully deployed to <#${targetChannel.id}>!**\n[Jump to Panel Message](${panelMessage.url})\n\n`;
    statusText += `**Configured Continent Roles:**\n`;
    
    for (const reg of REGIONS_CONFIG) {
      const roleId = regionRolesMap[reg.key];
      if (roleId) {
        statusText += `• ${reg.emoji} **${reg.name}**: <@&${roleId}>\n`;
      } else {
        statusText += `• ${reg.emoji} **${reg.name}**: *(No role linked)*\n`;
      }
    }

    if (createdRoles.length > 0) {
      statusText += `\n✨ *Auto-created ${createdRoles.length} new role(s) with matching colors!*`;
    }

    statusText += `\n\n💡 **Tip:** Ensure the bot's highest role is positioned **above** these region roles in **Server Settings > Roles** so the bot can assign them!`;

    const summaryEmbed = new EmbedBuilder()
      .setColor('#00FF7F')
      .setTitle('🌍 Region Selection Auto-Roles Ready!')
      .setDescription(statusText)
      .setFooter({ text: 'AHP Group Pvt. Ltd. • Riya Auto-Roles System 💖' });

    return await interaction.editReply({ embeds: [summaryEmbed] });
  } catch (err) {
    logger.error('Error deploying region selection panel:', err);
    return await interaction.editReply({
      content: `❌ **Failed to send panel:** ${err.message}`
    });
  }
};
