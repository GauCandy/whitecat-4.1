# WhiteCat Bot - Database Documentation

## 1. USERS - Thông tin người dùng Discord

Lưu thông tin cơ bản của user, dùng chung cho bot và web.

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

**Indexes:** `discord_id`

---

## 2. CURRENCIES - Các loại tiền tệ

Quản lý các loại tiền trong hệ thống (COIN, VND, USD...).

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của loại tiền tệ |
| `code` | VARCHAR(16) | Mã tiền tệ: 'COIN', 'VND', 'USD' (unique) |
| `name` | VARCHAR(32) | Tên hiển thị: 'WhiteCat Coins' |
| `emoji` | VARCHAR(64) | Discord emoji: '<:coin:123456789>' hoặc Unicode '🪙' |
| `is_tradeable` | BOOLEAN | Cho phép user chuyển tiền cho nhau không? |
| `is_active` | BOOLEAN | Tiền tệ còn hoạt động không? |
| `created_at` | TIMESTAMP | Khi nào loại tiền được thêm vào |

**Constraints:** UNIQUE(`code`)

---

## 3. USER_BALANCES - Số dư hiện tại

Snapshot số dú hiện tại của user. TRANSACTIONS là source of truth, bảng này chỉ để query nhanh.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của balance record |
| `user_id` | BIGINT | User nào (foreign key → users.id) |
| `currency_id` | INTEGER | Loại tiền nào (foreign key → currencies.id) |
| `balance` | BIGINT | Số dư hiện tại (đơn vị nhỏ nhất) |

**Constraints:** UNIQUE(`user_id`, `currency_id`)  
**Indexes:** `user_id`, `currency_id`

---

## 4. GUILDS - Server Discord

Lưu cấu hình của các server có bot.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID nội bộ của guild |
| `guild_id` | VARCHAR(20) | Discord Guild ID (snowflake), unique |
| `locale` | VARCHAR(10) | Ngôn ngữ: 'en-US', 'vi' |
| `prefix` | VARCHAR(10) | Prefix cho lệnh text (mặc định '!') |
| `joined_at` | TIMESTAMP | Khi nào bot join guild |
| `left_at` | TIMESTAMP | Khi nào bot rời guild (null nếu chưa rời) |

**Constraints:** UNIQUE(`guild_id`)  
**Indexes:** `guild_id`

---

## 5. TRANSACTIONS - Lịch sử giao dịch

Log mọi giao dịch tiền (append-only). Là source of truth cho toàn bộ hệ thống kinh tế.

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

**Indexes:** `user_id`, `currency_id`, `type`, `created_at`

---

## 6. GIVEAWAYS - Cuộc thi/Phần quà

Quản lý các giveaway trên Discord.

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

**Constraints:** UNIQUE(`message_id`)  
**Indexes:** `guild_id`, `is_completed`, `ends_at`

---

## 7. GIVEAWAY_REQUIREMENTS - Yêu cầu tham gia giveaway

Lưu các điều kiện để tham gia giveaway.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của requirement |
| `giveaway_id` | BIGINT | Giveaway nào |
| `requirement_type` | VARCHAR(20) | Loại: 'require_boost', 'require_role', 'blacklist_role' |
| `role_id` | VARCHAR(20) | Discord Role ID (null nếu type = require_boost) |
| `created_at` | TIMESTAMP | Khi nào requirement được tạo |

**Indexes:** `giveaway_id`

---

## 8. GIVEAWAY_ENTRIES - Người tham gia giveaway

Theo dõi ai đã tham gia giveaway nào.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của entry |
| `giveaway_id` | BIGINT | Giveaway nào |
| `user_id` | BIGINT | User nào tham gia |
| `is_winner` | BOOLEAN | User này có thắng cuộc không? |
| `created_at` | TIMESTAMP | Khi nào user join giveaway |

**Constraints:** UNIQUE(`giveaway_id`, `user_id`)  
**Indexes:** `giveaway_id`, `user_id`

---

## 9. COMMAND_LOGS - Nhật ký lệnh

