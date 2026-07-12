// backend/src/controllers/csv.controller.ts

import { Request, Response } from 'express';
import multer from 'multer';
import { csvService, CsvParseError } from '../services/csv.service';
import { validateCsvFile, extractionQuerySchema } from '../validators/csv.validator';
import { createExtractionService, ExtractionServiceOptions } from '../services/llm/extraction.service';
import { jobService } from '../services/job.service';
import { config } from '../config';
import type { RawCsvRecord, ExtractionResult } from '../types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const previewCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const validation = validateCsvFile(req.file);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const records = csvService.parseCsv(req.file.buffer);
    const validationResult = csvService.validateCsv(records);
    if (!validationResult.valid) {
      res.status(400).json({ error: 'Invalid CSV', details: validationResult.errors, warnings: validationResult.warnings });
      return;
    }

    const preview = csvService.getPreview(records, 5);

    res.status(200).json({
      message: 'File parsed successfully',
      ...preview,
      warnings: validationResult.warnings,
    });
  } catch (error) {
    console.error('CSV Preview Error:', error);
    if (error instanceof CsvParseError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to parse CSV file' });
    }
  }
};

export const extractLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const validation = validateCsvFile(req.file);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { provider, async: asyncMode, batchSize } = extractionQuerySchema.parse(req.query);
    const isAsync = asyncMode || req.file.size > 1024 * 1024;

    const records = csvService.parseCsv(req.file.buffer);
    const validationResult = csvService.validateCsv(records);

    if (!validationResult.valid) {
      res.status(400).json({ error: 'Invalid CSV', details: validationResult.errors });
      return;
    }

    if (records.length === 0) {
      res.status(400).json({ error: 'CSV contains no data rows' });
      return;
    }

    if (isAsync) {
      const job = jobService.createJob(records.length);

      res.status(202).json({
        jobId: job.id,
        status: 'pending',
        message: 'Extraction started. Poll /extract/:jobId/status for progress.',
        totalRecords: records.length,
      });

      processExtractionJob(job.id, records, validationResult.headers, {
        provider,
        batchSize: batchSize || config.batchSize,
        onProgress: (progress) => {
          jobService.updateJob(job.id, {
            status: 'processing',
            processedRecords: progress.processedRecords,
            progress: progress.percentage,
          });
        },
      }).catch((error) => {
        console.error(`Job ${job.id} failed:`, error);
        jobService.updateJob(job.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

      return;
    }

    const extractionService = createExtractionService({
      provider,
      batchSize: batchSize || config.batchSize,
    });

    const result = await extractionService.extractLeads(records, validationResult.headers);

    res.status(200).json({ message: 'Extraction completed', ...result });
  } catch (error) {
    console.error('Extraction Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Extraction failed' });
  }
};

export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = jobService.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.status(200).json(job);
  } catch (error) {
    console.error('Get Job Status Error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
};

export const getJobResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const job = jobService.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.status !== 'completed') {
      res.status(400).json({ error: 'Job not completed', status: job.status, progress: job.progress });
      return;
    }

    const results = jobService.getResults(jobId);
    if (!results) {
      res.status(404).json({ error: 'Results not found' });
      return;
    }

    res.status(200).json({ jobId, ...results });
  } catch (error) {
    console.error('Get Job Results Error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
};

async function processExtractionJob(
  jobId: string,
  records: RawCsvRecord[],
  headers: string[],
  options: ExtractionServiceOptions
): Promise<void> {
  const extractionService = createExtractionService(options);

 try {
  const result: ExtractionResult = await extractionService.extractLeads(records, headers);

  // Call setResults instead of updateJob! 
  // It handles the status, progress, and results all at once.
  jobService.setResults(jobId, result);
  
} catch (error) {
  jobService.updateJob(jobId, { 
    status: 'failed', 
    error: error instanceof Error ? error.message : 'Unknown error' 
  });
  throw error;
}
  } 


export { upload };