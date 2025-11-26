/**
 * Command Channel Restrictions Middleware
 * Checks if a command is restricted in a specific channel
 */

import { query } from '../../db/pool';
import { t } from '../../i18n';

/**
 * Check if a command is restricted in the given channel
 * @param guildId Guild ID
 * @param channelId Channel ID
 * @param commandName Command name to check
 * @returns true if command is restricted, false otherwise
 */
export async function isCommandRestricted(
  guildId: string,
  channelId: string,
  commandName: string
): Promise<boolean> {
  try {
    const result = await query(
      `SELECT id FROM command_channel_restrictions
       WHERE guild_id = $1
       AND channel_id = $2
       AND command_name = $3`,
      [guildId, channelId, commandName]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('[COMMAND RESTRICTIONS] Error checking restriction:', error);
    return false; // On error, allow command to proceed
  }
}

/**
 * Send restriction message and auto-delete after 5 seconds
 * For slash commands (interaction-based)
 */
export async function sendRestrictionMessageSlash(
  interaction: any,
  commandName: string,
  locale: string
): Promise<void> {
  try {
    const message = t('error.command_restricted', { command: commandName }, locale as any);

    const reply = await interaction.reply({
      content: message,
      ephemeral: false, // Not ephemeral so we can delete it
      fetchReply: true,
    });

    // Delete after 5 seconds
    setTimeout(async () => {
      try {
        await reply.delete();
      } catch (error) {
        // Ignore errors if message was already deleted
      }
    }, 5000);
  } catch (error) {
    console.error('[COMMAND RESTRICTIONS] Error sending restriction message:', error);
  }
}

/**
 * Send restriction message and auto-delete after 5 seconds
 * For prefix commands (message-based)
 */
export async function sendRestrictionMessagePrefix(
  message: any,
  commandName: string,
  locale: string
): Promise<void> {
  try {
    const restrictionMsg = t('error.command_restricted', { command: commandName }, locale as any);

    const reply = await message.reply(restrictionMsg);

    // Delete both the user's command message and bot's reply after 5 seconds
    setTimeout(async () => {
      try {
        await reply.delete();
        // Optionally delete user's message too if bot has permissions
        if (message.deletable) {
          await message.delete();
        }
      } catch (error) {
        // Ignore errors if messages were already deleted
      }
    }, 5000);
  } catch (error) {
    console.error('[COMMAND RESTRICTIONS] Error sending restriction message:', error);
  }
}

/**
 * Check command restriction for slash commands
 * Returns true if command should be blocked, false if allowed
 */
export async function checkSlashCommandRestriction(
  interaction: any,
  commandName: string,
  locale: string
): Promise<boolean> {
  // Only check in guilds, not in DMs
  if (!interaction.guild) return false;

  const restricted = await isCommandRestricted(
    interaction.guild.id,
    interaction.channel.id,
    commandName
  );

  if (restricted) {
    await sendRestrictionMessageSlash(interaction, commandName, locale);
    console.log(
      `\x1b[33m[RESTRICTION] Command "${commandName}" blocked in channel ${interaction.channel.id} ` +
      `(${interaction.guild.name})\x1b[0m`
    );
  }

  return restricted;
}

/**
 * Check command restriction for prefix commands
 * Returns true if command should be blocked, false if allowed
 */
export async function checkPrefixCommandRestriction(
  message: any,
  commandName: string,
  locale: string
): Promise<boolean> {
  // Only check in guilds, not in DMs
  if (!message.guild) return false;

  const restricted = await isCommandRestricted(
    message.guild.id,
    message.channel.id,
    commandName
  );

  if (restricted) {
    await sendRestrictionMessagePrefix(message, commandName, locale);
    console.log(
      `\x1b[33m[RESTRICTION] Command "${commandName}" blocked in channel ${message.channel.id} ` +
      `(${message.guild.name})\x1b[0m`
    );
  }

  return restricted;
}
