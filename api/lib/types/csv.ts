// backend/src/types/csv.ts

export interface RawCsvRecord {
  [column: string]: string;
}

export interface CsvPreviewResponse {
  headers: string[];
  previewData: RawCsvRecord[];
  totalRows: number;
}

export interface CsvValidationResult {
  valid: boolean;
  errors: string[];
  headers: string[];
  rowCount: number;
}

export interface ExtractionRequest {
  records: RawCsvRecord[];
  headers: string[];
  provider?: string;
}

export interface ExtractionResponse {
  leads: CrmLead[];
  processedCount: number;
  failedCount: number;
  errors: string[];
}

export interface BatchProcessResult {
  success: boolean;
  leads: CrmLead[];
  totalRecords: number;
  processedBatches: number;
  failedBatches: number;
  errors: BatchError[];
  durationMs: number;
}

export interface BatchError {
  batchIndex: number;
  error: string;
  recordCount: number;
}

// Import types from index to avoid circular deps
import type { CrmLead } from './index';