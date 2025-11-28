/**
 * Prefix Command
 * Change the bot's prefix for this server
 */

import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { Command } from '../../types/command';
import { t, getAllLocalizations } from '../../../i18n';
import { query } from '../../../db/pool';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription(t('admin.prefix.description', {}, 'en-US'))
    .setDescriptionLocalizations(getAllLocalizations('admin.prefix.description'))
    .addStringOption((option) =>
      option
        .setName('new_prefix')
        .setDescription(t('admin.prefix.option_description', {}, 'en-US'))
        .setDescriptionLocalizations(getAllLocalizations('admin.prefix.option_description'))
        .setRequired(true)
        .setMaxLength(10)
    )
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

    const newPrefix = interaction.options.getString('new_prefix', true);

    // Validate prefix
    if (newPrefix.length === 0) {
      await interaction.reply({
        content: t('admin.prefix.empty_error', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (newPrefix.length > 10) {
      await interaction.reply({
        content: t('admin.prefix.too_long_error', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      // Update prefix in database
      await query(
        `UPDATE guilds SET prefix = $1 WHERE guild_id = $2`,
        [newPrefix, interaction.guild.id]
      );

      await interaction.reply({
        content: t('admin.prefix.success', { prefix: newPrefix }, locale as any),
        ephemeral: false,
      });
    } catch (error) {
      console.error('[COMMAND] Error updating prefix:', error);
      await interaction.reply({
        content: t('error.unknown', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default command;
