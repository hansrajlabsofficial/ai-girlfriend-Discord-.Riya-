import { EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';

// Global Call State Store
let waitingLine = null; // { guildId, channelId, userId, guildName, timestamp }
const activeCalls = new Map(); // guildId -> { peerGuildId, peerChannelId, peerGuildName, callId, startTime }

export const startGlobalCall = async (interaction) => {
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;
  const guildName = interaction.guild.name;
  const userId = interaction.user.id;

  // 1. Check if already in an active call
  if (activeCalls.has(guildId)) {
    const active = activeCalls.get(guildId);
    return await interaction.reply({
      content: `📞 **Already in a Call!** Your server is currently connected to **${active.peerGuildName}**! Type \`/globalcall hangup\` or \`xhangup\` to end it!`,
      ephemeral: true
    });
  }

  // 2. Check if already waiting on line
  if (waitingLine && waitingLine.guildId === guildId) {
    return await interaction.reply({
      content: `📞 **Dialing in progress...** Your server is already waiting on the global hotline line! Waiting for another server to answer...`,
      ephemeral: true
    });
  }

  // 3. Match with waiting server if available
  if (waitingLine && waitingLine.guildId !== guildId) {
    const peer = waitingLine;
    waitingLine = null; // Clear waiting line

    const callId = `call_${Date.now()}`;
    const startTime = Date.now();

    activeCalls.set(guildId, {
      peerGuildId: peer.guildId,
      peerChannelId: peer.channelId,
      peerGuildName: peer.guildName,
      callId,
      startTime
    });

    activeCalls.set(peer.guildId, {
      peerGuildId: guildId,
      peerChannelId: channelId,
      peerGuildName: guildName,
      callId,
      startTime
    });

    // Send Connection Embeds to both channels
    const embedA = new EmbedBuilder()
      .setTitle('📞 GLOBAL CALL CONNECTED!')
      .setColor('#00FF7F')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/3059/3059502.png')
      .setDescription(
        `🎉 **Line Connected!** You are now connected live to **${peer.guildName}**!\n\n` +
        `💬 **How to talk:** Type messages or upload images in this channel to talk live across servers!\n` +
        `📵 Type \`/globalcall hangup\` or \`xhangup\` to end the call.`
      )
      .setFooter({ text: 'Riya Inter-Server Hotline Engine ☕✨' });

    const embedB = new EmbedBuilder()
      .setTitle('📞 GLOBAL CALL CONNECTED!')
      .setColor('#00FF7F')
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/3059/3059502.png')
      .setDescription(
        `🎉 **Line Connected!** You are now connected live to **${guildName}**!\n\n` +
        `💬 **How to talk:** Type messages or upload images in this channel to talk live across servers!\n` +
        `📵 Type \`/globalcall hangup\` or \`xhangup\` to end the call.`
      )
      .setFooter({ text: 'Riya Inter-Server Hotline Engine ☕✨' });

    // Reply to current caller
    await interaction.reply({ embeds: [embedA] });

    // Send connection notice to peer channel
    try {
      const peerChannel = interaction.client.channels.cache.get(peer.channelId) ||
        await interaction.client.channels.fetch(peer.channelId).catch(() => null);
      if (peerChannel) {
        await peerChannel.send({ embeds: [embedB] });
      }
    } catch (err) {
      logger.warn(`Failed to send call connected embed to peer channel: ${err.message}`);
    }

    return;
  }

  // 4. No server waiting: Put this server on the waiting line
  waitingLine = {
    guildId,
    channelId,
    userId,
    guildName,
    timestamp: Date.now()
  };

  const dialEmbed = new EmbedBuilder()
    .setTitle('📞 DIALING GLOBAL HOTLINE...')
    .setColor('#FFD700')
    .setThumbnail('https://cdn-icons-png.flaticon.com/512/3059/3059502.png')
    .setDescription(
      `☎️ *Ringing...* **${guildName}** is on the global phone line!\n\n` +
      `Waiting for another Discord server to dial in and pick up the call...\n` +
      `💡 *Stay tuned! As soon as another server calls, the line will connect automatically!*`
    )
    .setFooter({ text: 'Riya Inter-Server Hotline Engine ☕✨' });

  return await interaction.reply({ embeds: [dialEmbed] });
};

export const hangupGlobalCall = async (interaction) => {
  const guildId = interaction.guildId;

  // If waiting on line, cancel call waiting
  if (waitingLine && waitingLine.guildId === guildId) {
    waitingLine = null;
    const cancelEmbed = new EmbedBuilder()
      .setColor('#FF4500')
      .setTitle('📵 CALL CANCELLED')
      .setDescription('✅ Cancelled hotline dialing. Your server is no longer waiting for a call.');
    return await interaction.reply({ embeds: [cancelEmbed] });
  }

  // If in an active call
  if (activeCalls.has(guildId)) {
    const call = activeCalls.get(guildId);
    const peerGuildId = call.peerGuildId;
    const peerChannelId = call.peerChannelId;
    const peerGuildName = call.peerGuildName;

    activeCalls.delete(guildId);
    activeCalls.delete(peerGuildId);

    const hangupEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('📵 GLOBAL CALL ENDED')
      .setDescription(`👋 <@${interaction.user.id}> hung up the phone. Call with **${peerGuildName}** has ended!`);

    await interaction.reply({ embeds: [hangupEmbed] });

    // Notify peer channel
    try {
      const peerChannel = interaction.client.channels.cache.get(peerChannelId) ||
        await interaction.client.channels.fetch(peerChannelId).catch(() => null);
      if (peerChannel) {
        const peerNotice = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('📵 GLOBAL CALL ENDED')
          .setDescription(`👋 The line was hung up by **${interaction.guild.name}**. The global call has ended!`);
        await peerChannel.send({ embeds: [peerNotice] });
      }
    } catch (err) {
      logger.warn(`Failed to send call hangup embed to peer channel: ${err.message}`);
    }

    return;
  }

  return await interaction.reply({
    content: '❌ **No Active Call!** Your server is not currently in a global phone call.',
    ephemeral: true
  });
};

export const getCallStatus = async (interaction) => {
  const guildId = interaction.guildId;

  if (activeCalls.has(guildId)) {
    const call = activeCalls.get(guildId);
    const durationSec = Math.floor((Date.now() - call.startTime) / 1000);
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;

    const embed = new EmbedBuilder()
      .setTitle('📞 Active Global Call Status')
      .setColor('#00FF7F')
      .setDescription(
        `🟢 **Status:** Connected Live\n` +
        `🤝 **Connected Server:** **${call.peerGuildName}**\n` +
        `⏱️ **Call Duration:** **${mins}m ${secs}s**\n\n` +
        `📵 Type \`/globalcall hangup\` to end the call.`
      );
    return await interaction.reply({ embeds: [embed] });
  }

  if (waitingLine && waitingLine.guildId === guildId) {
    const embed = new EmbedBuilder()
      .setTitle('📞 Global Hotline Status')
      .setColor('#FFD700')
      .setDescription('🟡 **Status:** Dialing... Waiting for another server to pick up!');
    return await interaction.reply({ embeds: [embed] });
  }

  return await interaction.reply({
    content: '🔴 **Status:** Idle. No active global call. Type `/globalcall start` or `xcall` to dial out!',
    ephemeral: true
  });
};

export const handleGlobalCallRelay = async (message) => {
  try {
    if (message.author.bot || !message.guild) return false;

    const guildId = message.guild.id;
    if (!activeCalls.has(guildId)) return false;

    const call = activeCalls.get(guildId);

    // Verify message is in the connected call channel
    if (message.channel.id !== message.channel.id) return false;

    // Build Call Relay Embed
    const relayEmbed = new EmbedBuilder()
      .setColor('#00BFFF')
      .setAuthor({
        name: `${message.author.username} (${message.guild.name})`,
        iconURL: message.author.displayAvatarURL({ extension: 'png', size: 128 })
      })
      .setDescription(message.content || '*[Media Attachment]*')
      .setFooter({ text: `📞 Live Call • ${message.guild.name}` })
      .setTimestamp();

    const imageAttachment = message.attachments.find(a => a.contentType?.startsWith('image/'));
    if (imageAttachment) {
      relayEmbed.setImage(imageAttachment.url);
    }

    // React to origin message with 📞
    message.react('📞').catch(() => {});

    // Relay to peer channel
    try {
      const peerChannel = message.client.channels.cache.get(call.peerChannelId) ||
        await message.client.channels.fetch(call.peerChannelId).catch(() => null);

      if (peerChannel) {
        await peerChannel.send({ embeds: [relayEmbed] });
      }
    } catch (err) {
      logger.warn(`Failed to relay call message: ${err.message}`);
    }

    return true;

  } catch (err) {
    logger.error('Error handling global call relay:', err);
    return false;
  }
};
