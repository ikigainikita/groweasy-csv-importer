import OpenAI from 'openai';
import type { LlmConfig, BatchResponse, CrmLead, RawRecord, JsonSchema } from '../../types/llm';
import { SYSTEM_PROMPT, buildUserPrompt, OPENAI_FUNCTION_SCHEMA } from '../../prompts/extraction.prompt';
import { BaseLlmProvider } from './base.provider';
import { config as appConfig } from '../../config'; // 1. Import your central config

export class NvidiaProvider extends BaseLlmProvider {
  private client: OpenAI;

  constructor(config: LlmConfig) {
    super(config);
    this.client = new OpenAI({
      // 2. Safely use the verified API key from your config layer
      apiKey: appConfig.nvidiaApiKey, 
      baseURL: 'https://integrate.api.nvidia.com/v1',
      timeout: config.requestTimeoutMs || appConfig.requestTimeoutMs || 120000,
      maxRetries: 0,
    });
  }

  public async callApi(batch: RawRecord[], headers: string[]): Promise<BatchResponse> {
    const userPrompt = buildUserPrompt(batch, headers);

    const completion = await this.client.chat.completions.create({
      // 3. Fallback to the configured Nvidia model default
      model: this.config.model || appConfig.nvidiaModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Kept low for deterministic data extraction
      top_p: 0.95,
      max_tokens: 16384,
      // @ts-ignore - OpenAI types do not recognize NIM specific fields
      reasoning_budget: 16384,
      // @ts-ignore
      chat_template_kwargs: { "enable_thinking": true },
      // Note: If Nvidia NIM throws a validation error on 'json_schema', 
      // change type to 'json_object'
      response_format: {
        type: 'json_schema',
        json_schema: OPENAI_FUNCTION_SCHEMA as { name: string; schema: JsonSchema; strict: boolean },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Nvidia NIM');
    }

    // Strip out markdown formatting in case the model returns ```json ... ```
    const cleanedContent = content.replace(/```json\n|\n```|```/g, '').trim();

    const parsed = JSON.parse(cleanedContent);

    // Handle different response formats:
    // 1. Array of leads: [lead1, lead2, ...]
    // 2. Object with leads property: { leads: [lead1, lead2, ...] }
    // 3. Single lead object: { created_at: ..., name: ..., ... } - NVIDIA sometimes returns this
    let leads: unknown[] = [];
    if (Array.isArray(parsed)) {
      leads = parsed;
    } else if (parsed.leads && Array.isArray(parsed.leads)) {
      leads = parsed.leads;
    } else if (parsed && typeof parsed === 'object' && 'created_at' in parsed) {
      // Single lead object returned directly
      leads = [parsed];
    } else {
      console.warn('Unexpected NVIDIA response format:', JSON.stringify(parsed).substring(0, 200));
    }

    return {
      leads: this.validateAndNormalizeLeads(leads),
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }

  private validateAndNormalizeLeads(leads: unknown[]): CrmLead[] {
    return leads.map((lead) => this.normalizeLead(lead as Record<string, unknown>));
  }

  private normalizeLead(lead: Record<string, unknown>): CrmLead {
    const normalized: CrmLead = {
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

    return normalized;
  }

  private ensureString(value: unknown): string {
    return typeof value === 'string' ? value : String(value ?? '');
  }

  private ensureNullableString(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' ? value : String(value);
  }

  private ensureValidStatus(value: unknown): 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' {
    const validStatuses = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
    if (typeof value === 'string' && validStatuses.includes(value)) {
      return value as 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE';
    }
    return 'BAD_LEAD';
  }

  private ensureValidSource(value: unknown):
    | 'leads_on_demand'
    | 'meridian_tower'
    | 'eden_park'
    | 'varah_swamy'
    | 'sarjapur_plots'
    | null {
    const validSources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && validSources.includes(value)) {
      return value as 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots';
    }
    return null;
  }
}