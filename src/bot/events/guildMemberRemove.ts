/**
 * Guild Member Remove Event
 * Fires when a member leaves or is kicked from a guild
 */

import { Events, GuildMember } from 'discord.js';
import { removeUserGuildPermissions } from '../services/permission-sync-service';

export default {
  name: Events.GuildMemberRemove,
  once: false,

  async execute(member: GuildMember) {
    try {
      // Remove user's permissions for this guild
      await removeUserGuildPermissions(member.id, member.guild.id);

      console.log(`[MEMBER REMOVE] Removed permissions for ${member.user.tag} from ${member.guild.name}`);
    } catch (error) {
      console.error('[MEMBER REMOVE] Error removing permissions:', error);
    }
  },
};
