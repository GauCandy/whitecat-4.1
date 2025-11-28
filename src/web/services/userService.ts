/**
 * User Service
 * Handle user database operations
 */

import pool from '../../db/pool';

export interface UserData {
  discordId: string;
  username: string;
  avatar: string | null;
}

export interface OAuthTokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Upsert user to database (insert or update)
 * Updates: discord_id, username, avatar, terms_accepted (auto true), updated_at
 * Returns the user's internal database ID
 */
export async function upsertUser(userData: UserData): Promise<number> {
  const query = `
    INSERT INTO users (discord_id, username, avatar, terms_accepted)
    VALUES ($1, $2, $3, true)
    ON CONFLICT (discord_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      avatar = EXCLUDED.avatar,
      terms_accepted = true,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `;

  const values = [userData.discordId, userData.username, userData.avatar];

  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('[UserService] Error upserting user:', error);
    throw error;
  }
}

/**
 * Upsert OAuth tokens for a user
 */
export async function upsertOAuthTokens(userId: number, tokenData: OAuthTokenData): Promise<void> {
  const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);

  const query = `
    INSERT INTO oauth_tokens (user_id, access_token, refresh_token, token_expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at,
      updated_at = CURRENT_TIMESTAMP
  `;

  const values = [userId, tokenData.accessToken, tokenData.refreshToken, expiresAt];

  try {
    await pool.query(query, values);
  } catch (error) {
    console.error('[UserService] Error upserting OAuth tokens:', error);
    throw error;
  }
}

/**
 * Get user by Discord ID
 */
export async function getUserByDiscordId(discordId: string) {
  const query = 'SELECT * FROM users WHERE discord_id = $1';

  try {
    const result = await pool.query(query, [discordId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[UserService] Error getting user:', error);
    throw error;
  }
}
