# Project: GrowEasy AI-Powered CSV Importer

## 1. Project Overview
A full-stack web application that allows users to upload unstructured CSV files with unpredictable layouts. The system parses the CSV, previews it, and uses an LLM (via batch processing) to map the fuzzy data into a strict CRM JSON schema.

## 2. Tech Stack
- **Frontend:** React (Next.js or Vite), TypeScript, Tailwind CSS, TanStack Table (for high-performance data grids).
- **Backend:** Node.js (Express) OR Python (FastAPI). 
- **AI Integration:** Direct LLM SDKs (e.g., OpenAI or Gemini SDK) using Structured Outputs (JSON Schema).

## 3. Core Engineering Principles
- **Avoid AI Black Boxes:** Do not use heavy abstraction frameworks for the LLM layer. Build transparent, custom wrappers around the LLM API to maintain full control over the batching logic, context windows, and JSON parsing. 
- **Strict Typing:** All data flowing between the CSV parser, the AI, and the frontend must be strictly typed.
- **Resilience:** The backend must handle LLM timeouts and rate limits gracefully. Implement robust chunking/batching mechanisms for large files.
- **Separation of Concerns:** Keep prompt templates completely isolated from the core API routing and business logic.

## 4. CRM Schema & Rules
The AI must extract data into the following strict schema. Every raw record must yield exactly one JSON object.

### Fields
- `created_at`: Lead creation date (ISO-8601 format parsable by `new Date()`).
- `name`: Lead name.
- `email`: Primary email (first one found).
- `country_code`: Country code (e.g., "+91").
- `mobile_without_country_code`: Primary mobile number (first one found).
- `company`: Company name.
- `city`, `state`, `country`: Location data.
- `lead_owner`: Lead owner email/name.
- `crm_status`: MUST be exactly one of: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`.
- `crm_note`: Overflow field. Concatenate extra emails, extra phone numbers, follow-up remarks, or miscellaneous data here.
- `data_source`: MUST be exactly one of: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`. If unknown, leave null.
- `possession_time`: Property possession time.
- `description`: Additional description.

### Extraction Rules
1. Map fuzzy user intent to the strict `crm_status` enum.
2. If multiple emails/phones exist, put the first in the dedicated fields and the rest in `crm_note`.
3. The application will drop records missing BOTH `email` and `mobile_without_country_code` after the AI extraction phase.

## 5. Development Workflow
- When asked to build a feature, write the interface/types first.
- Keep UI components small, responsive, and free of complex business logic.
- Do not introduce new dependencies without asking the lead engineer, Nikita, for approval.