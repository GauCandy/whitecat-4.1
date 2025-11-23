# Internationalization System (i18n)

Guide to using the i18n system for WhiteCat Bot v4.1

## Overview

i18n (internationalization) allows the bot to support multiple languages. Currently supported:
- 🇬🇧 English (en-US, en-GB)
- 🇻🇳 Vietnamese (vi-VN, vi)

## Directory Structure

```
src/i18n/
├── index.ts          # Main module
└── locales/
    ├── en.ts        # English translations
    └── vi.ts        # Vietnamese translations
```

## Usage

### 1. Simple Translation

```typescript
import { t } from '../i18n';

// Basic translation
const message = t('common.error');
// Result: "Error" (en) or "Lỗi" (vi)

// Translation with nested keys
const success = t('startup.database_connected');
// Result: "Database connected successfully!"
```

### 2. Translation with Placeholders

```typescript
import { t } from '../i18n';

// Replace single placeholder
const message = t('startup.database_tables_found', { count: '15' });
// Result: "Found 15/15 bot tables"

// Replace multiple placeholders
const winner = t('giveaway.winner_announced', { user: 'John#1234' });
// Result: "Winner: John#1234"
```

### 3. Using in Discord Commands

```typescript
import { Command } from '../../types/command';
import { t } from '../../../i18n';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balance')
    .setDescriptionLocalizations({
      vi: 'Kiểm tra số dư của bạn',
      'en-US': 'Check your balance',
    }),

  async execute({ interaction, locale }) {
    const balance = 1000;

    await interaction.reply({
      content: `${t('economy.balance', {}, locale as any)}: ${balance} ${t('economy.coins', {}, locale as any)}`
      // English: "Your balance: 1000 WhiteCat Coins"
      // Vietnamese: "Số dư của bạn: 1000 WhiteCat Coins"
    });
  },
};
```

### 4. Error Messages

```typescript
async function someCommand({ interaction, locale }) {
  if (!hasPermission(interaction.user)) {
    await interaction.reply({
      content: t('error.permission_denied', {}, locale as any),
      flags: MessageFlags.Ephemeral
    });
    // English: "You do not have permission to use this command"
    // Vietnamese: "Bạn không có quyền sử dụng lệnh này"
  }
}
```

## Language Management

### Get Current Locale

```typescript
import { getLocale } from '../i18n';

const currentLocale = getLocale();
console.log(currentLocale); // "en-US"
```

### Change Locale

```typescript
import { setLocale } from '../i18n';

setLocale('vi-VN');
// All t() calls will now use Vietnamese
```

### Get Supported Locales

```typescript
import { getSupportedLocales } from '../i18n';

const locales = getSupportedLocales();
console.log(locales);
// ['en-US', 'en', 'vi-VN', 'vi']
```

### Per-User Translation

```typescript
import { getT } from '../i18n';

async function sendLocalizedMessage(userId: string) {
  // Get user's locale from database
  const userLocale = await getUserLocale(userId); // 'vi-VN' or 'en-US'

  // Create translation function for user
  const translate = getT(userLocale);

  // Use it
  return translate('commands.ping.reply', { latency: '50' });
}
```

## Adding New Translations

### Step 1: Add to English File

Edit `src/i18n/locales/en.ts`:

```typescript
export default {
  // ...other translations

  myFeature: {
    greeting: 'Hello, {name}!',
    farewell: 'Goodbye!',
  },
};
```

### Step 2: Add to Vietnamese File

Edit `src/i18n/locales/vi.ts`:

```typescript
export default {
  // ...other translations

  myFeature: {
    greeting: 'Xin chào, {name}!',
    farewell: 'Tạm biệt!',
  },
};
```

### Step 3: Use in Code

```typescript
import { t } from '../i18n';

const message = t('myFeature.greeting', { name: 'John' });
// English: "Hello, John!"
// Vietnamese: "Xin chào, John!"
```

## Available Translation Groups

### `common` - Common Terms
```typescript
t('common.error')    // "Error" / "Lỗi"
t('common.success')  // "Success" / "Thành công"
t('common.yes')      // "Yes" / "Có"
t('common.no')       // "No" / "Không"
```

### `startup` - Bot Startup
```typescript
t('startup.database_connected')  // Database messages
t('startup.bot_ready')          // "WhiteCat Bot is ready!"
```

### `bot` - Bot Information
```typescript
t('bot.logged_in', { tag: 'WhiteCat#1234' })
t('bot.guilds', { count: '10' })
```

### `economy` - Economy System
```typescript
t('economy.balance')              // "Your balance" / "Số dư của bạn"
t('economy.insufficient_funds')   // "Insufficient funds" / "Số dư không đủ"
```

### `giveaway` - Giveaway System
```typescript
t('giveaway.title')              // "Giveaway"
t('giveaway.winner_announced', { user: 'John' })
```

### `error` - Error Messages
```typescript
t('error.unknown')              // "An unknown error occurred"
t('error.permission_denied')    // "You do not have permission..."
t('error.guild_only')          // "This command can only be used in servers"
```

### `commands` - Bot Commands
```typescript
t('commands.ping.reply', { latency: '50' })
// "Pong! Latency: 50ms" / "Pong! Độ trễ: 50ms"
```

## Configuration

### Set Default Locale

In `.env` file:

```env
DEFAULT_LOCALE=en-US
# Or
DEFAULT_LOCALE=vi-VN
```

### Auto-detect from Discord

Bot automatically detects language from Discord user preferences:

```typescript
// In interactionCreate.ts
const locale = interaction.locale || 'en-US';
await command.execute({ interaction, locale });
```

## Best Practices

### ✅ Do

- Always use `t()` for user-facing text
- Add translations for both languages simultaneously
- Use placeholders instead of string concatenation
- Test both languages before deployment

### ❌ Don't

- Hardcode English/Vietnamese text in code
- Forget to add translation for one language
- Use string concatenation: `"Hello " + name` (wrong)
- Skip language testing

## Complete Example

### Command with i18n

```typescript
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types/command';
import { t } from '../../../i18n';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward')
    .setDescriptionLocalizations({
      vi: 'Nhận phần thưởng hàng ngày',
      'en-US': 'Claim your daily reward',
    }),

  async execute({ interaction, locale }) {
    const user = interaction.user;
    const lastClaim = await getLastClaim(user.id);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours

    if (lastClaim && now - lastClaim < cooldown) {
      const remaining = cooldown - (now - lastClaim);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

      await interaction.reply({
        content: t('economy_commands.daily.already_claimed',
          { hours: String(hours), minutes: String(minutes) },
          locale as any
        ),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const amount = 100;
    await addCoins(user.id, amount);
    await setLastClaim(user.id, now);

    await interaction.reply({
      content: t('economy_commands.daily.claimed',
        { amount: String(amount) },
        locale as any
      ),
    });
  },
};

export default command;
```

## See Also

- [Setup Database](./setup_db-en.md)
- [Commands Guide](./commands-en.md)
