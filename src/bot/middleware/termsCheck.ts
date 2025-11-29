/**
 * Terms Acceptance Middleware
 * Checks if user has accepted terms before executing commands
 */

import { ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { query } from '../../db/pool';
import { buildUserInstallURL } from '../utils/oauth';
import { t } from '../../i18n';

/**
 * Check if user has accepted terms
 * @param interaction Command interaction
 * @param locale User's locale
 * @returns true if user has accepted terms, false otherwise
 */
export async function checkTermsAccepted(
  interaction: ChatInputCommandInteraction,
  locale: string
): Promise<boolean> {
  try {
    // Check if user exists and has accepted terms
    const result = await query(
      'SELECT terms_accepted FROM users WHERE discord_id = $1',
      [interaction.user.id]
    );

    // If user doesn't exist in database, they haven't accepted terms
    if (result.rows.length === 0) {
      await sendTermsEmbed(interaction, locale);
      return false;
    }

    const termsAccepted = result.rows[0].terms_accepted;

    // If terms not accepted, send terms embed
    if (!termsAccepted) {
      await sendTermsEmbed(interaction, locale);
      return false;
    }

    return true;
  } catch (error) {
    console.error('\x1b[31m❌ Error checking terms acceptance:\x1b[0m', error);

    // On error, send generic error message
    await interaction.reply({
      content: t('oauth.error_checking_terms', {}, locale as any),
      flags: MessageFlags.Ephemeral,
    });

    return false;
  }
}

/**
 * Send terms acceptance embed with OAuth2 button
 * @param interaction Command interaction
 * @param locale User's locale
 */
async function sendTermsEmbed(
  interaction: ChatInputCommandInteraction,
  locale: string
): Promise<void> {
  try {
    console.log('\x1b[36m[Terms] Building OAuth2 URL...\x1b[0m');

    // Build OAuth2 authorization URL with integration_type=1 (User Install)
    const oauthUrl = buildUserInstallURL();

    console.log(`\x1b[36m[Terms] OAuth URL (User Install, integration_type=1): ${oauthUrl}\x1b[0m`);

    // Create embed
    console.log('\x1b[36m[Terms] Creating embed...\x1b[0m');
    const embed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle(t('oauth.terms_title', {}, locale as any))
      .setDescription(t('oauth.terms_description', {}, locale as any))
      .setFooter({ text: t('oauth.terms_footer', {}, locale as any) })
      .setTimestamp();

    // Create button
    console.log('\x1b[36m[Terms] Creating button...\x1b[0m');
    const button = new ButtonBuilder()
      .setLabel(t('oauth.authorize_button', {}, locale as any))
      .setStyle(ButtonStyle.Link)
      .setURL(oauthUrl);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Send embed with button
    console.log('\x1b[36m[Terms] Sending embed to Discord...\x1b[0m');
    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });

    console.log('\x1b[32m[Terms] ✓ Embed sent successfully!\x1b[0m');
  } catch (error) {
    console.error('\x1b[31m❌ Error sending terms embed:\x1b[0m');
    console.error('\x1b[31m   Error type:\x1b[0m', error instanceof Error ? error.constructor.name : typeof error);
    console.error('\x1b[31m   Error message:\x1b[0m', error instanceof Error ? error.message : String(error));
    console.error('\x1b[31m   Stack trace:\x1b[0m', error instanceof Error ? error.stack : 'No stack trace');

    // Fallback to simple message
    try {
      await interaction.reply({
        content: t('oauth.terms_required', {}, locale as any),
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      console.error('\x1b[31m❌ Failed to send fallback message:\x1b[0m', replyError);
    }
  }
}
