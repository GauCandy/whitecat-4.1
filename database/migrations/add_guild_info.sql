-- Add guild name and icon to guilds table
-- Migration: add_guild_info

ALTER TABLE guilds
ADD COLUMN IF NOT EXISTS guild_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS guild_icon VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guilds_guild_name ON guilds(guild_name);

-- Backfill comment
COMMENT ON COLUMN guilds.guild_name IS 'Discord guild name (cached)';
COMMENT ON COLUMN guilds.guild_icon IS 'Discord guild icon hash (cached)';
