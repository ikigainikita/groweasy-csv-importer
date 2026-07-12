// backend/src/services/llm/gemini.provider.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LlmConfig, RawRecord, BatchResponse, CrmLead } from '../../types/llm';
import { SYSTEM_PROMPT } from '../../prompts/extraction.prompt';

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);

    this.model = this.genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: this.getGeminiSchema() as any,
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    });
  }

  private getGeminiSchema() {
    return {
      type: 'object',
      properties: {
        leads: {
          type: 'array',
          items: this.getLeadSchema(),
        },
      },
      required: ['leads'],
    };
  }

  private getLeadSchema() {
    return {
      type: 'object',
      properties: {
        created_at: { type: 'string', format: 'date-time' },
        name: { type: 'string', nullable: true },
        email: { type: 'string', nullable: true },
        country_code: { type: 'string', nullable: true },
        mobile_without_country_code: { type: 'string', nullable: true },
        company: { type: 'string', nullable: true },
        city: { type: 'string', nullable: true },
        state: { type: 'string', nullable: true },
        country: { type: 'string', nullable: true },
        lead_owner: { type: 'string', nullable: true },
        crm_status: { type: 'string', enum: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'] },
        crm_note: { type: 'string', nullable: true },
        data_source: { type: 'string', nullable: true, enum: ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'] },
        possession_time: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
      },
      required: [
        'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
        'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
        'crm_note', 'data_source', 'possession_time', 'description',
      ],
    };
  }

  createBatches(records: RawRecord[], batchSize: number): RawRecord[][] {
    const batches: RawRecord[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  createSchema(): object {
    return this.getGeminiSchema();
  }

  async extractLeads(records: RawRecord[], headers: string[]): Promise<CrmLead[]> {
    const batches = this.createBatches(records, this.config.batchSize);
    const allLeads: CrmLead[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const batchResult = await this.callApi(batch, headers);
        allLeads.push(...batchResult.leads);
      } catch (error) {
        console.error(`Batch ${i + 1}/${batches.length} failed:`, error);
        throw error;
      }
    }

    return allLeads;
  }

  async callApi(batch: RawRecord[], headers: string[]): Promise<BatchResponse> {
    const userPrompt = this.buildUserPrompt(batch, headers);

    const chatSession = this.model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I will extract CRM leads from the provided records.' }] },
      ],
    });

    const result = await chatSession.sendMessage(userPrompt);
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('Gemini returned empty response');
    }

    const parsed = JSON.parse(responseText);

    return {
      leads: this.validateAndNormalizeLeads(parsed.leads || []),
      usage: result.response.usageMetadata
        ? {
            promptTokens: result.response.usageMetadata.promptTokenCount || 0,
            completionTokens: result.response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: result.response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }

  private validateAndNormalizeLeads(leads: unknown[]): CrmLead[] {
    return leads.map((lead) => this.normalizeLead(lead as Record<string, unknown>));
  }

  private normalizeLead(lead: Record<string, unknown>): CrmLead {
    return {
      created_at: this.ensureString(lead.created_at) || '',
      name: this.ensureNullableString(lead.name),
      email: this.ensureNullableString(lead.email),
      country_code: this.ensureNullableString(lead.country_code),
      mobile_without_country_code: this.ensureNullableString(lead.mobile_without_country_code),
      company: this.ensureNullableString(lead.company),
      city: this.ensureNullableString(lead.city),
      state: this.ensureNullableString(lead.state),
      country: this.ensureNullableString(lead.country),
      lead_owner: this.ensureNullableString(lead.lead_owner),
      crm_status: this.ensureValidStatus(lead.crm_status),
      crm_note: this.ensureNullableString(lead.crm_note),
      data_source: this.ensureValidSource(lead.data_source),
      possession_time: this.ensureNullableString(lead.possession_time),
      description: this.ensureNullableString(lead.description),
    };
  }

  private ensureString(value: unknown): string {
    return typeof value === 'string' ? value : String(value ?? '');
  }

  private ensureNullableString(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value : String(value);
  }

  private ensureValidStatus(value: unknown): 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' {
    const valid = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
    if (typeof value === 'string' && valid.includes(value)) return value as any;
    return 'BAD_LEAD';
  }

  private ensureValidSource(value: unknown): 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | null {
    const valid = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && valid.includes(value)) return value as any;
    return null;
  }

  private buildUserPrompt(batch: RawRecord[], headers: string[]): string {
    const recordsJson = JSON.stringify(batch, null, 2);
    return `Extract CRM leads from the following CSV records.

CSV Headers: ${headers.join(', ')}

Records:
${recordsJson}

Rules:
1. Map each record to the CrmLead schema
2. Infer dates to ISO-8601 format
3. Extract country code from phone numbers (e.g., +91XXXXXXXXXX -> country_code: "+91", mobile: "XXXXXXXXXX")
4. For multiple emails/phones: first goes to dedicated field, rest to crm_note
5. Map fuzzy status values to EXACT enum: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE
6. Map fuzzy source values to EXACT enum: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or null
7. If a field cannot be determined, use null
8. Return ONLY the JSON object with "leads" array`;
  }
}