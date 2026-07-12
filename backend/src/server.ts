// backend/src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import csvRoutes from './routes/csv.routes';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    provider: config.llmProvider,
  });
});

app.use('/api/v1/csv', csvRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

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

export default app;