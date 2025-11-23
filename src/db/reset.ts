#!/usr/bin/env node

/**
 * Database Reset Script
 * Drops bot tables and recreates them
 * WARNING: This will delete all bot data!
 */

import dotenv from 'dotenv';
import { Client, ClientConfig } from 'pg';
import fs from 'fs';
import path from 'path';
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

async function resetDatabase() {
  log('\n==========================================', colors.red);
  log('⚠️  RESET BOT TABLES - WARNING', colors.red);
  log('==========================================\n', colors.red);
  log('This will DELETE bot tables and recreate them:', colors.yellow);
  BOT_TABLES.forEach(table => log(`  • ${table}`, colors.yellow));
  log('\nAll data in bot tables will be LOST!', colors.red);
  log('Other tables in database will NOT be affected.', colors.green);
  log('\nDatabase:', colors.blue);
  log(`  Host: ${dbConfig.host}`, colors.blue);
  log(`  Database: ${dbConfig.database}\n`, colors.blue);

  // Ask for confirmation
  const confirmed = await askConfirmation('Type "yes" to continue: ');

  if (!confirmed) {
    log('\n❌ Reset cancelled.', colors.yellow);
    process.exit(0);
  }

  const client = new Client(dbConfig);

  try {
    log('\nConnecting to PostgreSQL...', colors.yellow);
    await client.connect();
    log('✓ Connected successfully!', colors.green);

    // Drop bot tables only
    log('\nDropping bot tables...', colors.yellow);
    for (const table of BOT_TABLES) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      log(`  ✓ Dropped: ${table}`, colors.green);
    }

    // Read and execute schema
    log('\nReading schema file...', colors.yellow);
    const schemaPath = path.join(__dirname, '../../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    log('✓ Schema file loaded!', colors.green);

    log('\nRecreating bot tables...', colors.yellow);
    await client.query(schema);
    log('✓ Bot tables created successfully!', colors.green);

    // Insert default data
    log('\nInserting default data...', colors.yellow);
    await client.query(`
      INSERT INTO currencies (code, name, emoji, is_tradeable, is_active)
      VALUES
        ('COIN', 'WhiteCat Coins', '🪙', true, true)
      ON CONFLICT (code) DO NOTHING;
    `);
    log('✓ Default currency added!', colors.green);

    // Verify
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name;
    `, [BOT_TABLES]);

    log(`\n✓ Recreated ${result.rows.length} bot tables`, colors.green);

    log('\n==========================================', colors.blue);
    log('Bot tables reset completed!', colors.green);
    log('==========================================\n', colors.blue);

  } catch (error) {
    log('\n==========================================', colors.red);
    log('❌ Database reset failed!', colors.red);
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

// Run reset
resetDatabase();
