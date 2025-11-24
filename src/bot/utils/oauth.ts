/**
 * OAuth2 Utilities
 * Build Discord OAuth2 authorization URLs
 */

/**
 * Build OAuth2 authorization URL from environment variables
 * @returns Discord OAuth2 authorization URL
 */
export function buildOAuth2URL(): string {
  const clientId = process.env.CLIENT_ID;
  const scopes = process.env.OAUTH2_SCOPES || 'identify,email';

  // Public URL configuration for OAuth callbacks
  const publicUrl = process.env.PUBLIC_URL || 'localhost';
  const publicPort = process.env.PUBLIC_PORT || '2082';
  const useSSL = process.env.PUBLIC_SSL === 'true';

  if (!clientId) {
    throw new Error('CLIENT_ID not found in environment variables');
  }

  // Build redirect URI
  let redirectUri: string;
  if (useSSL && publicPort === '443') {
    // HTTPS without port (default port)
    redirectUri = `https://${publicUrl}/auth/callback`;
  } else if (useSSL) {
    // HTTPS with custom port
    redirectUri = `https://${publicUrl}:${publicPort}/auth/callback`;
  } else if (publicPort === '80') {
    // HTTP without port (default port)
    redirectUri = `http://${publicUrl}/auth/callback`;
  } else {
    // HTTP with custom port
    redirectUri = `http://${publicUrl}:${publicPort}/auth/callback`;
  }

  // Build OAuth2 URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.replace(',', ' '), // Discord expects space-separated scopes
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
