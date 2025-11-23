# Database Commands - WhiteCat Bot

> Database management commands guide for WhiteCat Discord Bot

## Table of Contents

- [Database Commands](#database-commands)
- [Bot Tables](#bot-tables-15-tables)
- [Troubleshooting](#troubleshooting)

---

## Database Commands

### `npm run db:init` - Initialize database first time

Creates all bot tables from schema.sql for the first time.

```bash
npm run db:init
```

**What it does:**
- ✅ Checks if bot tables already exist
- ✅ If not exists → Creates 15 tables from `database/schema.sql`
- ✅ Adds default currency (WhiteCat Coins)
- ✅ If exists → Skips and suggests using `db:reset`

**When to use:**
- First time project setup
- Fresh database

---

### `npm run db:reset` - Reset and recreate bot tables

Drops all bot tables and recreates them from scratch. ⚠️ **LOSES ALL DATA!**

```bash
npm run db:reset
```

**What it does:**
- ⚠️ Drops 15 bot tables (with confirmation)
- ✅ Recreates from schema.sql
- ✅ Adds default currency
- ✅ Other tables in DB are **NOT affected**

**When to use:**
- During development and need to reset data
- Major schema changes
- Fixing structure issues

**⚠️ WARNING:**
```
Type "yes" to continue: yes

Dropping bot tables...
  ✓ Dropped: command_logs
  ✓ Dropped: giveaway_entries
  ✓ Dropped: giveaway_requirements
  ...
  ✓ Dropped: users

All data in bot tables will be LOST!
Other tables in database will NOT be affected.
```

---

### `npm run db:drop` - Drop only bot tables

Drops 15 bot tables, keeps other tables intact.

```bash
npm run db:drop
```

**What it does:**
- ⚠️ Drops 15 bot tables in correct order (respects foreign keys)
- ✅ Other tables are **NOT deleted**
- ✅ Asks for confirmation before dropping

**When to use:**
- Want to remove bot tables but keep other tables
- Cleanup before uninstall

---

### `npm run db:clear` - Drop NON-bot tables

Drops all tables **EXCEPT** the 15 bot tables.

```bash
npm run db:clear
```

**What it does:**
- ⚠️ Drops all tables that are NOT bot tables
- ✅ Keeps 15 bot tables + data
- ✅ Shows list of tables to be dropped before confirmation

**When to use:**
- Database has many old/test tables not in use
- Cleanup deprecated tables from old versions
- Clean up database while preserving bot data

**Example:**
```
Found 3 non-bot tables to drop:
  • test_users
  • old_payments
  • debug_table

Type "yes" to continue: yes

✓ Dropped: test_users
✓ Dropped: old_payments
✓ Dropped: debug_table

Kept 15 bot tables.
```

---

## Bot Tables (15 tables)

### User & Authentication (4 tables)
- `users` - Discord user information
- `oauth_tokens` - Discord OAuth tokens
- `web_sessions` - Web login sessions
- `user_guild_permissions` - User guild permissions

### Economy System (3 tables)
- `currencies` - Currency types
- `user_balances` - Current balances
- `transactions` - Transaction history (append-only)

### Guild Management (4 tables)
- `guilds` - Discord servers
- `auto_responses` - Automatic responses
- `auto_response_blocked_channels` - Auto response blocked channels
- `command_channel_restrictions` - Command channel restrictions

### Giveaway System (3 tables)
- `giveaways` - Contests/Giveaways
- `giveaway_requirements` - Giveaway requirements
- `giveaway_entries` - Giveaway participants

### Logging & Analytics (1 table)
- `command_logs` - Command logs

---

## Troubleshooting

### Error: "Connection refused"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Check if PostgreSQL is running: `pg_ctl status`
- Start PostgreSQL: `pg_ctl start`
- Verify port in `.env` is correct

---

### Error: "database does not exist"

```
Error: database "whitecat_bot" does not exist
```

**Solution:**
```sql
CREATE DATABASE whitecat_bot;
```

---

### Error: "password authentication failed"

```
Error: password authentication failed for user "whitecat"
```

**Solution:**
- Check `DB_USER` and `DB_PASSWORD` in `.env`
- Reset PostgreSQL password:
```sql
ALTER USER whitecat WITH PASSWORD 'new_password';
```

---

### Error: "permission denied for schema public"

```
Error: permission denied for schema public
```

**Solution:**
```sql
GRANT ALL PRIVILEGES ON DATABASE whitecat_bot TO whitecat;
GRANT ALL ON SCHEMA public TO whitecat;
```

---

### Script not running: "Schema file not found"

```
Error: Schema file not found at: /path/to/database/schema.sql
```

**Solution:**
- Check if `database/schema.sql` exists
- Make sure you're running commands from project root directory

---

## Database Schema Documentation

See detailed schema documentation at:
- [Database Documentation (Vietnamese)](./database-vi.md)
- [Database Documentation (English)](./database-en.md)

---

**Version:** 4.1
**Last Updated:** 2025-01-23
