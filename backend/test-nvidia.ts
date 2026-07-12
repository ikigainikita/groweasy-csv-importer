import OpenAI from 'openai';
import { config as appConfig } from './src/config';

console.log('Testing NVIDIA API...');
console.log('API Key:', appConfig.nvidiaApiKey?.substring(0, 20) + '...');
console.log('Model:', appConfig.nvidiaModel);
console.log('Base URL: https://integrate.api.nvidia.com/v1');

const client = new OpenAI({
  apiKey: appConfig.nvidiaApiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 120000,
  maxRetries: 0,
});

async function test() {
  try {
    const completion = await client.chat.completions.create({
      model: 'nvidia/nemotron-3-ultra-550b-a55b',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello in one word.' }
      ],
      temperature: 0.1,
      max_tokens: 10,
    });
    console.log('Success:', completion.choices[0]?.message?.content);
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

test();
