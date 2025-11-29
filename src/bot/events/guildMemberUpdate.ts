/**
 * Guild Member Update Event
 * Fires when a member's roles or permissions change
 */

import { Events, GuildMember } from 'discord.js';
import { updateUserGuildPermissions } from '../services/permission-sync-service';

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember: GuildMember, newMember: GuildMember) {
    try {
      // Check if roles changed
      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;

      if (oldRoles.size !== newRoles.size || !oldRoles.equals(newRoles)) {
        // Roles changed - update permissions and guild info
        const permissions = newMember.permissions.bitfield;
        const guild = newMember.guild;

        await updateUserGuildPermissions(
          newMember.id,
          guild.id,
          permissions,
          guild.name,
          guild.icon
        );

        console.log(`[MEMBER UPDATE] Synced permissions for ${newMember.user.tag} in ${guild.name}`);
      }
    } catch (error) {
      console.error('[MEMBER UPDATE] Error syncing permissions:', error);
    }
  },
};
