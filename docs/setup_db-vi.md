# Database Commands - WhiteCat Bot

> Hướng dẫn sử dụng các lệnh quản lý database cho WhiteCat Discord Bot

## Mục lục

- [Database Commands](#database-commands)
- [Bot Tables](#bot-tables-15-bảng)
- [Troubleshooting](#troubleshooting)

---

## Database Commands

### `npm run db:init` - Khởi tạo database lần đầu

Tạo tất cả bot tables từ schema.sql lần đầu tiên.

```bash
npm run db:init
```

**Chức năng:**
- ✅ Kiểm tra xem bot tables đã tồn tại chưa
- ✅ Nếu chưa có → Tạo 15 tables từ `database/schema.sql`
- ✅ Thêm default currency (WhiteCat Coins)
- ✅ Nếu đã có → Skip và báo dùng `db:reset`

**Khi nào dùng:**
- Lần đầu setup project
- Database mới hoàn toàn

---

### `npm run db:reset` - Reset và tạo lại bot tables

Drop tất cả bot tables và tạo lại từ đầu. ⚠️ **MẤT TOÀN BỘ DATA!**

```bash
npm run db:reset
```

**Chức năng:**
- ⚠️ Drop 15 bot tables (có confirmation)
- ✅ Tạo lại từ schema.sql
- ✅ Thêm default currency
- ✅ Tables khác trong DB **KHÔNG bị ảnh hưởng**

**Khi nào dùng:**
- Đang development và cần reset data
- Schema thay đổi lớn
- Fix lỗi structure

**⚠️ CẢNH BÁO:**
```
Type "yes" to continue: yes

Dropping bot tables...
  ✓ Dropped: command_logs
  ✓ Dropped: giveaway_entries
  ✓ Dropped: giveaway_requirements
  ...
  ✓ Dropped: users

All data in bot tables will be LOST!
Other tables in database will NOT be affected.
```

---

### `npm run db:drop` - Xóa chỉ bot tables

Xóa 15 bot tables, giữ nguyên tables khác.

```bash
npm run db:drop
```

**Chức năng:**
- ⚠️ Drop 15 bot tables theo thứ tự đúng (foreign keys)
- ✅ Tables khác **KHÔNG bị xóa**
- ✅ Có confirmation trước khi xóa

**Khi nào dùng:**
- Muốn xóa bot tables nhưng giữ lại tables khác
- Cleanup trước khi uninstall

---

### `npm run db:clear` - Xóa tables KHÔNG phải bot

Xóa tất cả tables **TRỪ** 15 bot tables.

```bash
npm run db:clear
```

**Chức năng:**
- ⚠️ Drop tất cả tables KHÔNG phải của bot
- ✅ Giữ nguyên 15 bot tables + data
- ✅ Show list tables sẽ xóa trước khi confirm

**Khi nào dùng:**
- Database có nhiều tables test/cũ không dùng
- Cleanup tables deprecated từ version cũ
- Dọn dẹp database nhưng giữ bot data

**Ví dụ:**
```
Found 3 non-bot tables to drop:
  • test_users
  • old_payments
  • debug_table

Type "yes" to continue: yes

✓ Dropped: test_users
✓ Dropped: old_payments
✓ Dropped: debug_table

Kept 15 bot tables.
```

---

## Bot Tables (15 bảng)

### User & Authentication (4 tables)
- `users` - Thông tin người dùng Discord
- `oauth_tokens` - Discord OAuth tokens
- `web_sessions` - Phiên đăng nhập web
- `user_guild_permissions` - Quyền hạn user trong guild

### Economy System (3 tables)
- `currencies` - Các loại tiền tệ
- `user_balances` - Số dư hiện tại
- `transactions` - Lịch sử giao dịch (append-only)

### Guild Management (4 tables)
- `guilds` - Server Discord
- `auto_responses` - Tự động trả lời
- `auto_response_blocked_channels` - Channels tắt auto response
- `command_channel_restrictions` - Hạn chế lệnh theo channel

### Giveaway System (3 tables)
- `giveaways` - Cuộc thi/Phần quà
- `giveaway_requirements` - Yêu cầu tham gia giveaway
- `giveaway_entries` - Người tham gia giveaway

### Logging & Analytics (1 table)
- `command_logs` - Nhật ký lệnh

---

## Troubleshooting

### Lỗi: "Connection refused"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Giải pháp:**
- Kiểm tra PostgreSQL đã chạy chưa: `pg_ctl status`
- Start PostgreSQL: `pg_ctl start`
- Kiểm tra port trong `.env` có đúng không

---

### Lỗi: "database does not exist"

```
Error: database "whitecat_bot" does not exist
```

**Giải pháp:**
```sql
CREATE DATABASE whitecat_bot;
```

---

### Lỗi: "password authentication failed"

```
Error: password authentication failed for user "whitecat"
```

**Giải pháp:**
- Kiểm tra `DB_USER` và `DB_PASSWORD` trong `.env`
- Reset password PostgreSQL:
```sql
ALTER USER whitecat WITH PASSWORD 'new_password';
```

---

### Lỗi: "permission denied for schema public"

```
Error: permission denied for schema public
```

**Giải pháp:**
```sql
GRANT ALL PRIVILEGES ON DATABASE whitecat_bot TO whitecat;
GRANT ALL ON SCHEMA public TO whitecat;
```

---

### Script không chạy: "Schema file not found"

```
Error: Schema file not found at: /path/to/database/schema.sql
```

**Giải pháp:**
- Kiểm tra file `database/schema.sql` có tồn tại không
- Đảm bảo đang chạy lệnh từ root directory của project

---

## Database Schema Documentation

Xem chi tiết về schema tại:
- [Database Documentation (Vietnamese)](./database-vi.md)
- [Database Documentation (English)](./database-en.md)

---

**Version:** 4.1
**Last Updated:** 2025-01-23
