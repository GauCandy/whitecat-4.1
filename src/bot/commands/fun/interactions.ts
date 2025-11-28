/**
 * Interaction Commands
 * All interaction commands that require a target user with GIFs from neko.best
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  MessageFlags
} from 'discord.js';
import { Command } from '../../types/command';
import { fetchNekoGif, INTERACTION_ACTIONS } from '../../utils/nekobest';
import { t, getAllLocalizations, locales, getDefaultLocale } from '../../../i18n';

/**
 * Get a random message from array or return string
 */
function getRandomMessage(key: string, replacements: Record<string, string>, locale: string): string {
  const translations = (locales as any)[locale] || (locales as any)[getDefaultLocale()];
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return t(key, replacements, locale as any);
    }
  }

  // If message is an array, pick random one
  if (Array.isArray(value)) {
    const randomIndex = Math.floor(Math.random() * value.length);
    let message = value[randomIndex];

    // Replace placeholders
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      message = message.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacement);
    }

    return message;
  }

  return t(key, replacements, locale as any);
}

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
    .setDescriptionLocalizations(
      getAllLocalizations(`commands.fun.${action}.description`)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription(t('commands.fun.user_option', {}, 'en-US'))
        .setDescriptionLocalizations(getAllLocalizations('commands.fun.user_option'))
        .setRequired(true)
    )
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel
    ),

  async execute({ interaction, locale }) {
    try {
      const targetUser = interaction.options.getUser('user', true);
      const currentLocale = locale || getDefaultLocale();

      // Case 1: Self-interaction (REJECT - ephemeral, no GIF)
      if (targetUser.id === interaction.user.id) {
        const message = getRandomMessage(
          `commands.fun.${action}.self`,
          { user: interaction.user.username },
          currentLocale
        );

        await interaction.reply({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Case 2: Current bot interaction (special response with GIF)
      if (targetUser.id === interaction.client.user.id) {
        await interaction.deferReply();

        const gifUrl = await fetchNekoGif(action);
        const message = getRandomMessage(
          `commands.fun.${action}.bot`,
          { user: interaction.user.username },
          currentLocale
        );

        const embed = new EmbedBuilder()
          .setColor(INTERACTION_COLORS[action] || 0x3498DB)
          .setDescription(message)
          .setImage(gifUrl)
          .setFooter({ text: 'Powered by nekos.best' });

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Case 3: Normal interaction (other users and other bots)
      await interaction.deferReply();

      const gifUrl = await fetchNekoGif(action);
      const message = getRandomMessage(
        `commands.fun.${action}.message`,
        {
          user: interaction.user.username,
          target: targetUser.username,
        },
        currentLocale
      );

      const embed = new EmbedBuilder()
        .setColor(INTERACTION_COLORS[action] || 0x3498DB)
        .setDescription(message)
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
