// backend/src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class CsvParseError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class LlmError extends AppError {
  public readonly provider: string;
  public readonly retryable: boolean;

  constructor(message: string, provider: string, statusCode: number = 502, retryable: boolean = false) {
    super(message, statusCode);
    this.provider = provider;
    this.retryable = retryable;
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded. Please try again later.') {
    super(message, 429, true);
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`❌ Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.name,
      ...(err instanceof LlmError && { provider: err.provider, retryable: err.retryable }),
    });
    return;
  }

  if (err.name === 'ZodError') {
    const zodError = err as any;
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: zodError.errors,
    });
    return;
  }

  if (err.name === 'MulterError') {
    if (err.message.includes('File too large')) {
      res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  const message = config.nodeEnv === 'production' ? 'Internal server error' : err.message;

  res.status(500).json({
    error: message,
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
}