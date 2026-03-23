# Server-First Agent Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken AI agent by switching from WebContainer to server-side execution, making the agent actually create files, run commands, install packages, and start dev servers.

**Architecture:** Server-first hybrid — agent runs on server (`/api/agent` with `spawn()`), files live on server disk (`project-workspace/`), terminal connects via WebSocket, preview shows dev server in iframe. WebContainer removed entirely.

**Tech Stack:** Express + child_process.spawn (server), React + SSE parsing (frontend), xterm.js + WebSocket (terminal), ws package (WebSocket server), Qwen 3.5 Plus (AI model)

**Spec:** `docs/superpowers/specs/2026-03-23-server-first-agent-redesign.md`

---

## File Structure

### Files to create
| File | Responsibility |
|------|---------------|
| (none — all changes go into existing files) | |

### Files to rewrite
| File | Responsibility |
|------|---------------|
| `src/hooks/useAgent.ts` | SSE stream consumer, agent UI state |
| `src/services/api.ts` | REST API calls to server (no WebContainer) |
| `src/hooks/useFiles.ts` | Server-based file management |
| `src/components/TerminalPanel.tsx` | Two-tab terminal (agent output + interactive WebSocket) |
| `src/components/PreviewPanel.tsx` | iframe to server dev server |

### Files to modify
| File | What changes |
|------|-------------|
| `server.ts` | COEP/COOP removal, GET /api/files fix, spawn() for run_command/install_package, new system prompt, ProcessManager, WebSocket terminal, list_files skip list |
| `src/App.tsx` | Remove WebContainer scaffold, update template buttons |
| `src/components/FileExplorer.tsx` | Display basename from full path |
| `src/components/ChatPanel.tsx` | Update Turkish file regex to English pattern |
| `src/utils/export.ts` | Use server /api/export instead of WebContainer |
| `src/services/autocomplete.ts` | Replace WebContainer import with fetch-based getCodeContext |
| `package.json` | Remove @webcontainer/api, add ws |

### Files to delete
| File | Reason |
|------|--------|
| `src/lib/webcontainer.ts` | WebContainer removed |
| `src/hooks/useEnhancedAgent.ts` | Unused |
| `src/components/TerminalSession.tsx` | Replaced by TerminalPanel rewrite |

---

## Task 1: Server Foundation — Headers + File API Fix

**Files:**
- Modify: `server.ts:48-53` (COEP/COOP headers)
- Modify: `server.ts:817-844` (GET /api/files)

- [ ] **Step 1: Remove COEP/COOP headers**

In `server.ts`, delete lines 48-53:

```typescript
// DELETE THIS ENTIRE BLOCK:
// COOP/COEP Headers for WebContainer API
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
```

- [ ] **Step 2: Fix GET /api/files — full paths + skip list**

Replace the `GET /api/files` handler. Key changes:
- `name: entry.name` → `name: relPath` (full relative path)
- Add skip list: `node_modules`, `dist`, `build`, `.next` (not just `.git`)
- Normalize path separators to forward slashes (Windows compat)

```typescript
app.get("/api/files", async (req, res) => {
  try {
    const files: any[] = [];
    const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next']);

    async function readDirRecursive(dir: string, relativePath: string = "") {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (SKIP.has(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await readDirRecursive(fullPath, relPath);
        } else {
          const content = await fs.readFile(fullPath, "utf-8");
          files.push({
            id: relPath,
            name: relPath,  // FIXED: full relative path, not basename
            content,
            language: detectLanguage(entry.name),
          });
        }
      }
    }
    await readDirRecursive(WORKSPACE_DIR);
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Verify server starts**

Run: `npx tsx server.ts`
Expected: Server starts without errors. `GET /api/files` returns files with full relative paths as `name`.

- [ ] **Step 4: Commit**

```bash
git add server.ts
git commit -m "fix: remove COEP/COOP headers, fix GET /api/files to use full paths"
```

---

## Task 2: Server — Replace exec() with spawn() in /api/agent

**Files:**
- Modify: `server.ts:664-683` (run_command handler)
- Modify: `server.ts:745-766` (install_package handler)
- Modify: `server.ts:687-699` (list_files skip list)

- [ ] **Step 1: Add spawn-based command runner helper**

Add this helper function near the top of `server.ts` (after the `safePath` function, around line 35):

```typescript
const IS_WINDOWS = process.platform === 'win32';

