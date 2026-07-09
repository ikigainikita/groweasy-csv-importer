export interface ParsedCSVData {
  headers: string[]
  rows: string[][]
  totalRows: number
  encoding?: string
  delimiter?: string
}

export interface DataPreviewRow {
  [key: string]: string
}

export interface CRMRecord {
  created_at: string
  name: string
  email: string
  country_code: string
  mobile_without_country_code: string
  company: string
  city: string
  state: string
  country: string
  lead_owner: string
  crm_status: CRMStatus
  crm_note: string
  data_source: DataSource | null
  possession_time: string
  description: string
}

export type CRMStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE'

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots'

export type CRMField =
  | 'created_at'
  | 'name'
  | 'email'
  | 'country_code'
  | 'mobile_without_country_code'
  | 'company'
  | 'city'
  | 'state'
  | 'country'
  | 'lead_owner'
  | 'crm_status'
  | 'crm_note'
  | 'data_source'
  | 'possession_time'
  | 'description'

export interface ColumnMapping {
  [csvHeader: string]: CRMField
}

export interface ImportProgress {
  status: 'idle' | 'processing' | 'complete' | 'error'
  progress: number
  currentBatch: number
  totalBatches: number
  processedRecords: number
  totalRecords: number
  error?: string
}

export interface ImportResult {
  successful: number
  failed: number
  total: number
  warnings: ImportWarning[]
  errors: ImportError[]
  records: CRMRecord[]
  statusDistribution: Record<CRMStatus, number>
}

export interface ImportWarning {
  row: number
  field: string
  message: string
  originalValue: string
}

export interface ImportError {
  row: number
  message: string
  rawData: string[]
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}