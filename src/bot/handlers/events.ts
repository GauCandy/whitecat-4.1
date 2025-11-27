/**
 * Event Loader
 * Loads and registers all Discord events
 */

import { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

export async function loadEvents(client: Client): Promise<void> {
  const eventsPath = path.join(__dirname, '../events');

  if (!fs.existsSync(eventsPath)) {
    console.log('\x1b[33m⚠️  No events directory found\x1b[0m');
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file =>
    (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
  );

  console.log('\x1b[33mLoading Discord events...\x1b[0m');

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);
    const eventModule = event.default || event;

    if (eventModule.once) {
      client.once(eventModule.name, (...args) => eventModule.execute(...args));
    } else {
      client.on(eventModule.name, (...args) => eventModule.execute(...args));
    }

    console.log(`\x1b[32m  ✓ Loaded event: ${eventModule.name}\x1b[0m`);
  }

  console.log(`\x1b[32m✓ Loaded ${eventFiles.length} events\x1b[0m\n`);
}
