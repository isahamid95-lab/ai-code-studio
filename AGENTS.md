# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build, Lint, and Test Commands

```bash
npm run dev          # Development server (Express + Vite)
npm run build        # Build for production
npm run lint         # Type checking and linting
npm run preview      # Preview production build
npm run clean        # Clean build artifacts
npm test             # Run Vitest test suite
npm run test:watch   # Watch mode for tests
```

## Project Overview

AI Code Studio Pro is a browser-based IDE with integrated AI assistance:
- **Frontend:** React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4
- **Backend:** Express.js server (`server.ts`)
- **Editor:** CodeMirror 6 with syntax highlighting
- **AI:** Alibaba Qwen3 Coder (primary), Google Gemini (optional)
- **Runtime:** Server-first local Node.js execution with `project-workspace/` as source of truth

## Code Style Guidelines

### Imports
```typescript
// 1. React and external libraries first
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 2. Internal types
import type { FileItem, ChatMessage, AiProvider } from '../types';

// 3. Internal utilities and hooks
import { useFiles } from '../hooks/useFiles';

// 4. Components (lazy-loaded for heavy ones)
const Header = React.lazy(() => import('./components/Header'));
```

### TypeScript
- **Strict typing:** Use explicit types for function parameters and return values
- **Interfaces over types:** Prefer `interface` for object shapes, `type` for unions
- **Avoid `any`:** Use `unknown` or specific types; cast only when necessary
- **Nullish coalescing:** Use `??` over `||` for fallbacks

### React Components
- **Functional components only:** No class components
- **Named exports:** Use `export default function ComponentName()`
- **Memoization:** Use `React.memo` for expensive components
- **Props destructuring:** Destructure in function signature

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

### Error Handling
- **Try-catch:** Wrap async operations and API calls
- **User feedback:** Display errors in UI, not just console
- **Graceful degradation:** Provide fallbacks when features fail

## File Organization

```
src/
├── components/     # React components (one per file)
├── hooks/          # Custom React hooks (use*.ts)
├── services/       # API calls and external services
├── types/          # TypeScript type definitions
├── lib/            # Shared server/runtime helpers
├── utils/          # Pure utility functions
├── constants.ts    # App-wide constants
└── App.tsx         # Main application component
```

## Git Commits

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code restructuring
- `docs:` - Documentation
- `style:` - Formatting changes
- `chore:` - Maintenance tasks

## API Patterns

- **Server routes:** Defined in `server.ts` under `/api/*`
- **Client calls:** Use functions in `src/services/api.ts`
- **Agent flow:** Use `/api/agent` with SSE events for server-side agent runs
- **Workspace:** Files live under `project-workspace/` and are accessed through the REST file API

## Environment Variables

Required in `.env.local`:
```
VITE_ALIBABA_API_KEY=sk-...
VITE_ALIBABA_BASE_URL=https://coding-intl.dashscope.aliyuncs.com/v1
```

## Important Notes

- **No comments in code** unless explicitly requested
- **Keep responses concise** - avoid unnecessary explanations
- **Run `npm run lint`** before committing to verify types
- **Path aliases:** Use `@/` for root-relative imports (configured in tsconfig)
