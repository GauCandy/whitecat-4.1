/**
 * Guild Update Event
 * Fires when guild settings change (including ownership transfer)
 */

import { Events, Guild } from 'discord.js';
import { query } from '../../db/pool';
import { updateUserGuildPermissions } from '../services/permission-sync-service';

export default {
  name: Events.GuildUpdate,
  once: false,

  async execute(oldGuild: Guild, newGuild: Guild) {
    try {
      // Update guild name/icon cache if changed
      if (oldGuild.name !== newGuild.name || oldGuild.icon !== newGuild.icon) {
        await query(
          `UPDATE guilds
           SET guild_name = $2,
               guild_icon = $3
           WHERE guild_id = $1`,
          [newGuild.id, newGuild.name, newGuild.icon]
        );
        console.log(`[GUILD UPDATE] Updated guild info: ${newGuild.name}`);
      }

      // Check if ownership changed
      if (oldGuild.ownerId !== newGuild.ownerId) {
        console.log(`[GUILD UPDATE] Ownership transferred in ${newGuild.name}`);
        console.log(`  Old owner: ${oldGuild.ownerId}`);
        console.log(`  New owner: ${newGuild.ownerId}`);

        // Sync old owner (may have lost permissions if not admin)
        const oldOwner = await oldGuild.members.fetch(oldGuild.ownerId).catch(() => null);
        if (oldOwner) {
          await updateUserGuildPermissions(
            oldOwner.id,
            oldGuild.id,
            oldOwner.permissions.bitfield,
            newGuild.name,
            newGuild.icon
          );
        }

        // Sync new owner (now has all permissions)
        const newOwner = await newGuild.members.fetch(newGuild.ownerId).catch(() => null);
        if (newOwner) {
          await updateUserGuildPermissions(
            newOwner.id,
            newGuild.id,
            newOwner.permissions.bitfield,
            newGuild.name,
            newGuild.icon
          );
        }

        console.log(`[GUILD UPDATE] Synced permissions for ownership transfer`);
      }
    } catch (error) {
      console.error('[GUILD UPDATE] Error syncing ownership transfer:', error);
    }
  },
};
