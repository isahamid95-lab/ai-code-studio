# Server-First Agent Redesign

**Date:** 2026-03-23
**Status:** Approved
**Scope:** AI Agent, File System, Terminal, Preview — full architectural overhaul

---

## Problem Statement

The AI agent system in AI Code Studio Pro is fundamentally broken due to several architectural issues:

1. **Wrong endpoint**: `useAgent.ts` calls `/api/chat` (a dumb proxy) instead of `/api/agent` (the full agent loop with 9 tools). The `sendAgentRequest()` function exists but is never called.
2. **Dual filesystem conflict**: Agent writes files to WebContainer (browser virtual FS), but server operates on `project-workspace/`. The workspace context injected into prompts comes from the server FS, while the agent operates in WebContainer — the AI sees wrong context.
3. **File name inconsistency**: `fetchFilesFromServer` sets `name: entry.name` (basename only like `"App.tsx"`), while `applyFileFromAgent` sets `name: filename` (full path like `"src/App.tsx"`). This breaks deduplication and causes explorer display issues.
4. **Unreliable tool calling**: Qwen model receives tools via the chat proxy, which doesn't process tool_calls server-side. The client-side tool execution depends on WebContainer which fails silently.
5. **Silent WebContainer failures**: If WebContainer boot fails, all file and terminal operations break with no user feedback.

**Result:** Agent doesn't create files, doesn't run terminal commands, doesn't install packages, doesn't scaffold projects, doesn't start dev servers.

---

## Solution: Server-First Hybrid Architecture

### Core Principle
- **Agent + Files + Commands = Server** (real Node.js, real npm, real filesystem)
- **Preview = iframe to server dev server port**
- **WebContainer = removed entirely**

### Architecture Overview

```
User (Browser)
    |
    +-- ChatPanel --> useAgent (rewritten)
    |                   |
    |                   v
    |              POST /api/agent (SSE stream)
    |                   |
    |                   v
    |              Server Agent Loop (Qwen 3.5 Plus)
    |                   +-- create_file     --> project-workspace/ FS
    |                   +-- edit_file       --> project-workspace/ FS
    |                   +-- run_command     --> child_process.spawn() [streaming]
    |                   +-- install_package --> npm install
    |                   +-- delete_file     --> project-workspace/ FS
    |                   +-- read_file       --> project-workspace/ FS
    |                   +-- list_files      --> project-workspace/ FS
    |                   +-- search_code     --> project-workspace/ FS
    |                   +-- update_memory   --> .ai-memory.json
    |
    +-- FileExplorer --> GET /api/files (from server)
    |
    +-- Terminal --> WebSocket + child_process.spawn (real shell on server)
    |
    +-- Preview --> iframe localhost:{dev-server-port}
```

---

## Section 1: Agent System

### Frontend (`useAgent.ts` — rewrite)

- Calls `sendAgentRequest()` which POSTs to `/api/agent`
- Parses SSE stream from response
- Updates UI based on event types:
  - `plan` — add plan message to chat
  - `text` — add AI reasoning text to chat
  - `file_created` / `file_edited` / `file_deleted` — refresh file list from server
  - `command_start` — show command starting in terminal
  - `command_output` — show command output in terminal (streamed incrementally)
  - `tool_call` — show status "Running: X..."
  - `server_started` — open preview with detected port
  - `error` — show error message
  - `done` — mark agent as complete

### Backend (`/api/agent` — strengthen)

- Model: `qwen-plus` (sent from client, not hardcoded)
- System prompt rewritten for server environment (see Section 6)
- Workspace context reads from `project-workspace/` (already correct)
- Self-correction protocol: after creating/editing .ts/.tsx/.js/.jsx files, run `npx tsc --noEmit`, fix if errors found
- Max iterations: 25 (kept as-is)

### `run_command` — replace `exec()` with `spawn()` (CRITICAL FIX)

The current implementation uses `child_process.exec()` which buffers ALL output until the process exits. This is fatal for long-running commands like `npm run dev` — the command hangs for the full timeout, then gets killed.

**New approach using `child_process.spawn()`:**

1. **Short-lived commands** (npm install, npx tsc, mkdir, etc.):
   - Spawn with `spawn('sh', ['-c', command])` (or `cmd /c` on Windows)
   - Stream stdout/stderr chunks incrementally via SSE `command_output` events
   - Resolve tool call when process exits (with collected output)
   - Timeout: 120s

