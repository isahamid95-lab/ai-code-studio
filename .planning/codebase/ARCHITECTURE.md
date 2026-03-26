# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Full-stack monolithic application with React SPA frontend and Express.js backend, featuring an AI-powered code agent with tool execution capabilities.

**Key Characteristics:**
- Single server entry point (`server.ts`) serving both API and static frontend
- Frontend built with React 19 and custom hooks for state management
- Backend uses Express.js with WebSocket support for terminal emulation
- AI agent with tool-use capabilities for file operations and command execution
- MCP (Model Context Protocol) integration for external tool connections

## Layers

### Frontend Layer
- Purpose: User interface for the web-based IDE
- Location: `src/`
- Contains: React components, hooks, services, utilities, types
- Depends on: Backend API (`src/services/api.ts`), CSS themes
- Used by: Browser runtime via Vite dev server or production build

### Backend Layer
- Purpose: API server, file system operations, AI integration, terminal proxy
- Location: `server/`
- Contains: Express routes, services, WebSocket handlers, middleware
- Depends on: File system, AI API providers, MCP SDK
- Used by: Frontend via REST API and WebSocket

### Workspace Layer
- Purpose: Isolated project directory for user code
- Location: `project-workspace/`
- Contains: User-created files and projects
- Depends on: None
- Used by: Backend services for file operations, agent tool execution

### Configuration Layer
- Purpose: Environment configuration and project metadata
- Location: Root directory (`package.json`, `tsconfig.json`, `vite.config.ts`)
- Contains: Build configs, dependencies, TypeScript settings
- Depends on: Build tools
- Used by: All layers during development and build

## Data Flow

### File Operations Flow:
1. User edits file in CodeMirror editor (`src/App.tsx`)
2. `handleFileChange` updates local state and marks file as dirty
3. Debounced save (500ms) calls `saveFileToServer` in `src/services/api.ts`
4. Backend `POST /api/files` validates via Zod schema and writes to `project-workspace/`
5. File system change triggers periodic refresh (3-10s interval depending on agent state)

### AI Agent Flow:
1. User sends message via ChatPanel (`src/components/ChatPanel.tsx`)
2. `useAgent` hook constructs request with workspace context
3. `POST /api/agent-enhanced` streams SSE events
4. Agent parses tool-use XML tags and executes tools via `executeTool()`
5. Tool results streamed back to frontend via SSE
6. Frontend updates chat messages and terminal output in real-time

### Terminal Flow:
1. User opens terminal panel
2. WebSocket connection to `/api/terminal` with token authentication
3. Backend spawns shell process (PowerShell on Windows, Bash on Unix)
4. Bidirectional communication: user input → stdin, stdout/stderr → WebSocket messages
5. Connection cleanup on socket close

**State Management:**
- React hooks (`useFiles`, `useChat`, `useAgent`, `useGit`) manage component state
- Custom hook pattern with `useState` and `useCallback` for performance
- UI state persisted to localStorage via `src/utils/persistence.ts`
- Note: `src/contexts/AppContext.tsx` imports from `../stores` but this directory does not exist - context may be unused or broken

## Key Abstractions

### Tool Execution Pattern
- Purpose: Enables AI agent to perform actions on user's behalf
- Examples: `server/routes/agent-enhanced.ts`, `server/utils/workspace.ts`
- Pattern: Tool definitions with typed parameters, execution functions return `{ success, result, error }`
- Available tools: `read_file`, `write_file`, `delete_file`, `list_files`, `run_command`, `start_dev_server`

### Streaming Agent Pattern
- Purpose: Real-time AI response with intermediate tool execution
- Examples: `server/routes/agent-enhanced.ts`, `src/hooks/useAgent.ts`
- Pattern: SSE (Server-Sent Events) with typed event objects
- Event types: `text`, `tool_use`, `tool_result`, `plan`, `error`, `done`

### Workspace Isolation
- Purpose: Secure file operations within bounded directory
- Examples: `server/utils/workspace.ts`, `server/services/aiContext.ts`
- Pattern: All paths resolved relative to `WORKSPACE_DIR`, path traversal protection via `safePath()`

### Custom React Hooks
- Purpose: Encapsulate complex state and logic for UI components
- Examples: `src/hooks/useFiles.ts`, `src/hooks/useAgent.ts`, `src/hooks/useChat.ts`
- Pattern: Hook returns object with state values and callback functions
- Each hook manages its own `useState` collection, no global state library

## Entry Points

### Server Entry Point
- Location: `server.ts`
- Triggers: `npm run dev` or `npm start`
- Responsibilities:
  - Initialize MCP client connections
  - Configure Express middleware (CORS, CSP, rate limiting)
  - Mount API routes
  - Setup WebSocket server for terminal
  - Start Vite dev server (development) or serve static files (production)
  - Handle graceful shutdown

### Frontend Entry Point
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html` → script module `src/main.tsx`
- Responsibilities:
  - Mount React app with StrictMode
  - Wrap with ErrorBoundary
  - Import global CSS

### AI Agent Entry Point
- Location: `server/routes/agent-enhanced.ts`
- Triggers: `POST /api/agent-enhanced` request
- Responsibilities:
  - Build system prompt with workspace context and tool definitions
  - Stream AI response with tool execution
  - Handle tool-use XML parsing and execution

## Error Handling

**Strategy:** Centralized error handling middleware with custom error classes

**Patterns:**
- Custom error classes extend `AppError` base class (`server/middleware/errorHandler.ts`)
- Error types: `NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `InternalError`
- Async route handlers wrapped with `asyncHandler` utility
- 404 handler catches unmatched routes
- Errors logged with context (path, method, timestamp, stack in development)

**Frontend Error Handling:**
- `ErrorBoundary` component wraps app root
- API errors caught and displayed in terminal/chat
- Agent errors streamed as `error` events

## Cross-Cutting Concerns

**Logging:** 
- Console logging on backend with `[MCP]`, `[Terminal WS]` prefixes
- Agent memory persisted to `.ai-memory.json` in workspace

**Validation:**
- Zod schemas in `src/validators/` for API request validation
- File size limits (1MB max) enforced in file routes
- Path validation via `safePath()` to prevent traversal attacks

**Authentication:**
- Token-based WebSocket authentication for terminal connections
- API key validation for AI provider (environment variables)
- CORS restricted to localhost origins in development

**Security Headers:**
- Content-Security-Policy configured in `server.ts`
- X-Content-Type-Options, X-Frame-Options, X-XSS-Protection headers set
- Rate limiting on API endpoints via `express-rate-limit`

---

*Architecture analysis: 2026-03-26*