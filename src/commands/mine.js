import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { getUserData, saveUserData } from '../database/models/User.js';
import { addBalance, formatMoney } from '../services/economyService.js';
import { addXp } from '../services/rpgService.js';
import { logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('mine')
  .setDescription('Click on rocks to mine ores & gems! Leave early or risk losing it ALL!');

const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown

const ORE_TYPES = [
  { name: '🥉 Copper Ore', emoji: '🥉', val: 300, xp: 30, weight: 40 },
  { name: '🥈 Iron Ore', emoji: '🥈', val: 750, xp: 60, weight: 30 },
  { name: '🥇 Gold Ore', emoji: '🥇', val: 2000, xp: 150, weight: 20 },
  { name: '💎 Diamond Gem', emoji: '💎', val: 5000, xp: 350, weight: 10 }
];

function getRandomOre() {
  const rand = Math.floor(Math.random() * 100);
  if (rand < 40) return ORE_TYPES[0]; // Copper
  if (rand < 70) return ORE_TYPES[1]; // Iron
  if (rand < 90) return ORE_TYPES[2]; // Gold
  return ORE_TYPES[3]; // Diamond
}

export const execute = async (interaction) => {
  const authorUser = interaction.user;
  const userDoc = await getUserData(authorUser.id, interaction.guildId);

  // Cooldown check
  const now = Date.now();
  const lastMine = userDoc.cooldowns?.mine || 0;
  if (now - lastMine < COOLDOWN_MS) {
    const nextUnix = Math.floor((lastMine + COOLDOWN_MS) / 1000);
    return interaction.reply({
      content: `⛏️ **Pickaxe Overheating!** Wait until <t:${nextUnix}:R> (<t:${nextUnix}:t>) before mining again!`,
      ephemeral: true
    });
  }

  // Generate 15-tile grid (3 rows x 5 columns = 15 tiles)
  // 3 tiles are CAVE-IN bombs (20% collapse risk per rock!)
  const totalTiles = 15;
  const numBombs = 3;

  const grid = Array(totalTiles).fill(null);
  const bombIndices = new Set();
  while (bombIndices.size < numBombs) {
    bombIndices.add(Math.floor(Math.random() * totalTiles));
  }

  for (let i = 0; i < totalTiles; i++) {
    if (bombIndices.has(i)) {
      grid[i] = { isBomb: true, emoji: '💥', label: 'CAVE-IN' };
    } else {
      const ore = getRandomOre();
      grid[i] = { isBomb: false, ore, emoji: ore.emoji, label: ore.name };
    }
  }

  const revealed = Array(totalTiles).fill(false);
  const collectedLoot = [];
  let totalValue = 0;
  let totalXp = 0;

  const buildEmbed = (statusText = null, isCollapsed = false, isEscaped = false) => {
    let color = '#5865F2'; // Discord Blurple
    if (isCollapsed) color = '#FF0000';
    if (isEscaped) color = '#00FF7F';

    let lootSummary = collectedLoot.length > 0
      ? collectedLoot.map(item => `${item.emoji} **${item.name}** (+${formatMoney(item.val)})`).join('\n')
      : '*No loot collected yet! Click a rock below to start!*';

    const embed = new EmbedBuilder()
      .setTitle('⛏️ MINING!')
      .setColor(color)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/3082/3082060.png')
      .setDescription(
        `**Click on the Rocks to Start Mining**\n` +
        `**Leave Early or Risk losing it ALL**\n\n` +
        `🧊 **Your LOOT!** (${formatMoney(totalValue)} • +${totalXp} XP)\n` +
        `${lootSummary}\n\n` +
        `💥 **Collapse Risk: 20% Per Rock.**`
      );

    if (statusText) {
      embed.addFields({ name: '📢 Status', value: statusText });
    }

    embed.setFooter({ text: 'Riya Underground Mining Engine ☕✨' });
    return embed;
  };

  const buildComponents = (disabledAll = false) => {
    const rows = [];

    // 3 rows of 5 rock buttons (15 tiles)
    for (let r = 0; r < 3; r++) {
      const row = new ActionRowBuilder();
      for (let c = 0; c < 5; c++) {
        const index = r * 5 + c;
        const btn = new ButtonBuilder().setCustomId(`mine_tile_${index}`);

        if (revealed[index]) {
          const tile = grid[index];
          btn.setEmoji(tile.emoji);
          btn.setDisabled(true);
          if (tile.isBomb) {
            btn.setStyle(ButtonStyle.Danger);
          } else {
            btn.setStyle(ButtonStyle.Success);
          }
        } else {
          btn.setEmoji('🪨');
          btn.setStyle(ButtonStyle.Secondary);
          if (disabledAll) btn.setDisabled(true);
        }

        row.addComponents(btn);
      }
      rows.push(row);
    }

    // Row 4: Controls (◀️, Leave Mine, ▶️)
    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mine_prev').setEmoji('◀️').setStyle(ButtonStyle.Primary).setDisabled(true),
      new ButtonBuilder().setCustomId('mine_leave').setLabel('Leave Mine').setStyle(ButtonStyle.Danger).setDisabled(disabledAll || collectedLoot.length === 0),
      new ButtonBuilder().setCustomId('mine_next').setEmoji('▶️').setStyle(ButtonStyle.Primary).setDisabled(true)
    );

    rows.push(controlRow);
    return rows;
  };

  const initialMsg = await interaction.reply({
    embeds: [buildEmbed()],
    components: buildComponents(),
    fetchReply: true
  });

  const collector = initialMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000
  });

  collector.on('collect', async i => {
    if (i.user.id !== authorUser.id) {
      return i.reply({ content: '❌ Use `/mine` to open your own mining session, Baka!', ephemeral: true });
    }

    // Handle Leave Mine (Cash out!)
    if (i.customId === 'mine_leave') {
      collector.stop('escaped');

      // Update user database with accumulated loot
      userDoc.cooldowns.mine = Date.now();
      if (!userDoc.inventory) userDoc.inventory = [];

      for (const item of collectedLoot) {
        userDoc.inventory.push(item.name);
      }

      await addBalance(userDoc, totalValue);
      const xpRes = addXp(userDoc, totalXp);
      await saveUserData(userDoc);

      const status = `🎉 **MINE EXCAVATED SAFELY!** You escaped with **${formatMoney(totalValue)}** & **+${totalXp} XP**! ${xpRes.leveledUp ? `Level Up to **Level ${xpRes.newLevel}**!` : ''}`;

      return i.update({
        embeds: [buildEmbed(status, false, true)],
        components: buildComponents(true)
      });
    }

    // Handle Rock Tile Click
    if (i.customId.startsWith('mine_tile_')) {
      const tileIndex = parseInt(i.customId.replace('mine_tile_', ''), 10);
      if (revealed[tileIndex]) return i.deferUpdate();

      revealed[tileIndex] = true;
      const tile = grid[tileIndex];

      if (tile.isBomb) {
        // CAVE-IN COLLAPSE! (All unrevealed tiles revealed as bombs/ores, all loot lost!)
        collector.stop('collapsed');

        for (let idx = 0; idx < totalTiles; idx++) {
          revealed[idx] = true;
        }

        userDoc.cooldowns.mine = Date.now();
        await saveUserData(userDoc);

        const status = `💥 **CAVE-IN! THE MINE COLLAPSED!** You struck a unstable rock and triggered a cavern collapse! All accumulated loot was destroyed under rocks! 🪨💸`;

        return i.update({
          embeds: [buildEmbed(status, true, false)],
          components: buildComponents(true)
        });
      } else {
        // Safe Ore Found!
        collectedLoot.push(tile.ore);
        totalValue += tile.ore.val;
        totalXp += tile.ore.xp;

        const status = `✨ You mined **${tile.ore.name}**! (+${formatMoney(tile.ore.val)} • +${tile.ore.xp} XP)`;

        return i.update({
          embeds: [buildEmbed(status)],
          components: buildComponents()
        });
      }
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason !== 'escaped' && reason !== 'collapsed') {
      // Timed out: Auto cash-out if loot collected, or finish
      if (collectedLoot.length > 0) {
        userDoc.cooldowns.mine = Date.now();
        if (!userDoc.inventory) userDoc.inventory = [];
        for (const item of collectedLoot) userDoc.inventory.push(item.name);
        await addBalance(userDoc, totalValue);
        addXp(userDoc, totalXp);
        await saveUserData(userDoc);
      }
      interaction.editReply({ components: buildComponents(true) }).catch(() => {});
    }
  });
};
