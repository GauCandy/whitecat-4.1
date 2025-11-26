# Hệ Thống Auto Response

## Cách Hoạt Động

Auto response tự động trả lời khi user gửi tin nhắn chứa keyword:

```
User gửi tin nhắn
    ↓
Có phải lệnh không? (bắt đầu bằng prefix) → Có → Xử lý lệnh
    ↓ Không
Kiểm tra keyword khớp trong database
    ↓
Tìm thấy? → Có → Gửi response (text/embed/cả 2)
    ↓ Không
Không làm gì
```

**Ưu tiên:** Lệnh (commands) được xử lý trước, auto-response chỉ chạy khi KHÔNG phải lệnh.

## Các Loại Khớp Keyword (Match Types)

| Loại | Mô Tả | Ví Dụ |
|------|-------|-------|
| `exact` | Tin nhắn phải chính xác là keyword | Keyword: `hello` → Khớp: `hello` ✅, `hello world` ❌ |
| `contains` | Tin nhắn chứa keyword ở bất kỳ đâu | Keyword: `help` → Khớp: `I need help` ✅, `help me` ✅ |
| `starts_with` | Tin nhắn bắt đầu bằng keyword | Keyword: `!faq` → Khớp: `!faq rules` ✅, `check !faq` ❌ |
| `ends_with` | Tin nhắn kết thúc bằng keyword | Keyword: `?` → Khớp: `How are you?` ✅, `? anyone` ❌ |
| `regex` | Khớp theo biểu thức chính quy | Keyword: `^(hi\|hello)\\b` → Khớp: `hi there` ✅, `hello` ✅ |

**Phân biệt hoa/thường:**
- `is_case_sensitive = false`: `Hello` = `hello` (mặc định)
- `is_case_sensitive = true`: `Hello` ≠ `hello`

## Các Loại Response

### 1. Chỉ Text
```sql
INSERT INTO auto_responses (guild_id, keyword, response_text, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  'hello',
  'Xin chào! 👋 Chào mừng bạn đến server!',
  'contains'
);
```

### 2. Chỉ Embed
```sql
INSERT INTO auto_responses (guild_id, keyword, response_embed, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  'rules',
  '{"title":"📜 Nội Quy Server","description":"1. Tôn trọng mọi người\\n2. Không spam\\n3. Vui vẻ và thân thiện!","color":5814783}',
  'exact'
);
```

### 3. Cả Text + Embed
```sql
INSERT INTO auto_responses (guild_id, keyword, response_text, response_embed, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  'faq',
  'Dưới đây là các câu hỏi thường gặp:',
  '{"title":"❓ FAQ","description":"Câu hỏi thường gặp","color":3447003}',
  'starts_with'
);
```

## Cấu Trúc JSON Embed

```json
{
  "title": "Tiêu đề (tối đa 256 ký tự)",
  "description": "Mô tả (tối đa 4096 ký tự)",
  "color": 5814783,
  "thumbnail": { "url": "https://example.com/thumb.png" },
  "image": { "url": "https://example.com/image.png" },
  "footer": {
    "text": "Footer (tối đa 2048 ký tự)",
    "icon_url": "https://example.com/icon.png"
  },
  "fields": [
    {
      "name": "Tên field (tối đa 256 ký tự)",
      "value": "Giá trị (tối đa 1024 ký tự)",
      "inline": false
    }
  ]
}
```

**Lưu ý:**
- Tất cả fields đều optional, chỉ dùng cái nào cần
- `color` phải là decimal (không phải hex): `0x5865F2` → `5814783`
- Dùng `\n` để xuống dòng trong string
- Tối đa 25 fields, tổng embed ≤ 6000 ký tự

### Màu Chuẩn (Decimal)