Log tất cả commands được thực thi. Dùng cho analytics, debug, monitoring.

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

**Indexes:** `user_id`, `guild_id`, `command_name`, `created_at`

---

## 10. OAUTH_TOKENS - Discord OAuth tokens

Lưu tokens để gọi Discord API cho web dashboard.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGSERIAL | ID của token record |
| `user_id` | BIGINT | User nào |
| `access_token` | TEXT | OAuth access token (hết hạn sau 7 ngày) |
| `refresh_token` | TEXT | OAuth refresh token để gia hạn |
| `token_expires_at` | TIMESTAMP | Khi nào access token hết hạn |
| `created_at` | TIMESTAMP | Khi nào tokens được tạo |
| `updated_at` | TIMESTAMP | Lần cuối refresh token |

**Constraints:** UNIQUE(`user_id`)  
**Indexes:** `user_id`

---

## 11. WEB_SESSIONS - Phiên đăng nhập web

Quản lý sessions của user trên web dashboard.

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

**Constraints:** UNIQUE(`session_token`)  
**Indexes:** `user_id`, `session_token`, `expires_at`

---

## 12. USER_GUILD_PERMISSIONS - Quyền hạn user trong guild

Cache permissions của user trong các guild. Dùng cho web dashboard (bot check trực tiếp qua slash commands).

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của permission record |
| `discord_id` | VARCHAR(20) | Discord User ID |
| `guild_id` | VARCHAR(20) | Discord Guild ID |
| `permissions` | BIGINT | Bitfield permissions của Discord |
| `last_synced` | TIMESTAMP | Lần cuối đồng bộ permissions từ Discord |

**Constraints:** UNIQUE(`discord_id`, `guild_id`)  
**Indexes:** `discord_id`, `guild_id`, composite(`discord_id`, `guild_id`)

---

## 13. AUTO_RESPONSES - Tự động trả lời

Bot tự động reply khi detect keyword.

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

**Constraints:** UNIQUE(`guild_id`, `keyword`)  
**Indexes:** `guild_id`, `is_enabled`

---

## 14. AUTO_RESPONSE_BLOCKED_CHANNELS - Channels tắt auto response

Danh sách channels không dùng auto response.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của block record |
| `guild_id` | BIGINT | Guild nào |
| `channel_id` | VARCHAR(20) | Discord Channel ID bị block |
| `created_at` | TIMESTAMP | Khi nào channel bị block |

**Constraints:** UNIQUE(`guild_id`, `channel_id`)  
**Indexes:** `guild_id`

---

## 15. COMMAND_CHANNEL_RESTRICTIONS - Hạn chế lệnh theo channel

Block commands cụ thể ở channels cụ thể.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | SERIAL | ID của restriction record |
| `guild_id` | BIGINT | Guild nào |
| `channel_id` | VARCHAR(20) | Discord Channel ID bị hạn chế |
| `command_name` | VARCHAR(100) | Tên lệnh bị block: 'gamble', 'giveaway' |

**Constraints:** UNIQUE(`guild_id`, `channel_id`, `command_name`)  
**Indexes:** `guild_id`, `channel_id`, composite(`guild_id`, `channel_id`)

---

## Database Schema Overview

**Tổng số bảng:** 15

**Nhóm chức năng:**
- **User & Auth:** users, oauth_tokens, web_sessions, user_guild_permissions
- **Economy:** currencies, user_balances, transactions
- **Guilds:** guilds, auto_responses, auto_response_blocked_channels, command_channel_restrictions
- **Giveaways:** giveaways, giveaway_requirements, giveaway_entries
- **Logs:** command_logs

**Workflow chính:**
1. User OAuth login → Tạo `users`, `oauth_tokens`, `web_sessions`
2. Bot join guild → Tạo `guilds`
3. User dùng lệnh economy → Log vào `transactions`, update `user_balances`
4. Admin tạo giveaway → Tạo `giveaways` + `giveaway_requirements`
5. User tham gia → Tạo `giveaway_entries`
6. Mọi lệnh → Log vào `command_logs`