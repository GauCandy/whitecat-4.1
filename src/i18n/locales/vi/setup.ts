/**
 * Vietnamese - Setup Wizard translations
 */

export default {
  // Common
  guild_only: "Chỉ có thể sử dụng trong máy chủ!",
  error_occurred: "Đã xảy ra lỗi!",
  error_language: "Đã xảy ra lỗi khi đặt ngôn ngữ!",
  error_prefix: "Đã xảy ra lỗi khi đặt prefix!",

  // Step 1: Language Selection
  step1: {
    title: "👋 Chào Mừng Đến Với WhiteCat Bot!",
    greeting: "Xin chào {inviter}! Cảm ơn bạn đã thêm tôi vào **{guildName}**!",
    greeting_no_inviter: "Cảm ơn bạn đã thêm tôi vào **{guildName}**!",
    description: "Hãy bắt đầu với thiết lập nhanh để cá nhân hóa trải nghiệm máy chủ của bạn.",
    step_label: "**Bước 1/2:** Chọn Ngôn Ngữ",
    language_prompt: "Chọn ngôn ngữ chính cho máy chủ này:",
    default_note: "📌 Mặc định: `{locale}` (dựa trên khu vực máy chủ)",
    can_change: "💡 Bạn có thể thay đổi sau bằng lệnh `/settings language`",
    select_placeholder: "🌐 Chọn ngôn ngữ",
    button_default: "✨ Dùng Mặc Định",
    footer: "WhiteCat Bot v4.1 • Bước 1/2",
  },

  // Step 2: Prefix Setup
  step2: {
    title: "⚙️ Sắp Xong Rồi! Cấu Hình Prefix",
    language_set: "Hoàn hảo! Ngôn ngữ máy chủ đã được đặt thành: **{language}**",
    description: "Bây giờ hãy thiết lập prefix lệnh của bạn.",
    step_label: "**Bước 2/2:** Prefix Tùy Chỉnh (Tùy chọn)",
    prefix_info: "**Prefix là gì?**\nPrefix được dùng trước lệnh văn bản, như `{prefix}help` hoặc `{prefix}ping`.",
    default_prefix: "📌 Prefix mặc định: `{prefix}` (từ BOT_PREFIX)",
    custom_option: "Bạn có thể tạo prefix tùy chỉnh ngắn gọn cho **{guildName}** nếu muốn.",
    note_slash: "💡 **Lưu ý:** Lệnh slash (/) luôn hoạt động bất kể prefix!",
    button_set: "⚙️ Đặt Prefix",
    button_skip: "⏭️ Bỏ Qua",
    button_back: "⬅️ Quay Lại",
    footer: "WhiteCat Bot v4.1 • Bước 2/2",
  },

  // Step 3: Completion
  step3: {
    title: "✅ Thiết Lập Hoàn Tất!",
    description: "Xong rồi! **{guildName}** đã được cấu hình đầy đủ và sẵn sàng sử dụng!",
    summary_title: "📋 Cấu Hình Của Bạn",
    language_label: "🌐 Ngôn Ngữ Máy Chủ",
    prefix_default_label: "⚙️ Prefix Mặc Định",
    prefix_custom_label: "✨ Prefix Tùy Chỉnh",
    prefix_note: "(từ BOT_PREFIX env)",
    getting_started_title: "🚀 Bắt Đầu Sử Dụng",
    getting_started_commands: "• Dùng `{prefix}help` hoặc `/help` để nhận trợ giúp\n• Dùng `{prefix}commands` hoặc `/commands` để xem tất cả lệnh\n• Thử `/ping` để kiểm tra bot hoạt động!",
    fun_commands_title: "🎉 Vui Vẻ Nào!",
    fun_commands: "Thử các lệnh vui này:\n• `/hug @user` - Ôm ai đó\n• `/pat @user` - Vỗ đầu ai đó\n• `/dance` - Khoe vũ đạo\n• Và nhiều lệnh tương tác khác!",
    footer: "WhiteCat Bot v4.1 • Sẵn sàng!",
    enjoy: "Chúc bạn vui vẻ với WhiteCat Bot! 🐱✨",
  },

  // Modal
  modal: {
    title: "Đặt Prefix Tùy Chỉnh",
    label: "Prefix Mới",
    placeholder: "Ví dụ: !, /, $, wc!",
    empty_error: "❌ Prefix không được để trống!",
  },

  // Button callbacks
  back_message: "⬅️ Để quay lại bước chọn ngôn ngữ, vui lòng xem lại tin nhắn chào mừng ban đầu ở trên!",

  // Legacy (for manual /setup command)
  legacy: {
    language_updated_title: "✅ Đã Cập Nhật Ngôn Ngữ!",
    language_updated_desc: "Ngôn ngữ máy chủ đã được đổi thành: **{language}**\n\nTất cả tin nhắn của bot sẽ hiển thị bằng ngôn ngữ này.",
    prefix_updated_title: "✅ Đã Cập Nhật Prefix!",
    prefix_updated_desc: "Prefix máy chủ đã được đổi thành: **`{prefix}`**\n\nGiờ bạn có thể dùng lệnh như: `{prefix}help`, `{prefix}ping`\n\nLưu ý: Lệnh slash (/) luôn hoạt động bất kể prefix!",
  },
};
