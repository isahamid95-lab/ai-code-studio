const DB_NAME = 'ai-code-studio-db';
const DB_VERSION = 1;

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  isHidden?: boolean;
  displayText?: string;
  variant?: 'default' | 'plan';
}

export interface FileRecord {
  path: string;
  content: string;
  language: string;
  lastModified: number;
}

export interface SettingsRecord {
  id: string;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  leftPanelTab?: string;
  theme?: string;
  openTabs?: string[];
  activeTabId?: string | null;
}

export interface AgentMemoryRecord {
  id: string;
  key: string;
  value: string;
  createdAt: number;
  updatedAt: number;
}

interface DBSchema {
  chats: {
    key: string;
    value: ChatMessageRecord;
    indexes: { 'by-timestamp': number };
  };
  files: {
    key: string;
    value: FileRecord;
    indexes: { 'by-path': string; 'by-modified': number };
  };
  settings: {
    key: string;
    value: SettingsRecord;
  };
  agentMemory: {
    key: string;
    value: AgentMemoryRecord;
    indexes: { 'by-key': string };
  };
}

type StoreNames = keyof DBSchema;

class PersistenceDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          chatStore.createIndex('by-timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'path' });
          fileStore.createIndex('by-modified', 'lastModified');
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('agentMemory')) {
          const memoryStore = db.createObjectStore('agentMemory', { keyPath: 'id' });
          memoryStore.createIndex('by-key', 'key');
        }
      };
    });

    return this.initPromise;
  }

  async get<K extends StoreNames>(
    storeName: K,
    key: string
  ): Promise<DBSchema[K]['value'] | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set<K extends StoreNames>(
    storeName: K,
    value: DBSchema[K]['value']
  ): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete<K extends StoreNames>(
    storeName: K,
    key: string
  ): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll<K extends StoreNames>(
    storeName: K
  ): Promise<DBSchema[K]['value'][]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear<K extends StoreNames>(storeName: K): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getByIndex<K extends StoreNames>(
    storeName: K,
    indexName: string,
    value: IDBValidKey
  ): Promise<DBSchema[K]['value'][]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const db = new PersistenceDB();

export type { DBSchema, StoreNames };