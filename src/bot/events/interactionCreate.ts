/**
 * Interaction Create Event
 * Handles slash command interactions, buttons, select menus, and modals
 */

import {
  Interaction,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  EmbedBuilder,
} from 'discord.js';
import { commands } from '../handlers/commands';
import { t } from '../../i18n';
import { checkTermsAccepted } from '../middleware/termsCheck';
import { query } from '../../db/pool';

export default {
  name: 'interactionCreate',
  async execute(interaction: Interaction) {
    // Handle different interaction types
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }
  },
};

/**
 * Handle slash command interactions
 */
async function handleCommand(interaction: any) {
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

    // Check terms acceptance (default: true, can be disabled with requireTerms: false)
    const requiresTerms = command.requireTerms !== false;
    if (requiresTerms) {
      const termsAccepted = await checkTermsAccepted(interaction, locale);
      if (!termsAccepted) {
        return; // Terms embed already sent by middleware
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
}

/**
 * Handle select menu interactions (language selection)
 */
async function handleSelectMenu(interaction: any) {
  if (!interaction.customId.startsWith('setup_language_')) return;

  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This can only be used in a server!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const selectedLocale = interaction.values[0];
    const guildId = interaction.guild.id;

    // Update guild locale in database
    await query(
      'UPDATE guilds SET locale = $1 WHERE guild_id = $2',
      [selectedLocale, guildId]
    );

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅ Language Updated!')
      .setDescription(
        `Server language has been changed to: **${selectedLocale === 'en-US' ? 'English 🇺🇸' : 'Tiếng Việt 🇻🇳'}**\n\n` +
        `All bot messages will now be displayed in this language.`
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });

    console.log(`\x1b[32m[SETUP] Language changed to ${selectedLocale} for guild: ${interaction.guild.name}\x1b[0m`);

  } catch (error) {
    console.error('[SELECT MENU] Error:', error);
    await interaction.reply({
      content: 'An error occurred while updating the language!',
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Handle button interactions (prefix setup)
 */
async function handleButton(interaction: any) {
  if (!interaction.customId.startsWith('setup_prefix_')) return;

  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This can only be used in a server!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Create modal for prefix input
    const modal = new ModalBuilder()
      .setCustomId(`modal_prefix_${interaction.guild.id}`)
      .setTitle('Change Server Prefix');

    const prefixInput = new TextInputBuilder()
      .setCustomId('prefix_input')
      .setLabel('New Prefix')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter new prefix (e.g., !, /, $)')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(10);

    const row = new ActionRowBuilder<ModalActionRowComponentBuilder>()
      .addComponents(prefixInput);

    modal.addComponents(row);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('[BUTTON] Error:', error);
  }
}

/**
 * Handle modal submissions (prefix change)
 */
async function handleModal(interaction: any) {
  if (!interaction.customId.startsWith('modal_prefix_')) return;

  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This can only be used in a server!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const newPrefix = interaction.fields.getTextInputValue('prefix_input');
    const guildId = interaction.guild.id;

    // Update guild prefix in database
    await query(
      'UPDATE guilds SET prefix = $1 WHERE guild_id = $2',
      [newPrefix, guildId]
    );

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('✅ Prefix Updated!')
      .setDescription(
        `Server prefix has been changed to: **\`${newPrefix}\`**\n\n` +
        `You can now use commands like: \`${newPrefix}help\`, \`${newPrefix}ping\`\n\n` +
        `Note: Slash commands (/) will always work regardless of the prefix!`
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });

    console.log(`\x1b[32m[SETUP] Prefix changed to "${newPrefix}" for guild: ${interaction.guild.name}\x1b[0m`);

  } catch (error) {
    console.error('[MODAL] Error:', error);
    await interaction.reply({
      content: 'An error occurred while updating the prefix!',
      flags: MessageFlags.Ephemeral,
    });
  }
}
