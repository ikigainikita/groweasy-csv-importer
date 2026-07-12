// backend/src/middleware/asyncHandler.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };