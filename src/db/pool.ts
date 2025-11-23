/**
 * Database Connection Pool
 * Shared PostgreSQL connection pool for WhiteCat Bot
 */

import dotenv from 'dotenv';
import { Pool, PoolConfig } from 'pg';

dotenv.config();

// Pool configuration from environment variables
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(poolConfig);

// Pool error handler
pool.on('error', (err) => {
  console.error('\x1b[31m❌ Database pool error:\x1b[0m', err);
  process.exit(-1);
});

/**
 * Execute a query using the connection pool
 * @param text SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function query(text: string, params?: any[]) {
  return await pool.query(text, params);
}

/**
 * Get a client from the pool
 * @returns Pool client
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Close the database pool
 */
export async function close() {
  await pool.end();
}

// Export pool instance
export default pool;
