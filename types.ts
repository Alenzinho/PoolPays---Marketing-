export enum TaskStatus {
  BACKLOG = 'Backlog / Planejamento',
  TODO = 'Não iniciado',
  IN_PROGRESS = 'Em progresso',
  DONE = 'Feito',
  BLOCKED = 'Bloqueador',
  ARCHIVED = 'Arquivado'
}

export type DemandType = 'GENERIC' | 'CREATIVE' | 'CAROUSEL' | 'REELS' | 'ANIMATION' | 'PRINT';

// --- RAG & MULTI-AGENT TYPES ---
export type AgentRole = 'SUPERVISOR' | 'GUARDIAN' | 'GROWTH' | 'ARCHITECT';

export type KnowledgeCategory = 
  | 'CORE_IDENTITY'
  | 'TECH_DOCS'
  | 'MARKETING_OPS'
  | 'GENERAL';

export interface BriefingFields {
  idea?: string;
  format?: string;
  reference?: string;
  attachment?: string;
  copy?: string;
  duration?: string;
  soundtrack?: string;
  psdLink?: string;
  size?: string;
  fileLink?: string;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  owner: string;
  deadline: Date | null;
  status: TaskStatus;
  week: string;
  category: string;
  subtasks: string[];
  demandType: DemandType;
  briefing: BriefingFields;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  previewUrl?: string;
}

export interface VectorDocument {
  id: string;
  type: 'TASK' | 'BRIEFING' | 'KNOWLEDGE' | 'FILE';
  content: string;
  metadata: {
    title: string;
    originalId: string;
    category?: KnowledgeCategory | string;
    status?: string;
  };
  embedding?: number[];
}

export interface AgentLog {
  step: string;
  details: string;
  agent?: AgentRole;
  timestamp: number;
}

// 🆕 NOVOS TIPOS PARA CHAT SYSTEM
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentRole;
  timestamp: number;
  context?: VectorDocument[];
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  agentMode: AgentRole;
}