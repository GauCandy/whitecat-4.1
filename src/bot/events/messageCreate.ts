/**
 * Message Create Event
 * Handles text-based prefix commands and auto responses
 */

import { Events, Message } from 'discord.js';
import { handleTextCommand } from '../handlers/text-commands';
import { processAutoResponses } from '../handlers/autoResponseHandler';

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message: Message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Priority 1: Handle text commands first
    // This prevents auto-responses from triggering when users type commands
    const isCommand = message.content.startsWith(process.env.BOT_PREFIX || '!');

    if (isCommand) {
      await handleTextCommand(message);
      return; // Don't process auto-responses for commands
    }

    // Priority 2: Check for auto responses (only if not a command)
    await processAutoResponses(message);
  },
};
