import type { ParsedCSVData, PreviewResponse } from './crm';

export type { ParsedCSVData, PreviewResponse };

export interface CsvParseResult {
  data: ParsedCSVData;
  errors: string[];
}

export const CRM_STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'GOOD_LEAD_FOLLOW_UP', label: 'Good Lead - Follow Up', color: 'green' },
  { value: 'DID_NOT_CONNECT', label: 'Did Not Connect', color: 'yellow' },
  { value: 'BAD_LEAD', label: 'Bad Lead', color: 'red' },
  { value: 'SALE_DONE', label: 'Sale Done', color: 'green' },
];

export const DATA_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'leads_on_demand', label: 'Leads on Demand' },
  { value: 'meridian_tower', label: 'Meridian Tower' },
  { value: 'eden_park', label: 'Eden Park' },
  { value: 'varah_swamy', label: 'Varah Swamy' },
  { value: 'sarjapur_plots', label: 'Sarjapur Plots' },
];