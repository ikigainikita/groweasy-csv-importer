// backend/src/types/index.ts

export type CrmStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots'
  | null;

export interface CrmLead {
  created_at: string;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CrmStatus;
  crm_note: string | null;
  data_source: DataSource;
  possession_time: string | null;
  description: string | null;
}

// CSV Types
export type RawCsvRecord = Record<string, string>;

export interface CsvPreviewResponse {
  headers: string[];
  previewData: RawCsvRecord[];
  totalRows: number;
}

export interface CsvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  headers: string[];
  rowCount: number;
}

// Job & Extraction Types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExtractionJob {
  id: string;
  status: JobStatus;
  totalRecords: number;
  processedRecords: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ExtractionResult {
  leads: CrmLead[];
  stats: {
    totalInput: number;
    totalExtracted: number;
    filteredNoContact: number;
    failedBatches: number;
  };
}

export interface BatchResult {
  batchIndex: number;
  leads: CrmLead[];
  errors: string[];
  processingTimeMs: number;
}

export interface ProcessedBatchJob {
  jobId: string;
  status: JobStatus;
  progress: number;
  results?: ExtractionResult;
  error?: string;
}

// Re-export LLM types
export * from './llm';
export * from './csv';