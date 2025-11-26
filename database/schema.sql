-- ==========================================
-- WhiteCat Bot - PostgreSQL Schema
-- Version: 4.1
-- ==========================================
-- Tables are organized by functional groups:
-- 1-4:   User & Authentication
-- 5-7:   Economy System
-- 8-11:  Guild Management
-- 12-14: Giveaway System
-- 15:    Logging & Analytics
-- ==========================================

-- ==========================================
-- USER & AUTHENTICATION
-- ==========================================

-- ==========================================
-- 1. USERS - Thông tin người dùng Discord
-- ==========================================
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,                      -- ID nội bộ database
  discord_id VARCHAR(20) UNIQUE NOT NULL,        -- Discord User ID (snowflake)
  username VARCHAR(100),                         -- Username Discord (cache)
  avatar VARCHAR(100),                           -- Avatar hash Discord (cache)
  terms_accepted BOOLEAN DEFAULT false,          -- Đã đồng ý điều khoản?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Lần cuối active
);

CREATE INDEX idx_users_discord_id ON users(discord_id);

-- ==========================================
-- 2. OAUTH_TOKENS - Discord OAuth tokens
-- ==========================================
CREATE TABLE oauth_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,                    -- Access token (7 ngày)
  refresh_token TEXT NOT NULL,                   -- Refresh token
  token_expires_at TIMESTAMP NOT NULL,           -- Token hết hạn khi nào
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Lần cuối refresh
);

CREATE INDEX idx_oauth_tokens_user_id ON oauth_tokens(user_id);

-- ==========================================
-- 3. WEB_SESSIONS - Phiên đăng nhập web
-- ==========================================
CREATE TABLE web_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(100) UNIQUE NOT NULL,    -- Token cookie
  expires_at TIMESTAMP NOT NULL,                 -- Session hết hạn (+7 ngày)
  guilds_cache JSONB,                            -- Cache guilds
  ip_address VARCHAR(50),                        -- IP đăng nhập
  user_agent TEXT,                               -- Browser info
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_web_sessions_user_id ON web_sessions(user_id);
CREATE INDEX idx_web_sessions_session_token ON web_sessions(session_token);
CREATE INDEX idx_web_sessions_expires_at ON web_sessions(expires_at);

-- ==========================================
-- 4. USER_GUILD_PERMISSIONS - Quyền hạn user
-- ==========================================
CREATE TABLE user_guild_permissions (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(20) NOT NULL,               -- Discord User ID
  guild_id VARCHAR(20) NOT NULL,                 -- Discord Guild ID
  permissions BIGINT NOT NULL,                   -- Bitfield permissions
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Lần cuối sync
  UNIQUE(discord_id, guild_id)
);

CREATE INDEX idx_user_guild_permissions_discord_id ON user_guild_permissions(discord_id);
CREATE INDEX idx_user_guild_permissions_guild_id ON user_guild_permissions(guild_id);
CREATE INDEX idx_user_guild_permissions_composite ON user_guild_permissions(discord_id, guild_id);

-- ==========================================
-- ECONOMY SYSTEM
-- ==========================================

-- ==========================================
-- 5. CURRENCIES - Các loại tiền tệ
-- ==========================================
CREATE TABLE currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,              -- Mã tiền tệ: 'COIN', 'VND'
  name VARCHAR(32) NOT NULL,                     -- Tên: 'WhiteCat Coins'
  emoji VARCHAR(64) NOT NULL,                    -- Discord emoji: '<:coin:123>' hoặc '🪙'
  is_tradeable BOOLEAN DEFAULT true,             -- Cho phép transfer?
  is_active BOOLEAN DEFAULT true,                -- Còn hoạt động?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. USER_BALANCES - Số dư hiện tại
-- ==========================================
CREATE TABLE user_balances (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  balance BIGINT DEFAULT 0,                      -- Số dư hiện tại
  UNIQUE(user_id, currency_id)                   -- 1 user = 1 balance/currency
);

CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX idx_user_balances_currency_id ON user_balances(currency_id);

-- ==========================================
-- 7. TRANSACTIONS - Lịch sử giao dịch
-- ==========================================
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency_id INTEGER NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,                     -- 'transfer_send', 'daily', 'work'...
  amount BIGINT NOT NULL,                        -- Số tiền (+ hoặc -)
  balance_before BIGINT NOT NULL,                -- Số dư trước
  balance_after BIGINT NOT NULL,                 -- Số dư sau
  related_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- User liên quan
  description TEXT,                              -- Mô tả
  metadata JSONB,                                -- Dữ liệu phụ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_currency_id ON transactions(currency_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ==========================================
-- GUILD MANAGEMENT
-- ==========================================

-- ==========================================
-- 8. GUILDS - Server Discord
-- ==========================================
CREATE TABLE guilds (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(20) UNIQUE NOT NULL,          -- Discord Guild ID
  locale VARCHAR(10),                            -- Ngôn ngữ: 'en-US', 'vi' (NULL = dùng DEFAULT_LOCALE từ env)
  prefix VARCHAR(10),                            -- Prefix lệnh text (NULL = dùng BOT_PREFIX từ env)
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Bot join khi nào
  left_at TIMESTAMP                              -- Bot rời khi nào (null = chưa rời)
);

CREATE INDEX idx_guilds_guild_id ON guilds(guild_id);

-- ==========================================
-- 9. AUTO_RESPONSES - Tự động trả lời
-- ==========================================
CREATE TABLE auto_responses (
  id SERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,                 -- Từ khóa trigger
  response_text TEXT,                            -- Text reply (null = chỉ embed)
  response_embed JSONB,                          -- Embed reply (null = chỉ text)
  match_type VARCHAR(20) DEFAULT 'contains',     -- 'contains', 'exact', 'starts_with'
  is_case_sensitive BOOLEAN DEFAULT false,       -- Phân biệt hoa/thường?
  is_enabled BOOLEAN DEFAULT true,               -- Còn hoạt động?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, keyword)
);

