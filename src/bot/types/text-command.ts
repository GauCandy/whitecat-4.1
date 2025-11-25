/**
 * Text Command Type Definitions
 * For prefix-based commands (e.g., !help, !ping)
 */

import { Message, PermissionsBitField } from 'discord.js';

export interface TextCommandExecuteOptions {
  message: Message;
  args: string[];
  locale: string;
  prefix: string;
}

export interface TextCommand {
  name: string; // Command name (e.g., 'ping')
  aliases?: string[]; // Alternative names (e.g., ['p', 'pong'])
  description: string; // Command description
  usage?: string; // Usage example (e.g., '!ping')
  category?: string; // Category (e.g., 'fun', 'utility')
  cooldown?: number; // Cooldown in seconds
  ownerOnly?: boolean; // Only bot owner can use
  guildOnly?: boolean; // Can only be used in guilds
  requireTerms?: boolean; // Require terms acceptance (default: true)
  permissions?: bigint[]; // Required permissions (User)
  botPermissions?: bigint[]; // Required bot permissions
  execute: (options: TextCommandExecuteOptions) => Promise<void>;
}

export interface TextCommandCategory {
  name: string;
  description: string;
  commands: Map<string, TextCommand>;
}
