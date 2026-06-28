import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config.js';

import authRoutes from './routes/auth.js';
import adminCandidates from './routes/adminCandidates.js';
import adminMockTests from './routes/adminMockTests.js';
import adminReview from './routes/adminReview.js';
import mockTests from './routes/mockTests.js';
import submissions from './routes/submissions.js';
import monitor from './routes/monitor.js';
import files from './routes/files.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Health check does not require the database.
  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // Data routes ensure the schema lazily (via db.query), so DB-free routes such
  // as admin code login work even before a database is configured.
  app.use('/api/auth', authRoutes);
  app.use('/api/admin/candidates', adminCandidates);
  app.use('/api/admin/mock-tests', adminMockTests);
  app.use('/api/admin/review', adminReview);
  app.use('/api/mock-tests', mockTests);
  app.use('/api/submissions', submissions);
  app.use('/api/monitor', monitor);
  app.use('/api/files', files);

  // Error handler.
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error('[api error]', err.message);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error.' });
  });

  // Serve the built client (local / non-Vercel hosting). On Vercel the static
  // files are served by the platform and only /api/* reaches this app.
  if (fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(config.clientDist, 'index.html'));
    });
  }

  return app;
}

export default createApp;