CREATE INDEX idx_auto_responses_guild_id ON auto_responses(guild_id);
CREATE INDEX idx_auto_responses_is_enabled ON auto_responses(is_enabled);

-- ==========================================
-- 10. AUTO_RESPONSE_BLOCKED_CHANNELS
-- ==========================================
CREATE TABLE auto_response_blocked_channels (
  id SERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  channel_id VARCHAR(20) NOT NULL,               -- Channel bị block
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, channel_id)
);

CREATE INDEX idx_auto_response_blocked_channels_guild_id ON auto_response_blocked_channels(guild_id);

-- ==========================================
-- 11. COMMAND_CHANNEL_RESTRICTIONS
-- ==========================================
CREATE TABLE command_channel_restrictions (
  id SERIAL PRIMARY KEY,
  guild_id VARCHAR(20) NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,  -- Discord Guild ID
  channel_id VARCHAR(20) NOT NULL,               -- Discord Channel ID bị hạn chế
  command_name VARCHAR(100) NOT NULL,            -- Tên lệnh bị block (e.g., 'gamble', 'giveaway')
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, channel_id, command_name)
);

CREATE INDEX idx_command_channel_restrictions_guild_id ON command_channel_restrictions(guild_id);
CREATE INDEX idx_command_channel_restrictions_channel_id ON command_channel_restrictions(channel_id);
CREATE INDEX idx_command_channel_restrictions_composite ON command_channel_restrictions(guild_id, channel_id);

-- ==========================================
-- GIVEAWAY SYSTEM
-- ==========================================

-- ==========================================
-- 12. GIVEAWAYS - Cuộc thi/Phần quà
-- ==========================================
CREATE TABLE giveaways (
  id BIGSERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  channel_id VARCHAR(20) NOT NULL,               -- Channel đăng giveaway
  message_id VARCHAR(20) UNIQUE NOT NULL,        -- Message ID (track reactions)
  prize TEXT NOT NULL,                           -- Phần thưởng
  description TEXT,                              -- Mô tả chi tiết
  winner_count INTEGER DEFAULT 1,                -- Số người thắng
  ends_at TIMESTAMP NOT NULL,                    -- Thời gian kết thúc
  is_completed BOOLEAN DEFAULT false,            -- Đã pick winners?
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_giveaways_guild_id ON giveaways(guild_id);
CREATE INDEX idx_giveaways_is_completed ON giveaways(is_completed);
CREATE INDEX idx_giveaways_ends_at ON giveaways(ends_at);

-- ==========================================
-- 13. GIVEAWAY_REQUIREMENTS - Yêu cầu tham gia
-- ==========================================
CREATE TABLE giveaway_requirements (
  id SERIAL PRIMARY KEY,
  giveaway_id BIGINT NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  requirement_type VARCHAR(20) NOT NULL,         -- 'require_boost', 'require_role', 'blacklist_role'
  role_id VARCHAR(20),                           -- Role ID (null nếu boost)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_giveaway_requirements_giveaway_id ON giveaway_requirements(giveaway_id);

-- ==========================================
-- 14. GIVEAWAY_ENTRIES - Người tham gia
-- ==========================================
CREATE TABLE giveaway_entries (
  id BIGSERIAL PRIMARY KEY,
  giveaway_id BIGINT NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_winner BOOLEAN DEFAULT false,               -- Có thắng không?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(giveaway_id, user_id)                   -- 1 user join 1 lần
);

CREATE INDEX idx_giveaway_entries_giveaway_id ON giveaway_entries(giveaway_id);
CREATE INDEX idx_giveaway_entries_user_id ON giveaway_entries(user_id);

-- ==========================================
-- LOGGING & ANALYTICS
-- ==========================================

-- ==========================================
-- 15. COMMAND_LOGS - Nhật ký lệnh
-- ==========================================
CREATE TABLE command_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  guild_id BIGINT REFERENCES guilds(id) ON DELETE SET NULL,
  command_name VARCHAR(100) NOT NULL,            -- Tên lệnh
  command_type VARCHAR(20) DEFAULT 'slash',      -- 'slash' hoặc 'text'
  success BOOLEAN DEFAULT true,                  -- Thành công?
  execution_time_ms INTEGER,                     -- Thời gian thực thi (ms)
  error_message TEXT,                            -- Lỗi (nếu có)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_command_logs_user_id ON command_logs(user_id);
CREATE INDEX idx_command_logs_guild_id ON command_logs(guild_id);
CREATE INDEX idx_command_logs_command_name ON command_logs(command_name);
CREATE INDEX idx_command_logs_created_at ON command_logs(created_at DESC);
