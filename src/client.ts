import type {
  EasyRAGConfig,
  UploadOptions,
  UploadResponse,
  ListFilesResponse,
  GetFileResponse,
  DeleteResponse,
  SearchOptions,
  SearchResponse,
  QueryOptions,
  QueryResponse,
  StreamEvent,
  CreateTokenOptions,
  CreateTokenResponse,
} from './types';
import { EasyRAGError } from './types';

function isAbortError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    (e as any).name === "AbortError"
  );
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Unknown error";
}

export class EasyRAG {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: string | EasyRAGConfig) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = 'https://api.easyrag.com';
      this.timeout = 30000;
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || 'https://api.easyrag.com';
      this.timeout = config.timeout || 30000;
    }
  }

  // Helper method for making requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new EasyRAGError(
          error.error || error.message || `HTTP ${response.status}`,
          response.status,
          error.error,
          error.details
        );
      }

      return response.json();
    } catch (error: unknown) {
        clearTimeout(timeoutId);

        if (error instanceof EasyRAGError) throw error;

        if (isAbortError(error)) {
          throw new EasyRAGError("Request timeout");
        }

        throw new EasyRAGError(
          getErrorMessage(error) || "Network error",
          undefined,
          undefined,
          error
        );
    }
  }

  // Upload files
  async upload(
    datasetId: string,
    files: File[] | File,
    options: UploadOptions = {}
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('datasetId', datasetId);

    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => formData.append('file', file));

    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    if (options.chunkSize !== undefined) {
      formData.append('chunkSize', String(options.chunkSize));
    }

    if (options.chunkOverlap !== undefined) {
      formData.append('chunkOverlap', String(options.chunkOverlap));
    }

    return this.request<UploadResponse>('/v1/files/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // List files in a dataset
  async listFiles(datasetId: string): Promise<ListFilesResponse> {
    return this.request<ListFilesResponse>(
      `/v1/files?datasetId=${encodeURIComponent(datasetId)}`
    );
  }

  // Get file details
  async getFile(datasetId: string, fileId: string): Promise<GetFileResponse> {
    return this.request<GetFileResponse>(
      `/v1/files/${fileId}?datasetId=${encodeURIComponent(datasetId)}`
    );
  }

  // Delete a file
  async deleteFile(datasetId: string, fileId: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(
      `/v1/files/${fileId}?datasetId=${encodeURIComponent(datasetId)}`,
      { method: 'DELETE' }
    );
  }

  // Delete all files in a dataset
  async deleteDataset(datasetId: string): Promise<DeleteResponse> {
    return this.request<DeleteResponse>(
      `/v1/datasets/${encodeURIComponent(datasetId)}/files`,
      { method: 'DELETE' }
    );
  }

  // Delete all files for customer
  async deleteAll(): Promise<DeleteResponse> {
    return this.request<DeleteResponse>('/v1/files', { method: 'DELETE' });
  }

  // Search
  async search(
    datasetId: string,
    question: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    return this.request<SearchResponse>('/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        question,
        ...options,
      }),
    });
  }

  // Query (non-streaming)
  async query(
    datasetId: string,
    question: string,
    options: Omit<QueryOptions, 'stream'> = {}
  ): Promise<QueryResponse> {
    return this.request<QueryResponse>('/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        question,
        stream: false,
        ...options,
      }),
    });
  }

  // Query (streaming)
  async *queryStream(
    datasetId: string,
    question: string,
    options: Omit<QueryOptions, 'stream'> = {}
  ): AsyncGenerator<StreamEvent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/v1/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId,
          question,
          stream: true,
          ...options,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new EasyRAGError(
          error.error || `HTTP ${response.status}`,
          response.status
        );
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof EasyRAGError) throw error;
        if (isAbortError(error)) {
          throw new EasyRAGError("Request timeout");
        }
        throw new EasyRAGError(getErrorMessage(error) || "Streaming error");
      }}

  // Create frontend token
  async createToken(
    datasetId: string,
    options: CreateTokenOptions = {}
  ): Promise<CreateTokenResponse> {
    return this.request<CreateTokenResponse>('/v1/tokens/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasetId,
        ttlSeconds: options.ttlSeconds || 3600,
      }),
    });
  }
}
