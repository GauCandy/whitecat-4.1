/**
 * Guild Delete Event
 * Fires when the bot is removed from a guild
 */

import { Events, Guild } from 'discord.js';
import { query } from '../../db/pool';
import { removeGuildPermissions } from '../services/permission-sync-service';

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

      // Remove all user guild permissions for this guild
      await removeGuildPermissions(guild.id);

    } catch (error) {
      console.error('[GUILD DELETE] Error updating guild in database:', error);
    }
  },
};
