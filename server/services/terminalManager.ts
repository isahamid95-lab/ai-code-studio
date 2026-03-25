import { EventEmitter } from 'events';

export interface TerminalSession {
  id: string;
  pid: number | null;
  createdAt: Date;
  lastActivity: Date;
  output: TerminalOutputLine[];
  status: 'active' | 'idle' | 'closed';
  cwd: string;
}

export interface TerminalOutputLine {
  id: string;
  type: 'stdout' | 'stderr' | 'system' | 'command';
  content: string;
  timestamp: number;
}

export interface TerminalCommand {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

class TerminalManager extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private maxOutputLines: number = 1000;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.startCleanupInterval();
  }

  createSession(id: string, cwd: string = process.cwd()): TerminalSession {
    const session: TerminalSession = {
      id,
      pid: null,
      createdAt: new Date(),
      lastActivity: new Date(),
      output: [],
      status: 'idle',
      cwd,
    };
    this.sessions.set(id, session);
    this.emit('session:created', session);
    return session;
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  updateSessionPid(id: string, pid: number): void {
    const session = this.sessions.get(id);
    if (session) {
      session.pid = pid;
      session.status = 'active';
      session.lastActivity = new Date();
      this.emit('session:updated', session);
    }
  }

  appendOutput(id: string, type: TerminalOutputLine['type'], content: string): void {
    const session = this.sessions.get(id);
    if (!session) return;

    const line: TerminalOutputLine = {
      id: `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      content,
      timestamp: Date.now(),
    };

    session.output.push(line);
    session.lastActivity = new Date();

    if (session.output.length > this.maxOutputLines) {
      session.output = session.output.slice(-this.maxOutputLines);
    }

    this.emit('output', { sessionId: id, line });
  }

  clearOutput(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.output = [];
      session.lastActivity = new Date();
      this.emit('output:cleared', id);
    }
  }

  closeSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.status = 'closed';
      session.lastActivity = new Date();
      this.emit('session:closed', session);
      this.sessions.delete(id);
    }
  }

  setSessionStatus(id: string, status: TerminalSession['status']): void {
    const session = this.sessions.get(id);
    if (session) {
      session.status = status;
      session.lastActivity = new Date();
      this.emit('session:updated', session);
    }
  }

  getOutputHistory(id: string, limit?: number): TerminalOutputLine[] {
    const session = this.sessions.get(id);
    if (!session) return [];
    
    if (limit && limit > 0) {
      return session.output.slice(-limit);
    }
    return [...session.output];
  }

  searchOutput(id: string, query: string): TerminalOutputLine[] {
    const session = this.sessions.get(id);
    if (!session) return [];

    const lowerQuery = query.toLowerCase();
    return session.output.filter((line) =>
      line.content.toLowerCase().includes(lowerQuery)
    );
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxIdleTime = 30 * 60 * 1000; // 30 minutes

      for (const [id, session] of this.sessions) {
        if (
          session.status === 'closed' ||
          now - session.lastActivity.getTime() > maxIdleTime
        ) {
          this.closeSession(id);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
    this.removeAllListeners();
  }
}

export const terminalManager = new TerminalManager();

export function formatTerminalOutput(lines: TerminalOutputLine[]): string {
  return lines
    .map((line) => {
      const prefix =
        line.type === 'stderr'
          ? '\x1b[31m'
          : line.type === 'system'
          ? '\x1b[36m'
          : line.type === 'command'
          ? '\x1b[33m'
          : '';
      const reset = prefix ? '\x1b[0m' : '';
      return `${prefix}${line.content}${reset}`;
    })
    .join('\n');
}

export function parseAnsiColors(text: string): string[] {
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  const lines: string[] = [];
  let currentLine = '';
  let lastIndex = 0;

  const matches = text.matchAll(/\n/g);
  let matchIndices = Array.from(matches, (m) => m.index);

  if (matchIndices.length === 0) {
    return [text];
  }

  matchIndices = [0, ...matchIndices, text.length];

  for (let i = 0; i < matchIndices.length - 1; i++) {
    const start = matchIndices[i];
    const end = matchIndices[i + 1];
    const line = text.slice(start, end).replace('\n', '');
    if (line || i > 0) {
      lines.push(line);
    }
  }

  return lines.length > 0 ? lines : [text];
}

export function detectCommandType(command: string): {
  type: 'npm' | 'node' | 'git' | 'shell' | 'unknown';
  risk: 'safe' | 'caution' | 'dangerous';
} {
  const trimmed = command.trim().toLowerCase();

  if (trimmed.startsWith('npm ') || trimmed.startsWith('yarn ') || trimmed.startsWith('pnpm ')) {
    if (trimmed.includes('rm') || trimmed.includes('uninstall')) {
      return { type: 'npm', risk: 'caution' };
    }
    return { type: 'npm', risk: 'safe' };
  }

  if (trimmed.startsWith('node ') || trimmed === 'node') {
    return { type: 'node', risk: 'safe' };
  }

  if (trimmed.startsWith('git ')) {
    if (trimmed.includes('push --force') || trimmed.includes('reset --hard')) {
      return { type: 'git', risk: 'dangerous' };
    }
    return { type: 'git', risk: 'caution' };
  }

  if (
    trimmed.includes('rm ') ||
    trimmed.includes('del ') ||
    trimmed.includes('format ') ||
    trimmed.includes('sudo ')
  ) {
    return { type: 'shell', risk: 'dangerous' };
  }

  return { type: 'shell', risk: 'safe' };
}