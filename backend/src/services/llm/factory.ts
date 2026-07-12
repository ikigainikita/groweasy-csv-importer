// backend/src/services/llm/factory.ts

import type { LlmConfig } from '../../types/llm';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { NvidiaProvider } from './nvidia.provider'; // 1. Import your new provider

export function createLlmProvider(config: LlmConfig) {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'claude':
      throw new Error('Claude provider not yet implemented');
    case 'nvidia': // 2. Add the routing logic for Nvidia
      return new NvidiaProvider(config);
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

// 3. Add 'nvidia' to the supported providers array
export const SUPPORTED_PROVIDERS = ['openai', 'gemini', 'claude', 'nvidia'] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];