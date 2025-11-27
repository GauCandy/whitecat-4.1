/**
 * Web Server Entry Point
 * Starts the Express web server
 */

import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import { startWebServer } from './server';

// Start web server
startWebServer();
