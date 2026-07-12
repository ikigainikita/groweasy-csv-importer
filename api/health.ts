// api/health.ts - Health check endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './lib/server';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}