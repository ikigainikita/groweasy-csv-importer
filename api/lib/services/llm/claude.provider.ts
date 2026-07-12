// backend/src/services/llm/claude.provider.ts

import Anthropic from '@anthropic-ai/sdk';
import type { LlmConfig, BatchResponse, CrmLead } from '../../types/llm';
import { SYSTEM_PROMPT, buildUserPrompt, CRM_LEAD_JSON_SCHEMA } from '../../prompts/extraction.prompt';

export class ClaudeProvider {
  private client: Anthropic;
  private config: LlmConfig;
  private batchSize: number;

  constructor(config: LlmConfig) {
    this.config = config;
    this.batchSize = config.batchSize || 50;

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
      timeout: config.requestTimeoutMs || 120000,
      maxRetries: 0,
    });
  }

  async extractLeads(records: Record<string, string>[], headers: string[]): Promise<CrmLead[]> {
    const batches = this.createBatches(records, this.batchSize);
    const allLeads: CrmLead[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const response = await this.callApiWithRetry(batch, headers);
        allLeads.push(...response.leads);
      } catch (error) {
        console.error(`Batch ${i + 1}/${batches.length} failed:`, error);
      }
    }

    return allLeads;
  }

  createBatches(records: Record<string, string>[], batchSize: number): Record<string, string>[][] {
    const batches: Record<string, string>[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  async callApi(batch: Record<string, string>[], headers: string[]): Promise<BatchResponse> {
    const userPrompt = buildUserPrompt(batch, headers);

    // Use tool use for structured output
    const tool = {
      name: 'extract_crm_leads',
      description: 'Extract CRM leads from CSV records',
      input_schema: {
        type: 'object' as const,
        properties: {
          leads: {
            type: 'array',
            items: CRM_LEAD_JSON_SCHEMA,
          },
        },
        required: ['leads'],
      },
    };

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'extract_crm_leads' },
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.1,
    });

    const toolUse = response.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.name !== 'extract_crm_leads') {
      throw new Error('Claude did not use the expected tool');
    }

    const leads = (toolUse.input as { leads: CrmLead[] }).leads || [];
    return {
      leads: this.validateAndNormalizeLeads(leads),
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

  private async callApiWithRetry(batch: Record<string, string>[], headers: string[]): Promise<BatchResponse> {
    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries ?? 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.callApi(batch, headers);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          const delay = (this.config.retryBaseDelayMs ?? 1000) * Math.pow(2, attempt);
          console.warn(`Claude API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}