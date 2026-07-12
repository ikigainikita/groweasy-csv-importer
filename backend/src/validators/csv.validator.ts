// backend/src/validators/csv.validator.ts

import { z } from 'zod';

export const MAX_FILE_SIZE_MB = 50;
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
];

export const csvUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number().max(MAX_FILE_SIZE_MB * 1024 * 1024),
  buffer: z.instanceof(Buffer),
});

export function validateCsvFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Check mimetype
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size: ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Check file extension if available
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  if (ext && !['csv', 'txt'].includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension: .${ext}. Allowed: .csv, .txt`,
    };
  }

  return { valid: true };
}

export const extractionQuerySchema = z.object({
  provider: z.enum(['openai', 'gemini', 'claude', 'nvidia']).optional(),
  batchSize: z.coerce.number().int().positive().max(200).optional(),
  async: z.coerce.boolean().optional(),
});