/**
 * English Language Pack
 */

export default {
  // Common
  common: {
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    unknown: 'Unknown',
  },

  // Bot startup messages
  startup: {
    database_connecting: 'Testing database connection...',
    database_connected: 'Database connected successfully!',
    database_checking_tables: 'Checking bot tables...',
    database_tables_found: 'Found {count}/15 bot tables',
    database_no_tables: 'No bot tables found! Please run: npm run db:init',
    discord_initializing: 'Initializing Discord bot...',
    discord_loading_events: 'Loading Discord events...',
    discord_event_loaded: 'Loaded event: {name}',
    discord_events_loaded: 'Loaded {count} events',
    discord_connecting: 'Connecting to Discord...',
    discord_no_token: 'DISCORD_TOKEN not found in .env file',
    bot_ready: 'WhiteCat Bot is ready!',
    bot_failed: 'Failed to start WhiteCat Bot',
  },

  // Discord bot info
  bot: {
    logged_in: 'Discord bot logged in as: {tag}',
    bot_id: 'Bot ID: {id}',
    guilds: 'Guilds: {count}',
    users: 'Users: {count}',
  },

  // Economy system
  economy: {
    balance: 'Your balance',
    currency: 'Currency',
    coins: 'WhiteCat Coins',
    transaction_success: 'Transaction completed successfully',
    insufficient_funds: 'Insufficient funds',
  },

  // Giveaway system
  giveaway: {
    title: 'Giveaway',
    prize: 'Prize',
    winners: 'Winners',
    entries: 'Entries',
    ends_at: 'Ends at',
    ended: 'Ended',
    participate: 'Click to participate',
    winner_announced: 'Winner: {user}',
  },

  // Errors
  error: {
    unknown: 'An unknown error occurred',
    database_connection: 'Cannot connect to database',
    discord_connection: 'Cannot connect to Discord',
    permission_denied: 'You do not have permission to use this command',
    command_not_found: 'Command not found',
    invalid_arguments: 'Invalid arguments',
    guild_only: 'This command can only be used in servers',
  },

  // Commands - General
  commands: {
    ping: {
      name: 'ping',
      description: 'Check bot latency',
      reply: 'Pong! Latency: {latency}ms',
    },
    help: {
      name: 'help',
      description: 'Show all available commands',
    },
  },

  // Commands - Economy
  economy_commands: {
    balance: {
      name: 'balance',
      description: 'Check your balance',
      user_option: 'User to check balance',
      your_balance: 'Your balance',
      user_balance: '{user}\'s balance',
    },
    daily: {
      name: 'daily',
      description: 'Claim your daily reward',
      claimed: 'You claimed {amount} coins!',
      already_claimed: 'You already claimed today. Come back in {hours}h {minutes}m',
    },
  },
};
