import OpenAI from 'openai';
import { config as appConfig } from './src/config';
import { SYSTEM_PROMPT, buildUserPrompt, OPENAI_FUNCTION_SCHEMA } from './src/prompts/extraction.prompt';

const client = new OpenAI({
  apiKey: appConfig.nvidiaApiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  timeout: 120000,
  maxRetries: 0,
});

const testRecords = [
  {
    "Name": "John Doe",
    "Email": "john.doe@example.com",
    "Phone": "+91-9876543210",
    "Company": "Acme Corp",
    "City": "Mumbai",
    "State": "Maharashtra",
    "Country": "India",
    "Source": "leads_on_demand",
    "Status": "Hot",
    "Created Date": "2024-01-15",
    "Notes": "Interested in 2BHK"
  },
  {
    "Name": "Jane Smith",
    "Email": "jane.smith@test.com",
    "Mobile": "9876543210",
    "Organization": "Test Inc",
    "City": "Bangalore",
    "Region": "Karnataka",
    "Country": "India",
    "Origin": "meridian_tower",
    "Lead Status": "Follow Up",
    "Date": "2024-02-20",
    "Remarks": "Looking for 3BHK"
  }
];

const headers = Object.keys(testRecords[0]);
const userPrompt = buildUserPrompt(testRecords, headers);

async function test() {
  try {
    const completion = await client.chat.completions.create({
      model: appConfig.nvidiaModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      top_p: 0.95,
      max_tokens: 16384,
      // @ts-ignore
      reasoning_budget: 16384,
      // @ts-ignore
      chat_template_kwargs: { "enable_thinking": true },
      response_format: {
        type: 'json_schema',
        json_schema: OPENAI_FUNCTION_SCHEMA as any,
      },
    });

    const content = completion.choices[0]?.message?.content;
    console.log('Raw Response:');
    console.log(content);
    console.log('\n---');
    
    const cleanedContent = content?.replace(/```json\n|\n```|```/g, '').trim();
    const parsed = JSON.parse(cleanedContent || '[]');
    console.log('Parsed type:', Array.isArray(parsed) ? 'array' : 'object');
    console.log('Keys:', Object.keys(parsed));
    if (Array.isArray(parsed)) {
      console.log('Array length:', parsed.length);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) console.error('Response:', JSON.stringify(error.response.data, null, 2));
  }
}

test();
