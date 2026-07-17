import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import csvRoutes from './routes/csv.routes.js';

export function createApp() {
  const app = express();

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.use(cors({ origin: corsOrigin, credentials: true }));

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      env: process.env.NODE_ENV || 'development',
    });
  });

  // CSV routes with multer.memoryStorage() for Vercel compatibility
  app.use('/api/v1/csv', csvRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

export default createApp;