```javascript
SUCCESS:    5763719   // Xanh lá (thành công)
ERROR:      15548997  // Đỏ (lỗi)
WARNING:    16705372  // Vàng (cảnh báo)
INFO:       5814783   // Discord Blurple (thông tin)
FUN:        15844367  // Vàng kim (giải trí)
MODERATION: 15158332  // Đỏ cam (quản lý)
ECONOMY:    3066993   // Xanh lá đậm (kinh tế)
```

## Ví Dụ Phổ Biến

### Tin Nhắn Chào Mừng
```json
{
  "title": "👋 Chào Mừng!",
  "description": "Cảm ơn bạn đã tham gia cộng đồng của chúng tôi!",
  "color": 5763719,
  "fields": [
    {"name": "📋 Bước 1", "value": "Đọc nội quy", "inline": true},
    {"name": "✅ Bước 2", "value": "Nhận role của bạn", "inline": true},
    {"name": "💬 Bước 3", "value": "Bắt đầu trò chuyện!", "inline": true}
  ]
}
```

### FAQ Với Fields
```json
{
  "title": "❓ Câu Hỏi Thường Gặp",
  "color": 3447003,
  "fields": [
    {"name": "🤔 Bot này làm gì?", "value": "WhiteCat giúp quản lý server của bạn!", "inline": false},
    {"name": "⚙️ Prefix mặc định?", "value": "Dùng `!help` để xem lệnh", "inline": false},
    {"name": "🆘 Cần trợ giúp?", "value": "Liên hệ admin hoặc dùng `/support`", "inline": false}
  ],
  "footer": {"text": "WhiteCat Bot v4.1"}
}
```

### Thông Báo Sự Kiện
```json
{
  "title": "🎉 Sự Kiện Đặc Biệt",
  "description": "**Giveaway: 1,000,000 Coins!**\n\nTham gia ngay để có cơ hội nhận thưởng!",
  "color": 15844367,
  "fields": [
    {"name": "📅 Thời Gian", "value": "15/01/2025 - 20:00 GMT+7", "inline": true},
    {"name": "🎁 Phần Thưởng", "value": "1,000,000 Coins", "inline": true},
    {"name": "📝 Cách Tham Gia", "value": "React 🎉 vào tin nhắn này!", "inline": false}
  ],
  "footer": {"text": "Tổ chức bởi WhiteCat Team"}
}
```

## Ví Dụ Regex

### Nhiều Lời Chào
```sql
-- Khớp: hi, hello, hey, xin chào
INSERT INTO auto_responses (guild_id, keyword, response_text, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  '^(hi|hello|hey|xin chào)\\b',
  'Chào bạn! 👋',
  'regex'
);
```

### Pattern Câu Hỏi
```sql
-- Khớp tin nhắn kết thúc bằng "?"
INSERT INTO auto_responses (guild_id, keyword, response_embed, match_type)
VALUES (
  (SELECT id FROM guilds WHERE guild_id = 'YOUR_GUILD_ID'),
  '\\?$',
  '{"title":"🤔 Có Câu Hỏi?","description":"Hỏi tại <#support-channel> nhé!","color":5814783}',
  'regex'
);
```

## Test

1. Insert auto response vào database
2. Gửi tin nhắn có chứa keyword trong Discord
3. Bot sẽ tự động trả lời (nếu không phải lệnh)

**Debug logs:**
```
[AUTO RESPONSE] Triggered for keyword "hello" in Server Name
[AUTO RESPONSE] Error fetching auto responses: ...
[AUTO RESPONSE] Invalid regex: ...
```

## Công Cụ Hữu Ích

- **Discord Embed Visualizer:** https://cog-creators.github.io/discord-embed-sandbox/
- **Hex sang Decimal:** https://www.rapidtables.com/convert/number/hex-to-decimal.html
- **JSON Validator:** https://jsonlint.com/

## Tham Chiếu Code

- Handler: [src/bot/handlers/autoResponseHandler.ts](../src/bot/handlers/autoResponseHandler.ts)
- Event: [src/bot/events/messageCreate.ts](../src/bot/events/messageCreate.ts)
