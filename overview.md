# JavaScript SDK

**Coming Soon**: Official EasyRAG JavaScript/TypeScript SDK

## What to Expect

The official EasyRAG SDK will provide a clean, type-safe interface for interacting with the EasyRAG API.

### Planned Features

- ✅ Full TypeScript support with types
- ✅ Promise-based async/await API
- ✅ Automatic retry logic with exponential backoff
- ✅ Built-in error handling
- ✅ Progress tracking for uploads
- ✅ Streaming support for queries
- ✅ Browser and Node.js compatible

## Preview

Here's what the SDK will look like:

### Installation

```bash
npm install @easyrag/sdk
# or
yarn add @easyrag/sdk
```

### Basic Usage

```typescript
import { EasyRAG } from '@easyrag/sdk';

// Initialize client
const client = new EasyRAG({
  apiKey: process.env.EASYRAG_API_KEY
});

// Upload files
const result = await client.upload({
  datasetId: 'my-dataset',
  files: [file1, file2]
});

// Search documents
const results = await client.search({
  datasetId: 'my-dataset',
  question: 'What is the refund policy?'
});

// Query with AI
const answer = await client.query({
  datasetId: 'my-dataset',
  question: 'Summarize the key points',
  stream: true,
  onToken: (token) => console.log(token)
});
```

### Upload with Progress

```typescript
await client.upload({
  datasetId: 'my-dataset',
  files: [largeFile],
  onProgress: (progress) => {
    console.log(`Upload: ${progress.percent}%`);
  }
});
```

### Frontend Token Generation

```typescript
// Backend only
const token = await client.createToken({
  datasetId: 'user-123-docs',
  ttlSeconds: 3600
});

// Use in frontend
const frontendClient = new EasyRAG({ token });
```

### Type Safety

```typescript
interface UploadOptions {
  datasetId: string;
  files: File[];
  metadata?: Record<string, any>;
  chunkSize?: number;
  chunkOverlap?: number;
  onProgress?: (progress: UploadProgress) => void;
}

interface SearchResult {
  score: number;
  pageContent: string;
  metadata: FileMetadata;
}

interface FileMetadata {
  fileId: string;
  originalName: string;
  datasetId: string;
  [key: string]: any;
}
```

## Notify Me When Available

Want to be notified when the SDK launches?

📧 Email us at: support@easyrag.com with "SDK Beta" in the subject

## In the Meantime

Use the REST API directly:

- **[API Reference](../api/overview)** - Complete API documentation
- **[Quick Start](../quickstart)** - Get started with the API
- **[Authentication](../authentication)** - API keys and tokens

## Feedback Welcome

We're designing the SDK based on user needs. If you have specific requirements or suggestions, please reach out:

- 📧 Email: support@easyrag.com
- 💬 Feature requests: [Dashboard feedback form](https://easyrag.com)

---

**Estimated Release**: Q1 2025
