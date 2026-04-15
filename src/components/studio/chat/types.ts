import type { StudioFile } from '@/hooks/useStudioProjects';

/** ─── Agent Specialization ──────────────────────────────────────────────────── */
export type AgentSpecialist = 
  | 'ux' 
  | 'frontend' 
  | 'backend' 
  | 'devops' 
  | 'game' 
  | 'architect' 
  | 'engineer' 
  | 'none';

/** ─── Operational Phases ───────────────────────────────────────────────────── */
export type AgentPhase = 
  | 'idle' 
  | 'thinking' 
  | 'streaming' 
  | 'generating' 
  | 'architecting' 
  | 'fixing' 
  | 'done';

/** ─── Message Interface (V21.0) ───────────────────────────────────────────── */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'chat' | 'code' | 'plan' | 'reasoning';
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

/** ─── Generation Payloads ─────────────────────────────────────────────────── */
export interface CodeGenResult {
  files: Record<string, StudioFile>;
  explanation: string;
  stack?: string[];
  tech_stack?: string[];
  deps?: string[];
  suggestions?: string[];
  isChatOnly?: boolean;
  blob?: Blob;
}

export interface DeepBuildResult {
  text: string;
  blob: Blob;
  files: Map<string, string>;
  isChatOnly: true; 
}

/** ─── External Preferences ────────────────────────────────────────────────── */
export interface AgentPreference {
  agent_id: string;
  instructions: string;
}

/** ─── UI Model Configuration ─────────────────────────────────────────────── */
export interface ModelOption {
  id: string;
  label: string;
  badge: string;
  provider: string;
  description?: string;
  vision: boolean;
  premium: boolean;
  free: boolean;
  inputCost: number;
  outputCost: number;
  context: string;
}
