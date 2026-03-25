import { db, type ChatMessageRecord, type SettingsRecord, type AgentMemoryRecord } from './db';

const MIGRATION_KEY = 'indexeddb-migration-complete';

interface LegacyChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'model';
  content?: string;
  text?: string;
  timestamp?: number | string;
}

async function migrateChats(): Promise<number> {
  const legacyChats = localStorage.getItem('chat-messages');
  if (!legacyChats) return 0;

  try {
    const chats: LegacyChatMessage[] = JSON.parse(legacyChats);
    if (!Array.isArray(chats) || chats.length === 0) return 0;

    for (const msg of chats) {
      const role = msg.role === 'assistant' ? 'model' : msg.role;
      if (role !== 'user' && role !== 'model' && role !== 'system') continue;
      
      const record: ChatMessageRecord = {
        id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        text: msg.text || msg.content || '',
        timestamp: typeof msg.timestamp === 'number' 
          ? msg.timestamp 
          : msg.timestamp 
            ? new Date(msg.timestamp).getTime() 
            : Date.now(),
      };
      await db.set('chats', record);
    }

    localStorage.removeItem('chat-messages');
    return chats.length;
  } catch {
    console.warn('Failed to migrate chats from localStorage');
    return 0;
  }
}

async function migrateSettings(): Promise<boolean> {
  const theme = localStorage.getItem('theme');
  const leftPanelOpen = localStorage.getItem('left-panel-open');
  const rightPanelOpen = localStorage.getItem('right-panel-open');
  const leftPanelTab = localStorage.getItem('left-panel-tab');
  const openTabs = localStorage.getItem('open-tabs');
  const activeTabId = localStorage.getItem('active-tab-id');

  const hasAnySettings = theme || leftPanelOpen || rightPanelOpen || leftPanelTab || openTabs || activeTabId;
  
  if (!hasAnySettings) return false;

  const settings: SettingsRecord = {
    id: 'ui',
    theme: theme || undefined,
    leftPanelOpen: leftPanelOpen ? JSON.parse(leftPanelOpen) : undefined,
    rightPanelOpen: rightPanelOpen ? JSON.parse(rightPanelOpen) : undefined,
    leftPanelTab: leftPanelTab || undefined,
    openTabs: openTabs ? JSON.parse(openTabs) : undefined,
    activeTabId: activeTabId || undefined,
  };

  try {
    await db.set('settings', settings);
    
    if (theme) localStorage.removeItem('theme');
    if (leftPanelOpen) localStorage.removeItem('left-panel-open');
    if (rightPanelOpen) localStorage.removeItem('right-panel-open');
    if (leftPanelTab) localStorage.removeItem('left-panel-tab');
    if (openTabs) localStorage.removeItem('open-tabs');
    if (activeTabId) localStorage.removeItem('active-tab-id');
    
    return true;
  } catch {
    console.warn('Failed to migrate settings from localStorage');
    return false;
  }
}

async function migrateAgentMemory(): Promise<boolean> {
  const memory = localStorage.getItem('agent-memory');
  if (!memory) return false;

  try {
    const memoryObj = JSON.parse(memory);
    const now = Date.now();
    
    for (const [key, value] of Object.entries(memoryObj)) {
      const record: AgentMemoryRecord = {
        id: `memory-${now}-${key}`,
        key,
        value: value as string,
        createdAt: now,
        updatedAt: now,
      };
      await db.set('agentMemory', record);
    }
    localStorage.removeItem('agent-memory');
    return true;
  } catch {
    console.warn('Failed to migrate agent memory from localStorage');
    return false;
  }
}

export async function runMigrations(): Promise<{
  chats: number;
  settings: boolean;
  agentMemory: boolean;
}> {
  const migrationComplete = localStorage.getItem(MIGRATION_KEY);
  if (migrationComplete === 'true') {
    return { chats: 0, settings: false, agentMemory: false };
  }

  const results = {
    chats: await migrateChats(),
    settings: await migrateSettings(),
    agentMemory: await migrateAgentMemory(),
  };

  localStorage.setItem(MIGRATION_KEY, 'true');

  return results;
}

export function clearMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
}