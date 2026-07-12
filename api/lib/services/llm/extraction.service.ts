import type { LlmConfig, ExtractionProgress, CrmLead, ExtractionResult, RawRecord, BatchResponse } from '../../types/llm';
import { config } from '../../config';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { ClaudeProvider } from './claude.provider';
import { NvidiaProvider } from './nvidia.provider'; // 1. Added Nvidia import
import { SYSTEM_PROMPT, buildUserPrompt } from '../../prompts/extraction.prompt';
import { postProcessLeads } from './post-process';

export interface ExtractionServiceOptions {
  provider?: string;
  batchSize?: number;
  onProgress?: (progress: ExtractionProgress) => void;
}

export class ExtractionService {
  private provider: 'openai' | 'gemini' | 'claude' | 'nvidia'; // 2. Updated property type
  private batchSize: number;
  private onProgress?: (progress: ExtractionProgress) => void;

  constructor(llmConfig: LlmConfig, options: ExtractionServiceOptions = {}) {
    this.provider = llmConfig.provider as 'openai' | 'gemini' | 'claude' | 'nvidia';
    this.batchSize = options.batchSize || config.batchSize;
    this.onProgress = options.onProgress;
  }

  async extractLeads(records: RawRecord[], headers: string[]): Promise<ExtractionResult> {
    const totalRecords = records.length;
    const batches = this.createBatches(records, this.batchSize);
    let allLeads: CrmLead[] = [];
    let failedBatches = 0;

    console.log(`📦 Processing ${totalRecords} records in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;

      this.reportProgress({
        totalBatches: batches.length,
        completedBatches: i,
        currentBatch: batchNumber,
        totalRecords,
        processedRecords: allLeads.length,
        percentage: Math.round((i / batches.length) * 100),
      });

      try {
        const batchLeads = await this.processBatch(batch, headers);
        allLeads.push(...batchLeads);
        console.log(`  ✅ Batch ${batchNumber}/${batches.length}: ${batchLeads.length} leads extracted`);
      } catch (error) {
        failedBatches++;
        console.error(`  ❌ Batch ${batchNumber}/${batches.length} failed:`, error);

        this.reportProgress({
          totalBatches: batches.length,
          completedBatches: i,
          currentBatch: batchNumber,
          totalRecords,
          processedRecords: allLeads.length,
          percentage: Math.round((i / batches.length) * 100),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.reportProgress({
      totalBatches: batches.length,
      completedBatches: batches.length,
      currentBatch: batches.length,
      totalRecords,
      processedRecords: allLeads.length,
      percentage: 100,
    });

    // Post-process: validate enums, deduplicate, filter
    const processedLeads = postProcessLeads(allLeads);
    const filteredCount = allLeads.length - processedLeads.length;

    console.log(`✅ Extraction complete: ${processedLeads.length} valid leads, ${filteredCount} filtered (no contact)`);

    return {
      leads: processedLeads,
      stats: {
        totalInput: totalRecords,
        totalExtracted: processedLeads.length,
        filteredNoContact: filteredCount,
        failedBatches,
      },
    };
  }

  private async processBatch(batch: RawRecord[], headers: string[]): Promise<CrmLead[]> {
    switch (this.provider) {
      case 'openai':
        return this.processBatchOpenAI(batch, headers);
      case 'gemini':
        return this.processBatchGemini(batch, headers);
      case 'claude':
        return this.processBatchClaude(batch, headers);
      case 'nvidia': // 3. Added switch case
        return this.processBatchNvidia(batch, headers);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  private async processBatchOpenAI(batch: RawRecord[], headers: string[]): Promise<CrmLead[]> {
    const provider = new OpenAIProvider({
      provider: 'openai',
      apiKey: config.openaiApiKey || '',
      model: config.openaiModel,
      baseUrl: config.openaiBaseUrl,
      batchSize: this.batchSize,
      maxConcurrentBatches: config.maxConcurrentBatches,
      maxRetries: config.maxRetries,
      requestTimeoutMs: config.requestTimeoutMs,
      retryBaseDelayMs: config.retryBaseDelayMs,
    });

    return provider.extractLeads(batch, headers);
  }

  private async processBatchGemini(batch: RawRecord[], headers: string[]): Promise<CrmLead[]> {
    const provider = new GeminiProvider({
      provider: 'gemini',
      apiKey: config.geminiApiKey || '',
      model: config.geminiModel,
      batchSize: this.batchSize,
      maxConcurrentBatches: config.maxConcurrentBatches,
      maxRetries: config.maxRetries,
      requestTimeoutMs: config.requestTimeoutMs,
      retryBaseDelayMs: config.retryBaseDelayMs,
    });

    return provider.extractLeads(batch, headers);
  }

  private async processBatchClaude(batch: RawRecord[], headers: string[]): Promise<CrmLead[]> {
    const provider = new ClaudeProvider({
      provider: 'claude',
      apiKey: config.claudeApiKey || '',
      model: config.claudeModel,
      batchSize: this.batchSize,
      maxConcurrentBatches: config.maxConcurrentBatches,
      maxRetries: config.maxRetries,
      requestTimeoutMs: config.requestTimeoutMs,
      retryBaseDelayMs: config.retryBaseDelayMs,
    });

    return provider.extractLeads(batch, headers);
  }

  // 4. Added private method for Nvidia integration
  private async processBatchNvidia(batch: RawRecord[], headers: string[]): Promise<CrmLead[]> {
    const provider = new NvidiaProvider({
      provider: 'nvidia',
      apiKey: config.nvidiaApiKey || '',
      model: config.nvidiaModel,
       // Often required for custom NIM endpoints or NVIDIA API Catalog
      batchSize: this.batchSize,
      maxConcurrentBatches: config.maxConcurrentBatches,
      maxRetries: config.maxRetries,
      requestTimeoutMs: config.requestTimeoutMs,
      retryBaseDelayMs: config.retryBaseDelayMs,
    });

    return provider.extractLeads(batch, headers);
  }

  // Helper placeholder for createBatches and reportProgress assuming they exist below in your file
  private createBatches(records: RawRecord[], size: number): RawRecord[][] {
    const batches: RawRecord[][] = [];
    for (let i = 0; i < records.length; i += size) {
      batches.push(records.slice(i, i + size));
    }
    return batches;
  }

  private reportProgress(progress: ExtractionProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
}

export function createExtractionService(options: ExtractionServiceOptions = {}): ExtractionService {
  const provider = options.provider || config.llmProvider;
  const batchSize = options.batchSize || config.batchSize;

  return new ExtractionService({ provider, batchSize } as any, options);
}