-- ==========================================
-- Fix Foreign Key Constraint for command_channel_restrictions
-- ==========================================
-- Problem: guild_id references guilds(id) instead of guilds(guild_id)
-- Solution: Drop old constraint and recreate with correct reference
-- ==========================================

BEGIN;

-- 1. Drop the old foreign key constraint
ALTER TABLE command_channel_restrictions
DROP CONSTRAINT IF EXISTS command_channel_restrictions_guild_id_fkey;

-- 2. Change guild_id column type to VARCHAR(20) to match guilds.guild_id
ALTER TABLE command_channel_restrictions
ALTER COLUMN guild_id TYPE VARCHAR(20);

-- 3. Add new foreign key constraint referencing guilds.guild_id
ALTER TABLE command_channel_restrictions
ADD CONSTRAINT command_channel_restrictions_guild_id_fkey
FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE;

-- Verify the change
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'command_channel_restrictions'
  AND tc.constraint_type = 'FOREIGN KEY';

COMMIT;
