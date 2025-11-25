#!/usr/bin/env node

/**
 * Deploy Slash Commands Script
 * Deploys commands globally or to a specific guild based on GUILD_ID
 */

import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

/**
 * Recursively load command data from directory
 */
function loadCommandData(dirPath: string): any[] {
  const commands: any[] = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Recursively load from subdirectory
      commands.push(...loadCommandData(itemPath));
    } else if (item.endsWith('.js') && !item.endsWith('.d.ts')) {
      // Load command file
      const commandExport = require(itemPath).default;

      // Handle both single command and array of commands
      const commandsToLoad = Array.isArray(commandExport) ? commandExport : [commandExport];

      for (const command of commandsToLoad) {
        if (command && command.data) {
          commands.push(command.data.toJSON());
          log(`  ✓ Loaded: ${command.data.name}`, colors.green);
        }
      }
    }
  }

  return commands;
}

async function deployCommands() {
  try {
    log('\n==========================================', colors.cyan);
    log('Slash Commands Deployment', colors.cyan);
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

    // Load commands
    log('Loading commands from directory...', colors.yellow);
    const commandsPath = path.join(__dirname, 'commands');

    if (!fs.existsSync(commandsPath)) {
      throw new Error(`Commands directory not found: ${commandsPath}`);
    }

    const commands = loadCommandData(commandsPath);
    log(`\n✓ Found ${commands.length} commands to deploy\n`, colors.green);

    // Initialize REST client
    const rest = new REST({ version: '10' }).setToken(token);

    // Determine deployment type
    const isGlobal = !guildId || guildId === '0' || guildId === '';

    if (isGlobal) {
      log('Deploying commands GLOBALLY...', colors.yellow);
      log('⚠️  This may take up to 1 hour to update on all servers!', colors.yellow);

      await rest.put(Routes.applicationCommands(clientId), { body: commands });

      log('\n==========================================', colors.cyan);
      log('✓ Global deployment successful!', colors.green);
      log('==========================================', colors.cyan);
      log(`Deployed ${commands.length} commands globally`, colors.green);
      log('Commands will be available in all servers within 1 hour\n', colors.blue);
    } else {
      log(`Deploying commands to GUILD: ${guildId}...`, colors.yellow);
      log('⚠️  Commands will update instantly in this server!', colors.yellow);

      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });

      log('\n==========================================', colors.cyan);
      log('✓ Guild deployment successful!', colors.green);
      log('==========================================', colors.cyan);
      log(`Deployed ${commands.length} commands to guild ${guildId}`, colors.green);
      log('Commands are now available in the server!\n', colors.blue);
    }

    // List deployed commands
    log('Deployed commands:', colors.yellow);
    commands.forEach((cmd: any) => {
      log(`  • /${cmd.name} - ${cmd.description}`, colors.blue);
    });

    console.log('');
  } catch (error) {
    log('\n==========================================', colors.red);
    log('❌ Deployment failed!', colors.red);
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

// Run deployment
deployCommands();
