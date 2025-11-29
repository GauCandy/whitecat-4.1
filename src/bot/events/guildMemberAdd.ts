/**
 * Guild Member Add Event
 * Fires when a new member joins a guild
 */

import { Events, GuildMember } from 'discord.js';
import { updateUserGuildPermissions } from '../services/permission-sync-service';

export default {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member: GuildMember) {
    try {
      // Sync permissions for new member
      // Important: New members might have high-level roles auto-assigned
      const permissions = member.permissions.bitfield;
      const guild = member.guild;

      await updateUserGuildPermissions(
        member.id,
        guild.id,
        permissions,
        guild.name,
        guild.icon
      );

      console.log(`[MEMBER ADD] Synced permissions for new member ${member.user.tag} in ${guild.name}`);
    } catch (error) {
      console.error('[MEMBER ADD] Error syncing permissions:', error);
    }
  },
};
