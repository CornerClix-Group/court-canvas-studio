

# Bid Document Analyzer - Plan

## What You Get

A new **Bid Documents** page in the admin portal where you can:
1. Upload bid documents (PDFs, Word docs, images)
2. Automatically extract key details: bid deadline, scope of work, bond/insurance requirements, material specs, budget ranges, and submission requirements
3. Chat with the document to ask follow-up questions (like you do in ChatGPT today)

## How It Works

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Upload PDF  │────▶│  Edge Function   │────▶│  OpenAI API │
│  in Admin    │     │  (parse + ask AI)│     │  (analysis)  │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Supabase   │
                    │  Storage +  │
                    │  Database   │
                    └─────────────┘
```

## Implementation Steps

### 1. Database: `bid_documents` table
- Stores uploaded document metadata, extracted key details (JSON), and status
- Columns: id, title, file_path, file_name, file_type, file_size, extracted_data (jsonb), status, uploaded_by, created_at
- RLS: admin/staff only

### 2. Database: `bid_document_messages` table
- Stores the Q&A chat history per document
- Columns: id, bid_document_id, role, content, created_at

### 3. Storage bucket: `bid-documents`
- Private bucket for uploaded bid files

### 4. Edge Function: `analyze-bid-document`
- Accepts a document file, extracts text (using the existing OPENAI_API_KEY)
- Sends text to OpenAI with a structured prompt to extract: bid deadline, project scope, bond requirements, insurance requirements, material specs, submission instructions, budget/pricing info
- Returns structured JSON of extracted details

### 5. Edge Function: `bid-document-chat`
- Accepts messages + document context, streams AI responses
- Reuses the same pattern as the existing `chat` edge function but with bid-document-specific system prompt and document context

### 6. Frontend: `/admin/bid-documents` page
- File upload area (drag & drop or click)
- After upload: shows extracted key details in organized cards (deadline, scope, bonds, etc.)
- Below that: a chat interface to ask follow-up questions about the document
- List of previously uploaded documents with search

### 7. Navigation
- Add "Bid Docs" nav item to AdminLayout (using FileSearch icon)

## Technical Notes

- Uses the existing `OPENAI_API_KEY` secret (already configured)
- PDF text extraction will be done server-side in the edge function using a lightweight approach (send base64 to OpenAI's vision model for PDFs, or extract text for text-based docs)
- The extracted data structure will be tailored to court construction bids (bond requirements, prevailing wage, court specs, etc.)
- Chat context includes the full document text so the AI can answer specific questions

