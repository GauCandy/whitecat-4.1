/**
 * OAuth2 Utilities
 * @deprecated Use DiscordInviteService instead
 */

import { inviteService } from '../services/discord-invite-service';

/**
 * User Login URL
 */
export function buildOAuth2URL(): string {
  return inviteService.getUserLoginURL();
}

/**
 * User Install URL (integration_type=1)
 */
export function buildUserInstallURL(): string {
  return inviteService.getUserInstallURL();
}

/**
 * Guild Install / Bot Invite URL (integration_type=0)
 */
export function buildBotInviteURL(): string {
  return inviteService.getBotInviteURL();
}

// Export service
export { inviteService } from '../services/discord-invite-service';
