/**
 * Guild Sync Service
 * Syncs user guild permissions to database
 */

import pool from '../../db/pool';

const MANAGE_GUILD = 0x00000020; // Permission bit for MANAGE_GUILD
const ADMINISTRATOR = 0x00000008; // Permission bit for ADMINISTRATOR

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

/**
 * Fetch user's guilds from Discord API
 */
async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guilds: ${response.status}`);
  }

  return await response.json() as DiscordGuild[];
}

/**
 * Check if user can manage bot (has MANAGE_GUILD or ADMINISTRATOR)
 */
function canManageBot(permissions: string): boolean {
  const permissionBits = BigInt(permissions);
  const hasManageGuild = (permissionBits & BigInt(MANAGE_GUILD)) === BigInt(MANAGE_GUILD);
  const hasAdministrator = (permissionBits & BigInt(ADMINISTRATOR)) === BigInt(ADMINISTRATOR);
  return hasManageGuild || hasAdministrator;
}

/**
 * Get bot's guild IDs from bot client
 * This fetches from the database to avoid cross-dependency
 */
async function getBotGuildIds(): Promise<Set<string>> {
  try {
    // Query guilds table to get guilds where bot is present (left_at IS NULL)
    const result = await pool.query(
      'SELECT guild_id FROM guilds WHERE left_at IS NULL'
    );
    return new Set(result.rows.map(row => row.guild_id));
  } catch (error) {
    console.error('[GuildSync] Error fetching bot guilds:', error);
    return new Set();
  }
}

/**
 * Sync user's guild permissions to database
 * Only saves guilds where:
 * 1. User has MANAGE_GUILD or ADMINISTRATOR permission (or is owner)
 * 2. Bot is present in the guild
 */
export async function syncUserGuildPermissions(
  discordId: string,
  accessToken: string
): Promise<void> {
  try {
    // Fetch user's guilds from Discord
    const userGuilds = await fetchUserGuilds(accessToken);

    // Get bot's guild IDs
    const botGuildIds = await getBotGuildIds();

    // Filter guilds where user can manage AND bot is present
    const manageableGuilds = userGuilds.filter(guild => {
      const hasPermission = guild.owner || canManageBot(guild.permissions);
      const botPresent = botGuildIds.has(guild.id);
      return hasPermission && botPresent;
    });

    // Delete old permissions for this user
    await pool.query(
      'DELETE FROM user_guild_permissions WHERE discord_id = $1',
      [discordId]
    );

    // Insert new permissions
    if (manageableGuilds.length > 0) {
      const values = manageableGuilds.map((guild, index) => {
        const offset = index * 3;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      }).join(', ');

      const params = manageableGuilds.flatMap(guild => [
        discordId,
        guild.id,
        guild.permissions,
      ]);

      await pool.query(
        `INSERT INTO user_guild_permissions (discord_id, guild_id, permissions)
         VALUES ${values}`,
        params
      );

      console.log(`[GuildSync] Synced ${manageableGuilds.length} guilds for user ${discordId}`);
    } else {
      console.log(`[GuildSync] No manageable guilds found for user ${discordId}`);
    }
  } catch (error) {
    console.error('[GuildSync] Error syncing guild permissions:', error);
    throw error;
  }
}

/**
 * Get user's manageable guilds from database
 */
export async function getUserManageableGuilds(discordId: string) {
  try {
    const result = await pool.query(
      `SELECT guild_id, permissions, last_synced
       FROM user_guild_permissions
       WHERE discord_id = $1
       ORDER BY last_synced DESC`,
      [discordId]
    );

    return result.rows;
  } catch (error) {
    console.error('[GuildSync] Error fetching user guilds:', error);
    throw error;
  }
}
