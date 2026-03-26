# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension - e.g., `Header.tsx`, `FileExplorer.tsx`, `ChatPanel.tsx`
- Hooks: camelCase with `use` prefix and `.ts` extension - e.g., `useAgent.ts`, `useChat.ts`, `useFiles.ts`
- Utilities: camelCase with `.ts` extension - e.g., `dev-server.ts`, `persistence.ts`, `export.ts`
- Types: camelCase with `.ts` extension - e.g., `index.ts` in `src/types/`
- Validators: kebab-case with `.validators.ts` suffix - e.g., `file.validators.ts`, `chat.validators.ts`
- Test files: Mirror source with `.test.ts` or `.test.tsx` suffix - e.g., `useAgent.test.ts`, `Header.test.tsx`

**Functions:**
- camelCase with verb prefixes: `fetchFilesFromServer`, `detectPortFromOutput`, `handleFileChange`
- Event handlers prefixed with `handle`: `handleClick`, `handleDeleteFile`, `handleGitCommit`
- Callbacks passed as props prefixed with `on`: `onOpenFile`, `onDeleteFile`, `onRefreshFiles`
- Boolean getters prefixed with `is`, `has`, `should`: `isDevServerCommand`, `isActiveRun`, `shouldAutoBuildWebsitePrompt`

**Variables:**
- camelCase for local variables and function parameters
- SCREAMING_SNAKE_CASE for true constants: `DEFAULT_CHAT_MESSAGES`, `FILE_TEMPLATES`, `ACTIVITY_ITEMS`
- Ref variables suffixed with `Ref`: `chatEndRef`, `hasHydratedChatRef`, `activeRunIdRef`

**Types:**
- Interfaces: PascalCase - `FileItem`, `ChatMessage`, `GitStatus`, `AgentEvent`
- Type aliases: PascalCase - `Language`, `AiProvider`, `LeftTab`
- Generic type parameters: Single capital letter - `T`, or descriptive - `ManagedProcessLike`

## Code Style

**Formatting:**
- Tool: Prettier (configured in `.prettierrc`)
- Semicolons: Required
- Quotes: Single quotes for strings
- Trailing commas: ES5 compatible
- Print width: 100 characters
- Tab width: 2 spaces (no tabs)
- Arrow parens: Always

**Linting:**
- Tool: ESLint with `typescript-eslint` strict config (`eslint.config.mjs`)
- Rules enforced:
  - `@typescript-eslint/no-explicit-any`: warn
  - `@typescript-eslint/no-unused-vars`: warn (ignores `_` prefixed args)
  - `no-console`: warn (allows `console.warn`, `console.error`)
  - `react-hooks/rules-of-hooks`: error
  - `react-refresh/only-export-components`: warn

**TypeScript Configuration:**
- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode enabled
- JSX: `react-jsx`
- Path alias: `@/*` maps to project root

## Import Organization

**Order:**
1. React and React-related imports
2. External packages (third-party libraries)
3. Internal types (from `../types`)
4. Internal modules (services, hooks, constants)
5. Relative imports (components, utilities)

**Example from `src/App.tsx`:**
```typescript
import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, FileCode2, Code2, /* ... */ } from 'lucide-react';

import type { Language } from './types';
import { FILE_TEMPLATES } from './constants';
import { useFiles } from './hooks/useFiles';
// ...
```

**Path Aliases:**
- `@/*` resolves to project root
- Used in configuration: `import path from 'path'` with `path.resolve(__dirname, './')`

## Error Handling

**Patterns:**
```typescript
// API error handling with typed catch
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
} catch (error: any) {
  console.error('Operation failed', error);
  throw error;
}

// Type-safe error message extraction
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  // handle error
}
```

**API Service Pattern:**
- Helper function for JSON parsing: `parseJsonResponse<T>(response: Response)`
- Consistent error throwing: `throw new Error(await response.text())`
- Async/await throughout (no raw Promises in business logic)

## Logging

**Framework:** Native `console` (ESLint allows `console.warn` and `console.error`)

**Patterns:**
```typescript
// Error logging
console.error('Failed to restore chat state', error);

// Development info (should be removed in production)
console.log('Jump to line:', line);
```

**When to Log:**
- Error conditions: `console.error`
- Warnings for recoverable issues: `console.warn`
- Development debugging: Remove before commit (enforced by lint rule)

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic
- Security-sensitive code (validation, sanitization)
- Workarounds or temporary solutions
- Public API documentation

**JSDoc/TSDoc:**
```typescript
/**
 * Detect if a command is likely to start a dev server
 */
export function isDevServerCommand(command: string): boolean {
  // ...
}

/**
 * Preflight check for dev server start
 */
export async function preflightDevServerStart(
  command: string,
  managedSnapshots: ManagedProcessLike[],
  isPortAvailable: (port: number) => Promise<boolean>
): Promise<{ shouldStart: boolean; reason?: string; /* ... */ }> {
  // ...
}
```

**Security Comments:**
```typescript
/**
 * Dosya kaydetme validasyonu
 * Path traversal saldırılarını önler
 * (File save validation - Prevents path traversal attacks)
 */
export const FileSaveSchema = z.object({ /* ... */ });
```

## Function Design

**Size:** Functions typically 10-50 lines; complex functions may be longer but should be decomposed

**Parameters:**
- Use object parameter pattern for 4+ arguments:
```typescript
interface UseAgentOptions {
  model: string;
  files: Array<{ id: string }>;
  activeFileId: string;
  setChatMessages: (fn: React.SetStateAction<ChatMessage[]>) => void;
  // ... more options
}

export function useAgent(options: UseAgentOptions) { /* ... */ }
```

**Return Values:**
- Hooks return object with named exports:
```typescript
return {
  agentMode,
  setAgentMode,
  planMode,
  setPlanMode,
  agentStatus,
  sendAgentMessage,
};
```

## Module Design

**Exports:**
- Default export for main component/hook
- Named exports for utilities and types
- Barrel files for re-exporting: `src/validators/index.ts`

**Barrel Files:**
```typescript
// src/validators/index.ts
export * from './file.validators';
export * from './chat.validators';
```

**React Components:**
- Named export with `React.memo`:
```typescript
const Header = React.memo(function Header({ /* props */ }: HeaderProps) {
  // ...
});

export default Header;
```

- Lazy loading with dynamic imports:
```typescript
const Header = React.lazy(() => import('./components/Header'));
const CommandPalette = React.lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
```

## Component Patterns

**Props Interface:**
- Named `ComponentNameProps` pattern:
```typescript
interface HeaderProps {
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenTheme: () => void;
  onRunCode: () => void;
  hasActiveFile: boolean;
}
```

**Event Callbacks:**
- Prefix callback props with `on`: `onClick`, `onOpenFile`, `onRefreshFiles`
- Callbacks are called without `handle` prefix: `onOpenFile(id)` not `onHandleOpenFile(id)`

## Validation Pattern

**Zod Schemas:**
- File-based validators: `file.validators.ts`, `chat.validators.ts`
- Schema naming: `EntityActionSchema` - e.g., `FileSaveSchema`, `FileDeleteSchema`
- Security-first validation (path traversal prevention):
```typescript
export const FileSaveSchema = z.object({
  id: z.string()
    .min(1, 'File ID is required')
    .refine(id => !id.includes('..') && !id.startsWith('/'), {
      message: 'Invalid file path - path traversal not allowed'
    }),
  content: z.string()
    .max(10 * 1024 * 1024, 'File content cannot exceed 10MB')
});
```

---

*Convention analysis: 2026-03-26*