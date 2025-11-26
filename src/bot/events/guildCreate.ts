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
  TextChannel,
} from 'discord.js';
import { query } from '../../db/pool';
import { getLanguageInfo, getPrimaryLocales } from '../../i18n/languages-config';
import { t } from '../../i18n';

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

      // Send welcome message (Step 1: Choose Language)
      await sendSetupStep1(guild);

    } catch (error) {
      console.error('[GUILD CREATE] Error adding guild to database:', error);
    }
  },
};

/**
 * Send Step 1: Choose Language
 */
async function sendSetupStep1(guild: Guild): Promise<void> {
  try {
    // Find who invited the bot
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
        if (botAddLog) inviter = botAddLog.executor;
      } catch (error) {
        console.error('[GUILD CREATE] Error fetching audit logs:', error);
      }
    }

    // Find welcome channel
    let channel: TextChannel | null = guild.systemChannel as TextChannel;
    if (!channel || !channel.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)) {
      const textChannels = guild.channels.cache.filter(
        ch => ch.isTextBased() &&
             ch.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)
      );
      channel = textChannels.first() as TextChannel;
    }

    if (!channel) {
      console.log(`\x1b[33m[GUILD] No channel found to send welcome message\x1b[0m`);
      return;
    }

    // Get guild's preferred locale or default
    const guildLocale = guild.preferredLocale || process.env.DEFAULT_LOCALE || 'en-US';
    const locale = guildLocale as any;

    // Create Step 1 embed with beautiful design
    const greeting = inviter
      ? t('setup.step1.greeting', { inviter: inviter.toString(), guildName: guild.name }, locale)
      : t('setup.step1.greeting_no_inviter', { guildName: guild.name }, locale);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2) // Discord Blurple
      .setTitle(t('setup.step1.title', {}, locale))
      .setDescription(
        `${greeting}\n\n` +
        `${t('setup.step1.description', {}, locale)}\n\n` +
        `${'─'.repeat(40)}\n\n` +
        `${t('setup.step1.step_label', {}, locale)}\n\n` +
        `${t('setup.step1.language_prompt', {}, locale)}\n\n` +
        `${t('setup.step1.default_note', { locale: guildLocale }, locale)}\n` +
        `${t('setup.step1.can_change', {}, locale)}`
      )
      .setThumbnail(guild.iconURL() || null)
      .setFooter({
        text: t('setup.step1.footer', {}, locale),
        iconURL: channel.client.user.displayAvatarURL()
      })
      .setTimestamp();

    // Get primary locales
    const primaryLocales = getPrimaryLocales();
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
      .setCustomId(`setup_step1_language_${guild.id}`)
      .setPlaceholder(t('setup.step1.select_placeholder', {}, locale))
      .addOptions(languageOptions);

    // Create button for default (use server locale)
    const defaultButton = new ButtonBuilder()
      .setCustomId(`setup_step1_default_${guild.id}`)
      .setLabel(t('setup.step1.button_default', {}, locale))
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(languageSelect);

    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(defaultButton);

    // Send message
    await channel.send({
      content: inviter ? `${inviter}` : undefined,
      embeds: [embed],
      components: [row1, row2],
    });

    console.log(`\x1b[32m[GUILD] Setup Step 1 sent to: ${channel.name}\x1b[0m`);

  } catch (error) {
    console.error('[GUILD CREATE] Error sending setup step 1:', error);
  }
}

/**
 * Create Step 2 embed (Setup Prefix)
 */
export function createSetupStep2Embed(guildName: string, selectedLocale: string, client: any): EmbedBuilder {
  const defaultPrefix = process.env.BOT_PREFIX || '!';
  const locale = selectedLocale as any;
  const languageInfo = getLanguageInfo(selectedLocale);

  return new EmbedBuilder()
    .setColor(0x57F287) // Green - Success
    .setTitle(t('setup.step2.title', {}, locale))
    .setDescription(
      `${t('setup.step2.language_set', { language: `${languageInfo.label} ${languageInfo.emoji}` }, locale)}\n\n` +
      `${'─'.repeat(40)}\n\n` +
      `${t('setup.step2.step_label', {}, locale)}\n\n` +
      `${t('setup.step2.prefix_info', { prefix: defaultPrefix }, locale)}\n\n` +
      `${t('setup.step2.default_prefix', { prefix: defaultPrefix }, locale)}\n` +
      `${t('setup.step2.custom_option', { guildName }, locale)}\n\n` +
      `${t('setup.step2.note_slash', {}, locale)}`
    )
    .setFooter({
      text: t('setup.step2.footer', {}, locale),
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();
}

/**
 * Create Step 3 embed (Complete)
 */
export function createSetupCompleteEmbed(
  guildName: string,
  locale: string,
  client: any,
  customPrefix?: string
): EmbedBuilder {
  const defaultPrefix = process.env.BOT_PREFIX || '!';
  const loc = locale as any;
  const languageInfo = getLanguageInfo(locale);
  const activePrefix = customPrefix || defaultPrefix;

  const embed = new EmbedBuilder()
    .setColor(0x57F287) // Green - Success
    .setTitle(t('setup.step3.title', {}, loc))
    .setDescription(
      `${t('setup.step3.description', { guildName }, loc)}\n\n` +
      `${'─'.repeat(40)}\n\n` +
      `**${t('setup.step3.summary_title', {}, loc)}**\n` +
      `${t('setup.step3.language_label', {}, loc)}: **${languageInfo.label} ${languageInfo.emoji}**\n` +
      `${t('setup.step3.prefix_default_label', {}, loc)}: \`${defaultPrefix}\` ${t('setup.step3.prefix_note', {}, loc)}\n` +
      (customPrefix ? `${t('setup.step3.prefix_custom_label', {}, loc)}: \`${customPrefix}\`\n` : '') +
      `\n${'─'.repeat(40)}\n`
    )
    .addFields(
      {
        name: `${t('setup.step3.getting_started_title', {}, loc)}`,
        value: t('setup.step3.getting_started_commands', { prefix: activePrefix }, loc),
        inline: false
      },
      {
        name: `${t('setup.step3.fun_commands_title', {}, loc)}`,
        value: t('setup.step3.fun_commands', {}, loc),
        inline: false
      }
    )
    .setFooter({
      text: t('setup.step3.footer', {}, loc),
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}
