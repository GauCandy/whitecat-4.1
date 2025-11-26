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
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { commands } from '../handlers/commands';
import { t } from '../../i18n';
import { checkTermsAccepted } from '../middleware/termsCheck';
import { checkSlashCommandRestriction } from '../middleware/commandRestrictions';
import { query } from '../../db/pool';
import { createSetupStep2Embed, createSetupCompleteEmbed } from './guildCreate';
import { getLanguageInfo } from '../../i18n/languages-config';

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

  // Get guild's configured locale from database (or fallback to Discord locale)
  let locale = interaction.locale || 'en-US';

  if (interaction.guild) {
    try {
      const guildResult = await query(
        'SELECT locale FROM guilds WHERE guild_id = $1',
        [interaction.guild.id]
      );
      const guildLocale = guildResult.rows[0]?.locale;
      if (guildLocale) {
        locale = guildLocale;
      }
    } catch (error) {
      console.error('[LOCALE] Error fetching guild locale:', error);
      // Fallback to interaction.locale or 'en-US'
    }
  }

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

    // Check command channel restrictions
    const isRestricted = await checkSlashCommandRestriction(interaction, interaction.commandName, locale);
    if (isRestricted) {
      return; // Restriction message already sent
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
 * Handle select menu interactions
 */
async function handleSelectMenu(interaction: any) {
  // Setup Step 1: Language selection
  if (interaction.customId.startsWith('setup_step1_language_')) {
    await handleSetupStep1Language(interaction);
    return;
  }

  // Legacy language selection (for manual /setup command if exists)
  if (interaction.customId.startsWith('setup_language_')) {
    await handleLegacyLanguageSetup(interaction);
    return;
  }
}

/**
 * Handle Setup Step 1: Language Selection
 */
async function handleSetupStep1Language(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
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

    console.log(`\x1b[32m[SETUP] Language set to ${selectedLocale} for guild: ${interaction.guild.name}\x1b[0m`);

    // Move to Step 2: Prefix Setup
    await showSetupStep2(interaction, selectedLocale);

  } catch (error) {
    console.error('[SETUP STEP 1] Error:', error);
    const locale = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_language', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Handle legacy language setup (for manual setup commands)
 */
async function handleLegacyLanguageSetup(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
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

    const languageInfo = getLanguageInfo(selectedLocale);
    const locale = selectedLocale as any;

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(t('setup.legacy.language_updated_title', {}, locale))
      .setDescription(
        t('setup.legacy.language_updated_desc', {
          language: `${languageInfo.label} ${languageInfo.emoji}`
        }, locale)
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });

    console.log(`\x1b[32m[SETUP] Language changed to ${selectedLocale} for guild: ${interaction.guild.name}\x1b[0m`);

  } catch (error) {
    console.error('[SELECT MENU] Error:', error);
    const locale = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_language', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Handle button interactions
 */
async function handleButton(interaction: any) {
  // Setup Step 1: Use Default Language
  if (interaction.customId.startsWith('setup_step1_default_')) {
    await handleSetupStep1Default(interaction);
    return;
  }

  // Setup Step 2: Set Custom Prefix
  if (interaction.customId.startsWith('setup_step2_prefix_')) {
    await handleSetupStep2SetPrefix(interaction);
    return;
  }

  // Setup Step 2: Back to Step 1
  if (interaction.customId.startsWith('setup_step2_back_')) {
    await handleSetupStep2Back(interaction);
    return;
  }

  // Setup Step 2: Skip Prefix Setup
  if (interaction.customId.startsWith('setup_step2_skip_')) {
    await handleSetupStep2Skip(interaction);
    return;
  }

  // Legacy prefix setup button
  if (interaction.customId.startsWith('setup_prefix_')) {
    await handleLegacyPrefixButton(interaction);
    return;
  }
}

/**
 * Handle Setup Step 1: Use Default Language Button
 */
async function handleSetupStep1Default(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Use guild's preferred locale or env default
    const defaultLocale = interaction.guild.preferredLocale || process.env.DEFAULT_LOCALE || 'en-US';

    // Update database (set to NULL to use default, or set the preferred locale)
    await query(
      'UPDATE guilds SET locale = NULL WHERE guild_id = $1',
      [interaction.guild.id]
    );

    console.log(`\x1b[32m[SETUP] Using default locale (${defaultLocale}) for guild: ${interaction.guild.name}\x1b[0m`);

    // Move to Step 2: Prefix Setup
    await showSetupStep2(interaction, defaultLocale);

  } catch (error) {
    console.error('[SETUP STEP 1 DEFAULT] Error:', error);
    const locale = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_language', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Handle Setup Step 2: Set Custom Prefix Button
 */
async function handleSetupStep2SetPrefix(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get guild's current locale for localized modal
    const guildResult = await query(
      'SELECT locale FROM guilds WHERE guild_id = $1',
      [interaction.guild.id]
    );
    const guildLocale = guildResult.rows[0]?.locale || interaction.guild.preferredLocale || 'en-US';
    const locale = guildLocale as any;

    // Create modal for prefix input
    const modal = new ModalBuilder()
      .setCustomId(`modal_setup_prefix_${interaction.guild.id}`)
      .setTitle(t('setup.modal.title', {}, locale));

    const prefixInput = new TextInputBuilder()
      .setCustomId('prefix_input')
      .setLabel(t('setup.modal.label', {}, locale))
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(t('setup.modal.placeholder', {}, locale))
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(10);

    const row = new ActionRowBuilder<ModalActionRowComponentBuilder>()
      .addComponents(prefixInput);

    modal.addComponents(row);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('[SETUP STEP 2 PREFIX] Error:', error);
  }
}

/**
 * Handle Setup Step 2: Back Button
 */
async function handleSetupStep2Back(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get current locale for localized message
    const guildResult = await query(
      'SELECT locale FROM guilds WHERE guild_id = $1',
      [interaction.guild.id]
    );
    const guildLocale = guildResult.rows[0]?.locale || interaction.guild.preferredLocale || 'en-US';
    const locale = guildLocale as any;

    await interaction.reply({
      content: t('setup.back_message', {}, locale),
      flags: MessageFlags.Ephemeral,
    });

  } catch (error) {
    console.error('[SETUP STEP 2 BACK] Error:', error);
  }
}

/**
 * Handle Setup Step 2: Skip Button
 */
async function handleSetupStep2Skip(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get guild's current locale
    const guildResult = await query(
      'SELECT locale FROM guilds WHERE guild_id = $1',
      [interaction.guild.id]
    );
    const guildLocale = guildResult.rows[0]?.locale || interaction.guild.preferredLocale || 'en-US';

    // Show completion embed without custom prefix
    await showSetupComplete(interaction, guildLocale, undefined);

  } catch (error) {
    console.error('[SETUP STEP 2 SKIP] Error:', error);
    const locale = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_occurred', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Handle legacy prefix button (for manual setup commands)
 */
async function handleLegacyPrefixButton(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
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
 * Handle modal submissions
 */
async function handleModal(interaction: any) {
  // Setup wizard prefix modal
  if (interaction.customId.startsWith('modal_setup_prefix_')) {
    await handleSetupPrefixModal(interaction);
    return;
  }

  // Legacy prefix modal
  if (interaction.customId.startsWith('modal_prefix_')) {
    await handleLegacyPrefixModal(interaction);
    return;
  }
}

/**
 * Handle Setup Wizard Prefix Modal Submission
 */
async function handleSetupPrefixModal(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const newPrefix = interaction.fields.getTextInputValue('prefix_input').trim();
    const guildId = interaction.guild.id;

    // Validate prefix (basic validation)
    if (newPrefix.length === 0) {
      const guildResult = await query('SELECT locale FROM guilds WHERE guild_id = $1', [guildId]);
      const guildLocale = guildResult.rows[0]?.locale || 'en-US';
      const locale = guildLocale as any;

      await interaction.reply({
        content: t('setup.modal.empty_error', {}, locale),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Update guild prefix in database
    await query(
      'UPDATE guilds SET prefix = $1 WHERE guild_id = $2',
      [newPrefix, guildId]
    );

    console.log(`\x1b[32m[SETUP] Custom prefix set to "${newPrefix}" for guild: ${interaction.guild.name}\x1b[0m`);

    // Get guild locale
    const guildResult = await query(
      'SELECT locale FROM guilds WHERE guild_id = $1',
      [guildId]
    );
    const guildLocale = guildResult.rows[0]?.locale || interaction.guild.preferredLocale || 'en-US';

    // Show Step 3: Setup Complete
    await showSetupComplete(interaction, guildLocale, newPrefix);

  } catch (error) {
    console.error('[SETUP PREFIX MODAL] Error:', error);
    const locale = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_prefix', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Handle legacy prefix modal (for manual setup commands)
 */
async function handleLegacyPrefixModal(interaction: any) {
  try {
    if (!interaction.guild) {
      const locale = interaction.locale || 'en-US';
      await interaction.reply({
        content: t('setup.guild_only', {}, locale as any),
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

    // Get guild locale for localized response
    const guildResult = await query('SELECT locale FROM guilds WHERE guild_id = $1', [guildId]);
    const guildLocale = guildResult.rows[0]?.locale || interaction.guild.preferredLocale || 'en-US';
    const locale = guildLocale as any;

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(t('setup.legacy.prefix_updated_title', {}, locale))
      .setDescription(
        t('setup.legacy.prefix_updated_desc', { prefix: newPrefix }, locale)
      )
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });

    console.log(`\x1b[32m[SETUP] Prefix changed to "${newPrefix}" for guild: ${interaction.guild.name}\x1b[0m`);

  } catch (error) {
    console.error('[MODAL] Error:', error);
    const locale = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_prefix', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Show Setup Step 2: Prefix Configuration
 */
async function showSetupStep2(interaction: any, selectedLocale: string) {
  try {
    const guildName = interaction.guild.name;
    const client = interaction.client;
    const embed = createSetupStep2Embed(guildName, selectedLocale, client);

    // Create buttons for Step 2
    const locale = selectedLocale as any;

    const setPrefixButton = new ButtonBuilder()
      .setCustomId(`setup_step2_prefix_${interaction.guild.id}`)
      .setLabel(t('setup.step2.button_set', {}, locale))
      .setStyle(ButtonStyle.Primary);

    const skipButton = new ButtonBuilder()
      .setCustomId(`setup_step2_skip_${interaction.guild.id}`)
      .setLabel(t('setup.step2.button_skip', {}, locale))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`setup_step2_back_${interaction.guild.id}`)
      .setLabel(t('setup.step2.button_back', {}, locale))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(setPrefixButton, skipButton, backButton);

    // Update the original message
    await interaction.update({
      embeds: [embed],
      components: [row],
    });

  } catch (error) {
    console.error('[SHOW SETUP STEP 2] Error:', error);
    const locale = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_occurred', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * Show Setup Step 3: Complete
 */
async function showSetupComplete(interaction: any, locale: string, customPrefix?: string) {
  try {
    const guildName = interaction.guild.name;
    const client = interaction.client;
    const embed = createSetupCompleteEmbed(guildName, locale, client, customPrefix);

    // Update or reply with completion message
    if (interaction.isModalSubmit()) {
      await interaction.reply({
        embeds: [embed],
        components: [], // No more buttons
      });
    } else {
      await interaction.update({
        embeds: [embed],
        components: [], // No more buttons
      });
    }

    console.log(`\x1b[32m[SETUP] ✅ Setup completed for guild: ${interaction.guild.name}\x1b[0m`);
    console.log(`\x1b[34m  Locale: ${locale || 'default'}\x1b[0m`);
    console.log(`\x1b[34m  Custom Prefix: ${customPrefix || 'none'}\x1b[0m`);

  } catch (error) {
    console.error('[SHOW SETUP COMPLETE] Error:', error);
    const loc = interaction.locale || 'en-US';
    await interaction.reply({
      content: t('setup.error_occurred', {}, loc as any),
      flags: MessageFlags.Ephemeral,
    });
  }
}
