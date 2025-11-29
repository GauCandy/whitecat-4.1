/**
 * WhiteCat Bot - Discord Bot Entry Point
 * Version 4.1
 */

import dotenv from 'dotenv';
import pool, { query, close } from '../db/pool';
import client from './client';
import { loadEvents } from './handlers/events';
import { loadCommands } from './handlers/commands';
import { loadTextCommands } from './handlers/text-commands';
import i18n from '../i18n';

// Load environment variables
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

async function startBot() {
  try {
    log('\n==========================================', colors.cyan);
    log('WhiteCat Bot v4.1 - Starting...', colors.cyan);
    log('==========================================\n', colors.cyan);

    // Test database connection
    log('Testing database connection...', colors.yellow);
    const result = await query('SELECT NOW() as current_time, current_database() as database');
    const { current_time, database } = result.rows[0];

    log('✓ Database connected successfully!', colors.green);
    log(`  Database: ${database}`, colors.blue);
    log(`  Server Time: ${current_time}`, colors.blue);

    // Check bot tables
    log('\nChecking bot tables...', colors.yellow);
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'users', 'oauth_tokens', 'web_sessions', 'user_guild_permissions',
          'currencies', 'user_balances', 'transactions',
          'guilds', 'auto_responses', 'auto_response_blocked_channels', 'command_channel_restrictions',
          'giveaways', 'giveaway_requirements', 'giveaway_entries',
          'command_logs'
        )
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      log('⚠️  No bot tables found!', colors.yellow);
      log('Please run: npm run db:init', colors.yellow);
      process.exit(1);
    }

    log(`✓ Found ${tablesResult.rows.length}/15 bot tables`, colors.green);

    // Get pool status
    log('\nDatabase Pool Status:', colors.yellow);
    log(`  Total connections: ${pool.totalCount}`, colors.blue);
    log(`  Idle connections: ${pool.idleCount}`, colors.blue);
    log(`  Waiting requests: ${pool.waitingCount}`, colors.blue);

    // Initialize i18n
    log('\nInitializing i18n...', colors.yellow);
    const locale = process.env.DEFAULT_LOCALE || 'en-US';
    i18n.init(locale);

    // Initialize Discord bot
    log('\nInitializing Discord bot...', colors.yellow);
    await loadCommands(client);
    await loadTextCommands(client);
    await loadEvents(client);

    // Login to Discord
    log('Connecting to Discord...', colors.yellow);
    const token = process.env.DISCORD_TOKEN;

    if (!token) {
      throw new Error('DISCORD_TOKEN not found in .env file');
    }

    // Wait for bot to be ready
    await new Promise<void>((resolve) => {
      client.once('clientReady', async () => {
        log('\n==========================================', colors.cyan);
        log('Discord Bot is ready!', colors.green);
        log('==========================================\n', colors.cyan);

        // Auto-generate support server invite if configured
        const supportGuildId = process.env.GUILD_ID_SUPPORT;
        if (supportGuildId) {
          try {
            const guild = client.guilds.cache.get(supportGuildId);
            if (guild) {
              // Find a suitable channel to create invite
              const channel = guild.channels.cache.find(
                (ch) => (ch.type === 0 || ch.type === 2) && ch.permissionsFor(guild.members.me!)?.has('CreateInstantInvite')
              );

              if (channel && 'createInvite' in channel) {
                const invite = await channel.createInvite({
                  maxAge: 0, // Never expires
                  maxUses: 0, // Unlimited uses
                  unique: false,
                });

                // Save to database
                await query(
                  `INSERT INTO settings (key, value, updated_at)
                   VALUES ($1, $2, CURRENT_TIMESTAMP)
                   ON CONFLICT (key)
                   DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
                  ['support_server_invite', invite.url]
                );

                log(`✓ Support server invite created: ${invite.url}`, colors.green);
              } else {
                log('⚠️  No suitable channel found for support invite', colors.yellow);
              }
            } else {
              log('⚠️  Support server not found in cache', colors.yellow);
            }
          } catch (error) {
            log('⚠️  Failed to create support server invite:', colors.yellow);
            console.error(error);
          }
        }

        resolve();
      });

      client.login(token);
    });

  } catch (error) {
    log('\n==========================================', colors.red);
    log('❌ Failed to start Discord Bot', colors.red);
    log('==========================================', colors.red);

    const err = error as any;
    log(`\nError: ${err.message || 'Unknown error'}`, colors.red);

    if (err.code) {
      log(`Error Code: ${err.code}`, colors.red);
    }

    if (err.code === 'ECONNREFUSED') {
      log('\n⚠️  Cannot connect to PostgreSQL database', colors.yellow);
      log('Please check:', colors.yellow);
      log('  1. PostgreSQL is running', colors.yellow);
      log('  2. DB_HOST and DB_PORT in .env are correct', colors.yellow);
      log('  3. Database credentials are valid', colors.yellow);
    }

    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  log(`\n${signal} received, shutting down gracefully...`, colors.yellow);

  try {
    // Stop Discord bot
    if (client.isReady()) {
      log('Disconnecting from Discord...', colors.yellow);
      client.destroy();
      log('✓ Discord bot disconnected', colors.green);
    }

    // Close database pool
    log('Closing database connections...', colors.yellow);
    await close();
    log('✓ All connections closed', colors.green);

    log('Discord Bot stopped successfully', colors.green);
    process.exit(0);
  } catch (error) {
    const err = error as any;
    log(`Error during shutdown: ${err.message}`, colors.red);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('Uncaught Exception:', colors.red);
  console.error(error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled Rejection at:', colors.red);
  console.error(promise);
  log('Reason:', colors.red);
  console.error(reason);
  shutdown('UNHANDLED_REJECTION');
});

// Start the bot and export the promise
export const botReady = startBot();
