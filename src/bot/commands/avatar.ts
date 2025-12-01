/**
 * Avatar Command
 * Displays user's avatar (global and guild-specific if available)
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Xem avatar của người dùng')
    .setDescriptionLocalizations({
      'en-US': 'View user avatar',
      'vi': 'Xem avatar của người dùng',
    })
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Người dùng muốn xem avatar')
        .setDescriptionLocalizations({
          'en-US': 'User to view avatar',
          'vi': 'Người dùng muốn xem avatar',
        })
        .setRequired(false)
    ),

  async execute({ interaction, locale }) {

    try {
      // Get target user (mentioned user or command user)
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const member = interaction.guild?.members.cache.get(targetUser.id);

      // Get avatars with 4K resolution
      const globalAvatarURL = targetUser.displayAvatarURL({
        size: 4096,
        extension: 'png'
      });

      // Check if user has guild-specific avatar (Nitro feature)
      const guildAvatarURL = member?.avatar
        ? member.displayAvatarURL({
            size: 4096,
            extension: 'png'
          })
        : null;

      // Build embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Avatar của ${targetUser.tag}`)
        .setTimestamp();

      // If user has guild avatar (Nitro), show both
      if (guildAvatarURL && guildAvatarURL !== globalAvatarURL) {
        embed.setImage(guildAvatarURL); // Guild avatar as main large image
        embed.setThumbnail(globalAvatarURL); // Global avatar as thumbnail (right side)

        embed.setDescription(
          `🎭 Avatar máy chủ: [Link](${guildAvatarURL})\n` +
          `🌐 Avatar chính: [Link](${globalAvatarURL})`
        );

        embed.setFooter({
          text: '💎 Người dùng này có Nitro và đã đặt avatar riêng cho máy chủ',
        });
      } else {
        // Only global avatar
        embed.setImage(globalAvatarURL);

        embed.setDescription(
          `🌐 [Link](${globalAvatarURL})`
        );
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[AVATAR] Error displaying avatar:', error);

      const errorMsg = locale === 'vi'
        ? '❌ Có lỗi xảy ra khi hiển thị avatar.'
        : '❌ An error occurred while displaying avatar.';

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMsg });
      } else {
        await interaction.reply({ content: errorMsg });
      }
    }
  },
};

export default command;
