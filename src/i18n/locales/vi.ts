/**
 * Vietnamese Language Pack
 */

export default {
  // Common
  common: {
    error: 'Lỗi',
    success: 'Thành công',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    yes: 'Có',
    no: 'Không',
    loading: 'Đang tải...',
    unknown: 'Không xác định',
  },

  // Bot startup messages
  startup: {
    database_connecting: 'Đang kiểm tra kết nối database...',
    database_connected: 'Kết nối database thành công!',
    database_checking_tables: 'Đang kiểm tra các bảng dữ liệu...',
    database_tables_found: 'Tìm thấy {count}/15 bảng dữ liệu',
    database_no_tables: 'Không tìm thấy bảng dữ liệu! Vui lòng chạy: npm run db:init',
    discord_initializing: 'Đang khởi tạo Discord bot...',
    discord_loading_events: 'Đang tải Discord events...',
    discord_event_loaded: 'Đã tải event: {name}',
    discord_events_loaded: 'Đã tải {count} events',
    discord_connecting: 'Đang kết nối tới Discord...',
    discord_no_token: 'Không tìm thấy DISCORD_TOKEN trong file .env',
    bot_ready: 'WhiteCat Bot đã sẵn sàng!',
    bot_failed: 'Khởi động WhiteCat Bot thất bại',
  },

  // Discord bot info
  bot: {
    logged_in: 'Discord bot đã đăng nhập: {tag}',
    bot_id: 'Bot ID: {id}',
    guilds: 'Servers: {count}',
    users: 'Người dùng: {count}',
  },

  // Economy system
  economy: {
    balance: 'Số dư của bạn',
    currency: 'Tiền tệ',
    coins: 'WhiteCat Coins',
    transaction_success: 'Giao dịch thành công',
    insufficient_funds: 'Số dư không đủ',
  },

  // Giveaway system
  giveaway: {
    title: 'Giveaway',
    prize: 'Phần thưởng',
    winners: 'Người thắng',
    entries: 'Lượt tham gia',
    ends_at: 'Kết thúc lúc',
    ended: 'Đã kết thúc',
    participate: 'Nhấn để tham gia',
    winner_announced: 'Người thắng: {user}',
  },

  // Errors
  error: {
    unknown: 'Đã xảy ra lỗi không xác định',
    database_connection: 'Không thể kết nối database',
    discord_connection: 'Không thể kết nối Discord',
    permission_denied: 'Bạn không có quyền sử dụng lệnh này',
    command_not_found: 'Không tìm thấy lệnh',
    invalid_arguments: 'Tham số không hợp lệ',
    guild_only: 'Lệnh này chỉ có thể sử dụng trong máy chủ',
  },

  // Commands - General
  commands: {
    ping: {
      name: 'ping',
      description: 'Kiểm tra độ trễ của bot',
      reply: 'Pong! Độ trễ: {latency}ms',
    },
    help: {
      name: 'help',
      description: 'Hiển thị tất cả lệnh có sẵn',
    },
  },

  // Commands - Economy
  economy_commands: {
    balance: {
      name: 'balance',
      description: 'Kiểm tra số dư của bạn',
      user_option: 'Người dùng cần kiểm tra số dư',
      your_balance: 'Số dư của bạn',
      user_balance: 'Số dư của {user}',
    },
    daily: {
      name: 'daily',
      description: 'Nhận phần thưởng hàng ngày',
      claimed: 'Bạn đã nhận {amount} coins!',
      already_claimed: 'Bạn đã nhận hôm nay rồi. Quay lại sau {hours}h {minutes}m',
    },
  },
};
