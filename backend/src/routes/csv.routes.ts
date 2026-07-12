// backend/src/routes/csv.routes.ts

import { Router } from 'express';
import { upload, previewCsv, extractLeads, getJobStatus, getJobResults } from '../controllers/csv.controller';

const router = Router();

/**
 * @route POST /api/v1/csv/preview
 * @description Preview CSV file (headers + first 5 rows)
 * @access Public
 */
router.post('/preview', upload.single('file'), previewCsv);

/**
 * @route POST /api/v1/csv/extract
 * @description Extract CRM leads from CSV using AI
 * @queryprovider - LLM provider (openai|gemini|claude)
 * @query async - Force async mode (auto for large files)
 * @query batchSize - Custom batch size
 * @access Public
 */
router.post('/extract', upload.single('file'), extractLeads);

/**
 * @route GET /api/v1/csv/extract/:jobId/status
 * @description Get extraction job status
 * @access Public
 */
router.get('/extract/:jobId/status', getJobStatus);

/**
 * @route GET /api/v1/csv/extract/:jobId/results
 * @description Get extraction job results
 * @access Public
 */
router.get('/extract/:jobId/results', getJobResults);

export default router;