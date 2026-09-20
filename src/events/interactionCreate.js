import { logger } from '../utils/logger.js';
import { loadAllCommands } from '../utils/commandLoader.js';

import { hangupGlobalCall } from '../services/globalCallService.js';
import { hangupGlobalPrivateCall } from '../services/globalPrivateCallService.js';
import { handleGiveawayEntry } from '../services/giveawayService.js';

let commandsCache = null;

export const name = 'interactionCreate';

export const execute = async (interaction) => {
  if (!commandsCache) {
    const { commandsMap } = await loadAllCommands();
    commandsCache = commandsMap;
  }

  // 1. Handle Button Component Interactions
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('giveaway_enter_')) {
      await handleGiveawayEntry(interaction);
      return;
    }
    if (interaction.customId === 'btn_globalcall_end') {
      await hangupGlobalCall(interaction);
      return;
    }
    if (interaction.customId === 'btn_globalprivcall_end') {
      await hangupGlobalPrivateCall(interaction);
      return;
    }
  }

  // 2. Handle Slash Chat Input Commands
  if (interaction.isChatInputCommand()) {
    const command = commandsCache.get(interaction.commandName);
    if (!command) {
      logger.warn(`No command matching /${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing slash command /${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ There was an error while executing this command!', ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: '❌ There was an error while executing this command!', ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // 3. Handle Unhandled Component Interactions (Expired Buttons / Menus)
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    // If a button click wasn't consumed by an active collector within 2.5s, give friendly response
    setTimeout(async () => {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '💡 This menu or button interaction has timed out or expired. Please run the slash command again!',
          ephemeral: true
        }).catch(() => {});
      }
    }, 2500);
  }
};
