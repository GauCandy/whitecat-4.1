# WhiteCat Bot - Database Documentation

> Comprehensive documentation for WhiteCat Discord Bot database structure

## Table of Contents

- [Overview](#overview)
- [User & Authentication](#user--authentication)
  - [1. USERS](#1-users---discord-user-information)
  - [10. OAUTH_TOKENS](#10-oauth_tokens---discord-oauth-tokens)
  - [11. WEB_SESSIONS](#11-web_sessions---web-login-sessions)
  - [12. USER_GUILD_PERMISSIONS](#12-user_guild_permissions---user-guild-permissions)
- [Economy System](#economy-system)
  - [2. CURRENCIES](#2-currencies---currency-types)
  - [3. USER_BALANCES](#3-user_balances---current-balances)
  - [5. TRANSACTIONS](#5-transactions---transaction-history)
- [Guild Management](#guild-management)
  - [4. GUILDS](#4-guilds---discord-servers)
  - [13. AUTO_RESPONSES](#13-auto_responses---automatic-responses)
  - [14. AUTO_RESPONSE_BLOCKED_CHANNELS](#14-auto_response_blocked_channels---auto-response-blocked-channels)
  - [15. COMMAND_CHANNEL_RESTRICTIONS](#15-command_channel_restrictions---command-channel-restrictions)
- [Giveaway System](#giveaway-system)
  - [6. GIVEAWAYS](#6-giveaways---contestsgiveaways)
  - [7. GIVEAWAY_REQUIREMENTS](#7-giveaway_requirements---giveaway-requirements)
  - [8. GIVEAWAY_ENTRIES](#8-giveaway_entries---giveaway-participants)
- [Logging & Analytics](#logging--analytics)
  - [9. COMMAND_LOGS](#9-command_logs---command-logs)
- [Database Relationships](#database-relationships)
- [Workflows](#workflows)

---

## Overview

**Total Tables:** 15

**Categorized by Function:**

| Group | Tables | Description |
|-------|--------|-------------|
| **User & Auth** | 4 tables | users, oauth_tokens, web_sessions, user_guild_permissions |
| **Economy** | 3 tables | currencies, user_balances, transactions |
| **Guilds** | 4 tables | guilds, auto_responses, auto_response_blocked_channels, command_channel_restrictions |
| **Giveaways** | 3 tables | giveaways, giveaway_requirements, giveaway_entries |
| **Logs** | 1 table | command_logs |

---

## User & Authentication

### 1. USERS - Discord User Information

**Purpose:** Store basic user information, shared between bot and web.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Internal database ID |
| `discord_id` | VARCHAR(20) | Discord User ID (snowflake), unique |
| `username` | VARCHAR(100) | Discord username (cached from OAuth) |
| `avatar` | VARCHAR(100) | Discord avatar hash (cached from OAuth) |
| `terms_accepted` | BOOLEAN | Has user accepted terms? OAuth via web = true |
| `created_at` | TIMESTAMP | When user was first created |
| `updated_at` | TIMESTAMP | Last update time |
| `last_seen` | TIMESTAMP | Last active time (login or bot usage) |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `discord_id`
- **Indexes:** `discord_id`

---

### 10. OAUTH_TOKENS - Discord OAuth tokens

**Purpose:** Store tokens for calling Discord API from web dashboard.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Token record ID |
| `user_id` | BIGINT | Which user |
| `access_token` | TEXT | OAuth access token (expires after 7 days) |
| `refresh_token` | TEXT | OAuth refresh token for renewal |
| `token_expires_at` | TIMESTAMP | When access token expires |
| `created_at` | TIMESTAMP | When tokens were created |
| `updated_at` | TIMESTAMP | Last token refresh |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `user_id`
- **Foreign Keys:** `user_id` → `users.id`
- **Indexes:** `user_id`

---

### 11. WEB_SESSIONS - Web Login Sessions

**Purpose:** Manage user sessions on web dashboard.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Session ID |
| `user_id` | BIGINT | Which user |
| `session_token` | VARCHAR(100) | Token stored in browser cookie |
| `expires_at` | TIMESTAMP | When session expires (default +7 days) |
| `guilds_cache` | JSONB | Cache of guilds user manages |
| `ip_address` | VARCHAR(50) | Login IP address |
| `user_agent` | TEXT | Browser/device info from request header |
| `created_at` | TIMESTAMP | When session was created |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `session_token`
- **Foreign Keys:** `user_id` → `users.id`
- **Indexes:** `user_id`, `session_token`, `expires_at`

---

### 12. USER_GUILD_PERMISSIONS - User Guild Permissions

**Purpose:** Cache user permissions in guilds. Used for web dashboard (bot checks directly via slash commands).

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Permission record ID |
| `discord_id` | VARCHAR(20) | Discord User ID |
| `guild_id` | VARCHAR(20) | Discord Guild ID |
| `permissions` | BIGINT | Discord permissions bitfield |
| `last_synced` | TIMESTAMP | Last permissions sync from Discord |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(discord_id, guild_id)`
- **Indexes:** `discord_id`, `guild_id`, composite `(discord_id, guild_id)`

---

## Economy System

### 2. CURRENCIES - Currency Types

**Purpose:** Manage currency types in the system (COIN, VND, USD...).

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Currency type ID |
| `code` | VARCHAR(16) | Currency code: 'COIN', 'VND', 'USD' (unique) |
| `name` | VARCHAR(32) | Display name: 'WhiteCat Coins' |
| `emoji` | VARCHAR(64) | Discord emoji: '<:coin:123456789>' or Unicode '🪙' |
| `is_tradeable` | BOOLEAN | Can users transfer this currency to each other? |
| `is_active` | BOOLEAN | Is currency still active? |
| `created_at` | TIMESTAMP | When currency was added |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `code`

---

### 3. USER_BALANCES - Current Balances

**Purpose:** Snapshot of user current balances. TRANSACTIONS is the source of truth, this table is for fast queries only.

> **Note:** This table is a denormalized cache. All changes must be logged in TRANSACTIONS table first.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Balance record ID |
| `user_id` | BIGINT | Which user (foreign key → users.id) |
| `currency_id` | INTEGER | Which currency (foreign key → currencies.id) |
| `balance` | BIGINT | Current balance (smallest unit) |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(user_id, currency_id)`
- **Foreign Keys:** `user_id` → `users.id`, `currency_id` → `currencies.id`
- **Indexes:** `user_id`, `currency_id`

---

### 5. TRANSACTIONS - Transaction History

**Purpose:** Log all money transactions (append-only). Source of truth for entire economy system.

> **Important:** This table is an append-only ledger. Never delete or update records after creation.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Transaction ID |
| `user_id` | BIGINT | User performing transaction |
| `currency_id` | INTEGER | Currency being transacted |
| `type` | VARCHAR(50) | Type: 'transfer_send', 'transfer_receive', 'admin_grant', 'daily', 'work' |
| `amount` | BIGINT | Transaction amount (positive or negative) |
| `balance_before` | BIGINT | Balance before transaction |
| `balance_after` | BIGINT | Balance after transaction |
| `related_user_id` | BIGINT | Related user (for transfers: recipient/sender) |
| `description` | TEXT | Human-readable description |
| `metadata` | JSONB | Additional data (JSON) |
| `created_at` | TIMESTAMP | When transaction occurred |

#### Database Constraints

- **Primary Key:** `id`
- **Foreign Keys:** `user_id` → `users.id`, `currency_id` → `currencies.id`
- **Indexes:** `user_id`, `currency_id`, `type`, `created_at`

#### Transaction Types

- `transfer_send` - Send money to another user
- `transfer_receive` - Receive money from another user
- `admin_grant` - Admin grants money
- `daily` - Claim daily reward
- `work` - Earn money from work

---

## Guild Management

### 4. GUILDS - Discord Servers

**Purpose:** Store configuration for servers with bot.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Internal guild ID |
| `guild_id` | VARCHAR(20) | Discord Guild ID (snowflake), unique |
| `locale` | VARCHAR(10) | Language: 'en-US', 'vi' |
| `prefix` | VARCHAR(10) | Prefix for text commands (default '!') |
| `joined_at` | TIMESTAMP | When bot joined guild |
| `left_at` | TIMESTAMP | When bot left guild (null if hasn't left) |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `guild_id`
- **Indexes:** `guild_id`

---

### 13. AUTO_RESPONSES - Automatic Responses

**Purpose:** Bot automatically replies when keyword is detected.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto response ID |
| `guild_id` | BIGINT | Which guild |
| `keyword` | VARCHAR(255) | Trigger keyword |
| `response_text` | TEXT | Plain text content (null if only sending embed) |
| `response_embed` | JSONB | Embed data in Discord format (null if only sending text) |
| `match_type` | VARCHAR(20) | Match method: 'contains', 'exact', 'starts_with' |
| `is_case_sensitive` | BOOLEAN | Is case-sensitive? |
| `is_enabled` | BOOLEAN | Is this response active? |
| `created_at` | TIMESTAMP | When created |
| `updated_at` | TIMESTAMP | Last edit time |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(guild_id, keyword)`
- **Foreign Keys:** `guild_id` → `guilds.id`
- **Indexes:** `guild_id`, `is_enabled`

#### Match Types

- `contains` - Keyword appears anywhere in message
- `exact` - Message must exactly match keyword
- `starts_with` - Message starts with keyword

---

### 14. AUTO_RESPONSE_BLOCKED_CHANNELS - Auto Response Blocked Channels

**Purpose:** List of channels where auto responses are disabled.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Block record ID |
| `guild_id` | BIGINT | Which guild |
| `channel_id` | VARCHAR(20) | Discord Channel ID being blocked |
| `created_at` | TIMESTAMP | When channel was blocked |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(guild_id, channel_id)`
- **Foreign Keys:** `guild_id` → `guilds.id`
- **Indexes:** `guild_id`

---

### 15. COMMAND_CHANNEL_RESTRICTIONS - Command Channel Restrictions

**Purpose:** Block specific commands in specific channels.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Restriction record ID |
| `guild_id` | BIGINT | Which guild |
| `channel_id` | VARCHAR(20) | Discord Channel ID being restricted |
| `command_name` | VARCHAR(100) | Command being blocked: 'gamble', 'giveaway' |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(guild_id, channel_id, command_name)`
- **Foreign Keys:** `guild_id` → `guilds.id`
- **Indexes:** `guild_id`, `channel_id`, composite `(guild_id, channel_id)`

---

## Giveaway System

### 6. GIVEAWAYS - Contests/Giveaways

**Purpose:** Manage giveaways on Discord.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Giveaway ID |
| `guild_id` | BIGINT | Which guild organizes |
| `channel_id` | VARCHAR(20) | Discord Channel ID where posted |
| `message_id` | VARCHAR(20) | Discord Message ID (to track reactions) |
| `prize` | TEXT | Prize description |
| `description` | TEXT | Detailed description (optional) |
| `winner_count` | INTEGER | Number of winners |
| `ends_at` | TIMESTAMP | End time |
| `is_completed` | BOOLEAN | Has winners been picked and announced? |
| `created_by` | BIGINT | User who created giveaway |
| `created_at` | TIMESTAMP | When giveaway was created |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `message_id`
- **Foreign Keys:** `guild_id` → `guilds.id`, `created_by` → `users.id`
- **Indexes:** `guild_id`, `is_completed`, `ends_at`

---

### 7. GIVEAWAY_REQUIREMENTS - Giveaway Requirements

**Purpose:** Store conditions for participating in giveaway.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Requirement ID |
| `giveaway_id` | BIGINT | Which giveaway |
| `requirement_type` | VARCHAR(20) | Type: 'require_boost', 'require_role', 'blacklist_role' |
| `role_id` | VARCHAR(20) | Discord Role ID (null if type = require_boost) |
| `created_at` | TIMESTAMP | When requirement was created |

#### Database Constraints

- **Primary Key:** `id`
- **Foreign Keys:** `giveaway_id` → `giveaways.id`
- **Indexes:** `giveaway_id`

#### Requirement Types

- `require_boost` - Must boost server
- `require_role` - Must have specific role
- `blacklist_role` - Must not have specific role

---

### 8. GIVEAWAY_ENTRIES - Giveaway Participants

**Purpose:** Track who participated in which giveaway.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Entry ID |
| `giveaway_id` | BIGINT | Which giveaway |
| `user_id` | BIGINT | Which user participated |
| `is_winner` | BOOLEAN | Did this user win? |
| `created_at` | TIMESTAMP | When user joined giveaway |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(giveaway_id, user_id)`
- **Foreign Keys:** `giveaway_id` → `giveaways.id`, `user_id` → `users.id`
- **Indexes:** `giveaway_id`, `user_id`

---

## Logging & Analytics

### 9. COMMAND_LOGS - Command Logs

**Purpose:** Log all executed commands. Used for analytics, debugging, monitoring.

#### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Log entry ID |
| `user_id` | BIGINT | User who executed command |
| `guild_id` | BIGINT | Which guild |
| `command_name` | VARCHAR(100) | Command name: 'balance', 'daily', 'transfer' |
| `command_type` | VARCHAR(20) | Type: 'slash' or 'text' |
| `success` | BOOLEAN | Did command execute successfully? |
| `execution_time_ms` | INTEGER | Execution time (milliseconds) |
| `error_message` | TEXT | Error message if failed |
| `created_at` | TIMESTAMP | When command was executed |

#### Database Constraints

- **Primary Key:** `id`
- **Foreign Keys:** `user_id` → `users.id`, `guild_id` → `guilds.id`
- **Indexes:** `user_id`, `guild_id`, `command_name`, `created_at`

---

## Database Relationships

### Entity Relationship Diagram (Text)

```
USERS
  ├── has many → USER_BALANCES
  ├── has many → TRANSACTIONS
  ├── has one  → OAUTH_TOKENS
  ├── has many → WEB_SESSIONS
  ├── has many → GIVEAWAY_ENTRIES
  └── has many → COMMAND_LOGS

GUILDS
  ├── has many → GIVEAWAYS
  ├── has many → AUTO_RESPONSES
  ├── has many → AUTO_RESPONSE_BLOCKED_CHANNELS
  ├── has many → COMMAND_CHANNEL_RESTRICTIONS
  └── has many → COMMAND_LOGS

CURRENCIES
  ├── has many → USER_BALANCES
  └── has many → TRANSACTIONS

GIVEAWAYS
  ├── has many → GIVEAWAY_REQUIREMENTS
  └── has many → GIVEAWAY_ENTRIES
```

### Key Relationships

| Parent Table | Child Table | Relationship Type | Description |
|--------------|-------------|-------------------|-------------|
| `users` | `user_balances` | One-to-Many | One user has multiple currency types |
| `users` | `transactions` | One-to-Many | One user has multiple transactions |
| `users` | `oauth_tokens` | One-to-One | One user has one token record |
| `currencies` | `user_balances` | One-to-Many | One currency has many user holders |
| `guilds` | `giveaways` | One-to-Many | One guild has many giveaways |
| `giveaways` | `giveaway_entries` | One-to-Many | One giveaway has many participants |

---

## Workflows

### 1. User Authentication Flow

```
User OAuth Login
  ↓
Create/Update USERS record
  ↓
Create/Update OAUTH_TOKENS
  ↓
Create WEB_SESSIONS record
  ↓
User authenticated
```

### 2. Economy Transaction Flow

```
User initiates transaction
  ↓
Validate balance & permissions
  ↓
Create TRANSACTIONS record (append-only)
  ↓
Update USER_BALANCES (cache)
  ↓
If transfer → Create paired TRANSACTIONS for recipient
```

### 3. Giveaway Creation Flow

```
Admin creates giveaway
  ↓
Create GIVEAWAYS record
  ↓
Create GIVEAWAY_REQUIREMENTS (if any)
  ↓
Post message to Discord
  ↓
Users react → Create GIVEAWAY_ENTRIES
  ↓
On end_time → Pick winners → Update is_winner flags
```

### 4. Command Execution Flow

```
User executes command
  ↓
Bot processes command
  ↓
Log to COMMAND_LOGS (always)
  ↓
Execute business logic
  ↓
Return response to user
```

---

## Best Practices

### Data Integrity

1. **Transactions are immutable** - Never UPDATE or DELETE in `transactions` table
2. **Balances are cache** - Always sync from transactions, don't modify arbitrarily
3. **Foreign keys** - Always use foreign keys to ensure referential integrity
4. **Indexes** - Create indexes on frequently queried columns (user_id, guild_id, created_at)

### Performance

1. **Pagination** - Always paginate when querying `transactions` and `command_logs`
2. **Composite indexes** - Use for queries filtering multiple columns
3. **JSONB** - Use JSONB for flexible metadata, can create partial indexes
4. **Archiving** - Consider archiving old logs after 6-12 months

### Security

1. **OAuth tokens** - Encrypt at application level before storing
2. **Session tokens** - Random, not predictable, rotate frequently
3. **IP logging** - Log IP for audit trail
4. **Permissions cache** - Refresh periodically, don't trust stale data

---

**Version:** 1.1
**Last Updated:** 2025-01-23
