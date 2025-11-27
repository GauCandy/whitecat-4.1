/**
 * Command Loader
 * Recursively loads all commands from commands directory and subdirectories
 */

import { Client, Collection } from 'discord.js';
import { Command } from '../types/command';
import fs from 'fs';
import path from 'path';

export const commands = new Collection<string, Command>();

/**
 * Recursively load commands from a directory
 * @param dirPath Directory path to load from
 */
function loadCommandsFromDirectory(dirPath: string): void {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Recursively load from subdirectory
      loadCommandsFromDirectory(itemPath);
    } else if ((item.endsWith('.ts') || item.endsWith('.js')) && !item.endsWith('.d.ts')) {
      // Load command file (skip .d.ts declaration files)
      const commandExport = require(itemPath).default;

      // Handle both single command and array of commands
      const commandsToLoad = Array.isArray(commandExport) ? commandExport : [commandExport];

      for (const command of commandsToLoad) {
        if (command && command.data && typeof command.execute === 'function') {
          commands.set(command.data.name, command);
          console.log(`\x1b[32m  ✓ Loaded command: ${command.data.name}\x1b[0m`);
        } else {
          console.log(`\x1b[33m  ⚠️  Skipped ${item}: missing data or execute\x1b[0m`);
        }
      }
    }
  }
}

/**
 * Load all commands into the client
 * @param client Discord client
 */
export async function loadCommands(client: Client): Promise<void> {
  console.log('\x1b[33mLoading slash commands...\x1b[0m');

  const commandsPath = path.join(__dirname, '../commands');

  if (!fs.existsSync(commandsPath)) {
    console.log('\x1b[33m⚠️  No commands directory found\x1b[0m');
    return;
  }

  loadCommandsFromDirectory(commandsPath);

  console.log(`\x1b[32m✓ Loaded ${commands.size} commands\x1b[0m\n`);

  // Attach commands to client for easy access
  (client as any).commands = commands;
}

export default loadCommands;
