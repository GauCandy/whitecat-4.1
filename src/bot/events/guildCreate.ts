/**
 * Guild Create Event
 * Fires when the bot joins a new guild
 */

import {
  Events,
  Guild,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  AuditLogEvent,
} from 'discord.js';
import { query } from '../../db/pool';
import { getSupportedLocales } from '../../i18n';
import { getLanguageInfo, getPrimaryLocales } from '../../i18n/languages-config';

export default {
  name: Events.GuildCreate,
  once: false,

  async execute(guild: Guild) {
    try {
      console.log(`\x1b[32m[GUILD] Bot joined guild: ${guild.name} (${guild.id})\x1b[0m`);

      // Check if guild already exists in database
      const existingGuild = await query(
        'SELECT id, left_at FROM guilds WHERE guild_id = $1',
        [guild.id]
      );

      if (existingGuild.rows.length > 0) {
        // Guild exists, update left_at to null (rejoined)
        await query(
          `UPDATE guilds
           SET left_at = NULL,
               joined_at = CURRENT_TIMESTAMP
           WHERE guild_id = $1`,
          [guild.id]
        );

        console.log(`\x1b[33m[GUILD] Rejoined guild updated in database: ${guild.name}\x1b[0m`);
      } else {
        // New guild, insert into database (locale and prefix are NULL by default)
        await query(
          `INSERT INTO guilds (guild_id, joined_at)
           VALUES ($1, CURRENT_TIMESTAMP)`,
          [guild.id]
        );

        console.log(`\x1b[32m[GUILD] New guild added to database: ${guild.name}\x1b[0m`);
      }

      // Log guild info
      console.log(`\x1b[34m  Guild ID: ${guild.id}\x1b[0m`);
      console.log(`\x1b[34m  Members: ${guild.memberCount}\x1b[0m`);
      console.log(`\x1b[34m  Owner: ${guild.ownerId}\x1b[0m`);

      // Send welcome message
      await sendWelcomeMessage(guild);

    } catch (error) {
      console.error('[GUILD CREATE] Error adding guild to database:', error);
    }
  },
};

/**
 * Send welcome message to the guild
 */
async function sendWelcomeMessage(guild: Guild): Promise<void> {
  try {
    // Find who invited the bot (check audit logs)
    let inviter = null;
    if (guild.members.me?.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      try {
        const auditLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent.BotAdd,
          limit: 10,
        });

        const botAddLog = auditLogs.entries.find(
          entry => entry.target?.id === guild.client.user.id
        );

        if (botAddLog) {
          inviter = botAddLog.executor;
        }
      } catch (error) {
        console.error('[GUILD CREATE] Error fetching audit logs:', error);
      }
    }

    // Find welcome channel (system channel or first channel bot can send to)
    let channel = guild.systemChannel;

    if (!channel || !channel.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)) {
      // Find first text channel where bot can send messages
      const textChannels = guild.channels.cache.filter(
        ch => ch.isTextBased() &&
             ch.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)
      );
      channel = textChannels.first() as any;
    }

    if (!channel) {
      console.log(`\x1b[33m[GUILD] No channel found to send welcome message\x1b[0m`);
      return;
    }

    // Get default locale and prefix
    const defaultLocale = process.env.DEFAULT_LOCALE || 'en-US';
    const defaultPrefix = process.env.BOT_PREFIX || '!';

    // Create welcome embed
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('👋 Thank you for adding WhiteCat Bot!')
      .setDescription(
        `${inviter ? `Hey ${inviter}! ` : ''}Thanks for inviting me to **${guild.name}**!\n\n` +
        `I'm here to bring fun and utility to your server. Before we get started, let's set up a few things:\n\n` +
        `**Current Settings:**\n` +
        `🌐 Language: \`${defaultLocale}\`\n` +
        `⚙️ Prefix: \`${defaultPrefix}\`\n\n` +
        `You can customize these settings using the buttons below!`
      )
      .addFields(
        {
          name: '📚 Quick Start',
          value:
            `• Use slash commands: \`/help\`\n` +
            `• Use prefix commands: \`${defaultPrefix}help\`\n` +
            `• Have fun with \`/hug\`, \`/pat\`, \`/dance\` and more!`,
          inline: false
        },
        {
          name: '🔧 Setup',
          value: 'Click the buttons below to customize your server settings!',
          inline: false
        }
      )
      .setFooter({ text: 'WhiteCat Bot v4.1' })
      .setTimestamp();

    // Get primary locales from config (auto-updated when adding new languages)
    const primaryLocales = getPrimaryLocales();

    // Create language options from primary locales
    const languageOptions = primaryLocales.map(locale => {
      const info = getLanguageInfo(locale);
      return {
        label: info.label,
        description: info.description,
        value: locale,
        emoji: info.emoji,
      };
    });

    // Create select menu for language
    const languageSelect = new StringSelectMenuBuilder()
      .setCustomId(`setup_language_${guild.id}`)
      .setPlaceholder('🌐 Select Language')
      .addOptions(languageOptions);

    // Create button for prefix setup
    const prefixButton = new ButtonBuilder()
      .setCustomId(`setup_prefix_${guild.id}`)
      .setLabel('⚙️ Change Prefix')
      .setStyle(ButtonStyle.Primary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(languageSelect);

    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(prefixButton);

    // Send message
    await channel.send({
      content: inviter ? `${inviter}` : undefined,
      embeds: [embed],
      components: [row1, row2],
    });

    console.log(`\x1b[32m[GUILD] Welcome message sent to: ${channel.name}\x1b[0m`);

  } catch (error) {
    console.error('[GUILD CREATE] Error sending welcome message:', error);
  }
}
