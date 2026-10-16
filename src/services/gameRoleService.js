import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';
import { logger } from '../utils/logger.js';

export const HANSRAJ_GAMES = [
  // Row 1 (5 buttons)
  { key: 'bloodstrike', name: 'BLOODSTRIKE', customEmojiName: 'BLOODSTRIKE', defaultEmoji: '🩸', style: ButtonStyle.Danger, color: '#E74C3C', row: 1 },
  { key: 'freefire', name: 'FreeFire', customEmojiName: 'FreeFire', defaultEmoji: '🔥', style: ButtonStyle.Danger, color: '#E67E22', row: 1 },
  { key: 'minecraft', name: 'MINECRAFT', customEmojiName: 'minecraft', defaultEmoji: '⛏️', style: ButtonStyle.Success, color: '#2ECC71', row: 1 },
  { key: 'roblox', name: 'ROBLOX', customEmojiName: 'ROBLOX', defaultEmoji: '🟥', style: ButtonStyle.Primary, color: '#3498DB', row: 1 },
  { key: 'valorant', name: 'VALORANT', customEmojiName: 'VALORANT', defaultEmoji: '🎯', style: ButtonStyle.Danger, color: '#E74C3C', row: 1 },

  // Row 2 (5 buttons)
  { key: 'pubg', name: "PUBG", customEmojiName: 'PLAYERUNKNOWNSBATTLEGROUNDS', defaultEmoji: '🪂', style: ButtonStyle.Secondary, color: '#F39C12', row: 2 },
  { key: 'r6s', name: 'Rainbow Six Siege', customEmojiName: 'TomClancysRainbowSixSiege', defaultEmoji: '🛡️', style: ButtonStyle.Primary, color: '#2980B9', row: 2 },
  { key: 'warzone', name: 'MW Warzone', customEmojiName: 'CALLOFDUTYMWWARZONE', defaultEmoji: '💥', style: ButtonStyle.Secondary, color: '#34495E', row: 2 },
  { key: 'cod', name: 'Call of Duty', customEmojiName: 'COD', defaultEmoji: '🔫', style: ButtonStyle.Secondary, color: '#2C3E50', row: 2 },
  { key: 'cs2', name: 'Counter Strike 2', customEmojiName: 'COUNTERSTRIKE2', defaultEmoji: '💣', style: ButtonStyle.Primary, color: '#F1C40F', row: 2 },

  // Row 3 (5 buttons)
  { key: 'epiclegends', name: 'EPICLEGENDS', customEmojiName: 'EPICLEGENDS', defaultEmoji: '🏆', style: ButtonStyle.Danger, color: '#9B59B6', row: 3 },
  { key: 'fortnite', name: 'FORTNITE', customEmojiName: 'FORTNITE', defaultEmoji: '⚡', style: ButtonStyle.Primary, color: '#8E44AD', row: 3 },
  { key: 'forza5', name: 'FORZA HORIZON 5', customEmojiName: 'FORZAHORIZON5', defaultEmoji: '🏎️', style: ButtonStyle.Success, color: '#27AE60', row: 3 },
  { key: 'gta5', name: 'GTA 5', customEmojiName: 'GTA5', defaultEmoji: '🚗', style: ButtonStyle.Success, color: '#16A085', row: 3 },
  { key: 'krunker', name: 'KRUNKER', customEmojiName: 'KRUNKER', defaultEmoji: '🎯', style: ButtonStyle.Secondary, color: '#7F8C8D', row: 3 },

  // Row 4 (2 buttons)
  { key: 'overwatch2', name: 'OVERWATCH 2', customEmojiName: 'OVERWATCH2', defaultEmoji: '🔶', style: ButtonStyle.Primary, color: '#E67E22', row: 4 },
  { key: 'hogwarts', name: 'Hogwarts Legacy', customEmojiName: 'Hogwarts_Legacy', defaultEmoji: '🪄', style: ButtonStyle.Primary, color: '#3498DB', row: 4 }
];

