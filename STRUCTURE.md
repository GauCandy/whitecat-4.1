# WhiteCat Bot - Project Structure

## 📁 Cấu trúc thư mục (Professional)

```
whitecat-4.1/
├── 📂 src/
│   ├── 📂 bot/                         # Discord Bot Module
│   │   ├── 📂 core/                    # Core bot functionality
│   │   │   ├── client.ts              # Discord.js client singleton
│   │   │   ├── index.ts               # Bot entry point & startup
│   │   │   └── 📂 loaders/            # Module loaders
│   │   │       ├── commands.ts       # Command loader
│   │   │       └── events.ts         # Event loader
│   │   │
│   │   ├── 📂 commands/                # Slash commands
│   │   │   ├── 📂 general/            # General commands
│   │   │   │   └── ping.ts           # Ping command
│   │   │   └── 📂 fun/                # Fun commands (42 commands)
│   │   │
│   │   ├── 📂 events/                  # Discord event handlers
│   │   │   ├── ready.ts               # Client ready event
│   │   │   ├── interactionCreate.ts  # Slash command handler
│   │   │   └── error.ts               # Error handler
│   │   │
│   │   ├── 📂 middleware/              # Middleware functions
│   │   │   └── termsCheck.ts         # Terms acceptance middleware
│   │   │
│   │   ├── 📂 utils/                   # Utility functions
│   │   │   └── oauth.ts               # OAuth2 URL builder
│   │   │
│   │   ├── 📂 types/                   # TypeScript type definitions
│   │   │   └── command.ts             # Command interface
│   │   │
│   │   ├── 📂 services/                # Business logic (future)
│   │   │
│   │   └── 📂 scripts/                 # CLI scripts
│   │       ├── deploy-commands.ts    # Deploy slash commands
│   │       └── deploy-clear.ts       # Clear slash commands
│   │
│   ├── 📂 web/                         # Web Server Module (future)
│   │   └── index.ts                   # Web server entry point
│   │
│   ├── 📂 db/                          # Database Module
│   │   ├── pool.ts                    # PostgreSQL connection pool
│   │   ├── init.ts                    # Initialize database
│   │   ├── reset.ts                   # Reset database
│   │   ├── drop.ts                    # Drop tables
│   │   └── clear.ts                   # Clear data
│   │
│   ├── 📂 i18n/                        # Internationalization
│   │   ├── index.ts                   # i18n main module
│   │   └── 📂 locales/                # Translations
│   │       ├── 📂 vi/                 # Vietnamese
│   │       │   ├── index.ts
│   │       │   ├── general.ts
│   │       │   └── oauth.ts
│   │       └── 📂 en-US/              # English
│   │           ├── index.ts
│   │           ├── general.ts
│   │           └── oauth.ts
│   │
│   └── index.ts                       # Main entry point (both bot & web)
│
├── 📂 database/                        # Database schemas
│   └── schema.sql                     # PostgreSQL schema
│
├── 📂 dist/                            # Compiled JavaScript (gitignored)
│
├── 📄 .env                             # Environment variables (gitignored)
├── 📄 .env.example                     # Environment template
├── 📄 .gitignore                       # Git ignore rules
├── 📄 package.json                     # NPM dependencies & scripts
├── 📄 tsconfig.json                    # TypeScript config
├── 📄 COMMANDS.md                      # NPM commands cheatsheet
├── 📄 STRUCTURE.md                     # This file
└── 📄 README.md                        # Project readme

```

## 🎯 Module Responsibilities

### 📦 Bot Module (`src/bot/`)
Discord bot logic, commands, events, and utilities.

#### Core (`core/`)
- **client.ts**: Discord.js client singleton instance
- **index.ts**: Bot startup, initialization, and shutdown
- **loaders/commands.ts**: Recursively loads all slash commands
- **loaders/events.ts**: Loads and registers Discord events

#### Commands (`commands/`)
Slash commands organized by category:
- `general/`: Utility commands (ping, help)
- `fun/`: Fun interaction commands (42 commands)

#### Events (`events/`)
Discord.js event handlers:
- `ready.ts`: Bot connected and ready
- `interactionCreate.ts`: Slash command execution
- `error.ts`: Error handling

#### Middleware (`middleware/`)
Reusable middleware functions:
- `termsCheck.ts`: OAuth2 terms acceptance verification

#### Utils (`utils/`)
Utility functions:
- `oauth.ts`: Build OAuth2 authorization URLs

#### Types (`types/`)
TypeScript type definitions:
- `command.ts`: Command interface definition

#### Scripts (`scripts/`)
CLI deployment scripts:
- `deploy-commands.ts`: Register/update slash commands
- `deploy-clear.ts`: Remove all slash commands

---

### 🌐 Web Module (`src/web/`)
Web server for OAuth callbacks and dashboard (future).

