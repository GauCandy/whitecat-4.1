/**
 * Centralized OAuth Service
 * Quản lý OAuth URLs với integration_type
 */

/**
 * Build base URL from environment
 */
function buildBaseUrl(): string {
  const publicUrl = process.env.PUBLIC_URL || 'localhost';
  const publicPort = process.env.PUBLIC_PORT || '2082';
  const useSSL = process.env.PUBLIC_SSL === 'true';

  const protocol = useSSL ? 'https' : 'http';
  const portDisplay = (useSSL && publicPort === '443') || (!useSSL && publicPort === '80')
    ? ''
    : `:${publicPort}`;

  return `${protocol}://${publicUrl}${portDisplay}`;
}

/**
 * Parse scopes (comma → space)
 */
function parseScopes(scopes: string): string {
  return scopes.replace(/,/g, ' ').trim();
}

/**
 * OAuth Service
 */
export class OAuthService {
  private baseUrl: string;
  private clientId: string;
  private scopes: string;
  private botPermissions: string;

  constructor() {
    this.baseUrl = buildBaseUrl();
    this.clientId = process.env.CLIENT_ID || '';
    this.scopes = parseScopes(process.env.OAUTH2_SCOPES || 'identify,email');
    this.botPermissions = process.env.BOT_PERMISSIONS || '8';

    if (!this.clientId) {
      throw new Error('CLIENT_ID not found in environment variables');
    }
  }

  /**
   * USER LOGIN - Login thông thường (không có integration_type)
   */
  getUserLoginURL(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${this.baseUrl}/auth/callback`,
      response_type: 'code',
      scope: this.scopes,
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * USER INSTALL - App cho user cá nhân
   * Dùng chung OAUTH2_SCOPES + integration_type=1
   */
  getUserInstallURL(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${this.baseUrl}/auth/callback`,
      response_type: 'code',
      scope: this.scopes,
      integration_type: '1', // User Install
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * GUILD INSTALL - Bot vào server
   * Dùng chung OAUTH2_SCOPES + integration_type=0 + permissions
   */
  getBotInviteURL(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${this.baseUrl}/auth/callback`,
      response_type: 'code',
      scope: this.scopes,
      permissions: this.botPermissions,
      integration_type: '0', // Guild Install
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Get all URLs
   */
  getAllURLs() {
    return {
      userLogin: this.getUserLoginURL(),
      userInstall: this.getUserInstallURL(),
      botInvite: this.getBotInviteURL(),
      baseUrl: this.baseUrl,
    };
  }
}

// Export singleton
export const inviteService = new OAuthService();

// Export helpers
export const buildOAuth2URL = () => inviteService.getUserLoginURL();
export const buildUserInstallURL = () => inviteService.getUserInstallURL();
export const buildBotInviteURL = () => inviteService.getBotInviteURL();
