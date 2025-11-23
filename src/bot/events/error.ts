/**
 * Bot Error Event
 * Handles Discord client errors
 */

export default {
  name: 'error',
  execute(error: Error) {
    console.error('\x1b[31m❌ Discord client error:\x1b[0m');
    console.error(error);
  },
};
