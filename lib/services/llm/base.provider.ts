import type { LlmConfig, JsonSchema, RawRecord, BatchResponse, LlmProviderInterface } from '../../types/llm';
import type { CrmLead } from '../../types';

export abstract class BaseLlmProvider implements LlmProviderInterface {
  protected config: LlmConfig;

  constructor(config: LlmConfig) {
    this.config = config;
  }

  abstract callApi(batch: RawRecord[], headers: string[]): Promise<BatchResponse>;

  createSchema(): JsonSchema {
    return {
      type: 'object',
      properties: {
        leads: {
          type: 'array',
          items: this.getLeadSchema(),
        },
      },
      required: ['leads'],
      additionalProperties: false,
    };
  }

  protected getLeadSchema(): JsonSchema {
    return {
      type: 'object',
      properties: {
        created_at: { type: 'string', format: 'date-time', description: 'Lead creation date (ISO-8601)' },
        name: { type: 'string', nullable: true, description: 'Lead full name' },
        email: { type: 'string', format: 'email', nullable: true, description: 'Primary email address' },
        country_code: { type: 'string', nullable: true, description: 'Country code (e.g., +91)' },
        mobile_without_country_code: { type: 'string', nullable: true, description: 'Mobile number without country code' },
        company: { type: 'string', nullable: true, description: 'Company name' },
        city: { type: 'string', nullable: true, description: 'City' },
        state: { type: 'string', nullable: true, description: 'State/Province' },
        country: { type: 'string', nullable: true, description: 'Country' },
        lead_owner: { type: 'string', nullable: true, description: 'Lead owner email or name' },
        crm_status: {
          type: 'string',
          enum: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'],
          description: 'CRM lead status',
        },
        crm_note: { type: 'string', nullable: true, description: 'Overflow field for extra emails, phones, notes' },
        data_source: {
          type: 'string',
          nullable: true,
          enum: ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'],
          description: 'Data source',
        },
        possession_time: { type: 'string', nullable: true, description: 'Property possession time' },
        description: { type: 'string', nullable: true, description: 'Additional description' },
      },
      required: [
        'created_at',
        'name',
        'email',
        'country_code',
        'mobile_without_country_code',
        'company',
        'city',
        'state',
        'country',
        'lead_owner',
        'crm_status',
        'crm_note',
        'data_source',
        'possession_time',
        'description',
      ],
      additionalProperties: false,
    };
  }

  createBatches(records: RawRecord[], batchSize: number): RawRecord[][] {
    const batches: RawRecord[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  async extractLeads(records: RawRecord[], headers: string[]): Promise<CrmLead[]> {
    const batches = this.createBatches(records, this.config.batchSize);
    const allLeads: CrmLead[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const response = await this.callApiWithRetry(batch, headers);
        allLeads.push(...response.leads);
      } catch (error) {
        console.error(`Batch ${i + 1}/${batches.length} failed:`, error);
        throw error;
      }
    }

    return allLeads;
  }

  protected async callApiWithRetry(batch: RawRecord[], headers: string[]): Promise<BatchResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.callApi(batch, headers);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if retryable
        if (!this.isRetryableError(lastError) || attempt >= this.config.maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = this.config.retryBaseDelayMs * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  protected isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    // Rate limits, timeouts, server errors
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('timeout') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    );
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}