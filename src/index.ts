/**
 * WhiteCat Bot - Main Entry Point
 * Version 4.1
 * Starts both Discord Bot and Web Server
 */

import { spawn } from 'child_process';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
} as const;

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

log('\n==========================================', colors.cyan);
log('WhiteCat Bot v4.1 - Starting All Services', colors.cyan);
log('==========================================\n', colors.cyan);

// Start bot process
const botProcess = spawn('node', [path.join(__dirname, 'bot', 'index.js')], {
  stdio: 'inherit',
  shell: true,
});

// Start web process
const webProcess = spawn('node', [path.join(__dirname, 'web', 'index.js')], {
  stdio: 'inherit',
  shell: true,
});

// Handle bot process events
botProcess.on('error', (error) => {
  log('❌ Bot process error:', colors.red);
  console.error(error);
});

botProcess.on('exit', (code) => {
  if (code !== 0) {
    log(`❌ Bot process exited with code ${code}`, colors.red);
  }
});

// Handle web process events
webProcess.on('error', (error) => {
  log('❌ Web process error:', colors.red);
  console.error(error);
});

webProcess.on('exit', (code) => {
  if (code !== 0) {
    log(`❌ Web process exited with code ${code}`, colors.red);
  }
});

// Graceful shutdown
function shutdown(signal: string) {
  log(`\n${signal} received, shutting down all services...`, colors.yellow);

  botProcess.kill();
  webProcess.kill();

  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