function spawnCommand(command: string, cwd: string, options: {
  timeout?: number;
  onData?: (chunk: string) => void;
}): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const shell = IS_WINDOWS ? 'cmd' : 'sh';
    const shellArgs = IS_WINDOWS ? ['/c', command] : ['-c', command];

    const child = spawn(shell, shellArgs, {
      cwd,
      env: { ...process.env, FORCE_COLOR: '0', CI: 'true', NONINTERACTIVE: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    const timeout = options.timeout || 120000;
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout / 1000}s`));
    }, timeout);

    child.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      options.onData?.(chunk);
    });

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      options.onData?.(chunk);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ output: output || '(no output)', exitCode: code ?? 1 });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
```

- [ ] **Step 2: Add dev server spawn helper + ProcessManager**

Add below the `spawnCommand` helper:

```typescript
// --- Process Manager for long-running dev servers ---
const managedProcesses = new Map<number, { pid: number; command: string; port?: number; process: any; spawnedAt: number }>();

function killManagedProcess(pid: number) {
  const entry = managedProcesses.get(pid);
  if (entry) {
    try { entry.process.kill('SIGTERM'); } catch {}
    managedProcesses.delete(pid);
  }
}

function killAllManagedProcesses() {
  for (const [pid] of managedProcesses) {
    killManagedProcess(pid);
  }
}

function killProcessOnPort(port: number) {
  for (const [pid, entry] of managedProcesses) {
    if (entry.port === port) {
      killManagedProcess(pid);
      return;
    }
  }
}

// Cleanup on server shutdown
process.on('SIGTERM', killAllManagedProcesses);
process.on('SIGINT', killAllManagedProcesses);

const DEV_SERVER_PATTERN = /(npm run dev|npm run start|npx vite|next dev|node server|nodemon)/i;
const PORT_PATTERN = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)|port\s+(\d+)|http:\/\/[^:]+:(\d+)/i;

function spawnDevServer(command: string, cwd: string, options: {
  onData?: (chunk: string) => void;
  onPort?: (port: number) => void;
}): Promise<{ output: string; port?: number }> {
  return new Promise((resolve) => {
    const shell = IS_WINDOWS ? 'cmd' : 'sh';
    const shellArgs = IS_WINDOWS ? ['/c', command] : ['-c', command];

    const child = spawn(shell, shellArgs, {
      cwd,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let detectedPort: number | undefined;
    let resolved = false;

    const entry = { pid: child.pid!, command, process: child, spawnedAt: Date.now() };
    managedProcesses.set(child.pid!, entry);

    child.on('error', (err) => {
      if (!resolved) { resolved = true; resolve({ output: `Spawn error: ${err.message}`, port: undefined }); }
    });

    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve({ output, port: detectedPort });
    };

    // Auto-resolve after 30s even if no port detected
    const timer = setTimeout(finish, 30000);

    const handleData = (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      options.onData?.(chunk);

      if (!detectedPort) {
        const match = chunk.match(PORT_PATTERN);
        if (match) {
          detectedPort = parseInt(match[1] || match[2] || match[3]);
          entry.port = detectedPort;
          options.onPort?.(detectedPort);
          clearTimeout(timer);
          // Give a moment for server to be fully ready
          setTimeout(finish, 1000);
        }
      }
    };

    child.stdout.on('data', handleData);
    child.stderr.on('data', handleData);

    child.on('close', () => {
      managedProcesses.delete(child.pid!);
      clearTimeout(timer);
      finish();
    });
  });
}
```

- [ ] **Step 3: Replace run_command handler with spawn()**

Replace the `run_command` handler in the agent loop (server.ts around line 664):

```typescript
} else if (toolCall.function.name === 'run_command') {
  send({ type: 'command_start', command: args.command });
  try {
    if (DEV_SERVER_PATTERN.test(args.command)) {
      // Long-running dev server — spawn as background process
      const { output, port } = await spawnDevServer(args.command, WORKSPACE_DIR, {
        onData: (chunk) => send({ type: 'command_output', command: args.command, output: chunk }),
        onPort: (p) => send({ type: 'server_started', port: p }),
      });
      result = port
        ? `Dev server started on port ${port}. Output: ${output.slice(-500)}`
        : `Server started but port not detected. Output: ${output.slice(-500)}`;
    } else {
      // Short-lived command — wait for completion
      const { output, exitCode } = await spawnCommand(args.command, WORKSPACE_DIR, {
        timeout: 120000,
        onData: (chunk) => send({ type: 'command_output', command: args.command, output: chunk }),
      });
      result = exitCode === 0
        ? output.slice(-2000)
        : `Command failed (exit ${exitCode}): ${output.slice(-2000)}`;
    }
  } catch (cmdErr: any) {
    const errMsg = cmdErr.message || String(cmdErr);
    send({ type: 'command_output', command: args.command, output: errMsg, error: true });
    result = `Command error: ${errMsg}`;
  }
}
```

- [ ] **Step 4: Replace install_package handler with spawn()**

Replace the `install_package` handler (server.ts around line 745):

```typescript
} else if (toolCall.function.name === 'install_package') {
  const packages = args.packages.join(' ');
  const devFlag = args.dev ? '-D' : '';
  const command = `npm install ${devFlag} ${packages}`.trim();
  send({ type: 'command_start', command });
  try {
    const { output, exitCode } = await spawnCommand(command, WORKSPACE_DIR, {
      timeout: 120000,
      onData: (chunk) => send({ type: 'command_output', command, output: chunk }),
    });
    result = exitCode === 0 ? output.slice(-2000) : `Install failed (exit ${exitCode}): ${output.slice(-2000)}`;
  } catch (cmdErr: any) {
    const errMsg = cmdErr.message || String(cmdErr);
    send({ type: 'command_output', command, output: errMsg, error: true });
    result = `Install error: ${errMsg}`;
  }
}
```

- [ ] **Step 5: Fix list_files skip list**

Replace the `list_files` handler skip list (server.ts around line 692):

```typescript
// Change this line:
if (e.name === '.git' || e.name === 'node_modules') continue;
// To:
const LIST_SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next']);
// And use:
if (LIST_SKIP.has(e.name)) continue;
```

- [ ] **Step 6: Add ProcessManager API endpoints**

Add after the file API endpoints (after line 869):

```typescript
// --- Process Manager API ---
app.get("/api/processes", (req, res) => {
  const processes = Array.from(managedProcesses.values()).map(p => ({
    pid: p.pid, command: p.command, port: p.port, spawnedAt: p.spawnedAt
  }));
  res.json({ processes });
});

app.delete("/api/processes/:pid", (req, res) => {
  const pid = parseInt(req.params.pid);
  if (managedProcesses.has(pid)) {
    killManagedProcess(pid);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Process not found" });
  }
});
```

- [ ] **Step 7: Verify server starts with new spawn logic**

Run: `npx tsx server.ts`
Expected: Server starts without errors.

- [ ] **Step 8: Commit**

```bash
git add server.ts
git commit -m "feat: replace exec() with spawn() for streaming output, add ProcessManager"
```

---

## Task 3: Server — Update System Prompt + Persona Detection

**Files:**
- Modify: `server.ts:578-589` (system prompt)
- Modify: `server.ts:342-354` (persona detection)

- [ ] **Step 1: Replace system prompt**

Replace the system prompt construction in the agent handler (server.ts around line 578):

```typescript
const systemPrompt = {
  role: 'system',
  content: contextPrompt +
    'You are a full-stack development environment running on a real server.\n\n' +
    'ENVIRONMENT:\n' +
    '- CWD: project-workspace/\n' +
    '- Real Node.js runtime, real npm/npx, real filesystem\n' +
    '- All shell commands work natively\n\n' +
    'RULES:\n' +
    '1. Always build REAL applications (React/Next.js/Vite + TypeScript + Tailwind)\n' +
    '2. First use run_command to scaffold: npx create-vite@latest . --template react-ts\n' +
    '3. Then use create_file to build components in src/ directory\n' +
    '4. Use install_package for dependencies\n' +
    '5. Run npm run dev to start the dev server\n' +
    '6. After creating .ts/.tsx/.js/.jsx files, run npx tsc --noEmit to verify — fix errors immediately\n\n' +
    'DO NOT:\n' +
    '- Create plain HTML/JS mockup files\n' +
    '- Build mock/fake applications\n' +
    '- Put everything in a single file\n' +
    '- Skip error checking after creating code files'
};
```

- [ ] **Step 2: Switch persona detection to English**

Replace `detectPersona` function:

```typescript
function detectPersona(messages: any[]): string {
  const allContent = messages.map((m: any) => m.content || '').join(' ').toLowerCase();

  if (allContent.match(/(ui|ux|design|css|tailwind|frontend|react|component|styling|button|layout)/)) {
    return "ROLE: FRONTEND_EXPERT. You are a UI/UX specialist with expertise in modern animations, Tailwind CSS, and responsive design.";
  } else if (allContent.match(/(backend|server|api|database|sql|express|node|auth|security|docker|endpoint)/)) {
    return "ROLE: BACKEND_EXPERT. You are a systems architect with expertise in Express, Node.js, databases, and performance optimization.";
  } else if (allContent.match(/(bug|error|fix|debug|crash|fail)/)) {
    return "ROLE: DEBUG_EXPERT. You are a systematic problem solver who finds root causes, not symptoms.";
  }
  return "ROLE: FULLSTACK_ORCHESTRATOR. You are the lead architect for building applications from scratch.";
}
```

- [ ] **Step 3: Commit**

```bash
git add server.ts
git commit -m "feat: update system prompt for server environment, switch persona to English"
```

---

## Task 4: Server — WebSocket Terminal Endpoint

**Files:**
- Modify: `server.ts` (add WebSocket upgrade)
- Modify: `package.json` (add `ws` dependency)

- [ ] **Step 1: Install ws package**

Run: `npm install ws && npm install -D @types/ws`

- [ ] **Step 2: Add WebSocket terminal endpoint**

Add at the top of `server.ts`, with other imports:

```typescript
import { WebSocketServer } from 'ws';
```

Add at the bottom of `startServer()`, before `app.listen()`:

```typescript
// --- WebSocket Terminal ---
const server = app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/api/terminal' });

wss.on('connection', (ws) => {
  const shell = IS_WINDOWS ? 'powershell.exe' : 'bash';
  const child = spawn(shell, [], {
    cwd: WORKSPACE_DIR,
    env: { ...process.env, TERM: 'xterm-256color' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data: Buffer) => {
    if (ws.readyState === ws.OPEN) ws.send(data.toString());
  });

  child.stderr.on('data', (data: Buffer) => {
    if (ws.readyState === ws.OPEN) ws.send(data.toString());
  });

  ws.on('message', (data: any) => {
    child.stdin.write(data.toString());
  });

  ws.on('close', () => {
    child.kill('SIGTERM');
  });

  child.on('close', () => {
    if (ws.readyState === ws.OPEN) ws.close();
  });
});
```

Also **remove** the existing `app.listen()` call at the bottom of the file (since we now use `server = app.listen()`).

- [ ] **Step 3: Verify server starts with WebSocket**

Run: `npx tsx server.ts`
Expected: Server starts, "Server ready at http://localhost:3000" logged.

- [ ] **Step 4: Commit**

```bash
git add server.ts package.json package-lock.json
git commit -m "feat: add WebSocket terminal endpoint using ws + child_process.spawn"
```

---

---

> **⚠️ Atomic Commit Warning (Tasks 5–11):** Tasks 5 through 11 form a tightly coupled set. Each task commits individually for traceability, but **intermediate commits between Tasks 5–10 will NOT compile** because imports/signatures change across files simultaneously. This is expected. TypeScript and build checks should only be run after Task 11 is complete. If using subagent-driven development, execute Tasks 5–11 as a single batch without running `tsc` between them.

---

## Task 5: Frontend — Rewrite api.ts (Remove WebContainer)

**Files:**
- Rewrite: `src/services/api.ts`

- [ ] **Step 1: Rewrite api.ts to use REST calls**

Replace the entire file:

```typescript
import type { FileItem } from '../types';

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
    py: 'python', go: 'go', rs: 'rust', java: 'java',
  };
  return map[ext || ''] || 'plaintext';
}

// --- File System API (REST) ---
export async function fetchFilesFromServer(): Promise<FileItem[] | null> {
  try {
    const res = await fetch('/api/files');
    if (!res.ok) return null;
    const data = await res.json();
    return data.files?.length > 0 ? data.files : null;
  } catch {
    return null;
  }
}

export async function saveFileToServer(id: string, content: string): Promise<void> {
  await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, content }),
  });
}

export async function deleteFileFromServer(id: string): Promise<void> {
  await fetch('/api/files', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

// --- Run Code API ---
export function runFileOnServer(id: string): Promise<Response> {
  return fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

// --- Git API ---
export async function gitInit(): Promise<void> { await fetch('/api/git/init', { method: 'POST' }); }
export async function gitGetStatus(): Promise<any> { const r = await fetch('/api/git/status'); if (!r.ok) throw new Error('Git status failed'); return r.json(); }
export async function gitStage(file: string): Promise<void> { await fetch('/api/git/stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) }); }
export async function gitUnstage(file: string): Promise<void> { await fetch('/api/git/unstage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) }); }
export async function gitCommit(message: string): Promise<void> { await fetch('/api/git/commit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) }); }
export async function gitSetRemote(url: string): Promise<void> { await fetch('/api/git/remote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }); }
export async function gitPush(): Promise<{ error?: string }> { const r = await fetch('/api/git/push', { method: 'POST' }); return r.json(); }
export async function gitPull(): Promise<{ error?: string }> { const r = await fetch('/api/git/pull', { method: 'POST' }); return r.json(); }

// --- AI Chat API ---
export function sendChatMessage(model: string, messages: any[], rest: any = {}): Promise<Response> {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, ...rest }),
  });
}

export function sendAgentRequest(model: string, messages: any[], mode: string): Promise<Response> {
  return fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, mode }),
  });
}

// --- Enhanced AI Endpoints ---
export async function aiAnalyzeCode(code: string, filename: string): Promise<any> { const r = await fetch('/api/ai/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, filename }) }); return r.json(); }
export async function aiGenerateTests(filename: string, testFramework = 'jest'): Promise<any> { const r = await fetch('/api/ai/generate-tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, testFramework }) }); return r.json(); }
export async function aiRefactorCode(filename: string, improvements: string[]): Promise<any> { const r = await fetch('/api/ai/refactor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, improvements }) }); return r.json(); }
export async function aiExplainCode(code: string, filename: string, detailLevel = 'intermediate'): Promise<any> { const r = await fetch('/api/ai/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, filename, detailLevel }) }); return r.json(); }
export async function aiDebugError(errorMessage: string, stackTrace: string, codeContext: string): Promise<any> { const r = await fetch('/api/ai/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errorMessage, stackTrace, codeContext }) }); return r.json(); }
export async function aiOptimizeCode(code: string, filename: string): Promise<any> { const r = await fetch('/api/ai/optimize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, filename }) }); return r.json(); }
```

- [ ] **Step 2: Verify no WebContainer imports remain**

Run: `grep -r "webcontainer\|getWebContainer" src/services/api.ts`
Expected: No matches.

- [ ] **Step 3: Commit**

```bash
git add src/services/api.ts
git commit -m "refactor: rewrite api.ts to use REST calls instead of WebContainer"
```

---

## Task 6: Frontend — Rewrite useFiles.ts

**Files:**
- Rewrite: `src/hooks/useFiles.ts`

> **Persistence Decision:** The original `useFiles.ts` called `saveProject()`/`loadProject()` from `src/utils/persistence.ts` to save files + chat to IndexedDB. With the server-first architecture, files live on server disk and survive refreshes automatically. Chat message persistence is dropped for now (low priority — can be re-added via server-side storage later). The `persistence.ts` file is left in place but unused; it will be cleaned up in Task 11.

- [ ] **Step 1: Rewrite useFiles.ts to use REST API**

Replace the entire file. Key changes:
- Remove all WebContainer imports and usage
- Remove `saveProject`/`loadProject`/`clearProject` imports (persistence now handled by server disk)
- `fetchFilesFromServer()` now returns REST data (already fixed in api.ts)
- Remove `applyFileFromAgent()` — replaced by `refreshFiles()` callback
- Add `isAgentRunning` state for adaptive polling (3s vs 10s)

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileItem, LogEntry } from '../types';
import { detectLanguage } from '../constants';
import { fetchFilesFromServer, saveFileToServer, deleteFileFromServer, runFileOnServer } from '../services/api';

function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as unknown as T;
}

