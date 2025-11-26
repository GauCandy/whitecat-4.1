-- ==========================================
-- Fix Foreign Key Constraint for auto_responses
-- ==========================================
-- Problem: guild_id references guilds(id) instead of guilds(guild_id)
-- Solution: Drop old constraint and recreate with correct reference
-- ==========================================

BEGIN;

-- 1. Drop the old foreign key constraint
ALTER TABLE auto_responses
DROP CONSTRAINT IF EXISTS auto_responses_guild_id_fkey;

-- 2. Change guild_id column type to VARCHAR(20) to match guilds.guild_id
ALTER TABLE auto_responses
ALTER COLUMN guild_id TYPE VARCHAR(20);

-- 3. Add new foreign key constraint referencing guilds.guild_id
ALTER TABLE auto_responses
ADD CONSTRAINT auto_responses_guild_id_fkey
FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE;

-- 4. Update the unique constraint to work with new type
ALTER TABLE auto_responses
DROP CONSTRAINT IF EXISTS auto_responses_guild_id_keyword_key;

ALTER TABLE auto_responses
ADD CONSTRAINT auto_responses_guild_id_keyword_key
UNIQUE (guild_id, keyword);

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
WHERE tc.table_name = 'auto_responses'
  AND tc.constraint_type = 'FOREIGN KEY';

COMMIT;
