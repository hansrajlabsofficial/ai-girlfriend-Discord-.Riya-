import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { getUserData, saveUserData } from '../database/models/User.js';
import { getBalance, addBalance, deductBalance, formatMoney } from '../services/economyService.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('catchme')
  .setDescription('Tactical 1v1 Grid Chase: Runner (🏃) vs Hunter (🚔) on a 5x5 city grid!')
  .addUserOption(opt =>
    opt.setName('opponent')
      .setDescription('The user you want to challenge to a tactical grid chase')
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName('bet')
      .setDescription('Optional wager coins per player (minimum $100 if specified)')
      .setRequired(false)
      .setMinValue(100)
  );

/**
 * Renders the 5x5 grid in Discord emoji format
 */
function renderGrid(runner, hunter, obstacles, goal, runnerSmoked, isCaught) {
  let output = '';
  for (let r = 0; r < 5; r++) {
    let rowStr = '';
    for (let c = 0; c < 5; c++) {
      if (isCaught && r === hunter.r && c === hunter.c && r === runner.r && c === runner.c) {
        rowStr += '💥 ';
      } else if (r === hunter.r && c === hunter.c) {
        rowStr += '🚔 ';
      } else if (r === runner.r && c === runner.c) {
        rowStr += runnerSmoked ? '❓ ' : '🏃 ';
      } else if (r === goal.r && c === goal.c) {
        rowStr += '🚁 ';
      } else if (obstacles.has(`${r},${c}`)) {
        rowStr += '🚧 ';
      } else {
        rowStr += '⬛ ';
      }
    }
    output += rowStr.trim() + '\n';
  }
  return output.trim();
}

/**
 * Generates 3-4 random roadblocks while keeping start and extraction paths clear
 */
function generateObstacles() {
  const obstacles = new Set();
  const forbidden = new Set([
    '0,4', // Goal Helipad
    '4,0', // Runner Start
    '0,0', // Hunter Start
    '0,3', // Helipad Access 1
    '1,4', // Helipad Access 2
    '4,1', // Runner Escape 1
    '3,0'  // Runner Escape 2
  ]);

  const candidateCells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const key = `${r},${c}`;
      if (!forbidden.has(key)) {
        candidateCells.push(key);
      }
    }
  }

  // Shuffle candidate cells
  candidateCells.sort(() => Math.random() - 0.5);

  // Pick 3 to 4 roadblocks
  const count = Math.random() < 0.5 ? 3 : 4;
  for (let i = 0; i < count && i < candidateCells.length; i++) {
    obstacles.add(candidateCells[i]);
  }

  return obstacles;
}

