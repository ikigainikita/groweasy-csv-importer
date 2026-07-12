import { createExtractionService } from './src/services/llm/extraction.service';
import { config } from './src/config';

console.log('Testing extraction with NVIDIA...');
console.log('Provider:', config.llmProvider);
console.log('Model:', config.nvidiaModel);

const service = createExtractionService({
  provider: 'nvidia',
  batchSize: 10,
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

 async function test() {
  try {
    console.log('\nStarting extraction...');
    const result = await service.extractLeads(testRecords, headers);
    console.log('\n=== Result ===');
    console.log('Total Input:', result.stats.totalInput);
    console.log('Total Extracted:', result.stats.totalExtracted);
    console.log('Filtered No Contact:', result.stats.filteredNoContact);
    console.log('Failed Batches:', result.stats.failedBatches);
    console.log('\nLeads:');
    result.leads.forEach((lead, i) => {
      console.log(`\n--- Lead ${i+1} ---`);
      console.log('Name:', lead.name);
      console.log('Email:', lead.email);
      console.log('Mobile:', lead.mobile_without_country_code);
      console.log('Country Code:', lead.country_code);
      console.log('Company:', lead.company);
      console.log('City:', lead.city);
      console.log('State:', lead.state);
      console.log('Country:', lead.country);
      console.log('CRM Status:', lead.crm_status);
      console.log('Data Source:', lead.data_source);
      console.log('Created At:', lead.created_at);
      console.log('CRM Note:', lead.crm_note);
      console.log('Possession:', lead.possession_time);
      console.log('Description:', lead.description);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
