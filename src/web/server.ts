/**
 * WhiteCat Bot Web Server
 * Express server for OAuth2 and dashboard
 */

import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { authRouter } from './routes/auth';
import { homeRouter } from './routes/home';
import { apiRouter } from './routes/api';

const app = express();
const PORT = process.env.WEB_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'whitecat-bot-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup (using HTML)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', (filePath, options, callback) => {
  const fs = require('fs');
  fs.readFile(filePath, 'utf-8', (err: any, content: string) => {
    if (err) return callback(err);

    // Simple template rendering - only replace primitive values
    let rendered = content;
    for (const [key, value] of Object.entries(options)) {
      // Only replace if value is a primitive (string, number, boolean)
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }

    callback(null, rendered);
  });
});

// Routes
app.use('/', homeRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[WEB] Error:', err);
  res.status(500).send('Internal Server Error');
});

/**
 * Start the web server
 */
export function startWebServer() {
  app.listen(PORT, () => {
    console.log(`\x1b[36m[WEB] Server running on http://localhost:${PORT}\x1b[0m`);
  });
}

export { app };
