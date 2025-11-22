import { ChatThread, ChatMessage, AgentRole } from '../types';

const STORAGE_KEY = 'poolpays-chat-threads';
const MAX_THREADS = 50;

export const ChatStorageService = {
  
  getAllThreads(): ChatThread[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse threads', e);
      return [];
    }
  },

  createThread(agentMode: AgentRole = 'SUPERVISOR'): ChatThread {
    const thread: ChatThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Nova Conversa',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentMode
    };
    
    let threads = this.getAllThreads();
    threads.unshift(thread);
    
    // Limitar a 50 threads
    if (threads.length > MAX_THREADS) {
      threads = threads.slice(0, MAX_THREADS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    return thread;
  },

  addMessage(threadId: string, message: ChatMessage): void {
    const threads = this.getAllThreads();
    const thread = threads.find(t => t.id === threadId);
    
    if (!thread) throw new Error('Thread not found');
    
    thread.messages.push(message);
    thread.updatedAt = Date.now();
    
    // Auto-gerar título da primeira mensagem do usuário
    if (thread.messages.length === 1 && thread.title === 'Nova Conversa' && message.role === 'user') {
      thread.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  },

  getThread(threadId: string): ChatThread | null {
    const threads = this.getAllThreads();
    return threads.find(t => t.id === threadId) || null;
  },

  deleteThread(threadId: string): void {
    const threads = this.getAllThreads();
    const filtered = threads.filter(t => t.id !== threadId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  updateThreadAgent(threadId: string, agentMode: AgentRole): void {
    const threads = this.getAllThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.agentMode = agentMode;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    }
  }
};