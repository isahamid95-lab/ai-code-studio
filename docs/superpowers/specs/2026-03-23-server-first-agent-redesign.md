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
    |                   +-- run_command     --> child_process.exec()
    |                   +-- install_package --> npm install
    |                   +-- delete_file     --> project-workspace/ FS
    |                   +-- read_file       --> project-workspace/ FS
    |                   +-- list_files      --> project-workspace/ FS
    |                   +-- search_code     --> project-workspace/ FS
    |                   +-- update_memory   --> .ai-memory.json
    |
    +-- FileExplorer --> GET /api/files (from server)
    |
    +-- Terminal --> WebSocket PTY (real shell on server)
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
  - `command_output` — show command output in terminal
  - `tool_call` — show status "Running: X..."
  - `server_started` — open preview with detected port
  - `error` — show error message
  - `done` — mark agent as complete

### Backend (`/api/agent` — strengthen)

- Model: `qwen-plus` (sent from client, not hardcoded)
- System prompt rewritten for server environment (see Section 6)
- Workspace context reads from `project-workspace/` (already correct)
- `run_command` timeout: 60s → 120s for npm install
- Dev server port detection: regex on command output for `localhost:(\d+)`, emit `{ type: 'server_started', port }`
- Self-correction protocol: after creating/editing .ts/.tsx/.js/.jsx files, run `npx tsc --noEmit`, fix if errors found
- Max iterations: 25 (kept as-is)

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
- `POST /api/files` — create or update a file
  - Body: `{ id: "src/App.tsx", content: "..." }`
  - Creates parent directories automatically
- `DELETE /api/files/:id` — delete a file

### Frontend (`useFiles.ts` — rewrite)

- `fetchFilesFromServer()` → calls `GET /api/files` (REST, not WebContainer)
- `saveFileToServer()` → calls `POST /api/files` (REST, not WebContainer)
- `deleteFileFromServer()` → calls `DELETE /api/files` (REST, not WebContainer)
- Polling interval: 3s while agent is running, 10s while idle
- `applyFileFromAgent()` — only updates local state + triggers file list refresh (server already wrote the file)

### File naming fix

- `name` always equals full relative path: `src/App.tsx`, `package.json`
- `id` = `name` = relative path (single consistent format)
- FileExplorer renders tree hierarchy from path separators

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
- These outputs are displayed in terminal in real-time
- Read-only — user watches but doesn't type

**Mode 2: Interactive Terminal (WebSocket PTY)**
- Server spawns real shell via `node-pty` (powershell on Windows, bash on Linux/Mac)
- Connected to xterm.js via WebSocket
- User can type commands directly: `npm run dev`, `git status`, etc.
- CWD: `project-workspace/`

### Backend changes

- New dependency: `node-pty`
- New endpoint: `WS /api/terminal` — WebSocket PTY connection
- Shell spawn: `powershell.exe` on Windows, `bash` on Linux/Mac
- Terminal session managed server-side with cleanup on disconnect

### Frontend changes

- `TerminalPanel.tsx` rewritten
- Two tabs at top: "Agent Output" | "Terminal"
- Auto-switches to "Agent Output" when agent is running
- User can switch to "Terminal" tab anytime for interactive use

### Dev server detection

- When agent runs `npm run dev`, scan `command_output` for port regex: `localhost:(\d+)` or `port (\d+)`
- Emit `{ type: 'server_started', port }` SSE event
- Preview panel auto-opens

---

## Section 4: Preview System

- `PreviewPanel.tsx` simplified
- Preview URL comes from agent `server_started` event
- iframe points to `http://localhost:{port}`
- Refresh button reloads iframe
- When no dev server running: "No preview available — run a dev server first"

### Removals

- `window.addEventListener('wc-server-ready', ...)`
- WebContainer URL references
- `/preview/index.html` fallback

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

Persona detection kept but switched to English for consistency.

---

## Section 7: Complete Change Inventory

### Files to remove
| File | Reason |
|------|--------|
| `src/lib/webcontainer.ts` | WebContainer removed |
| `src/hooks/useEnhancedAgent.ts` | Unused |

### Files to rewrite
| File | What changes |
|------|-------------|
| `src/hooks/useAgent.ts` | SSE stream + `/api/agent` integration |
| `src/services/api.ts` | WebContainer → REST API calls |
| `src/hooks/useFiles.ts` | WebContainer → server FS |
| `src/components/TerminalPanel.tsx` | WebSocket PTY + agent output tabs |
| `src/components/PreviewPanel.tsx` | Server dev server iframe |
| `server.ts` `/api/agent` | Prompt update, model update, port detection |
| `server.ts` `/api/files` | Recursive file listing with full paths |

### Files to modify (minor)
| File | What changes |
|------|-------------|
| `src/App.tsx` | Remove WebContainer scaffold, update template buttons |
| `src/components/ChatPanel.tsx` | Prop adjustments for new agent events |
| `package.json` | Remove `@webcontainer/api`, add `node-pty` |

### Files unchanged
- `src/components/FileExplorer.tsx`
- `src/components/GitPanel.tsx`
- `src/hooks/useGit.ts`
- `src/hooks/useChat.ts`
- `src/components/Header.tsx`
- `src/components/SettingsModal.tsx`
- All theme/search/outline/MCP components
- All CSS/styling

### New files
| File | Purpose |
|------|---------|
| (none — all changes go into existing files) | |

### New dependencies
| Package | Purpose |
|---------|---------|
| `node-pty` | Server-side PTY for interactive terminal |

### Removed dependencies
| Package | Reason |
|---------|--------|
| `@webcontainer/api` | WebContainer removed |

---

## Success Criteria

After implementation, the following user scenario must work end-to-end:

1. User types: "Create a React todo app with Tailwind CSS"
2. Agent responds with a plan
3. Agent runs `npx create-vite@latest . --template react-ts` (visible in terminal)
4. Agent runs `npm install tailwindcss @tailwindcss/vite` (visible in terminal)
5. Agent creates/edits files: `src/App.tsx`, `src/components/TodoList.tsx`, etc. (appear in explorer)
6. Agent runs `npx tsc --noEmit` to verify (self-correction)
7. Agent runs `npm run dev` (dev server starts)
8. Preview auto-opens showing the running todo app
9. User can edit files in the editor, see changes in preview
10. User can open interactive terminal and run their own commands
