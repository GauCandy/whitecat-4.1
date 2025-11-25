/**
 * Bot Ready Event
 * Fires when the bot successfully connects to Discord
 */

import { Client } from 'discord.js';
import { query } from '../../db/pool';

export default {
  name: 'clientReady',
  once: true,
  async execute(client: Client) {
    if (!client.user) return;

    console.log(`\x1b[32m✓ Discord bot logged in as: ${client.user.tag}\x1b[0m`);
    console.log(`\x1b[34m  Bot ID: ${client.user.id}\x1b[0m`);
    console.log(`\x1b[34m  Guilds: ${client.guilds.cache.size}\x1b[0m`);
    console.log(`\x1b[34m  Users: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\x1b[0m`);

    // Sync all guilds to database
    console.log('\n\x1b[33mSyncing guilds to database...\x1b[0m');
    await syncGuildsToDatabase(client);
  },
};

/**
 * Sync all guilds that the bot is in to the database
 */
async function syncGuildsToDatabase(client: Client): Promise<void> {
  try {
    const guilds = client.guilds.cache;
    let newGuilds = 0;
    let updatedGuilds = 0;

    for (const [guildId, guild] of guilds) {
      try {
        // Check if guild exists in database
        const existingGuild = await query(
          'SELECT id, left_at FROM guilds WHERE guild_id = $1',
          [guildId]
        );

        if (existingGuild.rows.length > 0) {
          // Guild exists, check if it was marked as left
          if (existingGuild.rows[0].left_at !== null) {
            // Guild was left before, mark as rejoined
            await query(
              `UPDATE guilds
               SET left_at = NULL,
                   joined_at = CURRENT_TIMESTAMP
               WHERE guild_id = $1`,
              [guildId]
            );
            updatedGuilds++;
            console.log(`\x1b[33m  ↻ Rejoined: ${guild.name}\x1b[0m`);
          }
          // If left_at is null, guild is already active, no update needed
        } else {
          // New guild, insert into database (locale and prefix are NULL by default)
          await query(
            `INSERT INTO guilds (guild_id, joined_at)
             VALUES ($1, CURRENT_TIMESTAMP)`,
            [guildId]
          );
          newGuilds++;
          console.log(`\x1b[32m  + Added: ${guild.name}\x1b[0m`);
        }
      } catch (error) {
        console.error(`\x1b[31m  ✗ Error syncing guild ${guild.name}:\x1b[0m`, error);
      }
    }

    console.log(`\x1b[32m✓ Guild sync completed: ${newGuilds} new, ${updatedGuilds} rejoined\x1b[0m\n`);
  } catch (error) {
    console.error('[READY] Error syncing guilds:', error);
  }
}
