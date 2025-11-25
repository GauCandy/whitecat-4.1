/**
 * Guild Delete Event
 * Fires when the bot is removed from a guild
 */

import { Events, Guild } from 'discord.js';
import { query } from '../../db/pool';

export default {
  name: Events.GuildDelete,
  once: false,

  async execute(guild: Guild) {
    try {
      console.log(`\x1b[33m[GUILD] Bot left guild: ${guild.name} (${guild.id})\x1b[0m`);

      // Update left_at timestamp in database
      await query(
        `UPDATE guilds
         SET left_at = CURRENT_TIMESTAMP
         WHERE guild_id = $1`,
        [guild.id]
      );

      console.log(`\x1b[33m[GUILD] Guild marked as left in database: ${guild.name}\x1b[0m`);

    } catch (error) {
      console.error('[GUILD DELETE] Error updating guild in database:', error);
    }
  },
};
