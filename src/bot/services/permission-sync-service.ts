/**
 * Permission Sync Service (Bot-side)
 * Syncs user guild permissions when Discord events occur
 */

import { query } from '../../db/pool';
import { GuildMember, PermissionFlagsBits } from 'discord.js';

const MANAGE_GUILD = PermissionFlagsBits.ManageGuild;
const ADMINISTRATOR = PermissionFlagsBits.Administrator;

/**
 * Update a single user's permissions for a guild
 * Also updates guild info (name, icon) if provided
 */
export async function updateUserGuildPermissions(
  userId: string,
  guildId: string,
  permissions: bigint,
  guildName?: string | null,
  guildIcon?: string | null
): Promise<void> {
  try {
    // Check if user has MANAGE_GUILD or ADMINISTRATOR permission
    const hasManageGuild = (permissions & MANAGE_GUILD) === MANAGE_GUILD;
    const hasAdministrator = (permissions & ADMINISTRATOR) === ADMINISTRATOR;
    const canManageBot = hasManageGuild || hasAdministrator;

    if (canManageBot) {
      // Upsert guild info if provided (cache guild name and icon)
      if (guildName !== undefined) {
        await query(
          `INSERT INTO guilds (guild_id, joined_at, guild_name, guild_icon)
           VALUES ($1, CURRENT_TIMESTAMP, $2, $3)
           ON CONFLICT (guild_id)
           DO UPDATE SET
             guild_name = EXCLUDED.guild_name,
             guild_icon = EXCLUDED.guild_icon`,
          [guildId, guildName, guildIcon]
        );
      }

      // Upsert permissions
      await query(
        `INSERT INTO user_guild_permissions (discord_id, guild_id, permissions, last_synced)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (discord_id, guild_id)
         DO UPDATE SET
           permissions = EXCLUDED.permissions,
           last_synced = CURRENT_TIMESTAMP`,
        [userId, guildId, permissions.toString()]
      );

      console.log(`[PermSync] Updated permissions for user ${userId} in guild ${guildId}`);
    } else {
      // Remove permissions if user no longer has MANAGE_GUILD
      await removeUserGuildPermissions(userId, guildId);
    }
  } catch (error) {
    console.error('[PermSync] Error updating user permissions:', error);
  }
}

/**
 * Remove a user's permissions for a guild
 */
export async function removeUserGuildPermissions(
  userId: string,
  guildId: string
): Promise<void> {
  try {
    const result = await query(
      `DELETE FROM user_guild_permissions
       WHERE discord_id = $1 AND guild_id = $2`,
      [userId, guildId]
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`[PermSync] Removed permissions for user ${userId} in guild ${guildId}`);
    }
  } catch (error) {
    console.error('[PermSync] Error removing user permissions:', error);
  }
}

/**
 * Remove all permissions for a guild (when bot leaves)
 */
export async function removeGuildPermissions(guildId: string): Promise<void> {
  try {
    const result = await query(
      `DELETE FROM user_guild_permissions
       WHERE guild_id = $1`,
      [guildId]
    );

    console.log(`[PermSync] Removed all permissions for guild ${guildId} (${result.rowCount || 0} users)`);
  } catch (error) {
    console.error('[PermSync] Error removing guild permissions:', error);
  }
}

/**
 * Sync all members with a specific role
 * Used when a role's permissions change
 */
export async function syncMembersWithRole(
  guildId: string,
  roleId: string,
  members: Map<string, GuildMember>,
  guildName?: string | null,
  guildIcon?: string | null
): Promise<void> {
  try {
    let synced = 0;

    for (const [userId, member] of members) {
      if (member.roles.cache.has(roleId)) {
        const permissions = member.permissions.bitfield;
        await updateUserGuildPermissions(userId, guildId, permissions, guildName, guildIcon);
        synced++;
      }
    }

    console.log(`[PermSync] Synced ${synced} members with role ${roleId} in guild ${guildId}`);
  } catch (error) {
    console.error('[PermSync] Error syncing members with role:', error);
  }
}
