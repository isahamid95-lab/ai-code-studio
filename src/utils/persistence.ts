import type { ChatMessage } from '../types';

const DB_NAME = 'ai-code-studio';
const STORE_NAME = 'projects';
const DB_VERSION = 1;
const SNAPSHOT_KEY = 'ui-state';

export interface UiStateSnapshot {
  chatMessages?: ChatMessage[];
  openTabs?: string[];
  activeTabId?: string;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  leftPanelTab?: string;
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadUiState(): Promise<UiStateSnapshot | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(SNAPSHOT_KEY);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveUiState(partial: UiStateSnapshot): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(SNAPSHOT_KEY);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const current = (request.result || {}) as UiStateSnapshot;
      store.put({ ...current, ...partial, timestamp: Date.now() }, SNAPSHOT_KEY);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearUiState(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(SNAPSHOT_KEY);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
