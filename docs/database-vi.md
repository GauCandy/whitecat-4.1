# WhiteCat Bot - Database Documentation

> Tài liệu mô tả chi tiết cấu trúc database của WhiteCat Discord Bot

## Mục lục

- [Tổng quan](#tổng-quan)
- [User & Authentication](#user--authentication)
  - [1. USERS](#1-users---thông-tin-người-dùng-discord)
  - [2. OAUTH_TOKENS](#2-oauth_tokens---discord-oauth-tokens)
  - [3. WEB_SESSIONS](#3-web_sessions---phiên-đăng-nhập-web)
  - [4. USER_GUILD_PERMISSIONS](#4-user_guild_permissions---quyền-hạn-user-trong-guild)
- [Economy System](#economy-system)
  - [5. CURRENCIES](#5-currencies---các-loại-tiền-tệ)
  - [6. USER_BALANCES](#6-user_balances---số-dư-hiện-tại)
  - [7. TRANSACTIONS](#7-transactions---lịch-sử-giao-dịch)
- [Guild Management](#guild-management)
  - [8. GUILDS](#8-guilds---server-discord)
  - [9. AUTO_RESPONSES](#9-auto_responses---tự-động-trả-lời)
  - [10. AUTO_RESPONSE_BLOCKED_CHANNELS](#10-auto_response_blocked_channels---channels-tắt-auto-response)
  - [11. COMMAND_CHANNEL_RESTRICTIONS](#11-command_channel_restrictions---hạn-chế-lệnh-theo-channel)
- [Giveaway System](#giveaway-system)
  - [12. GIVEAWAYS](#12-giveaways---cuộc-thiphần-quà)
  - [13. GIVEAWAY_REQUIREMENTS](#13-giveaway_requirements---yêu-cầu-tham-gia-giveaway)
  - [14. GIVEAWAY_ENTRIES](#14-giveaway_entries---người-tham-gia-giveaway)
- [Logging & Analytics](#logging--analytics)
  - [15. COMMAND_LOGS](#15-command_logs---nhật-ký-lệnh)
- [Database Relationships](#database-relationships)
- [Workflows](#workflows)

---

## Tổng quan

**Tổng số bảng:** 15

**Phân loại theo chức năng:**

| Nhóm | Bảng | Mô tả |
|------|------|-------|
| **User & Auth** | 4 tables | users, oauth_tokens, web_sessions, user_guild_permissions |
| **Economy** | 3 tables | currencies, user_balances, transactions |
| **Guilds** | 4 tables | guilds, auto_responses, auto_response_blocked_channels, command_channel_restrictions |
| **Giveaways** | 3 tables | giveaways, giveaway_requirements, giveaway_entries |
| **Logs** | 1 table | command_logs |

---

## User & Authentication

### 1. USERS - Thông tin người dùng Discord

**Mục đích:** Lưu thông tin cơ bản của user, dùng chung cho bot và web.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID nội bộ database |
| `discord_id` | VARCHAR(20) | Discord User ID (snowflake), unique |
| `username` | VARCHAR(100) | Username Discord (cache từ OAuth) |
| `avatar` | VARCHAR(100) | Avatar hash Discord (cache từ OAuth) |
| `terms_accepted` | BOOLEAN | User đã đồng ý điều khoản chưa? OAuth qua web = true |
| `created_at` | TIMESTAMP | Lần đầu user được tạo |
| `updated_at` | TIMESTAMP | Lần cuối cập nhật |
| `last_seen` | TIMESTAMP | Lần cuối active (login hoặc dùng bot) |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `discord_id`
- **Indexes:** `discord_id`

---

### 2. OAUTH_TOKENS - Discord OAuth tokens

**Mục đích:** Lưu tokens để gọi Discord API cho web dashboard.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của token record |
| `user_id` | BIGINT | User nào |
| `access_token` | TEXT | OAuth access token (hết hạn sau 7 ngày) |
| `refresh_token` | TEXT | OAuth refresh token để gia hạn |
| `token_expires_at` | TIMESTAMP | Khi nào access token hết hạn |
| `created_at` | TIMESTAMP | Khi nào tokens được tạo |
| `updated_at` | TIMESTAMP | Lần cuối refresh token |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `user_id`
- **Foreign Keys:** `user_id` → `users.id`
- **Indexes:** `user_id`

---

### 3. WEB_SESSIONS - Phiên đăng nhập web

**Mục đích:** Quản lý sessions của user trên web dashboard.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của session |
| `user_id` | BIGINT | User nào |
| `session_token` | VARCHAR(100) | Token lưu vào cookie browser |
| `expires_at` | TIMESTAMP | Khi nào session hết hạn (mặc định +7 ngày) |
| `guilds_cache` | JSONB | Cache danh sách guilds user quản lý |
| `ip_address` | VARCHAR(50) | IP address đăng nhập từ đâu |
| `user_agent` | TEXT | Browser/device info từ request header |
| `created_at` | TIMESTAMP | Khi nào session được tạo |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `session_token`
- **Foreign Keys:** `user_id` → `users.id`
- **Indexes:** `user_id`, `session_token`, `expires_at`

---

### 4. USER_GUILD_PERMISSIONS - Quyền hạn user trong guild

**Mục đích:** Cache permissions của user trong các guild. Dùng cho web dashboard (bot check trực tiếp qua slash commands).

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của permission record |
| `discord_id` | VARCHAR(20) | Discord User ID |
| `guild_id` | VARCHAR(20) | Discord Guild ID |
| `permissions` | BIGINT | Bitfield permissions của Discord |
| `last_synced` | TIMESTAMP | Lần cuối đồng bộ permissions từ Discord |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(discord_id, guild_id)`
- **Indexes:** `discord_id`, `guild_id`, composite `(discord_id, guild_id)`

---

## Economy System

### 5. CURRENCIES - Các loại tiền tệ

**Mục đích:** Quản lý các loại tiền trong hệ thống (COIN, VND, USD...).

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của loại tiền tệ |
| `code` | VARCHAR(16) | Mã tiền tệ: 'COIN', 'VND', 'USD' (unique) |
| `name` | VARCHAR(32) | Tên hiển thị: 'WhiteCat Coins' |
| `emoji` | VARCHAR(64) | Discord emoji: '<:coin:123456789>' hoặc Unicode '🪙' |
| `is_tradeable` | BOOLEAN | Cho phép user chuyển tiền cho nhau không? |
| `is_active` | BOOLEAN | Tiền tệ còn hoạt động không? |
| `created_at` | TIMESTAMP | Khi nào loại tiền được thêm vào |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `code`

---

### 6. USER_BALANCES - Số dư hiện tại

**Mục đích:** Snapshot số dư hiện tại của user. TRANSACTIONS là source of truth, bảng này chỉ để query nhanh.

> **Lưu ý:** Bảng này là denormalized cache. Mọi thay đổi phải được log trong bảng TRANSACTIONS trước.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của balance record |
| `user_id` | BIGINT | User nào (foreign key → users.id) |
| `currency_id` | INTEGER | Loại tiền nào (foreign key → currencies.id) |
| `balance` | BIGINT | Số dư hiện tại (đơn vị nhỏ nhất) |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(user_id, currency_id)`
- **Foreign Keys:** `user_id` → `users.id`, `currency_id` → `currencies.id`
- **Indexes:** `user_id`, `currency_id`

---

### 7. TRANSACTIONS - Lịch sử giao dịch

**Mục đích:** Log mọi giao dịch tiền (append-only). Là source of truth cho toàn bộ hệ thống kinh tế.

> **Quan trọng:** Bảng này là append-only ledger. Không bao giờ xóa hoặc update records sau khi đã tạo.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của giao dịch |
| `user_id` | BIGINT | User thực hiện giao dịch |
| `currency_id` | INTEGER | Loại tiền giao dịch |
| `type` | VARCHAR(50) | Loại: 'transfer_send', 'transfer_receive', 'admin_grant', 'daily', 'work' |
| `amount` | BIGINT | Số tiền giao dịch (dương hoặc âm) |
| `balance_before` | BIGINT | Số dư trước giao dịch |
| `balance_after` | BIGINT | Số dư sau giao dịch |
| `related_user_id` | BIGINT | User liên quan (với transfer: người nhận/gửi) |
| `description` | TEXT | Mô tả dễ hiểu |
| `metadata` | JSONB | Dữ liệu phụ thêm (JSON) |
| `created_at` | TIMESTAMP | Khi nào giao dịch xảy ra |

#### Database Constraints

- **Primary Key:** `id`
- **Foreign Keys:** `user_id` → `users.id`, `currency_id` → `currencies.id`
- **Indexes:** `user_id`, `currency_id`, `type`, `created_at`

#### Transaction Types

- `transfer_send` - Chuyển tiền cho user khác
- `transfer_receive` - Nhận tiền từ user khác
- `admin_grant` - Admin cấp tiền
- `daily` - Claim daily reward
- `work` - Làm việc kiếm tiền

---

## Guild Management

### 8. GUILDS - Server Discord

**Mục đích:** Lưu cấu hình của các server có bot.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID nội bộ của guild |
| `guild_id` | VARCHAR(20) | Discord Guild ID (snowflake), unique |
| `locale` | VARCHAR(10) | Ngôn ngữ: 'en-US', 'vi' |
| `prefix` | VARCHAR(10) | Prefix cho lệnh text (mặc định '!') |
| `joined_at` | TIMESTAMP | Khi nào bot join guild |
| `left_at` | TIMESTAMP | Khi nào bot rời guild (null nếu chưa rời) |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `guild_id`
- **Indexes:** `guild_id`

---

### 9. AUTO_RESPONSES - Tự động trả lời

**Mục đích:** Bot tự động reply khi detect keyword.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của auto response |
| `guild_id` | BIGINT | Guild nào |
| `keyword` | VARCHAR(255) | Từ khóa kích hoạt |
| `response_text` | TEXT | Nội dung text thường (null nếu chỉ gửi embed) |
| `response_embed` | JSONB | Embed data theo Discord format (null nếu chỉ gửi text) |
| `match_type` | VARCHAR(20) | Cách match: 'contains', 'exact', 'starts_with' |
| `is_case_sensitive` | BOOLEAN | Có phân biệt chữ hoa/thường không? |
| `is_enabled` | BOOLEAN | Response này còn hoạt động không? |
| `created_at` | TIMESTAMP | Khi nào được tạo |
| `updated_at` | TIMESTAMP | Lần cuối chỉnh sửa |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(guild_id, keyword)`
- **Foreign Keys:** `guild_id` → `guilds.id`
- **Indexes:** `guild_id`, `is_enabled`

#### Match Types

- `contains` - Keyword xuất hiện bất kỳ đâu trong message
- `exact` - Message phải giống hệt keyword
- `starts_with` - Message bắt đầu bằng keyword

---

### 10. AUTO_RESPONSE_BLOCKED_CHANNELS - Channels tắt auto response

**Mục đích:** Danh sách channels không dùng auto response.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của block record |
| `guild_id` | BIGINT | Guild nào |
| `channel_id` | VARCHAR(20) | Discord Channel ID bị block |
| `created_at` | TIMESTAMP | Khi nào channel bị block |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(guild_id, channel_id)`
- **Foreign Keys:** `guild_id` → `guilds.id`
- **Indexes:** `guild_id`

---

### 11. COMMAND_CHANNEL_RESTRICTIONS - Hạn chế lệnh theo channel

**Mục đích:** Block commands cụ thể ở channels cụ thể.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của restriction record |
| `guild_id` | BIGINT | Guild nào |
| `channel_id` | VARCHAR(20) | Discord Channel ID bị hạn chế |
| `command_name` | VARCHAR(100) | Tên lệnh bị block: 'gamble', 'giveaway' |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(guild_id, channel_id, command_name)`
- **Foreign Keys:** `guild_id` → `guilds.id`
- **Indexes:** `guild_id`, `channel_id`, composite `(guild_id, channel_id)`

---

## Giveaway System

### 12. GIVEAWAYS - Cuộc thi/Phần quà

**Mục đích:** Quản lý các giveaway trên Discord.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của giveaway |
| `guild_id` | BIGINT | Guild nào tổ chức |
| `channel_id` | VARCHAR(20) | Discord Channel ID nơi đăng |
| `message_id` | VARCHAR(20) | Discord Message ID (để theo dõi reactions) |
| `prize` | TEXT | Mô tả phần thưởng |
| `description` | TEXT | Mô tả chi tiết (tùy chọn) |
| `winner_count` | INTEGER | Số người thắng cuộc |
| `ends_at` | TIMESTAMP | Thời gian kết thúc |
| `is_completed` | BOOLEAN | Đã pick winners và announce chưa? |
| `created_by` | BIGINT | User tạo giveaway |
| `created_at` | TIMESTAMP | Khi nào giveaway được tạo |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `message_id`
- **Foreign Keys:** `guild_id` → `guilds.id`, `created_by` → `users.id`
- **Indexes:** `guild_id`, `is_completed`, `ends_at`

---

### 13. GIVEAWAY_REQUIREMENTS - Yêu cầu tham gia giveaway

**Mục đích:** Lưu các điều kiện để tham gia giveaway.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của requirement |
| `giveaway_id` | BIGINT | Giveaway nào |
| `requirement_type` | VARCHAR(20) | Loại: 'require_boost', 'require_role', 'blacklist_role' |
| `role_id` | VARCHAR(20) | Discord Role ID (null nếu type = require_boost) |
| `created_at` | TIMESTAMP | Khi nào requirement được tạo |

#### Database Constraints

- **Primary Key:** `id`
- **Foreign Keys:** `giveaway_id` → `giveaways.id`
- **Indexes:** `giveaway_id`

#### Requirement Types

- `require_boost` - Phải boost server
- `require_role` - Phải có role cụ thể
- `blacklist_role` - Không được có role cụ thể

---

### 14. GIVEAWAY_ENTRIES - Người tham gia giveaway

**Mục đích:** Theo dõi ai đã tham gia giveaway nào.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của entry |
| `giveaway_id` | BIGINT | Giveaway nào |
| `user_id` | BIGINT | User nào tham gia |
| `is_winner` | BOOLEAN | User này có thắng cuộc không? |
| `created_at` | TIMESTAMP | Khi nào user join giveaway |

#### Database Constraints

- **Primary Key:** `id`
- **Unique Constraints:** `(giveaway_id, user_id)`
- **Foreign Keys:** `giveaway_id` → `giveaways.id`, `user_id` → `users.id`
- **Indexes:** `giveaway_id`, `user_id`

---

## Logging & Analytics

### 15. COMMAND_LOGS - Nhật ký lệnh

**Mục đích:** Log tất cả commands được thực thi. Dùng cho analytics, debug, monitoring.

#### Columns

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của log entry |
| `user_id` | BIGINT | User thực thi lệnh |
| `guild_id` | BIGINT | Guild nào |
| `command_name` | VARCHAR(100) | Tên lệnh: 'balance', 'daily', 'transfer' |
| `command_type` | VARCHAR(20) | Loại: 'slash' hoặc 'text' |
| `success` | BOOLEAN | Lệnh thực thi thành công không? |
| `execution_time_ms` | INTEGER | Thời gian thực thi (mili giây) |
| `error_message` | TEXT | Thông báo lỗi nếu thất bại |
| `created_at` | TIMESTAMP | Khi nào lệnh được thực thi |

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
| `users` | `user_balances` | One-to-Many | Một user có nhiều loại tiền |
| `users` | `transactions` | One-to-Many | Một user có nhiều giao dịch |
| `users` | `oauth_tokens` | One-to-One | Một user có một token record |
| `currencies` | `user_balances` | One-to-Many | Một loại tiền có nhiều user holders |
| `guilds` | `giveaways` | One-to-Many | Một guild có nhiều giveaways |
| `giveaways` | `giveaway_entries` | One-to-Many | Một giveaway có nhiều participants |

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

1. **Transactions are immutable** - Không bao giờ UPDATE hoặc DELETE trong bảng `transactions`
2. **Balances are cache** - Luôn sync từ transactions, không tự ý modify
3. **Foreign keys** - Luôn dùng foreign keys để đảm bảo referential integrity
4. **Indexes** - Tạo indexes cho các columns hay query (user_id, guild_id, created_at)

### Performance

1. **Pagination** - Luôn paginate khi query `transactions` và `command_logs`
2. **Composite indexes** - Dùng cho queries filter nhiều columns
3. **JSONB** - Dùng JSONB cho metadata linh hoạt, có thể index partial
4. **Archiving** - Cân nhắc archive old logs sau 6-12 tháng

### Security

1. **OAuth tokens** - Encrypt ở application level trước khi lưu
2. **Session tokens** - Random, không predictable, rotate thường xuyên
3. **IP logging** - Log IP cho audit trail
4. **Permissions cache** - Refresh định kỳ, không trust stale data

---

**Phiên bản:** 1.1
**Cập nhật lần cuối:** 2025-01-23
