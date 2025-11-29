/**
 * Guild Role Update Event
 * Fires when a role's permissions are changed
 */

import { Events, Role } from 'discord.js';
import { syncMembersWithRole } from '../services/permission-sync-service';

export default {
  name: Events.GuildRoleUpdate,
  once: false,

  async execute(oldRole: Role, newRole: Role) {
    try {
      // Check if permissions changed
      if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        console.log(`[ROLE UPDATE] Role permissions changed: ${newRole.name} in ${newRole.guild.name}`);

        // Re-sync all members who have this role
        const guild = newRole.guild;
        await syncMembersWithRole(
          guild.id,
          newRole.id,
          guild.members.cache,
          guild.name,
          guild.icon
        );
      }
    } catch (error) {
      console.error('[ROLE UPDATE] Error syncing role permissions:', error);
    }
  },
};
