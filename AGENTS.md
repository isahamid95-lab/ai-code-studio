# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Build, Lint, and Test Commands

```bash
# Development server (Express + Vite)
npm run dev

# Build for production
npm run build

# Type checking (lint)
npm run lint

# Preview production build
npm run preview

# Clean build artifacts
npm run clean
```

**Note:** No test framework is currently configured. Tests referenced in README are aspirational.

## Project Overview

AI Code Studio Pro is a browser-based IDE with integrated AI assistance, built with:
- **Frontend:** React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4
- **Backend:** Express.js server (server.ts)
- **Editor:** CodeMirror 6 with syntax highlighting
- **AI:** Alibaba Qwen3 Coder (primary), Google Gemini (optional)
- **Runtime:** WebContainer API for in-browser Node.js execution

## Code Style Guidelines

### Imports

```typescript
// 1. React and external libraries first
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode2, Loader2 } from 'lucide-react';

// 2. Internal types
import type { FileItem, ChatMessage, AiProvider } from '../types';

// 3. Internal utilities and hooks
import { useFiles } from '../hooks/useFiles';
import { sendChatMessage } from '../services/api';

// 4. Components (lazy-loaded for heavy ones)
const Header = React.lazy(() => import('./components/Header'));
import FileExplorer from './components/FileExplorer';
```

### TypeScript

- **Strict typing:** Use explicit types for function parameters and return values
- **Interfaces over types:** Prefer `interface` for object shapes, `type` for unions
- **Avoid `any`:** Use `unknown` or specific types; cast only when necessary
- **Nullish coalescing:** Use `??` over `||` for fallbacks

```typescript
// Good
interface ChatPanelProps {
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
}

// Avoid
function process(data: any) { ... }
```

### React Components

- **Functional components only:** No class components
- **Named exports:** Use `export default function ComponentName()`
- **Memoization:** Use `React.memo` for expensive components, `useCallback`/`useMemo` appropriately
- **Props destructuring:** Destructure in function signature

```typescript
// Preferred pattern
const ChatPanel = React.memo(function ChatPanel({
  chatMessages,
  isGenerating,
  onSendMessage,
}: ChatPanelProps) {
  // Component body
});
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FileExplorer`, `ChatPanel` |
| Hooks | camelCase with `use` prefix | `useFiles`, `useAgent` |
| Functions | camelCase | `fetchFiles`, `handleClick` |
| Constants | UPPER_SNAKE_CASE | `FILE_TEMPLATES`, `WORKSPACE_DIR` |
| Types/Interfaces | PascalCase | `FileItem`, `ChatMessage` |
| CSS classes | kebab-case with Tailwind | `glass-panel`, `glass-button` |

### Styling

- **Tailwind CSS 4:** Use Tailwind utility classes preferentially
- **Custom utilities:** Defined in `src/index.css` under `@layer utilities`
- **Glassmorphism:** Use `.glass-panel`, `.glass-button`, `.glass-input` classes
- **Theme colors:** Use CSS variables: `--color-primary`, `--color-background`, etc.

```tsx
// Good - Tailwind + custom utilities
<div className="glass-panel rounded-2xl p-4">
  <button className="glass-button px-4 py-2 text-primary">
    Click
  </button>
</div>
```

### Error Handling

- **Try-catch:** Wrap async operations and API calls
- **User feedback:** Display errors in UI, not just console
- **Graceful degradation:** Provide fallbacks when features fail

```typescript
try {
  const response = await fetch('/api/chat', { ... });
  if (!response.ok) throw new Error('Request failed');
  const data = await response.json();
  // Handle success
} catch (err: any) {
  console.error('Operation failed', err);
  setErrorMessage(err.message || 'An unexpected error occurred');
}
```

### File Organization

```
src/
├── components/     # React components (one per file)
├── hooks/          # Custom React hooks (use*.ts)
├── services/       # API calls and external services
├── types/          # TypeScript type definitions
├── lib/            # Core libraries (WebContainer setup)
├── utils/          # Pure utility functions
├── constants.ts    # App-wide constants
└── App.tsx         # Main application component
```

### Git Commits

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code restructuring
- `docs:` - Documentation
- `style:` - Formatting changes
- `chore:` - Maintenance tasks

### API Patterns

- **Server routes:** Defined in `server.ts` under `/api/*`
- **Client calls:** Use functions in `src/services/api.ts`
- **WebContainer:** Access via `getWebContainer()` from `src/lib/webcontainer.ts`

### Environment Variables

Required in `.env.local`:
```
VITE_ALIBABA_API_KEY=sk-...
VITE_ALIBABA_BASE_URL=https://coding-intl.dashscope.aliyuncs.com/v1
GEMINI_API_KEY=...  # Optional
```

## Important Notes

- **No comments in code** unless explicitly requested
- **Keep responses concise** - avoid unnecessary explanations
- **Run `npm run lint`** before committing to verify types
- **Path aliases:** Use `@/` for root-relative imports (configured in tsconfig)