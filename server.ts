import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { initSchemaAndSeed } from './server/seed.js';
import authRoutes from './server/routes/auth.js';
import libraryRoutes from './server/routes/library.js';
import contentRoutes from './server/routes/content.js';
import insightsRoutes from './server/routes/insights.js';
import feedbackRoutes from './server/routes/feedback.js';
import healthRoutes from './server/routes/health.js';
import uploadRoutes from './server/routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize SQLite database & seed data
  await initSchemaAndSeed();

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Serve static uploads
  app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/insights', insightsRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/upload', uploadRoutes);

  // Vite development middleware or static production serve
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[InkCheck] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[InkCheck] Failed to start server:', err);
  process.exit(1);
});