---

### 🗄️ Database Module (`src/db/`)
PostgreSQL connection and management:
- **pool.ts**: Connection pool & query functions
- **init.ts**: Initialize database schema
- **reset.ts**: Drop and recreate tables
- **drop.ts**: Drop all tables
- **clear.ts**: Clear all data

---

### 🌍 i18n Module (`src/i18n/`)
Internationalization system:
- **index.ts**: i18n engine with `t()` function
- **locales/**: Translation files by language

---

## 🚀 Entry Points

| File | Description | Used By |
|------|-------------|---------|
| `src/index.ts` | Main entry - starts both bot & web | `npm start` |
| `src/bot/core/index.ts` | Bot entry point | `npm run start:bot` |
| `src/web/index.ts` | Web server entry point | `npm run start:web` |
| `src/bot/scripts/deploy-commands.ts` | Deploy commands script | `npm run deploy` |

---

## 📋 Design Principles

### 1. **Separation of Concerns**
Mỗi module có trách nhiệm riêng biệt:
- `bot/` = Discord logic
- `web/` = Web server
- `db/` = Database
- `i18n/` = Translations

### 2. **Scalability**
Cấu trúc dễ mở rộng:
- Thêm commands mới: `bot/commands/{category}/{command}.ts`
- Thêm events: `bot/events/{event}.ts`
- Thêm middleware: `bot/middleware/{middleware}.ts`
- Thêm utils: `bot/utils/{utility}.ts`

### 3. **Maintainability**
Code dễ maintain:
- Folder structure rõ ràng
- Mỗi file có mục đích cụ thể
- Import paths ngắn gọn
- Type definitions tập trung

### 4. **Professional Standards**
Tuân theo industry best practices:
- `core/` cho core functionality
- `loaders/` cho dynamic module loading
- `scripts/` cho CLI tools
- `services/` cho business logic (future)
- `middleware/` cho reusable logic
- `utils/` cho helper functions
- `types/` cho TypeScript definitions

---

## 🔄 Data Flow

### Slash Command Execution Flow

```
1. User types /command
   ↓
2. Discord → Bot (interactionCreate event)
   ↓
3. events/interactionCreate.ts
   ↓
4. middleware/termsCheck.ts (check terms)
   ↓
5. commands/{category}/{command}.ts (execute)
   ↓
6. Response → Discord
```

### Bot Startup Flow

```
1. src/bot/core/index.ts
   ↓
2. Load environment variables (.env)
   ↓
3. Connect to database (db/pool.ts)
   ↓
4. Initialize i18n (i18n/index.ts)
   ↓
5. Load commands (core/loaders/commands.ts)
   ↓
6. Register events (core/loaders/events.ts)
   ↓
7. Login to Discord (core/client.ts)
   ↓
8. Bot ready! 🎉
```

---

## 📚 Best Practices

### Adding a New Command
1. Create file: `src/bot/commands/{category}/{name}.ts`
2. Export Command object with `data` and `execute`
3. Loader auto-discovers it
4. Deploy: `npm run deploy`

### Adding a New Event
1. Create file: `src/bot/events/{eventName}.ts`
2. Export object with `name` and `execute`
3. Loader auto-registers it
4. Restart bot

### Adding Middleware
1. Create file: `src/bot/middleware/{name}.ts`
2. Export async function
3. Import in event handler
4. Call before command execution

---

## 🎨 Naming Conventions

- **Files**: camelCase.ts (e.g., `termsCheck.ts`)
- **Folders**: lowercase (e.g., `commands`, `events`)
- **Classes**: PascalCase (e.g., `CommandManager`)
- **Functions**: camelCase (e.g., `loadCommands()`)
- **Constants**: UPPER_CASE (e.g., `DEFAULT_LOCALE`)
- **Types**: PascalCase (e.g., `Command`, `CommandOptions`)

---

## 🔍 Quick Reference

**Find a command**: `src/bot/commands/{category}/{command}.ts`
**Find an event**: `src/bot/events/{event}.ts`
**Find a type**: `src/bot/types/{type}.ts`
**Find a util**: `src/bot/utils/{utility}.ts`
**Find middleware**: `src/bot/middleware/{middleware}.ts`
**Find database code**: `src/db/{file}.ts`
**Find translations**: `src/i18n/locales/{lang}/{module}.ts`

---

## 🎯 Summary

Cấu trúc mới này:
- ✅ **Professional** - Theo chuẩn industry
- ✅ **Scalable** - Dễ mở rộng
- ✅ **Maintainable** - Dễ maintain
- ✅ **Organized** - Rõ ràng, có logic
- ✅ **Clean** - Code sạch, dễ đọc

Mọi thứ đều có chỗ riêng, dễ tìm và dễ quản lý! 🚀
