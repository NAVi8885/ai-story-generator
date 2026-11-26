/**
 * Express Application Factory (MVC Composition Root)
 */

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';
import { presentJsonError } from './views/streamView.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
        return callback(new Error('Origin not allowed by CORS'));
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use('/api', apiRoutes);

  app.use((err, req, res, next) => {
    console.error('[Server Error Handler]', err);
    const status = err.status || err.statusCode || 500;
    presentJsonError(res, status, err.message || 'Internal server error');
  });

  return app;
}
