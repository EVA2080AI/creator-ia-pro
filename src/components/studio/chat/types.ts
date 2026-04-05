export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'chat' | 'code' | 'plan';
  files?: string[];
  imagePreview?: string;
  stack?: string[];
  deps?: string[];
  suggestions?: string[];
  planStatus?: 'pending' | 'approved' | 'rejected';
  originalPrompt?: string;
  blob?: Blob;
  projectFilesMap?: Map<string, string>;
}

export interface ModelOption {
  id: string;
  label: string;
  badge: string;
  vision: boolean;
  premium: boolean;
}
