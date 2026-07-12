🚀 AI-Powered CSV Importer for CRM
An intelligent full-stack application that takes messy, unstructured CSV exports from various sources (Facebook Leads, Google Ads, custom spreadsheets) and uses AI to map, normalize, and extract them into a standardized CRM format.

✨ Features
Intelligent Field Mapping: Uses LLMs n to accurately map custom columns to standard CRM fields.

Flexible AI Backends: Supports cloud providers (OpenAI, Gemini, Claude) 
Robust Processing: Batch processing algorithm to handle large CSVs without hitting LLM context limits or rate limits.

Modern Frontend: Responsive Next.js is used 

Data Validation: Strict JSON schema enforcement using Zod to ensure the AI output perfectly matches the expected CRM schema.

🛠️ Tech Stack
Frontend:

Next.js (App Router)

Tailwind CSS & shadcn/ui

PapaParse (Client-side CSV parsing)


Backend:

Node.js & Express

Multer (Memory storage for file uploads)

Zod (Schema validation)

⚙️ Prerequisites
Before you begin, ensure you have the following installed:

Node.js: v18.0 or higher

Package Manager: npm

AI Provider: An API key for OpenAI/Gemini/Claude, OR Ollama installed locally for running open-source models (like Qwen, DeepSeek, or Llama 3) during development.

🚀 Setup Instructions
1. Clone the Repository
Bash
git clone https://github.com/ikigainikita/groweasy-csv-importer.git
cd groweasy-csv-importer
2. Backend Setup
The backend handles the batching and AI extraction logic.

Bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install
Environment Variables (backend/.env)
Create a .env file in the backend directory. You can configure it to use cloud models or a local Ollama instance.

Start the Backend Server:

Bash
npm run dev
The backend will run on http://localhost:3002.

3. Frontend Setup
The frontend provides the UI for uploading, previewing, and reviewing the AI-extracted data.

Bash
# Open a new terminal instance and navigate to the frontend directory
cd frontend

# Install dependencies
npm install
Environment Variables (frontend/.env.local)
Create a .env.local file in the frontend directory.

Code snippet
# Point to the local backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
Start the Frontend Development Server:

Bash
npm run dev
The frontend will be accessible at http://localhost:3000/.


🧠 How the AI Extraction Works
Ingestion: The frontend parses the CSV locally and sends JSON arrays to the backend, or the backend accepts a raw CSV and parses it using csv-parser.

Batching: The backend groups rows into smaller chunks (e.g., 15 rows) to prevent LLM hallucination and respect context windows.

Prompting: the batch is injected  into a highly structured system prompt, defining the strict rules (e.g., only allowing specific CRM statuses).

Parsing & Validation: The LLM is forced to return JSON. The backend passes this response through a Zod schema to ensure required fields (email or mobile_without_country_code) are present and date formats are standard. Invalid rows are automatically routed to the "Skipped" array.

🤝 Contributing
1  Fork the repository

2   Create your feature branch (git checkout -b feature/AmazingFeature)

3   Commit your changes (git commit -m 'Add some AmazingFeature')

4   Push to the branch (git push origin feature/AmazingFeature)

5    Open a Pull Request