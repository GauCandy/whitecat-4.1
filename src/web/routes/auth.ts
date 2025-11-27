/**
 * Auth Routes
 * OAuth2 authentication flow
 */

import { Router } from 'express';
import { buildOAuth2URL } from '../../bot/utils/oauth';

const router = Router();

// Redirect to Discord OAuth
router.get('/login', (req, res) => {
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
    return res.redirect('/?error=access_denied');
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/?error=invalid_code');
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

    // Store user data in session
    (req.session as any).user = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    };

    console.log(`\x1b[32m[AUTH] User logged in: ${userData.username}#${userData.discriminator}\x1b[0m`);

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('[AUTH] Callback error:', error);
    res.redirect('/?error=auth_failed');
  }
});


// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[AUTH] Logout error:', err);
    }
    res.redirect('/');
  });
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
