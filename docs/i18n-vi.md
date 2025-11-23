# Hệ thống đa ngôn ngữ (i18n)

Hướng dẫn sử dụng hệ thống i18n cho WhiteCat Bot v4.1

## Tổng quan

i18n (internationalization) cho phép bot hỗ trợ nhiều ngôn ngữ. Hiện tại bot hỗ trợ:
- 🇬🇧 Tiếng Anh (en-US, en-GB)
- 🇻🇳 Tiếng Việt (vi-VN, vi)

## Cấu trúc thư mục

```
src/i18n/
├── index.ts          # Module chính
└── locales/
    ├── en.ts        # Bản dịch tiếng Anh
    └── vi.ts        # Bản dịch tiếng Việt
```

## Cách sử dụng

### 1. Dịch văn bản đơn giản

```typescript
import { t } from '../i18n';

// Dịch cơ bản
const message = t('common.error');
// Kết quả: "Error" (en) hoặc "Lỗi" (vi)

// Dịch với nested keys
const success = t('startup.database_connected');
// Kết quả: "Database connected successfully!"
```

### 2. Dịch với placeholders

```typescript
import { t } from '../i18n';

// Thay thế 1 placeholder
const message = t('startup.database_tables_found', { count: '15' });
// Kết quả: "Found 15/15 bot tables"

// Thay thế nhiều placeholders
const winner = t('giveaway.winner_announced', { user: 'John#1234' });
// Kết quả: "Winner: John#1234"
```

### 3. Sử dụng trong Discord Commands

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
      // Tiếng Anh: "Your balance: 1000 WhiteCat Coins"
      // Tiếng Việt: "Số dư của bạn: 1000 WhiteCat Coins"
    });
  },
};
```

### 4. Thông báo lỗi

```typescript
async function someCommand({ interaction, locale }) {
  if (!hasPermission(interaction.user)) {
    await interaction.reply({
      content: t('error.permission_denied', {}, locale as any),
      flags: MessageFlags.Ephemeral
    });
    // Tiếng Anh: "You do not have permission to use this command"
    // Tiếng Việt: "Bạn không có quyền sử dụng lệnh này"
  }
}
```

## Quản lý ngôn ngữ

### Lấy ngôn ngữ hiện tại

```typescript
import { getLocale } from '../i18n';

const currentLocale = getLocale();
console.log(currentLocale); // "en-US"
```

### Đổi ngôn ngữ

```typescript
import { setLocale } from '../i18n';

setLocale('vi-VN');
// Từ giờ tất cả t() sẽ dùng tiếng Việt
```

### Lấy danh sách ngôn ngữ hỗ trợ

```typescript
import { getSupportedLocales } from '../i18n';

const locales = getSupportedLocales();
console.log(locales);
// ['en-US', 'en', 'vi-VN', 'vi']
```

### Dịch cho từng user

```typescript
import { getT } from '../i18n';

async function sendLocalizedMessage(userId: string) {
  // Lấy ngôn ngữ user từ database
  const userLocale = await getUserLocale(userId); // 'vi-VN' hoặc 'en-US'

  // Tạo function dịch riêng cho user
  const translate = getT(userLocale);

  // Sử dụng
  return translate('commands.ping.reply', { latency: '50' });
}
```

## Thêm bản dịch mới

### Bước 1: Thêm vào file tiếng Anh

Chỉnh sửa `src/i18n/locales/en.ts`:

```typescript
export default {
  // ...các bản dịch khác

  myFeature: {
    greeting: 'Hello, {name}!',
    farewell: 'Goodbye!',
  },
};
```

### Bước 2: Thêm vào file tiếng Việt

Chỉnh sửa `src/i18n/locales/vi.ts`:

```typescript
export default {
  // ...các bản dịch khác

  myFeature: {
    greeting: 'Xin chào, {name}!',
    farewell: 'Tạm biệt!',
  },
};
```

### Bước 3: Sử dụng trong code

```typescript
import { t } from '../i18n';

const message = t('myFeature.greeting', { name: 'John' });
// Tiếng Anh: "Hello, John!"
// Tiếng Việt: "Xin chào, John!"
```

## Các nhóm bản dịch có sẵn

### `common` - Từ phổ biến
```typescript
t('common.error')    // "Error" / "Lỗi"
t('common.success')  // "Success" / "Thành công"
t('common.yes')      // "Yes" / "Có"
t('common.no')       // "No" / "Không"
```

### `startup` - Khởi động bot
```typescript
t('startup.database_connected')  // Thông báo database
t('startup.bot_ready')          // "WhiteCat Bot is ready!"
```

### `bot` - Thông tin bot
```typescript
t('bot.logged_in', { tag: 'WhiteCat#1234' })
t('bot.guilds', { count: '10' })
```

### `economy` - Hệ thống kinh tế
```typescript
t('economy.balance')              // "Your balance" / "Số dư của bạn"
t('economy.insufficient_funds')   // "Insufficient funds" / "Số dư không đủ"
```

### `giveaway` - Hệ thống giveaway
```typescript
t('giveaway.title')              // "Giveaway"
t('giveaway.winner_announced', { user: 'John' })
```

### `error` - Thông báo lỗi
```typescript
t('error.unknown')              // "An unknown error occurred"
t('error.permission_denied')    // "You do not have permission..."
t('error.guild_only')          // "This command can only be used in servers"
```

### `commands` - Lệnh bot
```typescript
t('commands.ping.reply', { latency: '50' })
// "Pong! Latency: 50ms" / "Pong! Độ trễ: 50ms"
```

## Cấu hình

### Đặt ngôn ngữ mặc định

Trong file `.env`:

```env
DEFAULT_LOCALE=en-US
# Hoặc
DEFAULT_LOCALE=vi-VN
```

### Ngôn ngữ tự động từ Discord

Bot tự động detect ngôn ngữ từ Discord user preferences:

```typescript
// Trong interactionCreate.ts
const locale = interaction.locale || 'en-US';
await command.execute({ interaction, locale });
```

## Best Practices

### ✅ Nên làm

- Luôn dùng `t()` cho mọi text hiển thị cho user
- Thêm bản dịch cho cả 2 ngôn ngữ cùng lúc
- Dùng placeholders thay vì string concatenation
- Test cả 2 ngôn ngữ trước khi deploy

### ❌ Không nên

- Hardcode text tiếng Anh/Việt trong code
- Quên thêm bản dịch cho 1 trong 2 ngôn ngữ
- Dùng string concatenation: `"Hello " + name` (sai)
- Skip việc test ngôn ngữ

## Ví dụ hoàn chỉnh

### Command với i18n

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

## Xem thêm

- [Setup Database](./setup_db-vi.md)
- [Commands Guide](./commands-vi.md)
