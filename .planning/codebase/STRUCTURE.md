# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
[project-root]/
├── server.ts              # Main server entry point
├── index.html             # HTML entry for React SPA
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── vitest.config.ts       # Test configuration
├── playwright.config.ts   # E2E test configuration
├── eslint.config.mjs      # Linting configuration
├── src/                   # Frontend source code
├── server/                # Backend source code
├── components/            # Shared UI components (shadcn-style)
├── project-workspace/     # User workspace (isolated file operations)
├── design-system/         # Design system assets
├── tests/                 # E2E tests
├── coverage/              # Test coverage reports
├── dist/                  # Production build output
├── .planning/             # Planning documents (GSD workflow)
├── .opencode/             # OpenCode agent configuration
├── .kilocode/             # Kilocode skills
├── plans/                 # Planning documents
├── screenshots/           # Screenshot storage
└── testsprite_tests/      # Test sprite tests
```

## Directory Purposes

### `src/` - Frontend Source
- Purpose: React application source code
- Contains: Components, hooks, services, utilities, types, themes
- Key files: `src/App.tsx`, `src/main.tsx`, `src/index.css`

### `server/` - Backend Source
- Purpose: Express.js API server implementation
- Contains: Routes, services, middleware, WebSocket handlers
- Key files: `server/routes/index.ts`, `server/services/aiContext.ts`

### `components/` - Shared UI Components
- Purpose: Reusable UI components (shadcn/ui pattern)
- Contains: Button, Dialog, Tabs, Tooltip, Badge, Dropdown, Sonner toast
- Key files: `components/ui/button.tsx`, `components/ui/dialog.tsx`

### `project-workspace/` - User Workspace
- Purpose: Isolated directory for user project files
- Contains: User-created files, `.ai-memory.json` for agent persistence
- Generated: Yes (created at runtime if missing)
- Committed: No (typically in .gitignore)

### `tests/` - E2E Tests
- Purpose: Playwright end-to-end tests
- Contains: `e2e/app.spec.ts`

### `src/test/` - Unit Tests
- Purpose: Vitest unit tests co-located with source
- Contains: Test files mirroring `src/` structure
- Key files: `src/test/setup.ts`, `src/test/hooks/*.test.ts`

## Key File Locations

### Entry Points
- `server.ts`: Backend server entry (Express + Vite middleware)
- `src/main.tsx`: Frontend React entry
- `index.html`: HTML entry point

### Configuration
- `package.json`: Dependencies, scripts, engines
- `tsconfig.json`: TypeScript config with `@/*` path alias
- `vite.config.ts`: Build config, React plugin, Tailwind plugin
- `vitest.config.ts`: Test runner config with jsdom environment
- `playwright.config.ts`: E2E test config

### Core Logic
- `src/App.tsx`: Main React component (846 lines) - orchestrates all hooks and panels
- `server/routes/agent-enhanced.ts`: AI agent route with tool execution
- `server/services/mcpClient.ts`: MCP integration for external tools
- `src/hooks/useFiles.ts`: File management hook (366 lines)
- `src/hooks/useAgent.ts`: AI agent hook (233 lines)
- `src/services/api.ts`: Frontend API client (257 lines)

### Testing
- `src/test/setup.ts`: Vitest setup file
- `src/test/hooks/`: Hook unit tests
- `tests/e2e/app.spec.ts`: Playwright E2E tests

### Types
- `src/types/index.ts`: Core type definitions (FileItem, ChatMessage, AgentEvent, etc.)
- `src/types/ws.d.ts`: WebSocket type declarations
- `src/types/playwright-test.d.ts`: Playwright type declarations

## Naming Conventions

### Files
- Components: PascalCase with `.tsx` extension (e.g., `ChatPanel.tsx`, `FileExplorer.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useFiles.ts`, `useAgent.ts`)
- Services: camelCase (e.g., `api.ts`, `aiContext.ts`)
- Routes: camelCase (e.g., `files.ts`, `agent-enhanced.ts`)
- Tests: `.test.ts` or `.spec.ts` suffix (e.g., `useFiles.test.ts`, `app.spec.ts`)
- Types: `index.ts` for barrel exports, `.d.ts` for declarations
- Constants: `index.ts` in constants directory

### Directories
- Feature directories: lowercase (e.g., `hooks/`, `services/`, `routes/`)
- Component directories: lowercase with index file (e.g., `components/layout/index.ts`)
- Test directories: mirror source structure (e.g., `src/test/hooks/`)

### Code Identifiers
- React components: PascalCase (e.g., `function App()`, `ChatPanel`)
- Hooks: camelCase with `use` prefix (e.g., `useFiles`, `useAgent`)
- API routes: kebab-case in URL, camelCase in file (e.g., `/api/agent-enhanced` → `agent-enhanced.ts`)
- Types/Interfaces: PascalCase (e.g., `FileItem`, `AgentEvent`, `ChatMessage`)
- Constants: SCREAMING_SNAKE_CASE for true constants, camelCase for functions

## Where to Add New Code

### New Feature
- Frontend component: `src/components/[ComponentName].tsx`
- Frontend hook: `src/hooks/use[Feature].ts`
- Backend route: `server/routes/[route-name].ts` + export in `server/routes/index.ts`
- Backend service: `server/services/[service-name].ts`

### New API Endpoint
1. Create route file: `server/routes/[name].ts`
2. Export from `server/routes/index.ts`
3. Mount in `server.ts`: `app.use('/api/[name]', [name]Routes)`

### New UI Component
- Shared component: `components/ui/[name].tsx`
- Feature component: `src/components/[Name].tsx`
- Layout component: `src/components/layout/[Name].tsx`

### New Hook
1. Create file: `src/hooks/use[Feature].ts`
2. Export function: `export function use[Feature]() { ... }`
3. Import and use in `src/App.tsx` or child components

### New Type
1. Add to `src/types/index.ts` for shared types
2. Create separate file for domain-specific types if needed

### New Test
- Unit test: `src/test/[mirrored-path]/[name].test.ts`
- E2E test: `tests/e2e/[name].spec.ts`

### New Theme
- Add theme object to `src/themes/index.ts` in the `themes` array

## Special Directories

### `project-workspace/`
- Purpose: Isolated user workspace for file operations
- Generated: Yes (created at server startup if missing)
- Committed: No (user-generated content)
- Agent memory: `.ai-memory.json` persists agent context

### `dist/`
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (build artifact)

### `coverage/`
- Purpose: Test coverage reports
- Generated: Yes (by `npm run test:coverage`)
- Committed: No (generated report)

### `.opencode/` and `.kilocode/`
- Purpose: Agent configuration and skills
- Contains: Commands, workflows, skills, templates
- Committed: Yes (part of codebase)

### `.planning/`
- Purpose: GSD (Get Shit Done) workflow documents
- Contains: `codebase/` directory with analysis documents
- Committed: Yes (documentation)

## Import Patterns

### Path Aliases
- `@/*` maps to project root (configured in `tsconfig.json` and `vite.config.ts`)
- Example: `import { something } from '@/src/types'`

### Relative Imports
- Within same directory: `import { X } from './file'`
- Parent directory: `import { X } from '../file'`
- Deep nesting: `import { X } from '../../services/api'`

### Barrel Exports
- Used in: `server/routes/index.ts`, `src/components/layout/index.ts`, `src/validators/index.ts`
- Pattern: Export individual modules, then import barrel in consumer

---

*Structure analysis: 2026-03-26*