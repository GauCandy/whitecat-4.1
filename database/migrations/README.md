# Database Migrations

## How to Run Migrations

Migrations should be run in order. Connect to your PostgreSQL database and execute:

```bash
psql -U your_username -d whitecat_bot -f migrations/fix-command-restrictions-fk.sql
```

## Migration History

### fix-command-restrictions-fk.sql
**Date**: 2025-01-XX
**Purpose**: Fix foreign key constraint for `command_channel_restrictions` table

**Problem**:
The `guild_id` column in `command_channel_restrictions` was referencing `guilds(id)` (internal BIGSERIAL) instead of `guilds(guild_id)` (Discord ID VARCHAR).

**Solution**:
- Changed `guild_id` column type from BIGINT to VARCHAR(20)
- Updated foreign key to reference `guilds(guild_id)` instead of `guilds(id)`
- This allows the middleware to directly use Discord guild IDs without additional queries

**Impact**:
- Existing data in `command_channel_restrictions` will need to be migrated if any exists
- After migration, you can insert restrictions using Discord guild IDs directly
