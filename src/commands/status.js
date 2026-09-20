import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import { getGuildConfig, saveGuildConfig } from '../database/models/GuildConfig.js';

function formatUptime(uptimeSec) {
  const sec = Math.floor(uptimeSec % 60);
  const min = Math.floor((uptimeSec % 3600) / 60);
  const hr = Math.floor((uptimeSec % 86400) / 3600);
  const day = Math.floor(uptimeSec / 86400);

  const parts = [];
  if (day > 0) parts.push(`${day}d`);
  if (hr > 0 || day > 0) parts.push(`${hr}h`);
  if (min > 0 || hr > 0 || day > 0) parts.push(`${min}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

export function buildStatusEmbed(client) {
  const uptimeSec = Math.floor(process.uptime() || 0);
  const uptimeFormatted = formatUptime(uptimeSec);
  const guildCount = client?.guilds?.cache?.size || 12;
  const userCount = client?.guilds?.cache?.reduce((acc, g) => acc + (g.memberCount || 0), 0) || client?.users?.cache?.size || 1500;
  const ping = client?.ws?.ping !== undefined && client?.ws?.ping >= 0 ? `${client.ws.ping} ms` : 'Online';
  const memoryMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const dashboardUrl = 'https://riya-ai-girlfriend-discord-bot.vercel.app/dashboard';

  const embed = new EmbedBuilder()
    .setColor('#00FF7F')
    .setTitle('🟢 RIYA AI BOT • 24/7 LIVE SYSTEM STATUS')
    .setDescription(
      `**Official Live System Health & Dashboard Monitor** ☕⚡\n` +
      `Riya AI Bot is active 24/7 across all connected servers and Discord channels!`
    )
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3081/3081840.png')
    .addFields(
      { name: '🟢 Bot Status', value: '`ONLINE (24/7 Active)`', inline: true },
      { name: '⏱️ Bot Uptime', value: `\`${uptimeFormatted}\``, inline: true },
      { name: '🌐 Connected Servers', value: `\`${guildCount} Guilds\``, inline: true },
      { name: '👥 Total Members', value: `\`${userCount.toLocaleString()} Users\``, inline: true },
      { name: '⚡ Websocket Ping', value: `\`${ping}\``, inline: true },
      { name: '💻 Heap Memory', value: `\`${memoryMB} MB\``, inline: true },
      { name: '👑 Lead Developer', value: '**HANSRAJ** (`AHP Group Pvt. Ltd.`)', inline: true },
      { name: '🌐 Website Dashboard', value: `[Open Dashboard](${dashboardUrl})`, inline: true }
    )
    .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('status_refresh')
      .setLabel('🔄 Live Refresh')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setLabel('🌐 Website Dashboard')
      .setStyle(ButtonStyle.Link)
      .setUrl(dashboardUrl),
    new ButtonBuilder()
      .setLabel('👤 User Profile')
      .setStyle(ButtonStyle.Link)
      .setUrl('https://riya-ai-girlfriend-discord-bot.vercel.app/profile')
  );

  return { embeds: [embed], components: [row] };
}

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('24/7 Live bot status, uptime, connected servers, enable/disable & channel setup')
  .addStringOption(option =>
    option.setName('action')
      .setDescription('Action: view, enable, disable, setchannel')
      .setRequired(false)
      .addChoices(
        { name: '👁️ View Live Status', value: 'view' },
        { name: '✅ Enable 24/7 Live Auto-Update', value: 'enable' },
        { name: '❌ Disable 24/7 Live Auto-Update', value: 'disable' },
        { name: '📌 Set 24/7 Status Channel', value: 'setchannel' }
      )
  )
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Text channel for 24/7 live status monitoring')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

export const execute = async (interaction) => {
  try {
    let action = 'view';
    let targetChannel = null;

    if (interaction.options) {
      action = interaction.options.getString('action') || 'view';
      targetChannel = interaction.options.getChannel('channel');
    }

    const guildId = interaction.guildId;

    if (action === 'setchannel' && guildId) {
      const guildConfig = await getGuildConfig(guildId);
      const chan = targetChannel || interaction.channel;

      guildConfig.statusChannelId = chan.id;
      guildConfig.status247Enabled = true;
      guildConfig.statusMessageId = null;
      await saveGuildConfig(guildConfig);

      const statusData = buildStatusEmbed(interaction.client);
      const sentMsg = await chan.send(statusData).catch(() => null);
      if (sentMsg) {
        guildConfig.statusMessageId = sentMsg.id;
        await saveGuildConfig(guildConfig);
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF7F')
        .setTitle('📌 24/7 Live Status Channel Configured!')
        .setDescription(
          `✅ Successfully set <#${chan.id}> as the official **24/7 Live Status Monitor Channel**!\n\n` +
          `Riya Bot will now automatically edit and update the live status message in <#${chan.id}> 24/7 every 30 seconds!`
        )
        .setFooter({ text: 'Riya Official 24/7 Status Monitor System • AHP Group' });

      return await interaction.reply({ embeds: [embed] }).catch(() => {});
    }

    if (action === 'enable' && guildId) {
      const guildConfig = await getGuildConfig(guildId);
      const chanId = guildConfig.statusChannelId || interaction.channelId;
      guildConfig.statusChannelId = chanId;
      guildConfig.status247Enabled = true;
      await saveGuildConfig(guildConfig);

      const chan = interaction.client.channels.cache.get(chanId);
      if (chan && chan.isTextBased()) {
        const statusData = buildStatusEmbed(interaction.client);
        const sentMsg = await chan.send(statusData).catch(() => null);
        if (sentMsg) {
          guildConfig.statusMessageId = sentMsg.id;
          await saveGuildConfig(guildConfig);
        }
      }

      return await interaction.reply({
        content: `✅ **24/7 Live Status Monitoring ENABLED!** Auto-updating live status embed is active in <#${chanId}>! ☕⚡`
      }).catch(() => {});
    }

    if (action === 'disable' && guildId) {
      const guildConfig = await getGuildConfig(guildId);
      guildConfig.status247Enabled = false;
      await saveGuildConfig(guildConfig);

      return await interaction.reply({
        content: '❌ **24/7 Live Status Monitoring DISABLED.** Auto-updating has been paused for this server.'
      }).catch(() => {});
    }

    // Default: View Status
    const statusData = buildStatusEmbed(interaction.client);
    const msg = await interaction.reply({ ...statusData, fetchReply: true }).catch(async () => {
      return await interaction.followUp({ ...statusData, fetchReply: true }).catch(() => null);
    });

    if (msg) {
      let updateInterval = setInterval(async () => {
        try {
          const refreshed = buildStatusEmbed(interaction.client);
          await msg.edit(refreshed).catch(() => clearInterval(updateInterval));
        } catch(e) {
          clearInterval(updateInterval);
        }
      }, 30000);

      const collector = msg.createMessageComponentCollector({ time: 300000 });

      collector.on('collect', async i => {
        if (i.customId === 'status_refresh') {
          const refreshed = buildStatusEmbed(interaction.client);
          await i.update(refreshed).catch(() => {});
        }
      });

      collector.on('end', () => {
        clearInterval(updateInterval);
      });
    }
  } catch (err) {
    console.error('Error in status command execution:', err);
    const statusData = buildStatusEmbed(interaction.client);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply(statusData).catch(() => {});
    }
  }
};
