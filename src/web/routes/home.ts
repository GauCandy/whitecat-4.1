/**
 * Home Routes
 * Main landing page
 */

import { Router } from 'express';
import path from 'path';

const router = Router();

// Home page
router.get('/', (req, res) => {
  res.render('index.html', {
    CLIENT_ID: process.env.CLIENT_ID || '',
  });
});

export { router as homeRouter };
