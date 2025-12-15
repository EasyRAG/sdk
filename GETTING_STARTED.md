# Getting Started with @easyrag/sdk

## Installation

```bash
npm install @easyrag/sdk
```

## 5-Minute Quickstart

```typescript
import { EasyRAG } from '@easyrag/sdk';

// 1. Initialize
const client = new EasyRAG(process.env.EASYRAG_API_KEY);

// 2. Upload
const file = new File(['content'], 'file.pdf', { type: 'application/pdf' });
await client.upload('my-dataset', file);

// 3. Search
const results = await client.search('my-dataset', 'your question');

// 4. Query
const answer = await client.query('my-dataset', 'summarize this');
console.log(answer.data.result);
```

## Build and Publish

```bash
# Install dependencies
npm install

# Build
npm run build

# Publish to npm
npm publish
```

## Project Structure

```
@easyrag/sdk/
├── src/
│   ├── index.ts      # Main export
│   ├── client.ts     # EasyRAG class
│   └── types.ts      # TypeScript types
├── package.json
├── tsconfig.json
├── README.md
└── examples.ts       # Usage examples
```

## What's Included

✅ Full TypeScript support
✅ All API endpoints covered
✅ Streaming support for queries
✅ Error handling
✅ Timeout management
✅ Browser and Node.js compatible
✅ Zero dependencies (uses native fetch)

## Next Steps

1. Add tests (jest or vitest)
2. Add retry logic
3. Add progress callbacks for uploads
4. Add rate limit handling
5. Add request cancellation
