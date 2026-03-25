export { db } from './db';
export { runMigrations, clearMigrationFlag } from './migration';
export type { 
  DBSchema, 
  StoreNames, 
  ChatMessageRecord, 
  FileRecord, 
  SettingsRecord, 
  AgentMemoryRecord 
} from './db';