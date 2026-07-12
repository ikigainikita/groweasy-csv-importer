import * as dotenv from 'dotenv';
dotenv.config(); // This forces Node to read the .env file immediately
import { z } from 'zod';


const envSchema = z.object({
  PORT: z.coerce.number().default(3002),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  // 1. Added 'nvidia' to the allowed providers
  LLM_PROVIDER: z.enum(['openai', 'gemini', 'claude', 'nvidia']).default('nvidia'),
  
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_BASE_URL: z.string().url().optional(),
  
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  
  CLAUDE_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-3-haiku-20240307'),
  CLAUDE_BASE_URL: z.string().url().optional(),

  // 2. Added Nvidia schema definitions
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_MODEL: z.string().default('nvidia/nemotron-3-ultra-550b-a55b'),

  BATCH_SIZE: z.coerce.number().int().positive().default(20),
  MAX_CONCURRENT_BATCHES: z.coerce.number().int().positive().default(3),
  MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(1000),
  JOB_TTL_MS: z.coerce.number().int().positive().default(3600000),
  CLEANUP_INTERVAL_MS: z.coerce.number().int().positive().default(300000),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(50),
  ALLOWED_MIME_TYPES: z.string().default('text/csv,application/csv,text/plain'),
});

type EnvConfig = z.infer<typeof envSchema>;

let configInstance: EnvConfig;

export function loadConfig(): EnvConfig {
  if (configInstance) return configInstance;
  console.log("🔍 SANITY CHECK - Provider is:", process.env.LLM_PROVIDER);
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  configInstance = result.data;
  validateProviderKeys(configInstance);

  return configInstance;
}

export function getConfig(): EnvConfig {
  if (!configInstance) return loadConfig();
  return configInstance;
}

// Export config as object with lowerCamelCase properties for easier access
export const config = {
  get port() { return getConfig().PORT; },
  get nodeEnv() { return getConfig().NODE_ENV; },
  get corsOrigin() { return getConfig().CORS_ORIGIN; },
  get llmProvider() { return getConfig().LLM_PROVIDER; },
  
  get openaiApiKey() { return getConfig().OPENAI_API_KEY; },
  get openaiModel() { return getConfig().OPENAI_MODEL; },
  get openaiBaseUrl() { return getConfig().OPENAI_BASE_URL; },
  
  get geminiApiKey() { return getConfig().GEMINI_API_KEY; },
  get geminiModel() { return getConfig().GEMINI_MODEL; },
  
  get claudeApiKey() { return getConfig().CLAUDE_API_KEY; },
  get claudeModel() { return getConfig().CLAUDE_MODEL; },
  get claudeBaseUrl() { return getConfig().CLAUDE_BASE_URL; },

  // 3. Export Nvidia getters
  get nvidiaApiKey() { return getConfig().NVIDIA_API_KEY; },
  get nvidiaModel() { return getConfig().NVIDIA_MODEL; },

  get batchSize() { return getConfig().BATCH_SIZE; },
  get maxConcurrentBatches() { return getConfig().MAX_CONCURRENT_BATCHES; },
  get maxRetries() { return getConfig().MAX_RETRIES; },
  get requestTimeoutMs() { return getConfig().REQUEST_TIMEOUT_MS; },
  get retryBaseDelayMs() { return getConfig().RETRY_BASE_DELAY_MS; },
  get jobTtlMs() { return getConfig().JOB_TTL_MS; },
  get jobCleanupIntervalMs() { return getConfig().CLEANUP_INTERVAL_MS; },
  get maxFileSizeMb() { return getConfig().MAX_FILE_SIZE_MB; },
  get allowedMimeTypes() { return getConfig().ALLOWED_MIME_TYPES; },
};

function validateProviderKeys(cfg: EnvConfig): void {
  const provider = cfg.LLM_PROVIDER;
  
  if (provider === 'openai' && !cfg.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required when LLM_PROVIDER=openai');
    process.exit(1);
  }
  if (provider === 'gemini' && !cfg.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is required when LLM_PROVIDER=gemini');
    process.exit(1);
  }
  if (provider === 'claude' && !cfg.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY is required when LLM_PROVIDER=claude');
    process.exit(1);
  }
  // 4. Added validation logic for Nvidia
  if (provider === 'nvidia' && !cfg.NVIDIA_API_KEY) {
    console.error('❌ NVIDIA_API_KEY is required when LLM_PROVIDER=nvidia');
    process.exit(1);
  }
}

export type { EnvConfig };