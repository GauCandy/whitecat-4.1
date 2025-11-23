/**
 * Discord Bot Client
 * Initializes and configures the Discord.js client
 */

import { Client, GatewayIntentBits, Partials, ActivityType } from 'discord.js';

// Create Discord client with required intents
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction,
  ],
  presence: {
    status: 'online',
    activities: [{
      name: 'WhiteCat Bot v4.1',
      type: ActivityType.Playing,
    }],
  },
});

// Export for use in other modules
export default client;
