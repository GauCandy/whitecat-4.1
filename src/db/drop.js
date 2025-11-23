#!/usr/bin/env node

/**
 * Drop Bot Tables Script
 * Drops only the tables used by WhiteCat Bot
 */

require('dotenv').config();
const { Client } = require('pg');
const readline = require('readline');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

// Bot tables in correct drop order (reverse of creation, respecting foreign keys)
const BOT_TABLES = [
  'command_logs',
  'giveaway_entries',
  'giveaway_requirements',
  'giveaways',
  'command_channel_restrictions',
  'auto_response_blocked_channels',
  'auto_responses',
  'guilds',
  'transactions',
  'user_balances',
  'currencies',
  'user_guild_permissions',
  'web_sessions',
  'oauth_tokens',
  'users',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function askConfirmation(question) {
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

async function dropBotTables() {
  log('\n==========================================', colors.red);
  log('⚠️  DROP BOT TABLES - WARNING', colors.red);
  log('==========================================\n', colors.red);
  log('This will DELETE the following bot tables:', colors.yellow);
  BOT_TABLES.forEach(table => log(`  • ${table}`, colors.yellow));
  log('\nAll data in these tables will be LOST!', colors.red);
  log('\nDatabase:', colors.blue);
  log(`  Host: ${dbConfig.host}`, colors.blue);
  log(`  Database: ${dbConfig.database}\n`, colors.blue);

  // Ask for confirmation
  const confirmed = await askConfirmation('Type "yes" to continue: ');

  if (!confirmed) {
    log('\n❌ Drop cancelled.', colors.yellow);
    process.exit(0);
  }

  const client = new Client(dbConfig);

  try {
    log('\nConnecting to PostgreSQL...', colors.yellow);
    await client.connect();
    log('✓ Connected successfully!', colors.green);

    // Check which tables exist
    log('\nChecking existing tables...', colors.yellow);
    const existingResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name;
    `, [BOT_TABLES]);

    const existingTables = existingResult.rows.map(row => row.table_name);

    if (existingTables.length === 0) {
      log('✓ No bot tables found in database.', colors.green);
      log('\n==========================================', colors.blue);
      log('Nothing to drop!', colors.green);
      log('==========================================\n', colors.blue);
      return;
    }

    log(`Found ${existingTables.length} bot tables to drop.`, colors.yellow);

    // Drop tables
    log('\nDropping bot tables...', colors.yellow);
    for (const table of BOT_TABLES) {
      if (existingTables.includes(table)) {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        log(`  ✓ Dropped: ${table}`, colors.green);
      }
    }

    log('\n==========================================', colors.blue);
    log('Bot tables dropped successfully!', colors.green);
    log('==========================================\n', colors.blue);

  } catch (error) {
    log('\n==========================================', colors.red);
    log('❌ Drop operation failed!', colors.red);
    log('==========================================', colors.red);
    log(`\nError: ${error.message}`, colors.red);

    if (error.code) {
      log(`Error Code: ${error.code}`, colors.red);
    }

    process.exit(1);
  } finally {
    await client.end();
    log('Connection closed.', colors.yellow);
  }
}

// Run drop
dropBotTables();