export const execute = async (interaction) => {
  try {
    await interaction.deferReply().catch(() => {});

    const challenger = interaction.user;
    const opponent = interaction.options.getUser('opponent');
    const rawBet = interaction.options.getInteger('bet');
    const bet = rawBet && rawBet >= 100 ? rawBet : 0;
    const guildId = interaction.guildId;

    // 1. Validation checks
    if (opponent.id === challenger.id) {
      return await interaction.editReply({
        content: '❌ **Cannot Play Yourself:** You cannot chase yourself through the streets, baka! Tag a friend.'
      });
    }

    if (opponent.bot) {
      return await interaction.editReply({
        content: '🤖 **No Bots Allowed:** Discord bots don\'t know how to pilot police cruisers or dodge roadblocks!'
      });
    }

    // 2. Wager balance verification
    if (bet > 0) {
      const cDoc = await getUserData(challenger.id, guildId);
      const oDoc = await getUserData(opponent.id, guildId);

      const cBal = getBalance(cDoc);
      const oBal = getBalance(oDoc);

      if (cBal < bet) {
        return await interaction.editReply({
          content: `❌ **Insufficient Funds:** You have **${formatMoney(cBal)}**, but placed a wager of **${formatMoney(bet)}**!`
        });
      }

      if (oBal < bet) {
        return await interaction.editReply({
          content: `❌ **Opponent Insufficient Funds:** <@${opponent.id}> only has **${formatMoney(oBal)}** in their wallet!`
        });
      }
    }

    // 3. Challenge invitation Embed
    const acceptRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cm_accept_${opponent.id}`)
        .setLabel(bet > 0 ? `⚔️ Accept Chase (${formatMoney(bet)})` : '⚔️ Accept Chase')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`cm_decline_${opponent.id}`)
        .setLabel('❌ Decline')
        .setStyle(ButtonStyle.Danger)
    );

    const challengeEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🚔🏃 Tactical 1v1 Grid Chase Challenge!')
      .setDescription(
        `Hey <@${opponent.id}>! **${challenger.username}** has challenged you to a tactical cat-and-mouse chase on a 5×5 city grid!\n\n` +
        `🏃 **Runner:** <@${challenger.id}> *(Goal: Reach 🚁 extraction or survive 10 rounds)*\n` +
        `🚔 **Hunter:** <@${opponent.id}> *(Goal: Intercept & tackle the Runner)*\n\n` +
        (bet > 0 ? `💰 **Wager Pot:** **${formatMoney(bet * 2)}** *(${formatMoney(bet)} each)*\n\n` : '🎮 **Type:** Casual friendly match\n\n') +
        `Click **Accept** below within 60 seconds to deploy into the city grid!`
      )
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/2913/2913990.png')
      .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.' });

    const replyMsg = await interaction.editReply({
      content: `<@${opponent.id}>`,
      embeds: [challengeEmbed],
      components: [acceptRow]
    });

    // 4. Challenge Acceptance Collector
    const acceptCollector = replyMsg.createMessageComponentCollector({
      time: 60000
    });

    acceptCollector.on('collect', async (btnInt) => {
      try {
        if (btnInt.user.id !== opponent.id) {
          return await btnInt.reply({
            content: `❌ **Anti-Cheat Warning:** Only <@${opponent.id}> can accept or decline this chase challenge!`,
            ephemeral: true
          });
        }

        if (btnInt.customId.startsWith('cm_decline_')) {
          acceptCollector.stop('declined');
          return await btnInt.update({
            content: `❌ <@${opponent.id}> declined the Tactical Grid Chase challenge.`,
            embeds: [],
            components: []
          });
        }

        if (btnInt.customId.startsWith('cm_accept_')) {
          acceptCollector.stop('accepted');

          // Check balance again in case it changed
          if (bet > 0) {
            const freshC = await getUserData(challenger.id, guildId);
            const freshO = await getUserData(opponent.id, guildId);

            if (getBalance(freshC) < bet || getBalance(freshO) < bet) {
              return await btnInt.update({
                content: '❌ Match cancelled! One of the players no longer has enough balance.',
                embeds: [],
                components: []
              });
            }

            await deductBalance(freshC, bet);
            await deductBalance(freshO, bet);
            await saveUserData(freshC);
            await saveUserData(freshO);
          }

          // Acknowledge acceptance
          await btnInt.deferUpdate().catch(() => {});

          // Launch Game Session
          await startGridChaseGame(interaction, challenger, opponent, bet, guildId);
        }
      } catch (err) {
        logger.error('Error during catchme accept collector:', err);
      }
    });

    acceptCollector.on('end', async (_, reason) => {
      if (reason === 'time') {
        try {
          const timeoutEmbed = new EmbedBuilder()
            .setColor('#7F8C8D')
            .setTitle('⌛ Challenge Expired')
            .setDescription(`The challenge to <@${opponent.id}> timed out without a response.`)
            .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.' });

          await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        } catch (e) {}
      }
    });

  } catch (error) {
    logger.error('Error executing /catchme command:', error);
    const errContent = '❌ An unexpected error occurred while setting up the grid chase.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errContent }).catch(() => {});
    } else {
      await interaction.reply({ content: errContent, ephemeral: true }).catch(() => {});
    }
  }
};

/**
 * Main Game Loop for Tactical 1v1 Grid Chase
 */
async function startGridChaseGame(interaction, runnerUser, hunterUser, bet, guildId) {
  // Game Coordinates & State
  const goal = { r: 0, c: 4 };
  const runner = { r: 4, c: 0 };
  const hunter = { r: 0, c: 0 };
  const obstacles = generateObstacles();

  let round = 1;
  const maxRounds = 10;
  let currentTurn = 'runner'; // Runner moves first

  // Special abilities
  let runnerSmokeUsed = false;
  let runnerSmokeActive = false;
  let hunterSprintUsed = false;
  let hunterSprintActive = false;

  let lastMoveEvent = 'Match started! Runner moves first to escape the police dragnet.';

  // Helper to build action rows
  const buildControls = () => {
    const isRunnerTurn = (currentTurn === 'runner');

    const dirRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cm_move_up').setLabel('Up').setEmoji('⬆️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('cm_move_down').setLabel('Down').setEmoji('⬇️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('cm_move_left').setLabel('Left').setEmoji('⬅️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('cm_move_right').setLabel('Right').setEmoji('➡️').setStyle(ButtonStyle.Primary)
    );

    const powerRow = new ActionRowBuilder();

    if (isRunnerTurn) {
      powerRow.addComponents(
        new ButtonBuilder()
          .setCustomId('cm_power_smoke')
          .setLabel(runnerSmokeActive ? '💨 Smoke ACTIVE (Position Obscured)' : (runnerSmokeUsed ? '💨 Smoke Used' : '💨 Smoke Bomb (1x)'))
          .setStyle(runnerSmokeActive ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(runnerSmokeUsed || runnerSmokeActive)
      );
    } else {
      powerRow.addComponents(
        new ButtonBuilder()
          .setCustomId('cm_power_sprint')
          .setLabel(hunterSprintActive ? '⚡ Sprint ARMED (Next Move 2x)' : (hunterSprintUsed ? '⚡ Sprint Used' : '⚡ Siren Sprint (1x)'))
          .setStyle(hunterSprintActive ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(hunterSprintUsed || hunterSprintActive)
      );
    }

    return [dirRow, powerRow];
  };

  // Helper to render embed
  const buildBoardEmbed = () => {
    const isRunnerTurn = (currentTurn === 'runner');
    const activePlayer = isRunnerTurn ? runnerUser : hunterUser;
    const activeRole = isRunnerTurn ? '🏃 Runner' : '🚔 Hunter';

    const gridString = renderGrid(runner, hunter, obstacles, goal, runnerSmokeActive, false);

    const embed = new EmbedBuilder()
      .setColor(isRunnerTurn ? '#3498DB' : '#E74C3C')
      .setTitle(`🏙️ Tactical Grid Chase • Round ${round} / ${maxRounds}`)
      .setDescription(
        `\`\`\`\n${gridString}\n\`\`\`\n` +
        `🎯 **Round:** **${round} / ${maxRounds}**\n` +
        `👉 **Current Turn:** <@${activePlayer.id}> (${activeRole})\n` +
        `*( ${lastMoveEvent} )*\n\n` +
        (bet > 0 ? `💰 **Wager Pot:** **${formatMoney(bet * 2)}**\n` : '') +
        `🚁 **Helipad Goal:** \`Row 1, Col 5 (Top-Right)\` | 🚧 **Roadblocks:** \`Active\`\n\n` +
        `*Use the direction buttons below to maneuver!*`
      )
      .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.' });

    return embed;
  };

  const gameMsg = await interaction.editReply({
    content: null,
    embeds: [buildBoardEmbed()],
    components: buildControls()
  });

  const collector = gameMsg.createMessageComponentCollector({
    time: 45000 * 20 // 45s per turn max
  });

  collector.on('collect', async (btnInt) => {
    try {
      const isRunnerTurn = (currentTurn === 'runner');
      const activePlayer = isRunnerTurn ? runnerUser : hunterUser;

      // Anti-Cheat check: Only active player can click
      if (btnInt.user.id !== activePlayer.id) {
        return await btnInt.reply({
          content: `❌ **Anti-Cheat:** It is not your turn! Currently waiting for <@${activePlayer.id}> to move.`,
          ephemeral: true
        });
      }

      // Handle Smoke Bomb
      if (btnInt.customId === 'cm_power_smoke') {
        if (!isRunnerTurn || runnerSmokeUsed) {
          return await btnInt.reply({ content: '❌ Smoke Bomb is not available right now!', ephemeral: true });
        }
        runnerSmokeUsed = true;
        runnerSmokeActive = true;
        lastMoveEvent = `💨 Runner <@${runnerUser.id}> deployed a Smoke Bomb! Position is hidden on the radar!`;
        return await btnInt.update({
          embeds: [buildBoardEmbed()],
          components: buildControls()
        });
      }

      // Handle Sprint Boost
      if (btnInt.customId === 'cm_power_sprint') {
        if (isRunnerTurn || hunterSprintUsed) {
          return await btnInt.reply({ content: '❌ Siren Sprint is not available right now!', ephemeral: true });
        }
        hunterSprintActive = true;
        lastMoveEvent = `⚡ Hunter <@${hunterUser.id}> activated Siren Sprint! Next move will jump 2 tiles forward!`;
        return await btnInt.update({
          embeds: [buildBoardEmbed()],
          components: buildControls()
        });
      }

      // Handle Directions
      let dRow = 0;
      let dCol = 0;
      let dirName = '';

      if (btnInt.customId === 'cm_move_up') { dRow = -1; dirName = 'Up'; }
      else if (btnInt.customId === 'cm_move_down') { dRow = 1; dirName = 'Down'; }
      else if (btnInt.customId === 'cm_move_left') { dCol = -1; dirName = 'Left'; }
      else if (btnInt.customId === 'cm_move_right') { dCol = 1; dirName = 'Right'; }
      else return;

      const actor = isRunnerTurn ? runner : hunter;
      const isSprinting = (!isRunnerTurn && hunterSprintActive);
      const stepDistance = isSprinting ? 2 : 1;

      // Calculate path
      let nextR = actor.r + (dRow * stepDistance);
      let nextC = actor.c + (dCol * stepDistance);

      // Boundary check
      if (nextR < 0 || nextR > 4 || nextC < 0 || nextC > 4) {
        return await btnInt.reply({
          content: `⚠️ **Perimeter Blocked:** Moving ${dirName} would take you outside the 5×5 city limits!`,
          ephemeral: true
        });
      }

      // Roadblock check
      if (isSprinting) {
        const midR = actor.r + dRow;
        const midC = actor.c + dCol;
        if (obstacles.has(`${midR},${midC}`) || obstacles.has(`${nextR},${nextC}`)) {
          return await btnInt.reply({
            content: `🚧 **Obstacle Collision:** A roadblock is blocking that 2-tile sprint lane! Try another direction.`,
            ephemeral: true
          });
        }
      } else {
        if (obstacles.has(`${nextR},${nextC}`)) {
          return await btnInt.reply({
            content: `🚧 **Roadblock:** A concrete barricade is blocking tile (${nextR + 1}, ${nextC + 1})! Choose another path.`,
            ephemeral: true
          });
        }
      }

      // Execute Move
      actor.r = nextR;
      actor.c = nextC;

      if (isSprinting) {
        hunterSprintUsed = true;
        hunterSprintActive = false;
        lastMoveEvent = `⚡ Hunter sprinted 2 tiles ${dirName}!`;
      } else {
        lastMoveEvent = `${isRunnerTurn ? '🏃 Runner' : '🚔 Hunter'} moved ${dirName}.`;
      }

      // Turn off Smoke Bomb after Runner's move finishes
      if (isRunnerTurn && runnerSmokeActive) {
        runnerSmokeActive = false;
      }

      // Check Win Condition 1: Hunter catches Runner!
      if (hunter.r === runner.r && hunter.c === runner.c) {
        collector.stop('hunter_win');

        if (bet > 0) {
          const freshHunter = await getUserData(hunterUser.id, guildId);
          await addBalance(freshHunter, bet * 2);
          await saveUserData(freshHunter);
        }

        const bustedGrid = renderGrid(runner, hunter, obstacles, goal, false, true);

        const winEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 BUSTED! The Hunter Wins! 🚔')
          .setDescription(
            `\`\`\`\n${bustedGrid}\n\`\`\`\n` +
            `💥 **TAKEDOWN!** <@${hunterUser.id}> intercepted and tackled <@${runnerUser.id}> on **Round ${round}**!\n\n` +
            (bet > 0 ? `💰 **Wager Pot Won:** **+${formatMoney(bet * 2)}** *(Net Profit: +${formatMoney(bet)})*\n\n` : '') +
            `*Amdavadi Riya says: "Khel khatam, paisa hazam! What an aggressive interception, baka!"* 🚔💥`
          )
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/2913/2913990.png')
          .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.' });

        return await btnInt.update({
          embeds: [winEmbed],
          components: []
        });
      }

      // Check Win Condition 2: Runner reaches extraction helicopter!
      if (isRunnerTurn && runner.r === goal.r && runner.c === goal.c) {
        collector.stop('runner_win');

        if (bet > 0) {
          const freshRunner = await getUserData(runnerUser.id, guildId);
          await addBalance(freshRunner, bet * 2);
          await saveUserData(freshRunner);
        }

        const escapeGrid = renderGrid(runner, hunter, obstacles, goal, false, false);

        const escapeEmbed = new EmbedBuilder()
          .setColor('#00FF7F')
          .setTitle('🚁 EXTRACTION SUCCESSFUL! The Runner Wins! 🏃')
          .setDescription(
            `\`\`\`\n${escapeGrid}\n\`\`\`\n` +
            `🎉 <@${runnerUser.id}> reached the helipad and boarded the extraction helicopter!\n\n` +
            (bet > 0 ? `💰 **Wager Pot Won:** **+${formatMoney(bet * 2)}** *(Net Profit: +${formatMoney(bet)})*\n\n` : '') +
            `*Amdavadi Riya says: "Wah baka, what speed! Left the police squad eating dust at the rooftop!"* 🚁💨`
          )
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/2913/2913990.png')
          .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.' });

        return await btnInt.update({
          embeds: [escapeEmbed],
          components: []
        });
      }

      // Switch turn
      if (isRunnerTurn) {
        currentTurn = 'hunter';
      } else {
        currentTurn = 'runner';
        round++;

        // Check Win Condition 3: Turn limit expires (10 rounds ended)
        if (round > maxRounds) {
          collector.stop('runner_timeout_win');

          if (bet > 0) {
            const freshRunner = await getUserData(runnerUser.id, guildId);
            await addBalance(freshRunner, bet * 2);
            await saveUserData(freshRunner);
          }

          const timeoutGrid = renderGrid(runner, hunter, obstacles, goal, false, false);

          const timeEmbed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('⏱️ TIME EXPIRED! The Runner Escaped! 🏃')
            .setDescription(
              `\`\`\`\n${timeoutGrid}\n\`\`\`\n` +
              `🏃 <@${runnerUser.id}> outmaneuvered the Hunter and survived all **${maxRounds} full rounds** without getting caught!\n\n` +
              (bet > 0 ? `💰 **Wager Pot Won:** **+${formatMoney(bet * 2)}** *(Net Profit: +${formatMoney(bet)})*\n\n` : '') +
              `*Amdavadi Riya says: "Runner disappeared into the crowded city alleyways and vanished! Well played!"* 🌃✨`
            )
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/2913/2913990.png')
            .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.' });

          return await btnInt.update({
            embeds: [timeEmbed],
            components: []
          });
        }
      }

      // Update board for next turn
      await btnInt.update({
        embeds: [buildBoardEmbed()],
        components: buildControls()
      });

    } catch (turnErr) {
      logger.error('Error handling grid chase turn:', turnErr);
    }
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      try {
        const timeoutEmbed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('⌛ Game Timed Out')
          .setDescription(`The grid chase match ended due to inactivity.`)
          .setFooter({ text: '© 2026 | Developed by AHP Group Pvt. Ltd. | All Rights Reserved.' });

        await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      } catch (e) {}
    }
  });
}
