# @easyrag/sdk

Official JavaScript/TypeScript SDK for [EasyRAG](https://easyrag.com) - RAG as a Service.

## Installation

```bash
npm install @easyrag/sdk
```

## Quick Start

```typescript
import { EasyRAG } from '@easyrag/sdk';

// Initialize with API key
const client = new EasyRAG('YOUR_API_KEY');

// Upload files
const upload = await client.upload('my-dataset', [file1, file2]);
console.log(`Uploaded ${upload.files.length} files`);

// Search
const results = await client.search('my-dataset', 'What is the refund policy?');
console.log(results.data);

// Query
const answer = await client.query('my-dataset', 'Summarize the key points');
console.log(answer.data.result);
```

## Method Overview

| Method | Purpose | Returns |
|--------|---------|---------|
| `upload(dataset, files, options?)` | Upload and index files | `UploadResponse` |
| `listFiles(dataset)` | List all files in dataset | `ListFilesResponse` |
| `getFile(dataset, fileId)` | Get file details + download URL | `GetFileResponse` |
| `deleteFile(dataset, fileId)` | Delete a specific file | `DeleteResponse` |
| `deleteDataset(dataset)` | Delete all files in dataset | `DeleteResponse` |
| `deleteAll()` | Delete all customer files | `DeleteResponse` |
| `search(dataset, question, options?)` | Semantic search | `SearchResponse` |
| `query(dataset, question, options?)` | AI-generated answer | `QueryResponse` |
| `queryStream(dataset, question, options?)` | Streaming AI answer | `AsyncGenerator<StreamEvent>` |
| `createToken(dataset, options?)` | Create frontend token | `CreateTokenResponse` |

## Quick Reference

```typescript
const client = new EasyRAG('YOUR_API_KEY');

// Files
await client.upload(datasetId, files, options?)
await client.listFiles(datasetId)
await client.getFile(datasetId, fileId)
await client.deleteFile(datasetId, fileId)
await client.deleteDataset(datasetId)
await client.deleteAll()

// Search & Query
await client.search(datasetId, question, options?)
await client.query(datasetId, question, options?)
for await (const chunk of client.queryStream(datasetId, question, options?)) { }

// Tokens
await client.createToken(datasetId, options?)
```

## API Reference

### Constructor

```typescript
// Simple
const client = new EasyRAG('YOUR_API_KEY');

// With options
const client = new EasyRAG({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.easyrag.com', // optional
  timeout: 30000 // optional, default 30s
});
```

### Upload Files

```typescript
// Single file
await client.upload('my-dataset', file);

// Multiple files
await client.upload('my-dataset', [file1, file2, file3]);

// With metadata
await client.upload('my-dataset', [file], {
  metadata: {
    'document.pdf': {
      userId: 'user_123',
      department: 'legal'
    }
  }
});

// With custom chunking
await client.upload('my-dataset', [file], {
  chunkSize: 500,
  chunkOverlap: 50
});
```

**Response:**
```typescript
{
  success: true,
  message: "Files processed and indexed successfully!",
  files: [
    {
      fileId: "f7a3b2c1-4d5e-6f7g",
      originalName: "document.pdf",
      datasetId: "my-dataset",
      created: "2024-12-13T10:30:00.000Z",
      // ...
    }
  ],
  billed: {
    fileCount: 1,
    uploadUnits: 10
  }
}
```

### List Files

Get all files in a dataset.

```typescript
const response = await client.listFiles('my-dataset');

// Response type: ListFilesResponse
console.log(response.files); // FileMetadata[]
```

**Response:**
```typescript
{
  success: true,
  files: [
    {
      fileId: "f7a3b2c1-4d5e-6f7g",
      originalName: "document.pdf",
      datasetId: "my-dataset",
      size: 245678,
      mimeType: "application/pdf",
      created: "2024-12-13T10:30:00.000Z",
      extension: ".pdf",
      extraMeta: { userId: "user_123" },
      // ... other fields
    }
  ]
}
```

### Get File Details

Get detailed information about a specific file, including a signed download URL.

```typescript
const response = await client.getFile('my-dataset', 'fileId');

// Response type: GetFileResponse
console.log(response.file.permanentUrl); // Signed download URL
console.log(response.file.originalName);
console.log(response.file.size);
```

**Response:**
```typescript
{
  success: true,
  file: {
    fileId: "f7a3b2c1-4d5e-6f7g",
    originalName: "document.pdf",
    datasetId: "my-dataset",
    permanentUrl: "https://storage.googleapis.com/...",
    // ... all file metadata
  }
}
```

The `permanentUrl` is a signed URL valid until year 2491 for direct file download.

### Delete File

Delete a specific file from a dataset.

```typescript
const response = await client.deleteFile('my-dataset', 'fileId');

// Response type: DeleteResponse
console.log(response.success); // true
```

This removes:
- File from cloud storage
- All vector embeddings
- File metadata

**Note:** Deletion is permanent and cannot be undone. Credits are not refunded.

### Delete All Files in Dataset

Delete all files in a specific dataset.

```typescript
const response = await client.deleteDataset('my-dataset');

// Response type: DeleteResponse
console.log(response.deleted); // Number of files deleted
```

**Response:**
```typescript
{
  success: true,
  deleted: 15 // Number of files removed
}
```

⚠️ **Warning:** This is irreversible and deletes ALL files in the dataset.

### Delete All Customer Files

Delete all files across all datasets for the authenticated customer.

```typescript
const response = await client.deleteAll();

// Response type: DeleteResponse
console.log(response.deleted); // Total files deleted
```

**Response:**
```typescript
{
  success: true,
  deleted: 127 // Total files across all datasets
}
```

⚠️ **Warning:** This is a complete wipe and cannot be undone. Only works with API keys (not frontend tokens).

### Search

Perform semantic search across your documents.

```typescript
// Basic search
const results = await client.search(
  'my-dataset',
  'What is the refund policy?'
);

// Response type: SearchResponse
console.log(results.data); // SearchResult[]
```

**With filters:**
```typescript
const results = await client.search(
  'my-dataset',
  'contract terms',
  {
    filters: [
      { key: 'department', match: { value: 'legal' } },
      { key: 'year', match: { value: 2024 } },
      { key: 'status', match: { value: 'active' } }
    ]
  }
);
```

**Response:**
```typescript
{
  success: true,
  data: [
    {
      score: 0.89,           // Relevance score (0-1, higher is better)
      pageContent: "...",    // Text chunk from document
      metadata: {
        fileId: "f7a3b2c1",
        originalName: "policy.pdf",
        datasetId: "my-dataset",
        // ... custom metadata from upload
      }
    }
  ]
}
```

**Filter syntax:**
```typescript
interface SearchFilter {
  key: string;              // Metadata field name
  match: {
    value: string | number | boolean;  // Exact value to match
  };
}
```

Multiple filters use AND logic (all must match).

**Score interpretation:**
- **0.9+** - Highly relevant
- **0.8-0.9** - Very relevant
- **0.7-0.8** - Relevant
- **< 0.7** - Possibly relevant

### Query (Non-Streaming)

Get an AI-generated answer to a question about your documents.

```typescript
const answer = await client.query(
  'my-dataset',
  'Summarize the key points'
);

// Response type: QueryResponse
console.log(answer.data.result);  // AI-generated answer
console.log(answer.data.sources); // Source chunks used
```

**With filters:**
```typescript
const answer = await client.query(
  'my-dataset',
  'What is the vacation policy?',
  {
    filters: [
      { key: 'department', match: { value: 'HR' } },
      { key: 'year', match: { value: 2024 } }
    ]
  }
);
```

**Response:**
```typescript
{
  success: true,
  data: {
    result: "Based on the documents, the key points are:\n1. ...",
    sources: [
      {
        pageContent: "...",
        metadata: { fileId: "...", originalName: "..." }
      }
    ]
  }
}
```

The AI answers **only** based on your documents - no hallucinations.

### Query (Streaming)

Stream the AI response in real-time for better UX.

```typescript
// Stream the response word-by-word
for await (const chunk of client.queryStream('my-dataset', 'Explain the features')) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);  // New text chunk
  } else if (chunk.done) {
    console.log('\nComplete!');          // Stream finished
  } else if (chunk.error) {
    console.error('Error:', chunk.error); // Stream error
  }
}
```

**With filters:**
```typescript
for await (const chunk of client.queryStream(
  'my-dataset',
  'Explain the policy',
  {
    filters: [{ key: 'department', match: { value: 'HR' } }]
  }
)) {
  if (chunk.delta) {
    console.log(chunk.delta);
  }
}
```

**Stream event types:**
```typescript
// Text chunk
{ delta: "Based on" }

// Completion
{ done: true }

// Error
{ error: "Error message" }
```

**Use streaming when:**
- Building chat interfaces
- User experience matters
- Long responses expected

**Benefits:**
- Response starts immediately
- Users see progress in real-time
- Same cost as non-streaming (0.1 credit)

### Create Frontend Token

Create a scoped token for use in browsers or mobile apps.

```typescript
// Create a token for frontend use
const result = await client.createToken('my-dataset', {
  ttlSeconds: 3600 // 1 hour (default: 3600, max: 86400)
});

// Response type: CreateTokenResponse
console.log(result.token);      // JWT token for frontend
console.log(result.expiresIn);  // 3600 (seconds)
```

**Response:**
```typescript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresIn: 3600
}
```

**Token scoping:**
- Token is scoped to a single dataset
- Can only access the specified dataset
- Expires after `ttlSeconds`
- Cannot create other tokens

**Recommended TTL values:**
```typescript
// Quick upload
await client.createToken('dataset', { ttlSeconds: 300 });   // 5 min

// Chat session
await client.createToken('dataset', { ttlSeconds: 3600 });  // 1 hour

// Long session
await client.createToken('dataset', { ttlSeconds: 14400 }); // 4 hours

// Maximum
await client.createToken('dataset', { ttlSeconds: 86400 }); // 24 hours
```

**Frontend usage:**
```typescript
// Backend generates token
const { token } = await client.createToken('user-dataset', { ttlSeconds: 3600 });

// Send to frontend
res.json({ token });

// Frontend uses token
const frontendClient = new EasyRAG(token);
await frontendClient.search('user-dataset', 'query');
```

**Security notes:**
- Only call this endpoint from your backend
- Never expose API keys in the frontend
- Tokens automatically scope to the specified dataset
- No way to revoke tokens before expiry

## Error Handling

```typescript
import { EasyRAGError } from '@easyrag/sdk';

try {
  await client.upload('my-dataset', file);
} catch (error) {
  if (error instanceof EasyRAGError) {
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
  }
}
```

## TypeScript Support

Full TypeScript support with autocomplete:

```typescript
import type { SearchResult, UploadResponse } from '@easyrag/sdk';

const results: SearchResult[] = await client.search(...);
const upload: UploadResponse = await client.upload(...);
```

## Costs

| Operation | Cost | Notes |
|-----------|------|-------|
| `upload()` | 1 credit per file | Includes processing and indexing |
| `listFiles()` | Free | No charge |
| `getFile()` | Free | No charge |
| `deleteFile()` | Free | Credits not refunded |
| `deleteDataset()` | Free | Credits not refunded |
| `deleteAll()` | Free | Credits not refunded |
| `search()` | 0.1 credit | Per search request |
| `query()` | 0.1 credit | Same for streaming/non-streaming |
| `queryStream()` | 0.1 credit | Same cost as non-streaming |
| `createToken()` | Free | No charge |

## Complete API Reference

### Constructor

```typescript
new EasyRAG(apiKey: string): EasyRAG
new EasyRAG(config: EasyRAGConfig): EasyRAG

interface EasyRAGConfig {
  apiKey: string;
  baseUrl?: string;   // Default: 'https://api.easyrag.com'
  timeout?: number;   // Default: 30000 (30 seconds)
}
```

### Methods

#### upload()
```typescript
upload(
  datasetId: string,
  files: File | File[],
  options?: UploadOptions
): Promise<UploadResponse>

interface UploadOptions {
  metadata?: Record<string, Record<string, any>>;
  chunkSize?: number;     // Default: 300
  chunkOverlap?: number;  // Default: 20
}
```

#### listFiles()
```typescript
listFiles(datasetId: string): Promise<ListFilesResponse>
```

#### getFile()
```typescript
getFile(
  datasetId: string,
  fileId: string
): Promise<GetFileResponse>
```

#### deleteFile()
```typescript
deleteFile(
  datasetId: string,
  fileId: string
): Promise<DeleteResponse>
```

#### deleteDataset()
```typescript
deleteDataset(datasetId: string): Promise<DeleteResponse>
```

#### deleteAll()
```typescript
deleteAll(): Promise<DeleteResponse>
```

#### search()
```typescript
search(
  datasetId: string,
  question: string,
  options?: SearchOptions
): Promise<SearchResponse>

interface SearchOptions {
  filters?: SearchFilter[];
}

interface SearchFilter {
  key: string;
  match: { value: string | number | boolean };
}
```

#### query()
```typescript
query(
  datasetId: string,
  question: string,
  options?: QueryOptions
): Promise<QueryResponse>

interface QueryOptions {
  filters?: SearchFilter[];
}
```

#### queryStream()
```typescript
queryStream(
  datasetId: string,
  question: string,
  options?: QueryOptions
): AsyncGenerator<StreamEvent>

type StreamEvent = StreamDelta | StreamDone | StreamError;

interface StreamDelta {
  delta: string;
}

interface StreamDone {
  done: true;
}

interface StreamError {
  error: string;
}
```

#### createToken()
```typescript
createToken(
  datasetId: string,
  options?: CreateTokenOptions
): Promise<CreateTokenResponse>

interface CreateTokenOptions {
  ttlSeconds?: number;  // Default: 3600, Max: 86400
}
```

### Response Types

```typescript
interface UploadResponse {
  success: true;
  message: string;
  files: FileMetadata[];
  billed: {
    fileCount: number;
    uploadUnits: number;
  };
}

interface FileMetadata {
  customerId: string;
  datasetId: string;
  fileId: string;
  filePath: string;
  originalName: string;
  mimeType: string | null;
  size: number | null;
  loaderId: string;
  created: string;
  extension: string;
  transcriptionText: string | null;
  transcriptionSrt: SrtEntry[] | null;
  extraMeta: Record<string, any> | null;
  permanentUrl?: string;  // Only in getFile() response
}

interface SearchResponse {
  success: true;
  data: SearchResult[];
}

interface SearchResult {
  score: number;
  pageContent: string;
  metadata: {
    fileId: string;
    originalName: string;
    customerId: string;
    datasetId: string;
    [key: string]: any;
  };
}

interface QueryResponse {
  success: true;
  data: {
    result: string;
    sources?: Array<{
      pageContent: string;
      metadata: Record<string, any>;
    }>;
  };
}

interface ListFilesResponse {
  success: true;
  files: FileMetadata[];
}

interface GetFileResponse {
  success: true;
  file: FileMetadata;
}

interface DeleteResponse {
  success: true;
  deleted?: number;
}

interface CreateTokenResponse {
  token: string;
  expiresIn: number;
}
```

### Error Handling

```typescript
class EasyRAGError extends Error {
  status?: number;    // HTTP status code
  code?: string;      // Error code from API
  details?: any;      // Additional error details
}
```

**Example:**
```typescript
import { EasyRAGError } from '@easyrag/sdk';

try {
  await client.upload('dataset', file);
} catch (error) {
  if (error instanceof EasyRAGError) {
    console.log('Status:', error.status);     // 402
    console.log('Code:', error.code);         // "INSUFFICIENT_CREDITS"
    console.log('Message:', error.message);   // "You are out of credits..."
    console.log('Details:', error.details);   // { required: 1, available: 0 }
  }
}
```

### Costs

| Operation | Cost |
|-----------|------|
| Upload 1 file | 1 credit |
| Search | 0.1 credit |
| Query (streaming or not) | 0.1 credit |
| List files | Free |
| Get file | Free |
| Delete file | Free |

### Rate Limits

- **Search/Query**: 1000 requests/minute
- **Upload**: 100 requests/minute
- **File operations**: 1000 requests/minute

Requests automatically timeout after 30 seconds (configurable via constructor).

## Examples

### Basic Usage

```typescript
import { EasyRAG } from '@easyrag/sdk';

const client = new EasyRAG(process.env.EASYRAG_API_KEY);

// Upload
const upload = await client.upload('docs', [file]);
console.log('Uploaded:', upload.files[0].fileId);

// Search
const results = await client.search('docs', 'pricing information');
results.data.forEach(r => {
  console.log(`Score: ${r.score}`);
  console.log(`Content: ${r.pageContent}`);
});

// Query
const answer = await client.query('docs', 'What are the pricing tiers?');
console.log(answer.data.result);
```

### Streaming Chat

```typescript
const question = 'Explain the main features';

process.stdout.write('Answer: ');

for await (const chunk of client.queryStream('docs', question)) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}

console.log('\n');
```

### Multi-Tenant with Filters

```typescript
// Upload with user metadata
await client.upload('shared-dataset', [file], {
  metadata: {
    'document.pdf': { userId: 'user_123' }
  }
});

// Search only user's documents
const results = await client.search(
  'shared-dataset',
  'my documents',
  {
    filters: [
      { key: 'userId', match: { value: 'user_123' } }
    ]
  }
);
```

### Error Handling

```typescript
import { EasyRAGError } from '@easyrag/sdk';

try {
  await client.upload('my-dataset', file);
} catch (error) {
  if (error instanceof EasyRAGError) {
    if (error.status === 402) {
      console.log('Out of credits!');
    } else if (error.status === 400) {
      console.log('Bad request:', error.message);
    }
  }
}
```

### File Management

```typescript
// List all files
const { files } = await client.listFiles('my-dataset');
console.log(`Total files: ${files.length}`);

// Get file details
const { file } = await client.getFile('my-dataset', fileId);
console.log('Download URL:', file.permanentUrl);

// Delete file
await client.deleteFile('my-dataset', fileId);
console.log('File deleted');
```

## Browser Usage

The SDK works in browsers with the Fetch API:

```typescript
// Frontend (with token from backend)
const token = await fetch('/api/token').then(r => r.json());
const client = new EasyRAG(token);

// Upload from file input
const fileInput = document.querySelector('input[type="file"]');
const files = Array.from(fileInput.files);
await client.upload('dataset', files);
```

**⚠️ Security Note:** Never use API keys in the browser. Use frontend tokens from your backend.

## Node.js Usage

```typescript
import { EasyRAG } from '@easyrag/sdk';
import fs from 'fs';

const client = new EasyRAG(process.env.EASYRAG_API_KEY);

// Upload from filesystem
const file = new File(
  [fs.readFileSync('document.pdf')],
  'document.pdf',
  { type: 'application/pdf' }
);

await client.upload('my-dataset', file);
```

## Rate Limits

The SDK respects API rate limits:
- 1000 requests/minute for search/query
- 100 requests/minute for uploads
- Requests timeout after 30 seconds (configurable)

## Support

- 📧 Email: support@easyrag.com
- 📚 Docs: https://easyrag.com/docs
- 🐛 Issues: https://github.com/easyrag/sdk/issues

## License

MIT