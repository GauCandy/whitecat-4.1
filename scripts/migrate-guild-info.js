/**
 * Migration script to add guild_name and guild_icon columns
 * Run: node scripts/migrate-guild-info.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('🔄 Running migration: add_guild_info...');

    // Add columns
    await pool.query(`
      ALTER TABLE guilds
      ADD COLUMN IF NOT EXISTS guild_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS guild_icon VARCHAR(100);
    `);

    console.log('✅ Added guild_name and guild_icon columns');

    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_guilds_guild_name ON guilds(guild_name);
    `);

    console.log('✅ Created index on guild_name');

    // Backfill from existing guilds (if bot is running)
    console.log('📝 Migration complete!');
    console.log('💡 Tip: Restart bot to populate guild names and icons');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
