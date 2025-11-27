/**
 * Text Command Handler
 * Handles prefix-based commands
 */

import { Client, Collection, Message } from 'discord.js';
import { TextCommand } from '../types/text-command';
import { query } from '../../db/pool';
import { getDefaultLocale } from '../../i18n';
import { checkPrefixCommandRestriction } from '../middleware/commandRestrictions';
import fs from 'fs';
import path from 'path';

// Store text commands
const textCommands = new Collection<string, TextCommand>();
const textCommandAliases = new Collection<string, string>(); // alias -> command name
const cooldowns = new Collection<string, Collection<string, number>>();

/**
 * Load all text commands from command-text directory
 */
export async function loadTextCommands(client: Client): Promise<void> {
  const commandsPath = path.join(__dirname, '../command-text');
  const categories = fs.readdirSync(commandsPath).filter(file =>
    fs.statSync(path.join(commandsPath, file)).isDirectory()
  );

  let commandCount = 0;

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const commandModule = await import(filePath);
      const commands: TextCommand[] = commandModule.default;

      if (Array.isArray(commands)) {
        for (const command of commands) {
          textCommands.set(command.name, command);
          commandCount++;

          // Register aliases
          if (command.aliases) {
            for (const alias of command.aliases) {
              textCommandAliases.set(alias, command.name);
            }
          }
        }
      }
    }
  }

  console.log(`\x1b[32m✓ Loaded ${commandCount} text commands\x1b[0m`);
}

/**
 * Get guild prefix from database or fallback to BOT_PREFIX
 */
async function getGuildPrefix(guildId: string): Promise<string> {
  try {
    const result = await query(
      'SELECT prefix FROM guilds WHERE guild_id = $1',
      [guildId]
    );

    if (result.rows.length > 0 && result.rows[0].prefix) {
      return result.rows[0].prefix;
    }
  } catch (error) {
    console.error('[TEXT COMMAND] Error fetching guild prefix:', error);
  }

  // Fallback to BOT_PREFIX from env
  return process.env.BOT_PREFIX || '!';
}

/**
 * Get guild locale from database or fallback to DEFAULT_LOCALE
 */
async function getGuildLocale(guildId: string): Promise<string> {
  try {
    const result = await query(
      'SELECT locale FROM guilds WHERE guild_id = $1',
      [guildId]
    );

    if (result.rows.length > 0 && result.rows[0].locale) {
      return result.rows[0].locale;
    }
  } catch (error) {
    console.error('[TEXT COMMAND] Error fetching guild locale:', error);
  }

  // Fallback to default locale
  return getDefaultLocale();
}

/**
 * Handle text command execution
 */
export async function handleTextCommand(message: Message): Promise<void> {
  // Ignore bots
  if (message.author.bot) return;

  // Get prefix (support both guild prefix and BOT_PREFIX)
  const botPrefix = process.env.BOT_PREFIX || '!';
  let prefix: string;
  let usedBotPrefix = false;

  if (message.guild) {
    const guildPrefix = await getGuildPrefix(message.guild.id);

    // Check if message starts with guild prefix or bot prefix
    if (message.content.startsWith(guildPrefix)) {
      prefix = guildPrefix;
    } else if (message.content.startsWith(botPrefix)) {
      prefix = botPrefix;
      usedBotPrefix = true;
    } else {
      return; // Not a command
    }
  } else {
    // In DMs, only use bot prefix
    if (!message.content.startsWith(botPrefix)) return;
    prefix = botPrefix;
    usedBotPrefix = true;
  }

  // Parse command and args
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  // Get command (check both name and aliases)
  const command = textCommands.get(commandName) ||
                 textCommands.get(textCommandAliases.get(commandName) || '');

  if (!command) return;

  // Check if command is guild only
  if (command.guildOnly && !message.guild) {
    await message.reply('This command can only be used in servers!');
    return;
  }

  // Check if command is owner only
  if (command.ownerOnly) {
    const ownerId = process.env.BOT_OWNER_ID;
    if (message.author.id !== ownerId) {
      await message.reply('This command can only be used by the bot owner!');
      return;
    }
  }

  // Check permissions
  if (command.permissions && message.guild) {
    const member = message.guild.members.cache.get(message.author.id);
    if (member && !command.permissions.every(perm => member.permissions.has(perm))) {
      await message.reply('You do not have permission to use this command!');
      return;
    }
  }

  // Check bot permissions
  if (command.botPermissions && message.guild) {
    const botMember = message.guild.members.cache.get(message.client.user.id);
    if (botMember && !command.botPermissions.every(perm => botMember.permissions.has(perm))) {
      await message.reply('I do not have permission to execute this command!');
      return;
    }
  }

  // Handle cooldowns
  if (command.cooldown) {
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name)!;
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        await message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        return;
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  }

  // Get locale
  const locale = message.guild
    ? await getGuildLocale(message.guild.id)
    : getDefaultLocale();

  // Check command channel restrictions
  const isRestricted = await checkPrefixCommandRestriction(message, command.name, locale);
  if (isRestricted) {
    return; // Restriction message already sent and will auto-delete
  }

  // Execute command
  try {
    await command.execute({
      message,
      args,
      locale,
      prefix,
    });

    console.log(`[TEXT COMMAND] ${message.author.tag} used: ${prefix}${commandName}`);
  } catch (error) {
    console.error(`[TEXT COMMAND] Error executing ${commandName}:`, error);
    await message.reply('There was an error executing this command!');
  }
}

/**
 * Get all loaded text commands
 */
export function getTextCommands(): Collection<string, TextCommand> {
  return textCommands;
}
