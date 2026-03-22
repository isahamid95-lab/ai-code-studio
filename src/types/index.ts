// --- Core Types ---
export type Language = 'javascript' | 'typescript' | 'css' | 'html' | 'json' | 'markdown';

export interface FileItem {
  id: string;
  name: string;
  content: string;
  language: Language;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isHidden?: boolean;
  displayText?: string;
}

export interface LogEntry {
  type: 'log' | 'error' | 'info';
  text: string;
}

export type AiProvider = 'gemini' | 'alibaba';

export type LeftPanelTab = 'explorer' | 'git';

export type AgentSendMode = 'agent' | 'plan';

export interface FileTemplate {
  name: string;
  defaultExt: string;
  content: string;
}