export const GAMETESTER_ROLES = [
  // Row 1 (5 buttons)
  { key: 'game_nights', name: 'Game Nights', customEmojiName: 'gamenights', defaultEmoji: '🕹️', style: ButtonStyle.Success, color: '#2ECC71', row: 1 },
  { key: 'competitions', name: 'Competitions', customEmojiName: 'competitions', defaultEmoji: '🏆', style: ButtonStyle.Success, color: '#F1C40F', row: 1 },
  { key: 'giveaways', name: 'Giveaways', customEmojiName: 'giveaways', defaultEmoji: '🎫', style: ButtonStyle.Success, color: '#E67E22', row: 1 },
  { key: 'streamer', name: 'Streamer', customEmojiName: 'streamer', defaultEmoji: '🔴', style: ButtonStyle.Danger, color: '#E74C3C', row: 1 },
  { key: 'job_vacancies', name: 'Job Vacancies', customEmojiName: 'jobvacancies', defaultEmoji: '📑', style: ButtonStyle.Danger, color: '#C0392B', row: 1 },

  // Row 2 (5 buttons)
  { key: 'gt_community', name: 'GT Community', customEmojiName: 'gtcommunity', defaultEmoji: '🏳️‍🌈', style: ButtonStyle.Primary, color: '#9B59B6', row: 2 },
  { key: 'gt_socials', name: 'GT Socials', customEmojiName: 'gtsocials', defaultEmoji: '🐦', style: ButtonStyle.Primary, color: '#3498DB', row: 2 },
  { key: 'gt_partners', name: 'GT Partners', customEmojiName: 'gtpartners', defaultEmoji: '🎷', style: ButtonStyle.Primary, color: '#F39C12', row: 2 },
  { key: 'android_tests', name: 'Android Tests', customEmojiName: 'android', defaultEmoji: '🤖', style: ButtonStyle.Secondary, color: '#A4C639', row: 2 },
  { key: 'ios_tests', name: 'iOS Tests', customEmojiName: 'ios', defaultEmoji: '🍏', style: ButtonStyle.Secondary, color: '#BDC3C7', row: 2 },

  // Row 3 (3 buttons)
  { key: 'pc_tests', name: 'PC Tests', customEmojiName: 'pc', defaultEmoji: '🖥️', style: ButtonStyle.Secondary, color: '#34495E', row: 3 },
  { key: 'console_tests', name: 'Console Tests', customEmojiName: 'console', defaultEmoji: '🎮', style: ButtonStyle.Secondary, color: '#7F8C8D', row: 3 },
  { key: 'vr_tests', name: 'VR Tests', customEmojiName: 'vr', defaultEmoji: '👓', style: ButtonStyle.Secondary, color: '#95A5A6', row: 3 }
];

export const TEMPLATES = {
  hansraj_games: {
    title: '🎮 Get Your Self Roles! • HANSRAJ Games',
    description: 
      `**React or click the buttons below to get your preferred game roles!**\n\n` +
      `This will help you get access to different game channels, team lobbies, and updates on the server. If you have any questions, feel free to ask! ☕✨`,
    items: HANSRAJ_GAMES
  },
  gametester: {
    title: 'Roles Selection',
    description:
      `Here you get to pick what subjects and devices you would like updates and notifications on. ` +
      `All you have to do is click any of the subjects at the bottom of this message and you will gain access to the role and any associated channels.`,
    items: GAMETESTER_ROLES
  }
};

/**
 * Resolves a custom or unicode emoji safely for a Discord button
 */
export const resolveButtonEmoji = (guild, customEmojiName, defaultEmoji) => {
  if (guild?.emojis?.cache) {
    const cleanName = (customEmojiName || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const serverEmoji = guild.emojis.cache.find(e => e.name.toLowerCase() === cleanName);
    if (serverEmoji) {
      return { id: serverEmoji.id, name: serverEmoji.name };
    }
  }
  return defaultEmoji;
};

/**
 * Builds the interactive Game Roles Embed & Action Rows
 */
export const buildGameRolesPanel = ({
  templateKey = 'hansraj_games',
  customTitle = null,
  customDescription = null,
  guild = null,
  rolesMap = {}
} = {}) => {
  const template = TEMPLATES[templateKey] || TEMPLATES.hansraj_games;
  const title = customTitle || template.title;
  const description = customDescription || template.description;
  const items = template.items;

  const embed = new EmbedBuilder()
    .setColor('#F1C40F')
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'AHP Group Pvt. Ltd. • Click any button to claim or remove role! 💖' })
    .setTimestamp();

  // Group items by row (max 5 buttons per row)
  const rowsMap = new Map();
  for (const item of items) {
    const rNum = item.row || 1;
    if (!rowsMap.has(rNum)) rowsMap.set(rNum, []);
    rowsMap.get(rNum).push(item);
  }

  const actionRows = [];

  for (const [rNum, rowItems] of rowsMap.entries()) {
    const actionRow = new ActionRowBuilder();

    for (const item of rowItems) {
      const roleId = rolesMap[item.key] || 'none';
      const button = new ButtonBuilder()
        .setCustomId(`gamerole_toggle:${templateKey}:${item.key}:${roleId}`)
        .setLabel(item.name)
        .setStyle(item.style);

      const emojiVal = resolveButtonEmoji(guild, item.customEmojiName, item.defaultEmoji);
      if (emojiVal) {
        try {
          button.setEmoji(emojiVal);
        } catch (err) {
          logger.warn(`Could not set emoji on button ${item.name}: ${err.message}`);
        }
      }

      actionRow.addComponents(button);
    }

    actionRows.push(actionRow);
  }

  return {
    embeds: [embed],
    components: actionRows
  };
};

