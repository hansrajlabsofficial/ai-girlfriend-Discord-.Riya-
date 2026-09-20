import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getUserData } from '../database/models/User.js';
import { renderBankCard, formatMoney, getBalance, generateUserSignature } from '../services/economyService.js';
import { getRelationshipTitle } from '../services/rpgService.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('bank_balance')
  .setDescription('Check your Bank Balance & Official Relationship Card!')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('The user whose bank card you want to view (defaults to yourself)')
      .setRequired(false)
  );

export const execute = async (interaction) => {
  await interaction.deferReply().catch(() => {});

  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userDoc = await getUserData(targetUser.id, interaction.guildId);

    let partnerName = null;
    if (userDoc.isDailyPartner) {
      partnerName = "👑 Riya's Partner of the Day 💖";
    } else if (userDoc.partnerId) {
      const pUser = await interaction.client.users.fetch(userDoc.partnerId).catch(() => null);
      if (pUser) partnerName = pUser.username + ' 💕';
    }

    const cardBuffer = await renderBankCard(targetUser, userDoc, partnerName);
    const attachment = new AttachmentBuilder(cardBuffer, { name: 'bank-card.png' });

    const balance = getBalance(userDoc);
    const title = getRelationshipTitle(userDoc.level || 1);
    const userSig = generateUserSignature(targetUser);

    const embed = new EmbedBuilder()
      .setColor('#FF1493')
      .setTitle(`💳 ${targetUser.username}'s Bank Balance & Relationship Card`)
      .setThumbnail('https://i.postimg.cc/63xkK4YM/HANSRAJ-AYAN-OFFICIAL-COMMUNITY-Global-Bank-discord-server.png')
      .setDescription(
        `💰 **Bank Balance:** **${formatMoney(balance)}**\n` +
        `📊 **Level:** **${userDoc.level || 1}** (${userDoc.xp || 0} XP)\n` +
        `💖 **Title:** \`${title}\`\n` +
        `💍 **Partner:** \`${partnerName || 'Riya 💕'}\` \n` +
        `✒️ **Authorised Signature:** \`${userSig}\``
      )
      .setImage('attachment://bank-card.png')
      .setFooter({ text: `Riya Official Banking System • Signature: ${userSig}` });

    await interaction.editReply({ embeds: [embed], files: [attachment] });

  } catch (error) {
    logger.error('Error executing /bank_balance command:', error);
    await interaction.editReply({ content: '❌ Failed to render bank balance card.' }).catch(() => {});
  }
};
