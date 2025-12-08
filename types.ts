export interface QdrantConfig {
  url: string;
  apiKey: string;
  collectionName: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'parsing' | 'embedding' | 'uploading' | 'ready' | 'error';
  progress: number;
  chunkCount?: number;
  fileUrl?: string; // Added for PDF preview blob URL
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface AppConfig {
  qdrant: QdrantConfig;
  isConfigured: boolean;
}