const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.query(`
  SELECT u.username, u.discord_id,
         ot.updated_at as token_updated,
         ot.token_expires_at
  FROM users u
  LEFT JOIN oauth_tokens ot ON u.id = ot.user_id
  ORDER BY u.updated_at DESC
  LIMIT 3
`)
  .then(result => {
    console.log('Users with OAuth tokens:');
    console.log(JSON.stringify(result.rows, null, 2));
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    pool.end();
  });
