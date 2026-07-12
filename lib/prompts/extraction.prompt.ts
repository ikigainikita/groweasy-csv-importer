// backend/src/prompts/extraction.prompt.ts

import type { JsonSchema } from '../types/llm';

export const SYSTEM_PROMPT = `You are an expert data extraction assistant for a real estate CRM system (GrowEasy).

Your task: Map unstructured CSV data rows to a strict CRM lead schema.

## Target CRM Schema (CrmLead)

Every output object MUST conform to this exact JSON structure:

{
  "created_at": "string (ISO-8601 date, e.g., 2024-01-15 or 2024-01-15T10:30:00Z)",
  "name": "string or null",
  "email": "string or null",
  "country_code": "string or null (e.g., +91, +1)",
  "mobile_without_country_code": "string or null (digits only, no spaces/dashes)",
  "company": "string or null",
  "city": "string or null",
  "state": "string or null",
  "country": "string or null",
  "lead_owner": "string or null (email or name)",
  "crm_status": "string (EXACTLY one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE)",
  "crm_note": "string or null (overflow field for extra data)",
  "data_source": "string or null (EXACTLY one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots)",
  "possession_time": "string or null",
  "description": "string or null"
}

## Extraction Rules

1. **Fuzzy Column Mapping**: Input CSV columns will have arbitrary names. Map them intelligently:
   - "Name", "Lead Name", "Full Name", "Client" → name
   - "Email", "Email Address", "Mail", "E-mail" → email
   - "Phone", "Mobile", "Phone Number", "Contact", "Mobile No" → mobile_without_country_code (extract country code separately if present)
   - "Company", "Organization", "Firm" → company
   - "City", "Town" → city
   - "State", "Province", "Region" → state
   - "Country", "Nation" → country
   - "Owner", "Assigned To", "Sales Rep", "Agent" → lead_owner
   - "Status", "Lead Status", "Stage" → crm_status
   - "Notes", "Remarks", "Comments", "Description" → crm_note / description
   - "Source", "Lead Source", "Origin" → data_source
   - "Created", "Date", "Lead Date", "Entry Date" → created_at
   - "Possession", "Possession Time", "Handover" → possession_time

2. **crm_status Mapping** (must be EXACT enum value):
   - "Interested", "Hot", "Warm", "Follow Up", "Call Back" → GOOD_LEAD_FOLLOW_UP
   - "Not Connected", "No Answer", "Busy", "Switched Off", "DNC" → DID_NOT_CONNECT
   - "Not Interested", "Invalid", "Wrong Number", "Spam", "Junk" → BAD_LEAD
   - "Converted", "Sold", "Closed", "Deal Done", "Sale Done" → SALE_DONE
   - Unknown/unmappable → BAD_LEAD (default)

3. **data_source Mapping** (must be EXACT enum value or null):
   - Match case-insensitively to: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots
   - Unknown → null

4. **Phone Number Parsing**:
   - Extract country code (e.g., +91, 91, 0091 → "+91")
   - Extract national number (digits only)
   - If no country code detected, default to "+91" for Indian numbers starting with 6-9

5. **Multiple Emails/Phones**:
   - FIRST email → email field
   - Additional emails → append to crm_note with label "Extra Email: ..."
   - FIRST phone → mobile_without_country_code + country_code
   - Additional phones → append to crm_note with label "Extra Phone: ..."

6. **Date Parsing**:
   - Accept flexible formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.
   - Output as ISO-8601 (YYYY-MM-DD)
   - If unparseable, set to null

7. **Required Output Fields**:
   - All fields must be present in output
   - Use null for missing/unmappable data
   - crm_status is REQUIRED (never null) - default to BAD_LEAD

8. **Record Filtering** (post-processing will filter):
   - Records missing BOTH email AND mobile will be dropped later
   - Still extract all other fields for them

9. **crm_note Aggregation**:
   - Concatenate: extra emails, extra phones, original notes, unmapped columns
   - Format: "Extra Email: x@y.com; Extra Phone: +91xxxxxxxxxx; Original Note: ...; Unmapped: col1=val1, col2=val2"`;

export function buildUserPrompt(records: Record<string, string>[], headers: string[]): string {
  const recordJson = JSON.stringify(records, null, 2);

  return `Extract CRM leads from the following CSV records.

CSV Headers: ${headers.join(', ')}

Records:
${recordJson}

Return a JSON object containing a single "leads" array. This array MUST contain all the extracted CrmLead objects for every record provided. Do not skip any records.`;
}

export const CRM_LEAD_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    created_at: { type: 'string', format: 'date-time', description: 'Lead creation date in ISO-8601 format' },
    name: { type: 'string', nullable: true, description: 'Lead full name' },
    email: { type: 'string', format: 'email', nullable: true, description: 'Primary email address' },
    country_code: { type: 'string', nullable: true, pattern: '^\\+?[1-9]\\d{0,3}$', description: 'Country calling code (e.g., +91)' },
    mobile_without_country_code: { type: 'string', nullable: true, pattern: '^\\d{6,15}$', description: 'Mobile number without country code' },
    company: { type: 'string', nullable: true, description: 'Company/organization name' },
    city: { type: 'string', nullable: true, description: 'City' },
    state: { type: 'string', nullable: true, description: 'State/province' },
    country: { type: 'string', nullable: true, description: 'Country' },
    lead_owner: { type: 'string', nullable: true, description: 'Lead owner email or name' },
    crm_status: { type: 'string', enum: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'], description: 'CRM lead status (must be exact enum value)' },
    crm_note: { type: 'string', nullable: true, description: 'Overflow field for extra emails, phones, notes, unmapped data' },
    data_source: { type: 'string', nullable: true, enum: ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'], description: 'Lead source (must be exact enum value or null)' },
    possession_time: { type: 'string', nullable: true, description: 'Property possession time' },
    description: { type: 'string', nullable: true, description: 'Additional description' },
  },
  required: [
    'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
    'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
    'crm_note', 'data_source', 'possession_time', 'description',
  ],
  additionalProperties: false,
};
export const CRM_LEADS_BATCH_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    leads: {
      type: 'array',
      items: CRM_LEAD_JSON_SCHEMA,
      description: 'An array containing all the extracted CRM leads from the batch.'
    }
  },
  required: ['leads'],
  additionalProperties: false,
};

export const OPENAI_FUNCTION_SCHEMA = {
  name: 'extract_crm_leads',
  description: 'Extract an array of CRM leads from a batch of CSV records',
  strict: true,
  schema: CRM_LEADS_BATCH_SCHEMA, // <-- Point to the new wrapper!
};

export const GEMINI_SCHEMA = CRM_LEAD_JSON_SCHEMA;