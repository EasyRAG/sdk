// Types for EasyRAG SDK

export interface EasyRAGConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// File Types
export interface FileMetadata {
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
  permanentUrl?: string;
}

export interface SrtEntry {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

export interface UploadOptions {
  metadata?: Record<string, Record<string, any>>;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface UploadResponse {
  success: true;
  message: string;
  files: FileMetadata[];
  billed: {
    fileCount: number;
    uploadUnits: number;
  };
}

export interface ListFilesResponse {
  success: true;
  files: FileMetadata[];
}

export interface GetFileResponse {
  success: true;
  file: FileMetadata;
}

export interface DeleteResponse {
  success: true;
  deleted?: number;
}

// Search Types
export interface SearchFilter {
  key: string;
  match: {
    value: string | number | boolean;
  };
}

export interface SearchOptions {
  filters?: SearchFilter[];
}

export interface SearchResult {
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

export interface SearchResponse {
  success: true;
  data: SearchResult[];
}

// Query Types
export interface QueryOptions {
  stream?: boolean;
  filters?: SearchFilter[];
}

export interface QueryResponse {
  success: true;
  data: {
    result: string;
    sources?: Array<{
      pageContent: string;
      metadata: Record<string, any>;
    }>;
  };
}

export interface StreamDelta {
  delta: string;
}

export interface StreamDone {
  done: true;
}

export interface StreamError {
  error: string;
}

export type StreamEvent = StreamDelta | StreamDone | StreamError;

// Token Types
export interface CreateTokenOptions {
  ttlSeconds?: number;
}

export interface CreateTokenResponse {
  token: string;
  expiresIn: number;
}

// Error Types
export class EasyRAGError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'EasyRAGError';
  }
}
