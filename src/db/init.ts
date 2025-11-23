#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes PostgreSQL database with schema from database/schema.sql
 */

import dotenv from 'dotenv';
import { Client, ClientConfig } from 'pg';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Database configuration from environment variables
const dbConfig: ClientConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

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

async function initDatabase() {
  const client = new Client(dbConfig);

  try {
    log('\n==========================================', colors.blue);
    log('WhiteCat Bot - Database Initialization', colors.blue);
    log('==========================================\n', colors.blue);

    // Connect to database
    log('Connecting to PostgreSQL...', colors.yellow);
    await client.connect();
    log('✓ Connected successfully!', colors.green);

    // Check existing bot tables
    log('\nChecking existing bot tables...', colors.yellow);
    const existingTables = await client.query(`
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

    if (existingTables.rows.length > 0) {
      log(`⚠️  Found ${existingTables.rows.length} existing bot tables:`, colors.yellow);
      existingTables.rows.forEach(row => log(`  - ${row.table_name}`, colors.yellow));
      log('\nSkipping initialization. Use "npm run db:reset" to recreate tables.', colors.yellow);
      return;
    }

    // Read schema file
    log('\nReading schema file...', colors.yellow);
    const schemaPath = path.join(__dirname, '../../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    log('✓ Schema file loaded!', colors.green);

    // Execute schema
    log('\nCreating bot tables...', colors.yellow);
    await client.query(schema);
    log('✓ Bot tables created successfully!', colors.green);

    // Verify tables were created
    log('\nVerifying tables...', colors.yellow);
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    log(`\n✓ Created ${result.rows.length} tables:`, colors.green);
    result.rows.forEach((row, index) => {
      log(`  ${index + 1}. ${row.table_name}`);
    });

    // Insert default currencies if needed
    log('\nInserting default data...', colors.yellow);
    await client.query(`
      INSERT INTO currencies (code, name, emoji, is_tradeable, is_active)
      VALUES
        ('COIN', 'WhiteCat Coins', '🪙', true, true)
      ON CONFLICT (code) DO NOTHING;
    `);
    log('✓ Default currency added!', colors.green);

    log('\n==========================================', colors.blue);
    log('Database initialization completed!', colors.green);
    log('==========================================\n', colors.blue);

  } catch (error) {
    log('\n==========================================', colors.red);
    log('❌ Database initialization failed!', colors.red);
    log('==========================================', colors.red);

    const err = error as any;
    log(`\nError: ${err.message || 'Unknown error'}`, colors.red);

    if (err.code) {
      log(`Error Code: ${err.code}`, colors.red);
    }

    if (err.detail) {
      log(`Details: ${err.detail}`, colors.red);
    }

    process.exit(1);
  } finally {
    await client.end();
    log('\nConnection closed.', colors.yellow);
  }
}

// Run initialization
initDatabase();
