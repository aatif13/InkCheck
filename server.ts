import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

  // Render sets RENDER=true, so production is detected even if NODE_ENV is missing
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

  const uploadsDir = path.resolve(__dirname, 'uploads');
  const distDir = path.resolve(__dirname, 'dist');
  fs.mkdirSync(uploadsDir, { recursive: true });

  // Initialize database & seed data
  await initSchemaAndSeed();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Serve static uploads
  app.use('/uploads', express.static(uploadsDir));

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/insights', insightsRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/upload', uploadRoutes);

  // Unknown /api routes return JSON 404, never the HTML page
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (!isProduction) {
    // Dynamic import: vite is a devDependency and may not exist in production
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const indexHtml = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      console.error(
        `[InkCheck] ${indexHtml} not found. Run "npm run build" before starting.`
      );
    }
    app.use(express.static(distDir));
    // Works on Express 4 and 5 (no '*' path pattern)
    app.use((req: Request, res: Response) => {
      if (req.method !== 'GET') return res.status(404).end();
      res.sendFile(indexHtml);
    });
  }

  // Last-resort error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[InkCheck] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[InkCheck] Server running at http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`
    );
  });
}

startServer().catch((err) => {
  console.error('[InkCheck] Failed to start server:', err);
  process.exit(1);
});