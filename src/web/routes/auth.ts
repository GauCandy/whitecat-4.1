/**
 * Auth Routes
 * OAuth2 authentication flow
 */

import { Router } from 'express';
import crypto from 'crypto';
import { buildOAuth2URL, buildUserInstallURL, buildBotInviteURL } from '../services/discord-invite-service';
import { upsertUser, upsertOAuthTokens } from '../services/userService';
import pool from '../../db/pool';

const router = Router();

// Redirect to User Install (integration_type=1)
router.get('/user-install', (req, res) => {
  try {
    const authUrl = buildUserInstallURL();
    res.redirect(authUrl);
  } catch (error) {
    console.error('[AUTH] Error building User Install URL:', error);
    res.status(500).send('OAuth configuration error');
  }
});

// Redirect to Guild Install (integration_type=0)
router.get('/guild-install', (req, res) => {
  try {
    const authUrl = buildBotInviteURL();
    res.redirect(authUrl);
  } catch (error) {
    console.error('[AUTH] Error building Guild Install URL:', error);
    res.status(500).send('OAuth configuration error');
  }
});

// Alias: /invite → /guild-install (backward compatibility)
router.get('/invite', (req, res) => {
  res.redirect('/auth/guild-install');
});

// Redirect to Discord OAuth (User Login - no integration_type)
router.get('/discord', (req, res) => {
  try {
    const authUrl = buildOAuth2URL();
    res.redirect(authUrl);
  } catch (error) {
    console.error('[AUTH] Error building OAuth URL:', error);
    res.status(500).send('OAuth configuration error');
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('[AUTH] OAuth error:', error);
    return res.redirect('/auth/fail?error=access_denied');
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/auth/fail?error=invalid_code');
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.CLIENT_ID!,
        client_secret: process.env.CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: getRedirectUri(),
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed');
    }

    const tokenData: any = await tokenResponse.json();

    // Fetch user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData: any = await userResponse.json();

    // Save user to database
    try {
      const userId = await upsertUser({
        discordId: userData.id,
        username: userData.username,
        avatar: userData.avatar,
      });

      // Save OAuth tokens to database
      await upsertOAuthTokens(userId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      });

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create session in database
      await pool.query(
        `INSERT INTO web_sessions (user_id, session_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (session_token) DO UPDATE SET
           expires_at = EXCLUDED.expires_at`,
        [
          userId,
          sessionToken,
          expiresAt,
          req.ip || req.socket.remoteAddress,
          req.get('user-agent') || 'Unknown'
        ]
      );

      // Set session cookie
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
      });

      console.log(`\x1b[32m[AUTH] User logged in & saved: ${userData.username}#${userData.discriminator || '0'}\x1b[0m`);

      // Redirect to success page
      res.redirect('/auth/success');
    } catch (dbError) {
      console.error('[AUTH] Database error:', dbError);
      res.redirect('/auth/fail?error=database_error');
    }
  } catch (error) {
    console.error('[AUTH] Callback error:', error);
    res.redirect('/auth/fail?error=auth_failed');
  }
});


// OAuth Success Page
router.get('/success', async (req, res) => {
  try {
    const sessionToken = req.cookies?.session_token;

    if (!sessionToken) {
      return res.redirect('/login');
    }

    // Get user from session
    const result = await pool.query(
      `SELECT u.username, u.discord_id, u.avatar
       FROM web_sessions ws
       JOIN users u ON ws.user_id = u.id
       WHERE ws.session_token = $1 AND ws.expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (result.rows.length === 0) {
      return res.redirect('/login');
    }

    const user = result.rows[0];

    res.render('auth-success', {
      username: user.username,
      CLIENT_ID: process.env.CLIENT_ID,
      GUILD_ID_SUPPORT: process.env.GUILD_ID_SUPPORT,
    });
  } catch (error) {
    console.error('[AUTH] Error in success page:', error);
    res.redirect('/login');
  }
});

// OAuth Fail Page
router.get('/fail', (req, res) => {
  const errorCode = req.query.error || 'unknown_error';

  const errorMessages: Record<string, string> = {
    access_denied: 'Bạn đã từ chối quyền truy cập',
    invalid_code: 'Mã xác thực không hợp lệ',
    database_error: 'Lỗi cơ sở dữ liệu',
    auth_failed: 'Xác thực thất bại',
    unknown_error: 'Lỗi không xác định',
  };

  res.render('auth-fail', {
    error_message: errorMessages[errorCode as string] || errorMessages.unknown_error,
  });
});

// Logout
router.get('/logout', async (req, res) => {
  try {
    const sessionToken = req.cookies?.session_token;

    if (sessionToken) {
      // Delete session from database
      await pool.query(
        'DELETE FROM web_sessions WHERE session_token = $1',
        [sessionToken]
      );
    }

    // Clear cookie
    res.clearCookie('session_token');
    res.redirect('/');
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    res.clearCookie('session_token');
    res.redirect('/');
  }
});

/**
 * Build redirect URI from environment variables
 */
function getRedirectUri(): string {
  const publicUrl = process.env.PUBLIC_URL || 'localhost';
  const publicPort = process.env.PUBLIC_PORT || '3000';
  const useSSL = process.env.PUBLIC_SSL === 'true';

  if (useSSL && publicPort === '443') {
    return `https://${publicUrl}/auth/callback`;
  } else if (useSSL) {
    return `https://${publicUrl}:${publicPort}/auth/callback`;
  } else if (publicPort === '80') {
    return `http://${publicUrl}/auth/callback`;
  } else {
    return `http://${publicUrl}:${publicPort}/auth/callback`;
  }
}

export { router as authRouter };
