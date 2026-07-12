// backend/src/services/llm/post-process.ts

import type { CrmLead, CrmStatus, DataSource } from '../../types';

/**
 * Post-process extracted leads to ensure data quality
 */
export function postProcessLeads(leads: CrmLead[]): CrmLead[] {
  return leads
    .map(normalizeLead)
    .map(deduplicateContacts)
    .map(aggregateNotes)
    .filter(hasContactInfo);
}

function normalizeLead(lead: CrmLead): CrmLead {
  return {
    ...lead,
    // Ensure crm_status is valid
    crm_status: validateStatus(lead.crm_status),
    // Ensure data_source is valid
    data_source: validateSource(lead.data_source),
    // Normalize phone number
    mobile_without_country_code: normalizePhone(lead.mobile_without_country_code),
    // Normalize country code
    country_code: normalizeCountryCode(lead.country_code),
    // Normalize email
    email: normalizeEmail(lead.email),
    // Ensure dates are ISO format
    created_at: normalizeDate(lead.created_at),
  };
}

function validateStatus(status: string): CrmStatus {
  const valid: CrmStatus[] = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
  if (valid.includes(status as CrmStatus)) return status as CrmStatus;
  return 'BAD_LEAD';
}

function validateSource(source: string | null): DataSource {
  const valid: DataSource[] = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', null];
  if (valid.includes(source as DataSource)) return source as DataSource;
  return null;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digits
  return phone.replace(/\D/g, '');
}

function normalizeCountryCode(code: string | null): string | null {
  if (!code) return null;
  // Ensure it starts with +
  const cleaned = code.replace(/\D/g, '');
  return `+${cleaned}`;
}

function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

function normalizeDate(date: string): string {
  if (!date) return new Date().toISOString();
  try {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  } catch {}
  return new Date().toISOString();
}

function deduplicateContacts(lead: CrmLead): CrmLead {
  // If multiple emails in crm_note, they should already be there
  // This is a placeholder for future enhancement
  return lead;
}

function aggregateNotes(lead: CrmLead): CrmLead {
  const notes: string[] = [];

  if (lead.crm_note) notes.push(lead.crm_note);
  if (lead.description) notes.push(lead.description);

  return {
    ...lead,
    crm_note: notes.length > 0 ? notes.join('; ') : null,
    description: null, // Merge into crm_note
  };
}

function hasContactInfo(lead: CrmLead): boolean {
  // Drop records missing BOTH email and mobile
  return !!(lead.email || lead.mobile_without_country_code);
}