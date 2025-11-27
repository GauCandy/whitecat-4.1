/**
 * API Routes
 * Public API endpoints
 */

import { Router } from 'express';
import { client } from '../../bot/client';

const router = Router();

// Bot stats endpoint
router.get('/stats', (req, res) => {
  try {
    const stats = {
      servers: client.guilds.cache.size || 0,
      users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0) || 0,
      uptime: process.uptime(),
    };

    res.json(stats);
  } catch (error) {
    console.error('[API] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export { router as apiRouter };