2. **Dev server commands** (npm run dev, next dev, etc.):
   - Detect dev server intent: regex match `(npm run dev|npx vite|next dev|node server)` on the command string
   - Spawn as a background process (tracked by ProcessManager — see Section 8)
   - Stream stdout/stderr chunks incrementally via SSE
   - Scan each output chunk for port pattern: `localhost:(\d+)` or `port\s+(\d+)` or `http://[^:]+:(\d+)`
   - When port detected: emit `{ type: 'server_started', port }` and resolve the tool call with "Dev server started on port {port}"
   - If no port detected within 30s: resolve with "Server started but port not detected"
   - The dev server process stays alive in the background (not killed)

3. **install_package** — also migrated to `spawn()` for streaming output consistency (large dependency trees benefit from incremental output). Same pattern as short-lived commands.

### Windows shell strategy

- **One-shot commands** (`run_command`, `install_package`): use `spawn('cmd', ['/c', command])` on Windows, `spawn('sh', ['-c', command])` on Linux/Mac. `cmd` is lighter weight for single commands.
- **Interactive terminal** (WebSocket): use `spawn('powershell.exe', [])` on Windows, `spawn('bash', [])` on Linux/Mac. PowerShell provides better interactive features.

### Removals

- `useEnhancedAgent.ts` — unused, remove entirely
- `sendChatMessage` with tools hack — no longer needed
- WebContainer imports from agent hook

---

## Section 2: File System

### Single source of truth: `project-workspace/` (server disk)

### Backend APIs

- `GET /api/files` — recursively scan `project-workspace/`, return file list with full relative paths
  - Response format: `{ files: [{ id: "src/App.tsx", name: "src/App.tsx", content: "...", language: "typescript" }] }`
  - Skip: `.git`, `node_modules`, `dist`, `build`, `.next`
  - Both `id` and `name` use the full relative path (e.g., `src/App.tsx`)
- `POST /api/files` — create or update a file
  - Body: `{ id: "src/App.tsx", content: "..." }`
  - Creates parent directories automatically
- `DELETE /api/files` — delete a file
  - Body: `{ id: "src/App.tsx" }`
  - Uses request body (not URL param) because file paths contain slashes

### Frontend (`useFiles.ts` — rewrite)

- `fetchFilesFromServer()` → calls `GET /api/files` (REST, not WebContainer)
- `saveFileToServer()` → calls `POST /api/files` (REST, not WebContainer)
- `deleteFileFromServer()` → calls `DELETE /api/files` (REST, not WebContainer)
- Polling interval: 3s while agent is running, 10s while idle
- `applyFileFromAgent()` — removed. When agent creates files, the SSE `file_created` event triggers `fetchFilesFromServer()` to reload the full file list from the server. No optimistic updates — single source of truth.

### File naming fix

- `name` always equals full relative path: `src/App.tsx`, `package.json`
- `id` = `name` = relative path (single consistent format)
- FileExplorer updated to render tree hierarchy from path separators (display basename, indent by depth)

### Removals

- `src/lib/webcontainer.ts` — entire file
- `@webcontainer/api` dependency from package.json
- All WebContainer imports and usages in `api.ts`
- All WebContainer references in `useFiles.ts`

---

## Section 3: Terminal System

### Two-mode terminal

**Mode 1: Agent Output Terminal**
- When agent runs `run_command`, SSE events (`command_start`, `command_output`) are received
- These outputs are displayed in terminal in real-time (streamed, not buffered)
- Read-only — user watches but doesn't type

**Mode 2: Interactive Terminal (WebSocket + spawn)**
- Server spawns real shell via `child_process.spawn` (not `node-pty`)
- Connected to xterm.js via WebSocket (`ws` package — already in typical Express setups)
- User can type commands directly: `npm run dev`, `git status`, etc.
- CWD: `project-workspace/`

### Why `child_process.spawn` instead of `node-pty`

`node-pty` requires native compilation (node-gyp, Python, Visual Studio Build Tools on Windows). Adding it would break `npm install` on many machines. Instead:

- Use `child_process.spawn('powershell.exe', [])` on Windows, `spawn('bash', [])` on Linux/Mac
- Pipe stdin/stdout/stderr through WebSocket to xterm.js
- Trade-off: no full PTY features (no colors, no cursor positioning) — but reliable cross-platform
- If needed in the future, `node-pty` can be added as an optional dependency with graceful fallback

### Backend changes

- New WebSocket endpoint: `WS /api/terminal`
  - On connection: spawn shell process with CWD `project-workspace/`
  - Forward WebSocket messages → process stdin
  - Forward process stdout/stderr → WebSocket messages
  - On disconnect: kill shell process
