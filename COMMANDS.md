# WhiteCat Bot - NPM Commands Cheatsheet

## 📦 Build Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run build` | Compile TypeScript → JavaScript | Before deployment |

## 🚀 Start Commands (Production)

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm start` | Start both bot & web | Production - Full system |
| `npm run start:bot` | Start only bot | Production - Bot only |
| `npm run start:web` | Start only web | Production - Web only |

**⚠️ Important:** Run `npm run build` first!

## 🔧 Development Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Run both bot & web (dev mode) | Development - Full system |
| `npm run dev:bot` | Run only bot (dev mode) | Development - Bot only |
| `npm run dev:web` | Run only web (dev mode) | Development - Web only |

**✨ Dev mode:** Auto-reload với ts-node, không cần build

## 🤖 Deploy Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run deploy` | Build & deploy slash commands | Register/update commands |
| `npm run deploy:clear` | Build & clear all commands | Remove all commands |

## 🗄️ Database Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run db:init` | Initialize database schema | First setup |
| `npm run db:reset` | Drop & recreate all tables | Clean reset |
| `npm run db:drop` | Drop all tables only | Remove tables |
| `npm run db:clear` | Clear all data (keep schema) | Clear data only |

---

## 💡 Quick Start Guide

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run db:init

# 3. Deploy slash commands
npm run deploy

# 4. Start development
npm run dev:bot
```

### Development Workflow
```bash
# Work on bot only
npm run dev:bot

# Work on web only
npm run dev:web

# Work on both
npm run dev
```

### Production Deployment
```bash
# 1. Build project
npm run build

# 2. Deploy commands (if changed)
npm run deploy

# 3. Start production
npm start
# or
npm run start:bot  # Bot only
npm run start:web  # Web only
```

---

## 🎯 Common Scenarios

### Scenario 1: Testing bot locally
```bash
npm run dev:bot
```

### Scenario 2: Reset database with fresh schema
```bash
npm run db:reset
npm run db:init
```

### Scenario 3: Update slash commands
```bash
npm run deploy
```

### Scenario 4: Production deployment
```bash
npm run build
npm run deploy  # If commands changed
npm run start:bot
```

### Scenario 5: Clear all commands
```bash
npm run deploy:clear
```

---

## 📝 Notes

- **Dev commands** (`dev:*`) use `ts-node` - no build needed
- **Start commands** (`start:*`) use compiled JS - need `npm run build` first
- **Deploy commands** auto-build before deploying
- **Database commands** use `ts-node` for convenience
- Use `Ctrl+C` to stop any running process

---

## 🆘 Troubleshooting

**Command not found?**
```bash
npm install  # Reinstall dependencies
```

**Build errors?**
```bash
rm -rf dist/  # Clear dist folder
npm run build  # Rebuild
```

**Database connection error?**
```bash
# Check .env file:
# - DB_HOST
# - DB_PORT
# - DB_USER
# - DB_PASSWORD
```

**Commands not showing in Discord?**
```bash
npm run deploy      # Register commands
# Wait 1-2 minutes for Discord to update
```
