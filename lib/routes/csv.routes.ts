import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import type { RawCsvRecord, CsvPreviewResponse, CsvValidationResult } from '../types/index.js';

// 1. Configure Multer for In-Memory Storage (Vercel read-only filesystem)
// Using 4.5MB limit matches Vercel's serverless payload limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4.5 * 1024 * 1024 }
});

const router = Router();

/**
 * Parse CSV from buffer using csv-parse/sync (handles quotes, escaped chars, etc.)
 */
function parseCsvBuffer(buffer: Buffer): RawCsvRecord[] {
  const csvString = buffer.toString('utf-8');
  return parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  });
}

/**
 * Validate CSV records
 */
function validateCsv(records: RawCsvRecord[]): CsvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (records.length === 0) {
    errors.push('CSV is empty');
  }

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  if (headers.length === 0) {
    errors.push('CSV has no headers');
  }

  // Check for duplicate headers (case-insensitive)
  const seen = new Set<string>();
  for (const header of headers) {
    if (seen.has(header.toLowerCase())) {
      warnings.push(`Duplicate header: "${header}"`);
    }
    seen.add(header.toLowerCase());
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    headers,
    rowCount: records.length,
  };
}

/**
 * Get preview of CSV data
 */
function getPreview(records: RawCsvRecord[], count: number = 5): CsvPreviewResponse {
  return {
    headers: records.length > 0 ? Object.keys(records[0]) : [],
    previewData: records.slice(0, count),
    totalRows: records.length,
  };
}

/**
 * POST /api/v1/csv/preview
 * Preview CSV file (headers + first 5 rows)
 */
router.post('/preview', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // File is in memory buffer, parse it
    const records = parseCsvBuffer(req.file.buffer);

    const validationResult = validateCsv(records);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid CSV',
        details: validationResult.errors,
        warnings: validationResult.warnings
      });
    }

    const preview = getPreview(records, 5);

    return res.status(200).json({
      message: 'File parsed successfully',
      ...preview,
      warnings: validationResult.warnings,
    });

  } catch (error) {
    console.error('CSV Preview Error:', error);
    return res.status(500).json({ error: 'Failed to process the file.' });
  }
});

/**
 * POST /api/v1/csv/extract
 * Extract CRM leads from CSV (simplified for serverless)
 */
router.post('/extract', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Read CSV from memory buffer
    const records = parseCsvBuffer(req.file.buffer);
    const validationResult = validateCsv(records);

    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Invalid CSV',
        details: validationResult.errors,
        warnings: validationResult.warnings
      });
    }

    // For serverless, return preview and info - full AI extraction needs async job queue
    const preview = getPreview(records, 10);

    return res.status(200).json({
      message: 'File uploaded and parsed successfully',
      ...preview,
      warnings: validationResult.warnings,
      note: 'Full AI extraction requires async job processing. Use the backend server for extraction.',
    });
  } catch (error) {
    console.error('CSV Extract Error:', error);
    return res.status(500).json({ error: 'Failed to process the file.' });
  }
});

/**
 * GET /api/v1/csv/extract/:jobId/status
 * Job status - not implemented in serverless mode
 */
router.get('/extract/:jobId/status', (_req: Request, res: Response) => {
  return res.status(501).json({
    error: 'Job status not available in serverless mode',
    message: 'Use the full backend server for async extraction jobs'
  });
});

/**
 * GET /api/v1/csv/extract/:jobId/results
 * Job results - not implemented in serverless mode
 */
router.get('/extract/:jobId/results', (_req: Request, res: Response) => {
  return res.status(501).json({
    error: 'Job results not available in serverless mode',
    message: 'Use the full backend server for async extraction jobs'
  });
});

export default router;