- Uses `ws` package (lightweight, no native deps) or Express built-in WebSocket upgrade

### Frontend changes

- `TerminalPanel.tsx` rewritten
- Two tabs at top: "Agent Output" | "Terminal"
- Auto-switches to "Agent Output" when agent is running
- User can switch to "Terminal" tab anytime for interactive use

### Dev server detection

- When agent runs `npm run dev`, scan `command_output` chunks for port regex
- Emit `{ type: 'server_started', port }` SSE event
- Preview panel auto-opens

---

## Section 4: Preview System

- `PreviewPanel.tsx` simplified
- Preview URL comes from agent `server_started` event
- iframe points to `http://localhost:{port}`
- Refresh button reloads iframe
- Remove 3-second auto-refresh interval (Vite has HMR, auto-refresh causes flickering)
- When no dev server running: "No preview available — run a dev server first"

### COEP/COOP Header Removal (CRITICAL)

`server.ts` lines 49-53 set `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`. These were required for WebContainer. With WebContainer removed, these headers MUST be removed — otherwise the iframe preview of the Vite dev server will be blocked (Vite doesn't send `Cross-Origin-Resource-Policy` headers).

### Removals

- `window.addEventListener('wc-server-ready', ...)`
- WebContainer URL references
- `/preview/index.html` fallback
- COEP/COOP headers from `server.ts`
- 3-second auto-refresh interval

---

## Section 5: Scaffold Templates

The "Start building" buttons in `App.tsx` (React, Next.js, Node.js) currently use WebContainer.

### New approach

- Buttons call `agentHook.sendAgentMessage("Create a new React + TypeScript + Tailwind project", 'agent')` (or Next.js, Node.js variant)
- Agent handles scaffolding via `run_command` on server
- No special template handling needed — agent decides the best scaffold approach

---

## Section 6: System Prompt

Shortened from ~90 lines to ~30 lines. Clear, server-focused instructions:

```
You are a full-stack development environment running on a real server.

ENVIRONMENT:
- CWD: project-workspace/
- Real Node.js runtime, real npm/npx, real filesystem
- All shell commands work natively

RULES:
1. Always build REAL applications (React/Next.js/Vite + TypeScript + Tailwind)
2. First use run_command to scaffold (npx create-vite@latest . --template react-ts)
3. Then use create_file to build components
4. Use install_package for dependencies
5. Run npm run dev to start the dev server
6. After creating code files, run npx tsc --noEmit to verify — fix errors immediately

DO NOT:
- Create plain HTML/JS files
- Build mock/fake applications
- Put everything in a single file
- Skip error checking
```

### Persona detection — switch to English

Current Turkish strings in `detectPersona()`:
- `"ROLE: FRONTEND_EXPERT. Sıkı bir UI/UX yeteneğine..."` → `"ROLE: FRONTEND_EXPERT. You are a UI/UX specialist with expertise in modern animations, Tailwind CSS, and responsive design."`
- `"ROLE: BACKEND_EXPERT. Sistem mimarisi..."` → `"ROLE: BACKEND_EXPERT. You are a systems architect with expertise in Express, Node.js, databases, and performance optimization."`
- `"ROLE: DEBUG_EXPERT. Hatayı değil..."` → `"ROLE: DEBUG_EXPERT. You are a systematic problem solver who finds root causes, not symptoms."`
- `"ROLE: FULLSTACK_ORCHESTRATOR. Uygulamayı..."` → `"ROLE: FULLSTACK_ORCHESTRATOR. You are the lead architect for building applications from scratch."`

---

## Section 7: Complete Change Inventory

### Files to remove
| File | Reason |
|------|--------|
| `src/lib/webcontainer.ts` | WebContainer removed |
| `src/hooks/useEnhancedAgent.ts` | Unused |
| `src/components/TerminalSession.tsx` | WebContainer terminal session replaced by WebSocket terminal in TerminalPanel.tsx |

### Files to rewrite
| File | What changes |
|------|-------------|
| `src/hooks/useAgent.ts` | SSE stream + `/api/agent` integration |
| `src/services/api.ts` | WebContainer → REST API calls |
| `src/hooks/useFiles.ts` | WebContainer → server FS, remove `applyFileFromAgent` |
| `src/components/TerminalPanel.tsx` | WebSocket + spawn terminal, agent output tabs |
| `src/components/PreviewPanel.tsx` | Server dev server iframe, remove auto-refresh |
| `server.ts` `/api/agent` | spawn() for run_command + install_package, prompt update, model update, port detection, `list_files` skip list updated to match GET /api/files (.git, node_modules, dist, build, .next) |
| `server.ts` `/api/files` | Recursive file listing with full paths, skip node_modules/dist/build/.next |

### Files to modify (minor)
| File | What changes |
|------|-------------|
| `src/App.tsx` | Remove WebContainer scaffold (`handleSelectTemplate`), update template buttons to use agent |
| `src/components/ChatPanel.tsx` | Prop adjustments for new agent events |
| `src/components/FileExplorer.tsx` | Display basename from full path (`name.split('/').pop()`), render tree hierarchy |
| `src/utils/export.ts` | Remove WebContainer import, use `GET /api/files` for export |
| `src/services/autocomplete.ts` | Remove WebContainer import, adapt to server FS |
| `src/services/api-enhanced.ts` | Remove if unused, or remove WebContainer refs |
| `package.json` | Remove `@webcontainer/api`, add `ws` |
| `server.ts` (headers) | Remove COEP/COOP headers (lines 49-53) |

### Test files to update
| File | What changes |
|------|-------------|
| `src/test/hooks/useFiles.test.ts` | Remove WebContainer mocks, test against REST API |
| `src/test/setup.ts` | Remove WebContainer references |

### Files unchanged
- `src/components/GitPanel.tsx`
- `src/hooks/useGit.ts`
- `src/hooks/useChat.ts`
- `src/components/Header.tsx`
- `src/components/SettingsModal.tsx`
- All theme/search/outline/MCP components
- All CSS/styling

### New dependencies
| Package | Purpose |
|---------|---------|
| `ws` | WebSocket server for interactive terminal |

### Removed dependencies
| Package | Reason |
|---------|--------|
| `@webcontainer/api` | WebContainer removed |

---

## Section 8: Process Manager (Dev Server Lifecycle)

Agent can start long-running processes (e.g., `npm run dev`). These need lifecycle management.

### Server-side ProcessManager

A simple in-memory tracker in `server.ts`:

```
processManager = {
  processes: Map<number, { pid, command, port?, spawnedAt }>,

  spawn(command, cwd) → { process, pid }
  kill(pid) → void
  killAll() → void
  getByPort(port) → process | null
}
```

### Rules

- Before starting a dev server, check if a process already occupies the target port → kill it first
- On agent `run_command` with dev server pattern: register in ProcessManager
- New endpoint: `DELETE /api/processes/:pid` — kill a specific process
- New endpoint: `GET /api/processes` — list running processes
- On server shutdown (SIGTERM/SIGINT): kill all managed processes
- On WebSocket terminal disconnect: do NOT kill the process (user might reconnect)

### Port conflict prevention

- Before `npm run dev`, agent or server checks if port 5173 (or target port) is already in use
- If occupied by a managed process: kill it, then start new one
- If occupied by external process: report error to agent, let it choose a different port

---

## Section 9: Security Considerations

This application is designed as a **single-user local development tool**. Security assumptions:

- **Single user**: No authentication on API endpoints. The server runs on `localhost` and is not exposed to the network.
- **No sandboxing**: `run_command` and the WebSocket terminal can execute arbitrary commands. This is intentional — it's a dev tool running on the developer's own machine.
- **Path traversal protection**: The existing `safePath()` function prevents file operations outside `project-workspace/`. This is kept for the file API endpoints.
- **run_command scope**: Commands execute with CWD `project-workspace/` but are not sandboxed — they can access the full filesystem. This matches the behavior of any local terminal.

If the application is ever deployed for multi-user or remote access, authentication and sandboxing must be added. That is out of scope for this spec.

---

## Success Criteria

After implementation, the following user scenario must work end-to-end:

1. User types: "Create a React todo app with Tailwind CSS"
2. Agent responds with a plan
3. Agent runs `npx create-vite@latest . --template react-ts` (visible in agent output terminal, streamed)
4. Agent runs `npm install tailwindcss @tailwindcss/vite` (visible in terminal, streamed)
5. Agent creates/edits files: `src/App.tsx`, `src/components/TodoList.tsx`, etc. (appear in explorer immediately)
6. Agent runs `npx tsc --noEmit` to verify (self-correction)
7. Agent runs `npm run dev` (dev server starts as background process)
8. Port detected from output, preview auto-opens showing the running todo app
9. User can edit files in the editor, see changes in preview (Vite HMR)
10. User can open interactive terminal and run their own commands
11. User can start a new agent task — old dev server is killed, new one starts