/**
 * Handles button interactions when a member clicks a game role button
 */
export const handleGameRoleClick = async (interaction) => {
  if (!interaction.inGuild() || !interaction.guild) {
    return await interaction.reply({
      content: '❌ This button can only be used inside a Discord server.',
      ephemeral: true
    }).catch(() => {});
  }

  const parts = interaction.customId.split(':');
  const templateKey = parts[1];
  const itemKey = parts[2];
  let targetRoleId = parts[3];

  const template = TEMPLATES[templateKey] || TEMPLATES.hansraj_games;
  const itemDef = template.items.find(i => i.key === itemKey);

  if (!itemDef) {
    return await interaction.reply({
      content: '❌ Unknown role item selection.',
      ephemeral: true
    }).catch(() => {});
  }

  // Check bot permissions
  const botMember = interaction.guild.members.me || await interaction.guild.members.fetchMe().catch(() => null);
  if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return await interaction.reply({
      content: '❌ **Permission Error:** I need the **Manage Roles** permission to give or remove roles. Please ask a server administrator to grant me this permission!',
      ephemeral: true
    }).catch(() => {});
  }

  // Resolve role from cache or guild
  let role = null;
  if (targetRoleId && targetRoleId !== 'none') {
    role = interaction.guild.roles.cache.get(targetRoleId) || await interaction.guild.roles.fetch(targetRoleId).catch(() => null);
  }

  if (!role) {
    const guildConfig = await getGuildConfig(interaction.guildId).catch(() => null);
    const savedRoles = guildConfig?.gameRoles || {};
    if (savedRoles[itemKey]) {
      role = interaction.guild.roles.cache.get(savedRoles[itemKey]) || await interaction.guild.roles.fetch(savedRoles[itemKey]).catch(() => null);
    }
  }

  if (!role) {
    // Lookup by role name
    role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === itemDef.name.toLowerCase());
  }

  if (!role) {
    return await interaction.reply({
      content: `❌ **Role Not Found:** The role for **${itemDef.name}** was not found on this server. Please ask a server admin to re-run \`/setup_games_roles\`.`,
      ephemeral: true
    }).catch(() => {});
  }

  // Role hierarchy check
  if (role.position >= botMember.roles.highest.position) {
    return await interaction.reply({
      content: `❌ **Hierarchy Error:** The role **${role.name}** is positioned higher than (or equal to) my bot role in Server Settings > Roles. Please ask an admin to drag my bot role above **${role.name}**!`,
      ephemeral: true
    }).catch(() => {});
  }

  const member = interaction.member;
  const hasRole = member.roles.cache.has(role.id);

  try {
    if (hasRole) {
      await member.roles.remove(role, 'User removed self game role via panel');
      return await interaction.reply({
        content: `❌ **Removed role:** <@&${role.id}> (\`${role.name}\`)\nYou will no longer receive notifications or access for this game.`,
        ephemeral: true
      });
    } else {
      await member.roles.add(role, 'User self-assigned game role via panel');
      return await interaction.reply({
        content: `✅ **Added role:** <@&${role.id}> (\`${role.name}\`)\nYou now have access to this game's channels and alerts! 🎮✨`,
        ephemeral: true
      });
    }
  } catch (err) {
    logger.error(`Error toggling game role ${role.name} for user ${interaction.user.tag}:`, err);
    return await interaction.reply({
      content: `❌ **Failed to update role:** ${err.message}`,
      ephemeral: true
    }).catch(() => {});
  }
};
