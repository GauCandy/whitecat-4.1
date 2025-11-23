#!/usr/bin/env node

/**
 * Clear Slash Commands Script
 * Removes all commands from guild or globally
 */

import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// Colors
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

async function clearCommands() {
  try {
    log('\n==========================================', colors.cyan);
    log('Clear Slash Commands', colors.cyan);
    log('==========================================\n', colors.cyan);

    // Get environment variables
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!token) {
      throw new Error('DISCORD_TOKEN not found in .env');
    }

    if (!clientId) {
      throw new Error('CLIENT_ID not found in .env');
    }

    // Initialize REST client
    const rest = new REST({ version: '10' }).setToken(token);

    // Determine clear type
    const isGlobal = !guildId || guildId === '0' || guildId === '';

    if (isGlobal) {
      log('Clearing GLOBAL commands...', colors.yellow);
      log('⚠️  This will remove all commands from all servers!', colors.red);

      await rest.put(Routes.applicationCommands(clientId), { body: [] });

      log('\n==========================================', colors.cyan);
      log('✓ Global commands cleared!', colors.green);
      log('==========================================', colors.cyan);
      log('All global commands have been removed\n', colors.green);
    } else {
      log(`Clearing commands from GUILD: ${guildId}...`, colors.yellow);
      log('⚠️  This will remove all commands from this server!', colors.red);

      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: [],
      });

      log('\n==========================================', colors.cyan);
      log('✓ Guild commands cleared!', colors.green);
      log('==========================================', colors.cyan);
      log(`All commands removed from guild ${guildId}\n`, colors.green);
    }
  } catch (error) {
    log('\n==========================================', colors.red);
    log('❌ Clear failed!', colors.red);
    log('==========================================', colors.red);

    const err = error as any;
    log(`\nError: ${err.message || 'Unknown error'}`, colors.red);

    if (err.code) {
      log(`Error Code: ${err.code}`, colors.red);
    }

    if (err.rawError) {
      log('\nRaw Error:', colors.red);
      console.error(err.rawError);
    }

    process.exit(1);
  }
}

// Run clear
clearCommands();