export function useFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<LogEntry[]>([
    { type: 'info', text: '$ Terminal ready' }
  ]);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  const activeFile = files.find(f => f.id === activeTabId);

  const debouncedSave = useDebouncedCallback(async (id: string, content: string) => {
    try {
      await saveFileToServer(id, content);
      setDirtyFileIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    } catch (e) {
      console.error("Failed to save file", e);
    }
  }, 500);

  const saveFileToBackend = useCallback(async (id: string, content: string) => {
    try { await saveFileToServer(id, content); } catch (e) { console.error("Failed to save file", e); }
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const serverFiles = await fetchFilesFromServer();
      if (serverFiles && serverFiles.length > 0) {
        setFiles(prevFiles => {
          const isSame = prevFiles.length === serverFiles.length &&
            prevFiles.every((f, i) => f.id === serverFiles[i].id);
          if (isSame) {
            let hasContentChange = false;
            const updated = prevFiles.map(localFile => {
              const serverFile = serverFiles.find(sf => sf.id === localFile.id);
              if (serverFile && serverFile.content !== localFile.content) {
                if (activeTabId === localFile.id) return localFile;
                hasContentChange = true;
                return { ...localFile, content: serverFile.content };
              }
              return localFile;
            });
            return hasContentChange ? updated : prevFiles;
          }
          return serverFiles;
        });
      } else if (serverFiles && serverFiles.length === 0) {
        setFiles([]);
        setOpenTabs([]);
        setActiveTabId('');
      }
    } catch (e) {
      console.error("Failed to fetch files", e);
    }
  }, [activeTabId]);

  // Adaptive polling: 3s while agent running, 10s idle
  useEffect(() => {
    fetchFiles();
    const interval = isAgentRunning ? 3000 : 10000;
    const id = setInterval(fetchFiles, interval);
    return () => clearInterval(id);
  }, [fetchFiles, isAgentRunning]);

  const handleFileChange = useCallback((newContent: string) => {
    setFiles(prev => prev.map(f => f.id === activeTabId ? { ...f, content: newContent } : f));
    setDirtyFileIds(prev => new Set(prev).add(activeTabId));
    debouncedSave(activeTabId, newContent);
  }, [activeTabId, debouncedSave]);

  const openFile = useCallback((id: string) => {
    setOpenTabs(prev => prev.includes(id) ? prev : [...prev, id]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== id);
      if (activeTabId === id) setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : '');
      return newTabs;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((id: string) => { setOpenTabs([id]); setActiveTabId(id); }, []);
  const closeAllTabs = useCallback(() => { setOpenTabs([]); setActiveTabId(''); }, []);

  const handleCreateFile = useCallback((templates: Record<string, { content: string; defaultExt: string }>) => {
    if (!newFileName.trim()) { setIsCreatingFile(false); setSelectedTemplate(null); return; }
    const content = selectedTemplate && templates[selectedTemplate] ? templates[selectedTemplate].content : '';
    const newFile: FileItem = {
      id: newFileName.trim(), name: newFileName.trim(),
      language: detectLanguage(newFileName.trim()), content,
      createdAt: Date.now(), updatedAt: Date.now()
    };
    setFiles(prev => [...prev, newFile]);
    setOpenTabs(prev => [...prev, newFile.id]);
    setActiveTabId(newFile.id);
    setNewFileName(''); setIsCreatingFile(false); setSelectedTemplate(null);
    saveFileToBackend(newFile.id, content);
  }, [newFileName, selectedTemplate, saveFileToBackend]);

  const handleDeleteFile = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteFileFromServer(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      setOpenTabs(prev => {
        const newTabs = prev.filter(t => t !== id);
        if (activeTabId === id) setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : '');
        return newTabs;
      });
    } catch (err) { console.error("Failed to delete file", err); }
  }, [activeTabId]);

  const runCode = useCallback(async () => {
    if (!activeFile) { setIsTerminalOpen(true); setTerminalOutput(prev => [...prev, { type: 'error', text: 'No file selected.' }]); return; }
    if (activeFile.language !== 'javascript' && activeFile.language !== 'typescript') {
      setIsTerminalOpen(true); setTerminalOutput(prev => [...prev, { type: 'error', text: `Cannot execute ${activeFile.language} files.` }]); return;
    }
    setIsTerminalOpen(true);
    setTerminalOutput([{ type: 'info', text: `> Executing ${activeFile.name}...` }]);
    try {
      const response = await runFileOnServer(activeFile.id);
      if (!response.ok) { const err = await response.json(); setTerminalOutput(prev => [...prev, { type: 'error', text: `Error: ${err.error}` }]); return; }
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'exit') setTerminalOutput(prev => [...prev, { type: 'info', text: `> Finished with code ${data.code}.` }]);
              else setTerminalOutput(prev => [...prev, { type: data.type, text: data.text.trimEnd() }]);
            } catch {}
          }
        }
      }
    } catch (err: any) { setTerminalOutput(prev => [...prev, { type: 'error', text: err.toString() }]); }
  }, [activeFile]);

  return {
    files, setFiles, openTabs, setOpenTabs, activeTabId, setActiveTabId,
    dirtyFileIds, activeFile, isTerminalOpen, setIsTerminalOpen,
    terminalOutput, setTerminalOutput, isCreatingFile, setIsCreatingFile,
    newFileName, setNewFileName, selectedTemplate, setSelectedTemplate,
    selectedCode, setSelectedCode, isAgentRunning, setIsAgentRunning,
    handleFileChange, openFile, closeTab, closeOtherTabs, closeAllTabs,
    handleCreateFile, handleDeleteFile, runCode, fetchFiles, saveFileToBackend,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useFiles.ts
git commit -m "refactor: rewrite useFiles to use REST API instead of WebContainer"
```

---

## Task 7: Frontend — Rewrite useAgent.ts (SSE Stream)

**Files:**
- Rewrite: `src/hooks/useAgent.ts`

- [ ] **Step 1: Rewrite useAgent.ts**

Replace the entire file. Key changes:
- Use `sendAgentRequest()` which POSTs to `/api/agent`
- Parse SSE stream from response
- Call `fetchFiles()` on file events instead of `applyFileFromAgent`
- Expose `terminalLines` for agent output terminal tab
- Expose `previewPort` for auto-preview

```typescript
import { useState, useCallback, useRef } from 'react';
import type { ChatMessage } from '../types';
import { sendAgentRequest } from '../services/api';

export function useAgent(
  alibabaModel: string,
  setChatMessages: (fn: React.SetStateAction<ChatMessage[]>) => void,
  setIsGenerating: (val: boolean) => void,
  fetchFiles: () => Promise<void>,
  setIsAgentRunning: (val: boolean) => void,
  onComplete?: () => void,
) {
  const [agentMode, setAgentMode] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [previewPort, setPreviewPort] = useState<number | null>(null);
  const conversationRef = useRef<any[]>([]);

  const sendAgentMessage = useCallback(async (text: string, mode: 'agent' | 'plan') => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text }]);
    setIsGenerating(true);
    setIsAgentRunning(true);
    setAgentStatus(mode === 'plan' ? 'Generating plan...' : 'Agent running...');
    setTerminalLines([]);

    // Build conversation for server
    conversationRef.current.push({ role: 'user', content: text });

    const modelMsgId = (Date.now() + 1).toString();
    setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

    try {
      const response = await sendAgentRequest(
        alibabaModel || 'qwen-plus',
        conversationRef.current,
        mode
      );

      if (!response.ok) {
        const err = await response.text();
        setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: `❌ Error: ${err}` } : m));
        return;
      }

      // Parse SSE stream
      if (!response.body) {
        setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: 'Error: No response body' } : m));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case 'plan':
              case 'text':
                fullText += (event.content || '') + '\n';
                setChatMessages(prev => prev.map(m =>
                  m.id === modelMsgId ? { ...m, text: fullText } : m
                ));
                break;

              case 'tool_call':
                setAgentStatus(`⚙️ ${event.tool}: ${event.filename || ''}`);
                break;

              case 'file_created':
                setChatMessages(prev => prev.map(m =>
                  m.id === modelMsgId ? { ...m, text: m.text + `\n✅ Created: **${event.filename}**\n` } : m
                ));
                fullText += `\n✅ Created: **${event.filename}**\n`;
                fetchFiles();
                break;

              case 'file_edited':
                setChatMessages(prev => prev.map(m =>
                  m.id === modelMsgId ? { ...m, text: m.text + `\n✏️ Edited: **${event.filename}**\n` } : m
                ));
                fullText += `\n✏️ Edited: **${event.filename}**\n`;
                fetchFiles();
                break;

              case 'file_deleted':
                setChatMessages(prev => prev.map(m =>
                  m.id === modelMsgId ? { ...m, text: m.text + `\n🗑️ Deleted: **${event.filename}**\n` } : m
                ));
                fullText += `\n🗑️ Deleted: **${event.filename}**\n`;
                fetchFiles();
                break;

              case 'command_start':
                setAgentStatus(`▶ ${event.command}`);
                setTerminalLines(prev => [...prev, `$ ${event.command}`]);
                break;

              case 'command_output':
                setTerminalLines(prev => [...prev, event.output]);
                break;

              case 'server_started':
                setPreviewPort(event.port);
                setChatMessages(prev => prev.map(m =>
                  m.id === modelMsgId ? { ...m, text: m.text + `\n🌐 Dev server started on port **${event.port}**\n` } : m
                ));
                fullText += `\n🌐 Dev server started on port **${event.port}**\n`;
                break;

              case 'error':
                setChatMessages(prev => prev.map(m =>
                  m.id === modelMsgId ? { ...m, text: m.text + `\n❌ ${event.content}\n` } : m
                ));
                fullText += `\n❌ ${event.content}\n`;
                break;

              case 'done':
                break;
            }
          } catch {}
        }
      }

      // Save assistant response to conversation history
      if (fullText.trim()) {
        conversationRef.current.push({ role: 'assistant', content: fullText });
      }

      setAgentStatus('Completed');
    } catch (err: any) {
      setChatMessages(prev => prev.map(m =>
        m.id === modelMsgId ? { ...m, text: `❌ Error: ${err.message}` } : m
      ));
    } finally {
      setIsGenerating(false);
      setIsAgentRunning(false);
      onComplete?.();
      setTimeout(() => setAgentStatus(''), 4000);
    }
  }, [alibabaModel, setChatMessages, setIsGenerating, setIsAgentRunning, fetchFiles, onComplete]);

  const clearConversation = useCallback(() => {
    conversationRef.current = [];
  }, []);

  return {
    agentMode, setAgentMode,
    planMode, setPlanMode,
    agentStatus,
    terminalLines,
    previewPort, setPreviewPort,
    sendAgentMessage,
    clearConversation,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAgent.ts
git commit -m "feat: rewrite useAgent to consume SSE from /api/agent endpoint"
```

---

## Task 8: Frontend — Rewrite TerminalPanel.tsx

**Files:**
- Rewrite: `src/components/TerminalPanel.tsx`
- Delete: `src/components/TerminalSession.tsx`

- [ ] **Step 1: Rewrite TerminalPanel with two tabs**

Replace the entire file. Two tabs: "Agent Output" (read-only log) and "Terminal" (WebSocket xterm.js).

```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, TerminalSquare, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalPanelProps {
  onClose: () => void;
  agentTerminalLines?: string[];
  isAgentRunning?: boolean;
}

const TerminalPanel = React.memo(function TerminalPanel({
  onClose, agentTerminalLines = [], isAgentRunning = false,
}: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<'agent' | 'terminal'>('terminal');
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const agentLogRef = useRef<HTMLDivElement>(null);

  // Auto-switch to agent tab when agent starts
  useEffect(() => {
    if (isAgentRunning) setActiveTab('agent');
  }, [isAgentRunning]);

  // Auto-scroll agent log
  useEffect(() => {
    if (agentLogRef.current) {
      agentLogRef.current.scrollTop = agentLogRef.current.scrollHeight;
    }
  }, [agentTerminalLines]);

  // Setup interactive terminal with WebSocket
  useEffect(() => {
    if (!terminalRef.current) return;

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    const terminal = new Terminal({
      theme: { background: 'transparent', foreground: '#F1F5F9' },
      fontFamily: 'monospace', fontSize: 13, cursorBlink: true, convertEol: true,
    });
    xtermRef.current = terminal;
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);

    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch {}
    });
    resizeObserver.observe(terminalRef.current);

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/terminal`);
    wsRef.current = ws;

    ws.onopen = () => terminal.write('\x1b[32mTerminal connected.\x1b[0m\r\n');
    ws.onmessage = (e) => terminal.write(e.data);
    ws.onclose = () => terminal.write('\r\n\x1b[31mTerminal disconnected.\x1b[0m\r\n');
    ws.onerror = () => terminal.write('\r\n\x1b[31mConnection error.\x1b[0m\r\n');

    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      ws.close();
    };
  }, []);

  // Re-fit on tab switch
  useEffect(() => {
    if (activeTab === 'terminal' && fitAddonRef.current) {
      setTimeout(() => { try { fitAddonRef.current?.fit(); } catch {} }, 50);
    }
  }, [activeTab]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 280, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="border-t border-white/[0.06] bg-background/60 backdrop-blur-md flex flex-col shrink-0 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
              activeTab === 'agent' ? 'bg-white/[0.06] text-text/70' : 'text-text/30 hover:text-text/50'
            }`}
          >
            <Bot size={12} />
            Agent Output
            {isAgentRunning && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all ${
              activeTab === 'terminal' ? 'bg-white/[0.06] text-text/70' : 'text-text/30 hover:text-text/50'
            }`}
          >
            <TerminalSquare size={12} />
            Terminal
          </button>
        </div>
        <button onClick={onClose} className="p-1 text-text/20 hover:text-text/50 cursor-pointer transition-all rounded-md hover:bg-white/[0.04]" title="Close">
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 w-full overflow-hidden relative">
        {/* Agent Output Tab */}
        <div ref={agentLogRef} className={`absolute inset-0 overflow-auto p-3 font-mono text-xs ${activeTab === 'agent' ? 'block' : 'hidden'}`}>
          {agentTerminalLines.length === 0 ? (
            <span className="text-text/20">Agent output will appear here...</span>
          ) : (
            agentTerminalLines.map((line, i) => (
              <div key={i} className={`whitespace-pre-wrap ${line.startsWith('$') ? 'text-primary' : 'text-text/60'}`}>{line}</div>
            ))
          )}
        </div>

        {/* Interactive Terminal Tab */}
        <div className={`absolute inset-0 p-2 ${activeTab === 'terminal' ? 'block' : 'hidden'}`} ref={terminalRef} />
      </div>
    </motion.div>
  );
});

export default TerminalPanel;
```

- [ ] **Step 2: Delete TerminalSession.tsx**

Run: `rm src/components/TerminalSession.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/TerminalPanel.tsx
git rm src/components/TerminalSession.tsx
git commit -m "feat: rewrite TerminalPanel with agent output + WebSocket interactive tabs"
```

---

## Task 9: Frontend — Rewrite PreviewPanel.tsx

**Files:**
- Rewrite: `src/components/PreviewPanel.tsx`

- [ ] **Step 1: Rewrite PreviewPanel**

Key changes:
- Remove `wc-server-ready` event listener
- Accept `previewPort` prop
- Remove 3-second auto-refresh
- Show "no dev server" message when port is null

```typescript
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, ExternalLink, X, Globe, Maximize2, Minimize2, Smartphone, Tablet as TabletIcon, Monitor } from 'lucide-react';

interface PreviewPanelProps {
  onClose: () => void;
  previewPort?: number | null;
}

const PreviewPanel = React.memo(function PreviewPanel({ onClose, previewPort }: PreviewPanelProps) {
  const previewUrl = previewPort ? `http://localhost:${previewPort}` : null;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleOpenExternal = () => {
    if (previewUrl) window.open(previewUrl, '_blank');
  };

  const viewportButtons = (
    <div className="flex items-center gap-1.5 px-3 border-x border-white/10 mx-2">
      {(['mobile', 'tablet', 'desktop'] as const).map(mode => (
        <button key={mode} onClick={() => setViewportMode(mode)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewportMode === mode ? 'bg-primary/20 text-primary' : 'text-text/40 hover:text-text hover:bg-white/5'}`}
          title={`${mode} view`}
        >
          {mode === 'mobile' ? <Smartphone size={14} /> : mode === 'tablet' ? <TabletIcon size={14} /> : <Monitor size={14} />}
        </button>
      ))}
    </div>
  );

  const actionButtons = (
    <div className="flex items-center gap-1.5">
      <button onClick={handleRefresh} className="p-1.5 text-text/50 hover:text-text hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="Refresh"><RefreshCcw size={14} /></button>
      <button onClick={handleOpenExternal} className="p-1.5 text-text/50 hover:text-text hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="Open in new tab"><ExternalLink size={14} /></button>
      <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-text/50 hover:text-text hover:bg-white/10 rounded-lg transition-colors cursor-pointer" title="Toggle fullscreen">
        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
      <button onClick={onClose} className="p-1.5 text-text/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Close"><X size={14} /></button>
    </div>
  );

  const noPreview = (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <Globe size={32} className="text-text/15" />
      <p className="text-sm text-text/30">No preview available</p>
      <p className="text-xs text-text/15">Run a dev server to see live preview</p>
    </div>
  );

  const iframeContent = previewUrl ? (
    <iframe ref={iframeRef} key={refreshKey} src={previewUrl}
      className="w-full h-full border-none" title="Live Preview" />
  ) : noPreview;

  if (isFullscreen) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center gap-3 px-4 py-2 bg-background/80 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-primary"><Globe size={16} /><span className="text-xs font-semibold uppercase tracking-wider">Live Preview</span></div>
          {previewUrl && <span className="text-xs text-text/30 flex-1 text-center">{previewUrl}</span>}
          {viewportButtons}
          {actionButtons}
        </div>
        <div className="flex-1 w-full flex items-center justify-center p-8 overflow-hidden bg-black/20">
          <motion.div animate={{ width: viewportMode === 'mobile' ? 375 : viewportMode === 'tablet' ? 768 : '100%', height: viewportMode === 'desktop' ? '100%' : '812px' }}
            className="bg-white rounded-xl shadow-2xl overflow-hidden border border-white/10">
            {iframeContent}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 350, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
      className="border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-background/40 shrink-0">
        <div className="flex items-center gap-2 text-primary"><Globe size={14} /><span className="text-xs font-semibold uppercase tracking-wider">Live Preview</span></div>
        {previewUrl && <span className="text-xs text-text/30 flex-1 text-center">{previewUrl}</span>}
        <div className="flex-1" />
        {actionButtons}
      </div>
      {previewUrl ? (
        <iframe ref={iframeRef} key={refreshKey} src={previewUrl} className="flex-1 w-full border-none bg-white" title="Live Preview" />
      ) : noPreview}
    </motion.div>
  );
});

export default PreviewPanel;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PreviewPanel.tsx
git commit -m "feat: rewrite PreviewPanel to use server dev server port instead of WebContainer"
```

---

## Task 10: Frontend — Update App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update useAgent hook call (new signature)**

The `useAgent` signature changed — no longer takes `applyFileFromAgent` or `files`, instead takes `fetchFiles` and `setIsAgentRunning`.

Replace the `useAgent` call (around line 111):

```typescript
const agentHook = useAgent(
  alibabaModel,
  chatHook.setChatMessages,
  chatHook.setIsGenerating,
  fileHook.fetchFiles,
  fileHook.setIsAgentRunning,
);
```

- [ ] **Step 2: Remove WebContainer scaffold function**

Delete the `handleSelectTemplate` function (lines 79-91) and replace template buttons. Replace the template button section (around line 516-537):

```typescript
<button
  onClick={() => agentHook.sendAgentMessage('Create a new React + TypeScript + Vite project with Tailwind CSS. Scaffold it, install dependencies, and start the dev server.', 'agent')}
  className="glass-panel px-5 py-3.5 rounded-xl hover:bg-white/[0.06] transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
>
  <span className="text-sm text-primary font-semibold group-hover:text-primary/80">React</span>
  <span className="text-[10px] text-text/25">Vite + Tailwind</span>
</button>
<button
  onClick={() => agentHook.sendAgentMessage('Create a new Next.js project with TypeScript, Tailwind CSS, and App Router. Scaffold it, install dependencies, and start the dev server.', 'agent')}
  className="glass-panel px-5 py-3.5 rounded-xl hover:bg-white/[0.06] transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
>
  <span className="text-sm text-text/70 font-semibold group-hover:text-text/90">Next.js</span>
  <span className="text-[10px] text-text/25">Full-stack</span>
</button>
<button
  onClick={() => agentHook.sendAgentMessage('Create a new Node.js Express API project with TypeScript. Initialize package.json, install Express and TypeScript, create a basic server.', 'agent')}
  className="glass-panel px-5 py-3.5 rounded-xl hover:bg-white/[0.06] transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
>
  <span className="text-sm text-emerald-400 font-semibold group-hover:text-emerald-400/80">Node.js</span>
  <span className="text-[10px] text-text/25">Express API</span>
</button>
```

- [ ] **Step 3: Pass new props to TerminalPanel**

Update the TerminalPanel usage (around line 576):

```typescript
{fileHook.isTerminalOpen && (
  <TerminalPanel
    onClose={() => fileHook.setIsTerminalOpen(false)}
    agentTerminalLines={agentHook.terminalLines}
    isAgentRunning={fileHook.isAgentRunning}
  />
)}
```

- [ ] **Step 4: Pass previewPort to PreviewPanel**

Update PreviewPanel usage (around line 563):

```typescript
{isPreviewOpen && (
  <PreviewPanel
    onClose={() => setIsPreviewOpen(false)}
    previewPort={agentHook.previewPort}
  />
)}
```

- [ ] **Step 5: Auto-open preview when port detected**

Add a useEffect to auto-open preview:

```typescript
useEffect(() => {
  if (agentHook.previewPort) {
    setIsPreviewOpen(true);
  }
}, [agentHook.previewPort]);
```

- [ ] **Step 6: Remove unused imports**

Remove `Loader2` from imports if no longer used by `isScaffolding`. Remove `isScaffolding` state and `handleSelectTemplate`. Remove the WebContainer dynamic import.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: update App.tsx for new agent/terminal/preview architecture"
```

---

## Task 11: Cleanup — Remove WebContainer + Fix Minor Files

**Files:**
- Delete: `src/lib/webcontainer.ts`
- Delete: `src/hooks/useEnhancedAgent.ts`
- Modify: `src/utils/export.ts`
- Modify: `src/services/autocomplete.ts`
- Modify: `src/components/FileExplorer.tsx`
- Modify: `package.json`

- [ ] **Step 1: Delete WebContainer files**

```bash
rm src/lib/webcontainer.ts
rm src/hooks/useEnhancedAgent.ts
```

- [ ] **Step 2: Fix export.ts — use server endpoint**

Replace `src/utils/export.ts`:

```typescript
export async function exportWorkspaceAsZip() {
  try {
    const response = await fetch('/api/export');
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-studio-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export workspace:', error);
    alert('Export failed. Ensure the workspace has files.');
  }
}
```

- [ ] **Step 3: Fix autocomplete.ts — replace WebContainer with fetch**

In `src/services/autocomplete.ts`:

**Delete line 1:**
```typescript
// DELETE THIS LINE:
import { getWebContainer } from '@/src/lib/webcontainer'
```

**Replace the `getCodeContext` function (around line 189-197) with:**
```typescript
export async function getCodeContext(filename: string): Promise<string> {
  try {
    const res = await fetch('/api/files');
    if (!res.ok) return '';
    const data = await res.json();
    const file = data.files?.find((f: any) => f.id === filename);
    return file?.content || '';
  } catch {
    return '';
  }
}
```

- [ ] **Step 4: Fix FileExplorer.tsx — display basename**

In `src/components/FileExplorer.tsx`, find where `file.name` is displayed and change to show basename:

```typescript
// Where file names are rendered, use:
{file.name.split('/').pop() || file.name}
```

- [ ] **Step 5: Fix ChatPanel.tsx — update Turkish regex to English**

In `src/components/ChatPanel.tsx`, the `parseMessageContent` function (around line 55-80) uses a Turkish regex to detect file creation messages. The new agent outputs English patterns. Replace:

```typescript
// REPLACE THIS (line 57):
const fileRegex = /\n?\n?✅ \*\*(.+?)\*\* oluşturuldu/g;

// WITH:
const fileRegex = /\n?\n?✅ (?:Created|Edited|Deleted): \*\*(.+?)\*\*/g;
```

This matches the new English SSE event format from useAgent.ts: `✅ Created: **filename**`, `✏️ Edited: **filename**`, `🗑️ Deleted: **filename**`.

Also update the `file` part type rendering if it references the old Turkish text. Check for any hardcoded Turkish strings in the component.

- [ ] **Step 6: Remove unused persistence imports**

The `src/utils/persistence.ts` file and `src/hooks/useFiles.ts` no longer call `saveProject`/`loadProject`. Verify no other file imports from `persistence.ts`:

Run: `grep -r "persistence" src/ --include="*.ts" --include="*.tsx" -l`

If only the original `useFiles.ts` imported it (now rewritten without it), the file is dead code. Leave `persistence.ts` in place for now — it can be deleted in a future cleanup if confirmed unused.

- [ ] **Step 7: Remove @webcontainer/api from package.json**

Run: `npm uninstall @webcontainer/api`

- [ ] **Step 8: Check for any remaining WebContainer references**

Run: `grep -r "webcontainer\|getWebContainer\|wc-server-ready" src/ --include="*.ts" --include="*.tsx" -l`
Expected: No matches (except possibly test files handled in next task).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: remove WebContainer entirely, fix export/autocomplete/FileExplorer"
```

---

## Task 12: Cleanup — Fix Test Files

**Files:**
- Modify: `src/test/setup.ts`
- Modify: `src/test/hooks/useFiles.test.ts`

- [ ] **Step 1: Remove WebContainer mocks from test setup**

In `src/test/setup.ts`, remove the `vi.mock('@/lib/webcontainer', ...)` block.

- [ ] **Step 2: Update useFiles test**

In `src/test/hooks/useFiles.test.ts`, remove the `vi.mock('../../lib/webcontainer', ...)` block. Update tests to mock `fetch` instead of WebContainer.

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: Tests pass (or at least no WebContainer-related failures).

- [ ] **Step 4: Commit**

```bash
git add src/test/
git commit -m "test: remove WebContainer mocks, update tests for REST API"
```

---

## Task 13: Build Verification + End-to-End Test

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds without errors.

- [ ] **Step 3: Start server and verify**

Run: `npx tsx server.ts`
Then open `http://localhost:3000` in browser.

Verify:
1. File Explorer shows files from `project-workspace/`
2. Terminal panel opens with "Agent Output" and "Terminal" tabs
3. Interactive terminal connects and allows typing commands
4. Clicking "React" template button triggers agent
5. Agent creates files (visible in explorer)
6. Agent runs commands (visible in agent output terminal)
7. Preview opens when dev server starts

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: server-first agent redesign complete — full-stack agent working"
```
