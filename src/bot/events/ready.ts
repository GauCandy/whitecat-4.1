/**
 * Bot Ready Event
 * Fires when the bot successfully connects to Discord
 */

import { Client } from 'discord.js';

export default {
  name: 'clientReady',
  once: true,
  execute(client: Client) {
    if (!client.user) return;

    console.log(`\x1b[32m✓ Discord bot logged in as: ${client.user.tag}\x1b[0m`);
    console.log(`\x1b[34m  Bot ID: ${client.user.id}\x1b[0m`);
    console.log(`\x1b[34m  Guilds: ${client.guilds.cache.size}\x1b[0m`);
    console.log(`\x1b[34m  Users: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\x1b[0m`);
  },
};
