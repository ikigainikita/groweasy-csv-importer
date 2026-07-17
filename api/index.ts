// api/index.ts - Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../lib/server.js';

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
