import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserData, saveUserData } from '../database/models/User.js';
import { addBalance, deductBalance, getBalance, formatMoney } from '../services/economyService.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Flip a coin! Bet your coins or flip for fun!')
  .addStringOption(opt =>
    opt.setName('choice')
      .setDescription('Pick Heads or Tails')
      .setRequired(false)
      .addChoices(
        { name: '🪙 Heads', value: 'heads' },
        { name: '🪙 Tails', value: 'tails' }
      )
  )
  .addIntegerOption(opt =>
    opt.setName('bet')
      .setDescription('Bet amount in coins (minimum $100)')
      .setRequired(false)
      .setMinValue(100)
  );

export const execute = async (interaction) => {
  try {
    // 1. Immediately defer reply to guarantee NO Discord 3-second timeout
    await interaction.deferReply().catch(() => {});

    const rawChoice = interaction.options.getString('choice');
    const rawBet = interaction.options.getInteger('bet');

    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    // 2. Fetch User Data
    const userDoc = await getUserData(userId, guildId);
    const currentBalance = getBalance(userDoc);

    // 3. Casual Free Flip (if no bet was placed)
    if (!rawBet || rawBet <= 0) {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const userPrediction = rawChoice ? rawChoice.toLowerCase() : null;

      let resultText = `🪙 The coin spun high in the air and landed on **${result.toUpperCase()}**!`;
      if (userPrediction) {
        if (userPrediction === result) {
          resultText += `\n🎯 **Great call!** Your prediction of **${userPrediction.toUpperCase()}** was correct! ✨`;
        } else {
          resultText += `\n😅 Better luck next time! You guessed **${userPrediction.toUpperCase()}**.`;
        }
      }

      resultText += `\n\n💡 *Tip: Place a bet with \`/coinflip bet:1000 choice:heads\` to win double coins!*`;

      const freeEmbed = new EmbedBuilder()
        .setColor(result === 'heads' ? '#FFD700' : '#E67E22')
        .setTitle(`🪙 Coinflip Result: ${result.toUpperCase()}`)
        .setDescription(resultText)
        .setFooter({ text: `Current Wallet Balance: ${formatMoney(currentBalance)}` })
        .setTimestamp();

      return await interaction.editReply({ embeds: [freeEmbed] });
    }

    // 4. Bet-based Coinflip Game
    const bet = rawBet;
    const choice = (rawChoice || 'heads').toLowerCase();

    // Balance check
    if (currentBalance < bet) {
      return await interaction.editReply({
        content: `❌ **Insufficient Funds!** You need **${formatMoney(bet)}**, but your current balance is **${formatMoney(currentBalance)}**.`
      });
    }

    // Deduct bet from balance
    const deducted = await deductBalance(userDoc, bet);
    if (!deducted) {
      return await interaction.editReply({
        content: `❌ **Transaction Failed:** Could not deduct **${formatMoney(bet)}** from wallet.`
      });
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = (result === choice);

    let finalBal = getBalance(userDoc);
    let embedColor = '#E74C3C';
    let title = '';
    let description = '';

    if (isWin) {
      const winPayout = bet * 2;
      finalBal = await addBalance(userDoc, winPayout);
      embedColor = '#00FF7F';
      title = `🪙 Coin Landed on ${result.toUpperCase()}! • YOU WON! 🎉`;
      description = 
        `🪙 **Coin Result:** **${result.toUpperCase()}**\n` +
        `🎯 **Your Prediction:** **${choice.toUpperCase()}**\n\n` +
        `💰 **Bet Placed:** **${formatMoney(bet)}**\n` +
        `💵 **Profit Won:** **+${formatMoney(bet)}**\n` +
        `🎉 **Total Payout:** **${formatMoney(winPayout)}**\n\n` +
        `💳 **Updated Wallet Balance:** **${formatMoney(finalBal)}**`;
    } else {
      embedColor = '#FF4500';
      title = `🪙 Coin Landed on ${result.toUpperCase()}! • YOU LOST! ❌`;
      description = 
        `🪙 **Coin Result:** **${result.toUpperCase()}**\n` +
        `🎯 **Your Prediction:** **${choice.toUpperCase()}**\n\n` +
        `💰 **Bet Lost:** **-${formatMoney(bet)}**\n` +
        `💳 **Remaining Wallet Balance:** **${formatMoney(finalBal)}**\n\n` +
        `*Amdavadi Riya says: "Baka, double down on the next flip and win it back!"* ☕`;
    }

    await saveUserData(userDoc);

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(title)
      .setDescription(description)
      .setThumbnail(result === 'heads' 
        ? 'https://cdn-icons-png.flaticon.com/512/217/217853.png' 
        : 'https://cdn-icons-png.flaticon.com/512/217/217854.png')
      .setFooter({ text: 'AHP Group Pvt. Ltd. • Riya Casino Suite 💖' })
      .setTimestamp();

    // Interactive Re-flip Buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cf_play_${choice}_${bet}`)
        .setLabel(`🪙 Flip Again (${choice.toUpperCase()})`)
        .setStyle(isWin ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`cf_play_${choice === 'heads' ? 'tails' : 'heads'}_${bet}`)
        .setLabel(`🔄 Switch to ${(choice === 'heads' ? 'tails' : 'heads').toUpperCase()}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const replyMsg = await interaction.editReply({ embeds: [embed], components: [row] });

    // Handle interactive button clicks for 90 seconds
    if (replyMsg && typeof replyMsg.createMessageComponentCollector === 'function') {
      const collector = replyMsg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 90000
      });

      collector.on('collect', async btnInteraction => {
        try {
          await btnInteraction.deferUpdate().catch(() => {});

          const parts = btnInteraction.customId.split('_');
          const nextChoice = parts[2];
          const nextBet = parseInt(parts[3], 10);

          const freshUserDoc = await getUserData(userId, guildId);
          const freshBalance = getBalance(freshUserDoc);

          if (freshBalance < nextBet) {
            return await btnInteraction.followUp({
              content: `❌ **Insufficient Funds!** You have **${formatMoney(freshBalance)}**, but need **${formatMoney(nextBet)}** to flip again.`,
              ephemeral: true
            });
          }

          await deductBalance(freshUserDoc, nextBet);
          const nextResult = Math.random() < 0.5 ? 'heads' : 'tails';
          const nextWin = (nextResult === nextChoice);

          let updatedBal = getBalance(freshUserDoc);
          let nextColor = '#FF4500';
          let nextTitle = '';
          let nextDesc = '';

          if (nextWin) {
            const nextPayout = nextBet * 2;
            updatedBal = await addBalance(freshUserDoc, nextPayout);
            nextColor = '#00FF7F';
            nextTitle = `🪙 Coin Landed on ${nextResult.toUpperCase()}! • YOU WON! 🎉`;
            nextDesc = 
              `🪙 **Coin Result:** **${nextResult.toUpperCase()}**\n` +
              `🎯 **Your Prediction:** **${nextChoice.toUpperCase()}**\n\n` +
              `💰 **Bet Placed:** **${formatMoney(nextBet)}**\n` +
              `💵 **Profit Won:** **+${formatMoney(nextBet)}**\n` +
              `🎉 **Total Payout:** **${formatMoney(nextPayout)}**\n\n` +
              `💳 **Updated Wallet Balance:** **${formatMoney(updatedBal)}**`;
          } else {
            nextColor = '#FF4500';
            nextTitle = `🪙 Coin Landed on ${nextResult.toUpperCase()}! • YOU LOST! ❌`;
            nextDesc = 
              `🪙 **Coin Result:** **${nextResult.toUpperCase()}**\n` +
              `🎯 **Your Prediction:** **${nextChoice.toUpperCase()}**\n\n` +
              `💰 **Bet Lost:** **-${formatMoney(nextBet)}**\n` +
              `💳 **Remaining Wallet Balance:** **${formatMoney(updatedBal)}**\n\n` +
              `*Amdavadi Riya says: "Don't give up baka, try again!"* ☕`;
          }

          await saveUserData(freshUserDoc);

          const nextEmbed = new EmbedBuilder()
            .setColor(nextColor)
            .setTitle(nextTitle)
            .setDescription(nextDesc)
            .setThumbnail(nextResult === 'heads' 
              ? 'https://cdn-icons-png.flaticon.com/512/217/217853.png' 
              : 'https://cdn-icons-png.flaticon.com/512/217/217854.png')
            .setFooter({ text: 'AHP Group Pvt. Ltd. • Riya Casino Suite 💖' })
            .setTimestamp();

          const nextRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`cf_play_${nextChoice}_${nextBet}`)
              .setLabel(`🪙 Flip Again (${nextChoice.toUpperCase()})`)
              .setStyle(nextWin ? ButtonStyle.Success : ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`cf_play_${nextChoice === 'heads' ? 'tails' : 'heads'}_${nextBet}`)
              .setLabel(`🔄 Switch to ${(nextChoice === 'heads' ? 'tails' : 'heads').toUpperCase()}`)
              .setStyle(ButtonStyle.Secondary)
          );

          await interaction.editReply({ embeds: [nextEmbed], components: [nextRow] });
        } catch (bErr) {
          logger.error('Error handling coinflip button click:', bErr);
        }
      });

      collector.on('end', async () => {
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cf_done1').setLabel('🪙 Flip Ended').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('cf_done2').setLabel('Run /coinflip again').setStyle(ButtonStyle.Secondary).setDisabled(true)
          );
          await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        } catch (e) {}
      });
    }

  } catch (error) {
    logger.error('Error in /coinflip command execution:', error);
    const errContent = '❌ An unexpected error occurred while flipping the coin. Please try again!';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errContent }).catch(() => {});
    } else {
      await interaction.reply({ content: errContent, ephemeral: true }).catch(() => {});
    }
  }
};
