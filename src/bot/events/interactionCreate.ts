/**
 * Interaction Create Event
 * Handles slash command interactions
 */

import { Interaction, MessageFlags } from 'discord.js';
import { commands } from '../loadCommands';
import { t } from '../../i18n';

export default {
  name: 'interactionCreate',
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      console.error(`\x1b[31m❌ Command not found: ${interaction.commandName}\x1b[0m`);
      return;
    }

    // Get user's locale (Discord provides this)
    const locale = interaction.locale || 'en-US';

    try {
      // Check if guild only
      if (command.guildOnly && !interaction.guild) {
        await interaction.reply({
          content: t('error.guild_only', {}, locale as any),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Check if owner only
      if (command.ownerOnly) {
        const ownerId = process.env.BOT_OWNER_ID;
        if (interaction.user.id !== ownerId) {
          await interaction.reply({
            content: t('error.permission_denied', {}, locale as any),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      // Execute command
      await command.execute({ interaction, locale });

      console.log(
        `\x1b[34m/${interaction.commandName}\x1b[0m executed by ` +
        `\x1b[36m${interaction.user.tag}\x1b[0m in ` +
        `\x1b[33m${interaction.guild?.name || 'DM'}\x1b[0m`
      );
    } catch (error) {
      console.error(`\x1b[31m❌ Error executing command ${interaction.commandName}:\x1b[0m`);
      console.error(error);

      // Check if error is due to interaction timeout
      const err = error as any;
      if (err.code === 10062 || err.code === 40060) {
        // Unknown interaction or already acknowledged - ignore
        return;
      }

      try {
        const errorMessage = t('error.unknown', {}, locale as any);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (replyError) {
        // Silently fail if we can't reply (interaction likely timed out)
      }
    }
  },
};
