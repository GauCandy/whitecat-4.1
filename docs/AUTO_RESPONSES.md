# Auto Response System

## How It Works

Auto responses automatically reply to messages containing specific keywords:

```
User sends message
    ↓
Is it a command? (starts with prefix) → Yes → Handle as command
    ↓ No
Check for keyword match in database
    ↓
Match found? → Yes → Send response (text/embed/both)
    ↓ No
No action
```

**Priority:** Commands are processed first, auto-responses only trigger for non-command messages.

## Match Types

| Type | Description | Example |
|------|-------------|---------|
| `exact` | Message must be exactly the keyword | Keyword: `hello` → Match: `hello` ✅, `hello world` ❌ |
| `contains` | Message contains keyword anywhere | Keyword: `help` → Match: `I need help` ✅, `help me` ✅ |
| `starts_with` | Message starts with keyword | Keyword: `!faq` → Match: `!faq rules` ✅, `check !faq` ❌ |
| `ends_with` | Message ends with keyword | Keyword: `?` → Match: `How are you?` ✅, `? anyone` ❌ |
| `regex` | Regular expression pattern | Keyword: `^(hi\|hello)\\b` → Match: `hi there` ✅, `hello` ✅ |

**Case Sensitive:**
- `is_case_sensitive = false`: `Hello` = `hello` (default)
- `is_case_sensitive = true`: `Hello` ≠ `hello`

## Response Types

### 1. Text Only
```sql
INSERT INTO auto_responses (guild_id, keyword, response_text, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  'hello',
  'Hello! 👋 Welcome to our server!',
  'contains'
);
```

### 2. Embed Only
```sql
INSERT INTO auto_responses (guild_id, keyword, response_embed, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  'rules',
  '{"title":"📜 Server Rules","description":"1. Be respectful\\n2. No spam\\n3. Have fun!","color":5814783}',
  'exact'
);
```

### 3. Both Text + Embed
```sql
INSERT INTO auto_responses (guild_id, keyword, response_text, response_embed, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  'faq',
  'Here are our frequently asked questions:',
  '{"title":"❓ FAQ","description":"Common questions and answers","color":3447003}',
  'starts_with'
);
```

## Embed JSON Structure

```json
{
  "title": "Title (max 256 chars)",
  "description": "Description (max 4096 chars)",
  "color": 5814783,
  "thumbnail": { "url": "https://example.com/thumb.png" },
  "image": { "url": "https://example.com/image.png" },
  "footer": {
    "text": "Footer text (max 2048 chars)",
    "icon_url": "https://example.com/icon.png"
  },
  "fields": [
    {
      "name": "Field 1 (max 256 chars)",
      "value": "Value (max 1024 chars)",
      "inline": false
    }
  ]
}
```

**Notes:**
- **IMPORTANT:** Embed must have at least ONE of: `title`, `description`, `fields`, `author`, `footer`, `image`, or `thumbnail`
- Empty embed `{}` will be rejected by Discord
- `color` must be decimal (not hex): `0x5865F2` → `5814783`
- Use `\n` for line breaks in strings
- Max 25 fields, total embed ≤ 6000 chars

### Standard Colors (Decimal)

```javascript
SUCCESS:    5763719   // Green
ERROR:      15548997  // Red
WARNING:    16705372  // Yellow
INFO:       5814783   // Discord Blurple
FUN:        15844367  // Yellow-Gold
MODERATION: 15158332  // Orange-Red
ECONOMY:    3066993   // Dark Green
```

## Common Examples

### Welcome Message
```json
{
  "title": "👋 Welcome!",
  "description": "Thanks for joining our community!",
  "color": 5763719,
  "fields": [
    {"name": "📋 Step 1", "value": "Read the rules", "inline": true},
    {"name": "✅ Step 2", "value": "Get your roles", "inline": true},
    {"name": "💬 Step 3", "value": "Start chatting!", "inline": true}
  ]
}
```

### FAQ with Fields
```json
{
  "title": "❓ Frequently Asked Questions",
  "color": 3447003,
  "fields": [
    {"name": "🤔 What is this bot?", "value": "WhiteCat helps manage your server!", "inline": false},
    {"name": "⚙️ Default prefix?", "value": "Use `!help` for commands", "inline": false},
    {"name": "🆘 Need help?", "value": "Contact admin or use `/support`", "inline": false}
  ],
  "footer": {"text": "WhiteCat Bot v4.1"}
}
```

### Event Announcement
```json
{
  "title": "🎉 Special Event",
  "description": "**Giveaway: 1,000,000 Coins!**\n\nJoin now for a chance to win!",
  "color": 15844367,
  "fields": [
    {"name": "📅 Time", "value": "Jan 15, 2025 - 8:00 PM GMT+7", "inline": true},
    {"name": "🎁 Prize", "value": "1,000,000 Coins", "inline": true},
    {"name": "📝 How to Join", "value": "React 🎉 to this message!", "inline": false}
  ],
  "footer": {"text": "Organized by WhiteCat Team"}
}
```

## Regex Examples

### Multiple Greetings
```sql
-- Matches: hi, hello, hey, greetings
INSERT INTO auto_responses (guild_id, keyword, response_text, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  '^(hi|hello|hey|greetings)\\b',
  'Hey there! 👋',
  'regex'
);
```

### Question Pattern
```sql
-- Matches messages ending with "?"
INSERT INTO auto_responses (guild_id, keyword, response_embed, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  '\\?$',
  '{"title":"🤔 Got a Question?","description":"Ask in <#support-channel>!","color":5814783}',
  'regex'
);
```

## Testing

1. Insert auto response into database
2. Send a message with the keyword in Discord
3. Bot should auto-reply (if not a command)

**Debug logs:**
```
[AUTO RESPONSE] Triggered for keyword "hello" in Server Name
[AUTO RESPONSE] Error fetching auto responses: ...
[AUTO RESPONSE] Invalid regex: ...
```

## Tools

- **Discord Embed Visualizer:** https://cog-creators.github.io/discord-embed-sandbox/
- **Hex to Decimal:** https://www.rapidtables.com/convert/number/hex-to-decimal.html
- **JSON Validator:** https://jsonlint.com/

## Code Reference

- Handler: [src/bot/handlers/autoResponseHandler.ts](../src/bot/handlers/autoResponseHandler.ts)
- Event: [src/bot/events/messageCreate.ts](../src/bot/events/messageCreate.ts)
