/**
 * Interaction Commands
 * All interaction commands that require a target user with GIFs from neko.best
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { fetchNekoGif, INTERACTION_ACTIONS } from '../../utils/nekobest';
import { t } from '../../../i18n';

// Color palette for different interactions
const INTERACTION_COLORS: Record<string, number> = {
  hug: 0xE91E63,
  pat: 0xF39C12,
  kiss: 0xFF1493,
  cuddle: 0xFF69B4,
  poke: 0x3498DB,
  slap: 0xE74C3C,
  kick: 0xE67E22,
  bite: 0x9B59B6,
  tickle: 0xFFB6C1,
  feed: 0xFF8C00,
  punch: 0xC0392B,
  shoot: 0x2C3E50,
  yeet: 0x8E44AD,
  highfive: 0xF39C12,
  handshake: 0x2ECC71,
  handhold: 0xFF69B4,
  peck: 0xFFB6C1,
  nom: 0xFF8C00,
};

// Generate all interaction commands
const interactionCommands: Command[] = INTERACTION_ACTIONS.map(action => ({
  data: new SlashCommandBuilder()
    .setName(action)
    .setDescription(t(`commands.fun.${action}.description`, {}, 'en-US'))
    .setDescriptionLocalizations({
      vi: t(`commands.fun.${action}.description`, {}, 'vi'),
    })
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to interact with')
        .setDescriptionLocalizations({ vi: 'Người bạn muốn tương tác' })
        .setRequired(true)
    ),

  async execute({ interaction, locale }) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser('user', true);

      // Prevent self-interaction
      if (targetUser.id === interaction.user.id) {
        await interaction.editReply({
          content: t('commands.fun.no_self_interaction', {}, locale as any),
        });
        return;
      }

      // Prevent bot interaction
      if (targetUser.bot) {
        await interaction.editReply({
          content: t('commands.fun.no_bot_interaction', {}, locale as any),
        });
        return;
      }

      const gifUrl = await fetchNekoGif(action);

      const embed = new EmbedBuilder()
        .setColor(INTERACTION_COLORS[action] || 0x3498DB)
        .setDescription(
          t(`commands.fun.${action}.message`, {
            user: interaction.user.username,
            target: targetUser.username,
          }, locale as any)
        )
        .setImage(gifUrl)
        .setFooter({ text: 'Powered by nekos.best' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`[${action.toUpperCase()}] Error:`, error);
      await interaction.editReply({
        content: t('commands.fun.error', {}, locale as any),
      });
    }
  },
}));

export default interactionCommands;
