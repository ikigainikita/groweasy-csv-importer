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
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CrmStatus | null;
  crm_note: string | null;
  data_source: DataSource;
  possession_time: string | null;
  description: string | null;
}

export interface ParsedCSVData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface PreviewResponse {
  headers: string[];
  previewData: Record<string, string>[];
  totalRows: number;
  warnings?: string[];
  message?: string;
}

export interface ExtractSyncResponse {
  message: string;
  leads: CrmLead[];
  stats: {
    totalInput: number;
    totalExtracted: number;
    filteredNoContact: number;
    failedBatches: number;
  };
}

export interface ExtractAsyncResponse {
  jobId: string;
  status: 'pending';
  message: string;
  totalRecords: number;
}

export type ExtractResponse = ExtractSyncResponse | ExtractAsyncResponse;

export interface JobStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface JobResultsResponse {
  jobId: string;
  leads: CrmLead[];
  stats: {
    totalInput: number;
    totalExtracted: number;
    filteredNoContact: number;
    failedBatches: number;
  };
}