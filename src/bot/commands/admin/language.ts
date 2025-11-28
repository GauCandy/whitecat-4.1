/**
 * Language Command
 * Change the bot's language for this server
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../types/command';
import { t, getAllLocalizations } from '../../../i18n';
import { query } from '../../../db/pool';
import { LANGUAGES } from '../../../i18n/languages-config';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription(t('admin.language.description', {}, 'en-US'))
    .setDescriptionLocalizations(getAllLocalizations('admin.language.description'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute({ interaction, locale }) {
    if (!interaction.guild) {
      await interaction.reply({
        content: t('error.guild_only', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Get current language info
    const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
    const totalLanguages = LANGUAGES.length;

    // Create simple embed with basic info
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(t('admin.language.embed_title', {}, locale as any))
      .setDescription(
        t('admin.language.embed_description', {}, locale as any) +
        `\n\n` +
        `${'─'.repeat(40)}\n\n` +
        `**${t('admin.language.current_language', {}, locale as any)}:** ${currentLang.flag} ${currentLang.name}\n` +
        `**${t('admin.language.total_languages', {}, locale as any)}:** ${totalLanguages}`
      )
      .setFooter({
        text: t('admin.language.embed_footer', {}, locale as any),
      })
      .setTimestamp();

    // Create select menu with language options
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('language_select')
      .setPlaceholder(t('admin.language.select_placeholder', {}, locale as any))
      .addOptions(
        LANGUAGES.map((lang) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${lang.flag} ${lang.name}`)
            .setDescription(lang.nativeName)
            .setValue(lang.code)
            .setDefault(lang.code === locale)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false,
    });

    // Collect select menu interaction
    try {
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000, // 60 seconds
      });

      collector.on('collect', async (selectInteraction) => {
        // Only allow the command author or admins to select
        if (
          selectInteraction.user.id !== interaction.user.id &&
          !selectInteraction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
        ) {
          await selectInteraction.reply({
            content: t('error.permission_denied', {}, locale as any),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const selectedLocale = selectInteraction.values[0];

        try {
          // Update language in database
          await query(
            `UPDATE guilds SET locale = $1 WHERE guild_id = $2`,
            [selectedLocale, interaction.guild!.id]
          );

          const selectedLang = LANGUAGES.find((l) => l.code === selectedLocale);

          await selectInteraction.update({
            content: t(
              'admin.language.success',
              { language: selectedLang?.name || selectedLocale },
              selectedLocale as any
            ),
            embeds: [],
            components: [],
          });

          collector.stop();
        } catch (error) {
          console.error('[COMMAND] Error updating language:', error);
          await selectInteraction.reply({
            content: t('error.unknown', {}, locale as any),
            flags: MessageFlags.Ephemeral,
          });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          // Timeout - remove components
          await interaction.editReply({
            components: [],
          });
        }
      });
    } catch (error) {
      console.error('[COMMAND] Error with language selector:', error);
    }
  },
};

export default command;
