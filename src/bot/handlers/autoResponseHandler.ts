/**
 * Auto Response Handler
 * Handles automatic responses based on keywords
 */

import { Message, EmbedBuilder } from 'discord.js';
import { query } from '../../db/pool';

interface AutoResponse {
  id: number;
  guild_id: string;
  keyword: string;
  response_text: string | null;
  response_embed: any | null; // JSONB
  match_type: 'contains' | 'exact' | 'starts_with' | 'ends_with' | 'regex';
  is_case_sensitive: boolean;
  is_enabled: boolean;
}

/**
 * Check if message content matches keyword based on match_type
 */
function isMatch(content: string, keyword: string, matchType: string, caseSensitive: boolean): boolean {
  const messageContent = caseSensitive ? content : content.toLowerCase();
  const keywordToMatch = caseSensitive ? keyword : keyword.toLowerCase();

  switch (matchType) {
    case 'exact':
      return messageContent === keywordToMatch;

    case 'starts_with':
      return messageContent.startsWith(keywordToMatch);

    case 'ends_with':
      return messageContent.endsWith(keywordToMatch);

    case 'contains':
      return messageContent.includes(keywordToMatch);

    case 'regex':
      try {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(keywordToMatch, flags);
        return regex.test(messageContent);
      } catch (error) {
        console.error('[AUTO RESPONSE] Invalid regex:', error);
        return false;
      }

    default:
      return messageContent.includes(keywordToMatch);
  }
}

/**
 * Get all enabled auto responses for a guild
 */
async function getGuildAutoResponses(guildId: string): Promise<AutoResponse[]> {
  try {
    const result = await query(
      `SELECT *
       FROM auto_responses
       WHERE guild_id = $1 AND is_enabled = true
       ORDER BY id ASC`,
      [guildId]
    );

    return result.rows;
  } catch (error) {
    console.error('[AUTO RESPONSE] Error fetching auto responses:', error);
    return [];
  }
}

/**
 * Send auto response (text, embed, or both)
 */
async function sendAutoResponse(message: Message, response: AutoResponse): Promise<void> {
  try {
    const replyOptions: any = {};

    // Add text response
    if (response.response_text) {
      replyOptions.content = response.response_text;
    }

    // Add embed response (only if valid)
    if (response.response_embed && typeof response.response_embed === 'object') {
      const embedData = response.response_embed;

      // Check if embed has at least one required field
      const hasContent = !!(
        embedData.title ||
        embedData.description ||
        (embedData.fields && embedData.fields.length > 0) ||
        embedData.author ||
        embedData.footer ||
        embedData.image ||
        embedData.thumbnail
      );

      if (hasContent) {
        try {
          const embed = new EmbedBuilder(embedData);
          replyOptions.embeds = [embed];
        } catch (error) {
          console.error('[AUTO RESPONSE] Error creating embed:', error);
        }
      }
      // If no content, silently skip embed
    }

    // Send reply if we have content or embeds
    if (replyOptions.content || replyOptions.embeds) {
      await message.reply(replyOptions);
      console.log(
        `\x1b[35m[AUTO RESPONSE] Triggered for keyword "${response.keyword}" ` +
        `in ${message.guild?.name || 'DM'}\x1b[0m`
      );
    }
  } catch (error) {
    console.error('[AUTO RESPONSE] Error sending response:', error);
  }
}

/**
 * Process message for auto responses
 * Returns true if an auto response was triggered
 */
export async function processAutoResponses(message: Message): Promise<boolean> {
  // Only process in guilds
  if (!message.guild) return false;

  // Ignore bots
  if (message.author.bot) return false;

  // Ignore empty messages
  if (!message.content || message.content.trim().length === 0) return false;

  try {
    // Get all enabled auto responses for this guild
    const autoResponses = await getGuildAutoResponses(message.guild.id);

    if (autoResponses.length === 0) return false;

    // Check each auto response
    for (const response of autoResponses) {
      if (isMatch(message.content, response.keyword, response.match_type, response.is_case_sensitive)) {
        await sendAutoResponse(message, response);
        return true; // Only trigger first matching response
      }
    }

    return false;
  } catch (error) {
    console.error('[AUTO RESPONSE] Error processing:', error);
    return false;
  }
}
