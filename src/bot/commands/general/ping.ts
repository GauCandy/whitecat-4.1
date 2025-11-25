/**
 * Ping Command
 * Check bot latency with i18n support
 */

import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { t, getAllLocalizations } from '../../../i18n';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription(t('general.ping.description', {}, 'en-US'))
    .setDescriptionLocalizations(getAllLocalizations('general.ping.description')),

  async execute({ interaction, locale }) {
    // Reply immediately to avoid timeout
    const sent = Date.now();

    await interaction.reply({
      content: t('general.ping.reply', { latency: '...' }, locale as any),
    });

    const latency = Date.now() - sent;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply(
      t('general.ping.reply', { latency: String(latency) }, locale as any) +
      `\nAPI: ${apiLatency}ms`
    );
  },
};

export default command;
