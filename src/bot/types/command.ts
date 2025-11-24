/**
 * Command Type Definitions
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

export interface CommandExecuteOptions {
  interaction: ChatInputCommandInteraction;
  locale: string;
}

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | any;
  execute: (options: CommandExecuteOptions) => Promise<void>;
  cooldown?: number; // Cooldown in seconds
  ownerOnly?: boolean; // Only bot owner can use
  guildOnly?: boolean; // Can only be used in guilds
  requireTerms?: boolean; // Require terms acceptance (default: true)
}

export interface CommandCategory {
  name: string;
  description: string;
  commands: Map<string, Command>;
}
