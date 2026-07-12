// api/lib/server.ts - Express app factory for Vercel serverless function

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import csvRoutes from './routes/csv.routes';

export function createApp() {
  const app = express();

  // Trust proxy for Vercel
  app.set('trust proxy', true);

  // Middleware
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      provider: config.llmProvider,
    });
  });

  // API routes
  app.use('/api/v1/csv', csvRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// For local development only
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const app = createApp();
  const startServer = (): void => {
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📚 Health check: http://localhost:${config.port}/health`);
      console.log(`📝 CSV Preview: POST http://localhost:${config.port}/api/v1/csv/preview`);
      console.log(`🤖 CSV Extract: POST http://localhost:${config.port}/api/v1/csv/extract`);
      console.log(`⚙️  Environment: ${config.nodeEnv}`);
      console.log(`🤖 LLM Provider: ${config.llmProvider}`);
    });
  };

  process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
  });

  startServer();
}

export default createApp();