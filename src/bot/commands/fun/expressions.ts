/**
 * Expression Commands
 * All expression commands that show user actions with GIFs from neko.best
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { fetchNekoGif, EXPRESSION_ACTIONS } from '../../utils/nekobest';
import { t, getAllLocalizations, locales } from '../../../i18n';

/**
 * Get a random message from array or return string
 */
function getRandomMessage(key: string, replacements: Record<string, string>, locale: string): string {
  const translations = (locales as any)[locale] || (locales as any)['vi'];
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

// Color palette for different emotions
const EMOTION_COLORS: Record<string, number> = {
  sleep: 0x9B59B6,
  wave: 0x3498DB,
  smile: 0xF39C12,
  dance: 0xE91E63,
  happy: 0xFFD700,
  angry: 0xE74C3C,
  cry: 0x5DADE2,
  laugh: 0xFF6B6B,
  blush: 0xFF69B4,
  wink: 0xF39C12,
  smug: 0x95A5A6,
  think: 0x9B59B6,
  pout: 0xFF6B9D,
  shrug: 0x95A5A6,
  yawn: 0x9B59B6,
  bored: 0x95A5A6,
  nod: 0x2ECC71,
  nope: 0xE74C3C,
  facepalm: 0x95A5A6,
  stare: 0x34495E,
  lurk: 0x2C3E50,
  run: 0x3498DB,
  thumbsup: 0x2ECC71,
};

// Generate all expression commands
const expressionCommands: Command[] = EXPRESSION_ACTIONS.map(action => ({
  data: new SlashCommandBuilder()
    .setName(action)
    .setDescription(t(`commands.fun.${action}.description`, {}, 'en-US'))
    .setDescriptionLocalizations(
      getAllLocalizations(`commands.fun.${action}.description`)
    ),

  async execute({ interaction, locale }) {
    try {
      await interaction.deferReply();

      const gifUrl = await fetchNekoGif(action);

      const message = getRandomMessage(
        `commands.fun.${action}.message`,
        { user: interaction.user.username },
        locale || 'vi'
      );

      const embed = new EmbedBuilder()
        .setColor(EMOTION_COLORS[action] || 0x3498DB)
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

export default expressionCommands;
