// Example usage of @easyrag/sdk

import { EasyRAG } from '@easyrag/sdk';

// Initialize client
const client = new EasyRAG(process.env.EASYRAG_API_KEY!);

// ============================================
// Example 1: Basic Upload, Search, and Query
// ============================================

async function basicUsage() {
  // Upload a file
  const file = new File(['Hello world'], 'test.txt', { type: 'text/plain' });
  const upload = await client.upload('my-dataset', file);
  console.log('Uploaded:', upload.files[0].fileId);

  // Search
  const searchResults = await client.search('my-dataset', 'hello');
  console.log('Found:', searchResults.data.length, 'results');

  // Query
  const answer = await client.query('my-dataset', 'What does the file say?');
  console.log('Answer:', answer.data.result);
}

// ============================================
// Example 2: Upload with Metadata
// ============================================

async function uploadWithMetadata() {
  const file = new File(['Contract terms...'], 'contract.pdf', {
    type: 'application/pdf',
  });

  await client.upload('legal-docs', file, {
    metadata: {
      'contract.pdf': {
        userId: 'user_123',
        department: 'legal',
        year: 2024,
        status: 'active',
      },
    },
  });

  console.log('Uploaded with metadata');
}

// ============================================
// Example 3: Search with Filters
// ============================================

async function searchWithFilters() {
  const results = await client.search(
    'legal-docs',
    'termination clause',
    {
      filters: [
        { key: 'department', match: { value: 'legal' } },
        { key: 'year', match: { value: 2024 } },
        { key: 'status', match: { value: 'active' } },
      ],
    }
  );

  results.data.forEach((result) => {
    console.log(`Score: ${result.score.toFixed(3)}`);
    console.log(`From: ${result.metadata.originalName}`);
    console.log(`Content: ${result.pageContent.slice(0, 100)}...`);
    console.log('---');
  });
}

// ============================================
// Example 4: Streaming Query
// ============================================

async function streamingQuery() {
  console.log('Answer: ');

  for await (const chunk of client.queryStream(
    'my-dataset',
    'Summarize the main points'
  )) {
    if (chunk.delta) {
      process.stdout.write(chunk.delta);
    } else if (chunk.done) {
      console.log('\n✅ Complete');
    } else if (chunk.error) {
      console.error('\n❌ Error:', chunk.error);
    }
  }
}

// ============================================
// Example 5: File Management
// ============================================

async function fileManagement() {
  // List files
  const { files } = await client.listFiles('my-dataset');
  console.log(`Total files: ${files.length}`);

  for (const file of files) {
    console.log(`- ${file.originalName} (${file.size} bytes)`);
  }

  // Get file details
  if (files.length > 0) {
    const { file } = await client.getFile('my-dataset', files[0].fileId);
    console.log('Download URL:', file.permanentUrl);
  }

  // Delete file
  if (files.length > 0) {
    await client.deleteFile('my-dataset', files[0].fileId);
    console.log('Deleted:', files[0].originalName);
  }
}

// ============================================
// Example 6: Multi-Tenant Usage
// ============================================

async function multiTenantUsage() {
  const userId = 'user_123';

  // Upload user's document
  const file = new File(['User data'], 'data.txt', { type: 'text/plain' });
  await client.upload('shared-dataset', file, {
    metadata: {
      'data.txt': { userId, uploadedAt: new Date().toISOString() },
    },
  });

  // Search only user's documents
  const results = await client.search('shared-dataset', 'user data', {
    filters: [{ key: 'userId', match: { value: userId } }],
  });

  console.log(`Found ${results.data.length} results for user ${userId}`);
}

// ============================================
// Example 7: Error Handling
// ============================================

import { EasyRAGError } from '@easyrag/sdk';

async function errorHandling() {
  try {
    await client.upload('my-dataset', []);
  } catch (error) {
    if (error instanceof EasyRAGError) {
      console.error('EasyRAG Error:');
      console.error('  Status:', error.status);
      console.error('  Code:', error.code);
      console.error('  Message:', error.message);
      console.error('  Details:', error.details);

      // Handle specific errors
      if (error.status === 402) {
        console.log('Out of credits - please top up');
      } else if (error.status === 400) {
        console.log('Bad request - check your parameters');
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}

// ============================================
// Example 8: Create Frontend Token
// ============================================

async function createFrontendToken() {
  // Backend creates token for frontend
  const { token, expiresIn } = await client.createToken('user-dataset', {
    ttlSeconds: 3600, // 1 hour
  });

  console.log('Token:', token);
  console.log('Expires in:', expiresIn, 'seconds');

  // Frontend uses this token
  const frontendClient = new EasyRAG(token);
  await frontendClient.search('user-dataset', 'some query');
}

// ============================================
// Example 9: Upload Multiple Files
// ============================================

async function uploadMultipleFiles() {
  const files = [
    new File(['Content 1'], 'file1.txt', { type: 'text/plain' }),
    new File(['Content 2'], 'file2.txt', { type: 'text/plain' }),
    new File(['Content 3'], 'file3.txt', { type: 'text/plain' }),
  ];

  const result = await client.upload('my-dataset', files, {
    metadata: {
      'file1.txt': { priority: 'high' },
      'file2.txt': { priority: 'medium' },
      'file3.txt': { priority: 'low' },
    },
  });

  console.log(`Uploaded ${result.files.length} files`);
  console.log(`Billed: ${result.billed.uploadUnits} units`);
}

// ============================================
// Example 10: Custom Chunking
// ============================================

async function customChunking() {
  const file = new File(['Long document...'], 'doc.pdf', {
    type: 'application/pdf',
  });

  await client.upload('my-dataset', file, {
    chunkSize: 500, // Larger chunks
    chunkOverlap: 50, // More overlap for context
  });

  console.log('Uploaded with custom chunking');
}

// Run examples
if (require.main === module) {
  (async () => {
    try {
      await basicUsage();
      // Uncomment to run other examples:
      // await uploadWithMetadata();
      // await searchWithFilters();
      // await streamingQuery();
      // await fileManagement();
      // await multiTenantUsage();
      // await errorHandling();
      // await createFrontendToken();
      // await uploadMultipleFiles();
      // await customChunking();
    } catch (error) {
      console.error('Example failed:', error);
    }
  })();
}
