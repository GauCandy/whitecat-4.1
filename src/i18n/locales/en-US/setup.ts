/**
 * English - Setup Wizard translations
 */

export default {
  // Common
  guild_only: "This can only be used in a server!",
  error_occurred: "An error occurred!",
  error_language: "An error occurred while setting the language!",
  error_prefix: "An error occurred while setting the prefix!",

  // Step 1: Language Selection
  step1: {
    title: "👋 Welcome to WhiteCat Bot!",
    greeting: "Hello {inviter}! Thank you for adding me to **{guildName}**!",
    greeting_no_inviter: "Thank you for adding me to **{guildName}**!",
    description: "Let's get started with a quick setup to personalize your server experience.",
    step_label: "**Step 1 of 2:** Choose Your Language",
    language_prompt: "Select the primary language for this server:",
    default_note: "📌 Default: `{locale}` (based on your server's region)",
    can_change: "💡 You can always change this later using `/settings language`",
    select_placeholder: "🌐 Select a language",
    button_default: "✨ Use Default",
    footer: "WhiteCat Bot v4.1 • Step 1 of 2",
  },

  // Step 2: Prefix Setup
  step2: {
    title: "⚙️ Almost Done! Prefix Configuration",
    language_set: "Perfect! Your server language is now set to: **{language}**",
    description: "Now let's set up your command prefix.",
    step_label: "**Step 2 of 2:** Custom Prefix (Optional)",
    prefix_info: "**What is a prefix?**\nA prefix is used before text commands, like `{prefix}help` or `{prefix}ping`.",
    default_prefix: "📌 Default prefix: `{prefix}` (from BOT_PREFIX)",
    custom_option: "You can create a custom short prefix for **{guildName}** if you want.",
    note_slash: "💡 **Note:** Slash commands (/) always work regardless of prefix!",
    button_set: "⚙️ Set Prefix",
    button_skip: "⏭️ Skip",
    button_back: "⬅️ Back",
    footer: "WhiteCat Bot v4.1 • Step 2 of 2",
  },

  // Step 3: Completion
  step3: {
    title: "✅ Setup Complete!",
    description: "All done! **{guildName}** is now fully configured and ready to use!",
    summary_title: "📋 Your Configuration",
    language_label: "🌐 Server Language",
    prefix_default_label: "⚙️ Default Prefix",
    prefix_custom_label: "✨ Custom Prefix",
    prefix_note: "(from BOT_PREFIX env)",
    getting_started_title: "🚀 Getting Started",
    getting_started_commands: "• Use `{prefix}help` or `/help` to get help\n• Use `{prefix}commands` or `/commands` to see all commands\n• Try `/ping` to test if I'm working!",
    fun_commands_title: "🎉 Have Fun!",
    fun_commands: "Try these fun commands:\n• `/hug @user` - Give someone a hug\n• `/pat @user` - Pat someone's head\n• `/dance` - Show off your moves\n• And many more interactive commands!",
    footer: "WhiteCat Bot v4.1 • Ready to use!",
    enjoy: "Enjoy using WhiteCat Bot! 🐱✨",
  },

  // Modal
  modal: {
    title: "Set Custom Prefix",
    label: "New Prefix",
    placeholder: "e.g., !, /, $, wc!",
    empty_error: "❌ Prefix cannot be empty!",
  },

  // Button callbacks
  back_message: "⬅️ To go back to language selection, please refer to the original welcome message above!",

  // Legacy (for manual /setup command)
  legacy: {
    language_updated_title: "✅ Language Updated!",
    language_updated_desc: "Server language has been changed to: **{language}**\n\nAll bot messages will now be displayed in this language.",
    prefix_updated_title: "✅ Prefix Updated!",
    prefix_updated_desc: "Server prefix has been changed to: **`{prefix}`**\n\nYou can now use commands like: `{prefix}help`, `{prefix}ping`\n\nNote: Slash commands (/) will always work regardless of the prefix!",
  },
};
