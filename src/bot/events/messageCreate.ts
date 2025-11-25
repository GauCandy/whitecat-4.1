/**
 * Message Create Event
 * Handles text-based prefix commands
 */

import { Events, Message } from 'discord.js';
import { handleTextCommand } from '../handlers/text-commands';

export default {
  name: Events.MessageCreate,
  once: false,

  async execute(message: Message) {
    // Handle text commands
    await handleTextCommand(message);
  },
};
