/**
 * Home Routes
 * Main landing page
 */

import { Router } from 'express';
import path from 'path';
import pool from '../../db/pool';

const router = Router();

// Home page
router.get('/', (req, res) => {
  res.render('index.html', {
    CLIENT_ID: process.env.CLIENT_ID || '',
  });
});

// Login page - check session in database
router.get('/login', async (req, res) => {
  try {
    // Check if user has session cookie
    const sessionToken = req.cookies?.session_token;

    if (sessionToken) {
      // Check if session exists in database and is valid
      const result = await pool.query(
        `SELECT ws.*, u.username, u.discord_id, u.avatar
         FROM web_sessions ws
         JOIN users u ON ws.user_id = u.id
         WHERE ws.session_token = $1 AND ws.expires_at > CURRENT_TIMESTAMP`,
        [sessionToken]
      );

      if (result.rows.length > 0) {
        // Session is valid, redirect to dashboard
        return res.redirect('/dashboard');
      }
    }

    // No valid session, show login page
    res.render('login.html', {
      CLIENT_ID: process.env.CLIENT_ID || '',
    });
  } catch (error) {
    console.error('[LOGIN] Error checking session:', error);
    res.render('login.html', {
      CLIENT_ID: process.env.CLIENT_ID || '',
    });
  }
});

// Dashboard (placeholder)
router.get('/dashboard', async (req, res) => {
  try {
    const sessionToken = req.cookies?.session_token;

    if (!sessionToken) {
      return res.redirect('/login');
    }

    // Get user from session
    const result = await pool.query(
      `SELECT u.username, u.discord_id, u.avatar, u.id
       FROM web_sessions ws
       JOIN users u ON ws.user_id = u.id
       WHERE ws.session_token = $1 AND ws.expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (result.rows.length === 0) {
      return res.redirect('/login');
    }

    const user = result.rows[0];

    res.render('dashboard.html', {
      username: user.username,
      avatar: user.avatar,
      discriminator: '0',
      id: user.discord_id,
    });
  } catch (error) {
    console.error('[DASHBOARD] Error:', error);
    res.redirect('/login');
  }
});

export { router as homeRouter };
