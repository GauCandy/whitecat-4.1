/**
 * Ping Command
 * Check bot latency with i18n support
 */

import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { t } from '../../../i18n';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency')
    // Add Vietnamese description
    .setDescriptionLocalizations({
      vi: 'Kiểm tra độ trễ của bot',
      'en-US': 'Check bot latency',
      'en-GB': 'Check bot latency',
    }),

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
