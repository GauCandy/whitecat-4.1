# WhiteCat Bot 4.1

Discord bot với dashboard web quản lý và OAuth integration.

## Yêu cầu

- Node.js 18+
- PostgreSQL 14+
- Discord Bot Token
- Discord OAuth Application

## Cài đặt nhanh

### 1. Clone và cài đặt dependencies

```bash
npm install
```

### 2. Tạo file `.env`

```env
# Discord Bot
DISCORD_TOKEN=your_bot_token_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whitecat

# Web Dashboard
WEB_PORT=3000
SESSION_SECRET=your_random_secret_here

# OAuth (Discord Developer Portal)
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. Setup Database

**Tạo database:**
```bash
psql -U postgres
CREATE DATABASE whitecat;
\q
```

**Import schema:**
```bash
psql -U postgres -d whitecat -f database/schema.sql
```

**Nếu nâng cấp từ version cũ, chạy migration:**
```bash
node scripts/migrate-guild-info.js
```

### 4. Build project

```bash
npm run build
```

### 5. Chạy bot

**Chỉ bot:**
```bash
npm run dev:bot
```

**Chỉ web:**
```bash
npm run dev:web
```

**Cả hai cùng lúc:**
```bash
npm run dev
```

## Cấu hình Discord OAuth

1. Vào [Discord Developer Portal](https://discord.com/developers/applications)
2. Chọn application của bạn
3. Vào **OAuth2** → **General**
4. Thêm Redirect URL: `http://localhost:3000/auth/callback`
5. Vào **OAuth2** → **URL Generator**:
   - Scopes: `identify`, `email`, `guilds`, `applications.commands`
   - Copy URL và dùng để invite bot

## Scripts hữu ích

```bash
npm run build              # Build TypeScript
npm run clean              # Xóa folder dist
npm run dev                # Chạy cả bot và web
npm run dev:bot            # Chỉ chạy bot
npm run dev:web            # Chỉ chạy web dashboard
```

## Cấu trúc project

```
whitecat-4.1/
├── src/
│   ├── bot/               # Discord bot code
│   │   ├── commands/      # Slash commands
│   │   ├── events/        # Discord events
│   │   └── services/      # Permission sync, etc.
│   └── web/               # Web dashboard
│       ├── routes/        # Express routes
│       ├── services/      # OAuth, guild sync
│       └── views/         # HTML templates
├── database/
│   ├── schema.sql         # Database schema
│   └── migrations/        # Database migrations
└── scripts/               # Utility scripts
```

## Tính năng

- ✅ Discord slash commands (fun, interactions)
- ✅ Web dashboard với OAuth login
- ✅ Real-time permission syncing
- ✅ Multi-language support (i18n)
- ✅ Guild settings management
- ✅ Starry sky background effects

## Troubleshooting

**Bot không kết nối được database:**
- Kiểm tra `DATABASE_URL` trong `.env`
- Đảm bảo PostgreSQL đang chạy

**OAuth không hoạt động:**
- Kiểm tra `DISCORD_REDIRECT_URI` khớp với Discord Developer Portal
- Đảm bảo `DISCORD_CLIENT_ID` và `DISCORD_CLIENT_SECRET` đúng

**Dashboard hiển thị "Unknown Server":**
- Chạy script backfill: `node scripts/backfill-guild-info.js`
- Hoặc đợi bot tự động sync khi có event (member update, role change, etc.)

## License

MIT
