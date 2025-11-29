/**
 * Backfill guild names and icons from Discord bot cache
 * Run: node scripts/backfill-guild-info.js
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { Pool } = require('pg');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function backfillGuildInfo() {
  try {
    console.log('🔐 Logging in to Discord...');
    await client.login(process.env.DISCORD_TOKEN);

    console.log('✅ Connected to Discord');
    console.log(`📊 Bot is in ${client.guilds.cache.size} guilds`);

    let updated = 0;
    let skipped = 0;

    for (const [guildId, guild] of client.guilds.cache) {
      try {
        // Update guild info in database
        const result = await pool.query(
          `UPDATE guilds
           SET guild_name = $2,
               guild_icon = $3
           WHERE guild_id = $1 AND left_at IS NULL
           RETURNING id`,
          [guildId, guild.name, guild.icon]
        );

        if (result.rowCount > 0) {
          console.log(`✅ Updated: ${guild.name} (${guildId})`);
          updated++;
        } else {
          console.log(`⏭️  Skipped: ${guild.name} (not in database or left)`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Failed to update ${guildId}:`, error.message);
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`  ✅ Updated: ${updated} guilds`);
    console.log(`  ⏭️  Skipped: ${skipped} guilds`);
    console.log('\n✅ Backfill complete!');

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    client.destroy();
  }
}

// Wait for bot to be ready
client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  backfillGuildInfo();
});
