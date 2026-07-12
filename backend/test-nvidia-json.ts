import OpenAI from 'openai';
import { config as appConfig } from './src/config';
import { OPENAI_FUNCTION_SCHEMA } from './src/prompts/extraction.prompt';

console.log('Testing NVIDIA API with JSON schema...');
console.log('API Key:', appConfig.nvidiaApiKey?.substring(0, 20) + '...');
console.log('Model:', appConfig.nvidiaModel);

const client = new OpenAI({
  apiKey: appConfig.nvidiaApiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 120000,
  maxRetries: 0,
});

async function test() {
  try {
    const completion = await client.chat.completions.create({
      model: appConfig.nvidiaModel,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts CRM leads from CSV data.' },
        { role: 'user', content: 'Extract leads from this data: [{"Name": "John Doe", "Email": "john@example.com", "Phone": "+919876543210"}]' }
      ],
      temperature: 0.1,
      top_p: 0.95,
      max_tokens: 16384,
      // @ts-ignore - NIM specific fields
      reasoning_budget: 16384,
      // @ts-ignore
      chat_template_kwargs: { "enable_thinking": true },
      response_format: {
        type: 'json_schema',
        json_schema: OPENAI_FUNCTION_SCHEMA as any,
      },
    });
    console.log('Success:', completion.choices[0]?.message?.content);
    console.log('Usage:', completion.usage);
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    }
  }
}

test();
