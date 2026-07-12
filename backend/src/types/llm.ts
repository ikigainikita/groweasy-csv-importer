// backend/src/types/llm.ts

export type LlmProvider = 'openai' | 'gemini' | 'claude'| 'nvidia';

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  batchSize: number;
  maxConcurrentBatches: number;
  maxRetries: number;
  requestTimeoutMs: number;
  retryBaseDelayMs: number;
}

export interface BatchRequest {
  records: RawRecord[];
  headers: string[];
  schema: object;
}

export interface BatchResponse {
  leads: CrmLead[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type RawRecord = Record<string, string>;

export interface ExtractionProgress {
  totalBatches: number;
  completedBatches: number;
  currentBatch: number;
  totalRecords: number;
  processedRecords: number;
  percentage: number;
  error?: string;
}

export interface JsonSchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: (string | number)[];
  format?: string;
  pattern?: string;
  additionalProperties?: boolean;
  nullable?: boolean;
  description?: string;
  [key: string]: unknown;
}

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

export interface LlmProviderInterface {
  extractLeads(records: RawRecord[], headers: string[]): Promise<CrmLead[]>;
  createSchema(): JsonSchema;
  createBatches(records: RawRecord[], batchSize: number): RawRecord[][];
}

// Re-export from main types for extraction service
export type { ExtractionResult } from '../types';