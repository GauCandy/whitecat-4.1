/**
 * Guild Ban Add Event
 * Fires when a member is banned from a guild
 */

import { Events, GuildBan } from 'discord.js';
import { removeUserGuildPermissions } from '../services/permission-sync-service';

export default {
  name: Events.GuildBanAdd,
  once: false,

  async execute(ban: GuildBan) {
    try {
      // Remove banned user's permissions
      await removeUserGuildPermissions(ban.user.id, ban.guild.id);

      console.log(`[BAN] Removed permissions for banned user ${ban.user.tag} from ${ban.guild.name}`);
    } catch (error) {
      console.error('[BAN] Error removing permissions:', error);
    }
  },
};
