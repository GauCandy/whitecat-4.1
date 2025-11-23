#!/usr/bin/env node

/**
 * Clear Non-Bot Tables Script
 * Drops all tables EXCEPT the ones used by WhiteCat Bot
 */

import dotenv from 'dotenv';
import { Client, ClientConfig } from 'pg';
import readline from 'readline';

dotenv.config();

// Database configuration from environment variables
const dbConfig: ClientConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

// Bot tables that should NOT be dropped
const BOT_TABLES = [
  'users',
  'oauth_tokens',
  'web_sessions',
  'user_guild_permissions',
  'currencies',
  'user_balances',
  'transactions',
  'guilds',
  'auto_responses',
  'auto_response_blocked_channels',
  'command_channel_restrictions',
  'giveaways',
  'giveaway_requirements',
  'giveaway_entries',
  'command_logs',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
} as const;

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function clearNonBotTables() {
  log('\n==========================================', colors.red);
  log('⚠️  CLEAR NON-BOT TABLES - WARNING', colors.red);
  log('==========================================\n', colors.red);
  log('This will DELETE all tables EXCEPT bot tables:', colors.yellow);
  log('\nBot tables (will be kept):', colors.green);
  BOT_TABLES.forEach(table => log(`  ✓ ${table}`, colors.green));
  log('\nDatabase:', colors.blue);
  log(`  Host: ${dbConfig.host}`, colors.blue);
  log(`  Database: ${dbConfig.database}\n`, colors.blue);

  const client = new Client(dbConfig);

  try {
    log('Connecting to PostgreSQL...', colors.yellow);
    await client.connect();
    log('✓ Connected successfully!', colors.green);

    // Get all tables in public schema
    log('\nFinding non-bot tables...', colors.yellow);
    const allTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const allTables = allTablesResult.rows.map(row => row.table_name);
    const nonBotTables = allTables.filter(table => !BOT_TABLES.includes(table));

    if (nonBotTables.length === 0) {
      log('✓ No non-bot tables found in database.', colors.green);
      log('\n==========================================', colors.blue);
      log('Nothing to clear!', colors.green);
      log('==========================================\n', colors.blue);
      return;
    }

    log(`\nFound ${nonBotTables.length} non-bot tables to drop:`, colors.red);
    nonBotTables.forEach(table => log(`  • ${table}`, colors.red));

    // Ask for confirmation
    const confirmed = await askConfirmation('\nType "yes" to continue: ');

    if (!confirmed) {
      log('\n❌ Clear cancelled.', colors.yellow);
      process.exit(0);
    }

    // Drop non-bot tables
    log('\nDropping non-bot tables...', colors.yellow);
    for (const table of nonBotTables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      log(`  ✓ Dropped: ${table}`, colors.green);
    }

    log('\n==========================================', colors.blue);
    log('Non-bot tables cleared successfully!', colors.green);
    log('==========================================', colors.blue);
    log(`\nDropped ${nonBotTables.length} tables.`, colors.green);
    log(`Kept ${BOT_TABLES.length} bot tables.\n`, colors.green);

  } catch (error) {
    log('\n==========================================', colors.red);
    log('❌ Clear operation failed!', colors.red);
    log('==========================================', colors.red);

    const err = error as any;
    log(`\nError: ${err.message || 'Unknown error'}`, colors.red);

    if (err.code) {
      log(`Error Code: ${err.code}`, colors.red);
    }

    process.exit(1);
  } finally {
    await client.end();
    log('Connection closed.', colors.yellow);
  }
}

// Run clear
clearNonBotTables();
