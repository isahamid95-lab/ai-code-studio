# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript 5.8.2 - Full codebase (frontend, backend, shared types)
- JavaScript (ESM) - Configuration files, ESLint config

**Secondary:**
- CSS - TailwindCSS 4 styling

## Runtime

**Environment:**
- Node.js >=20.0.0 (specified in `package.json` engines)
- ESM modules (`"type": "module"` in package.json)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.0.0 - UI framework
- Express 4.21.2 - Backend server
- Vite 6.2.0 - Build tool and dev server

**UI/Components:**
- TailwindCSS 4.1.14 - Styling framework
- Base UI 1.3.0 - Headless UI primitives
- Framer Motion 12.38.0 - Animation library
- Lucide React 0.546.0 - Icon library
- CodeMirror 6 - Code editor (@uiw/react-codemirror)
- xterm 6.0.0 - Terminal emulator

**State Management:**
- Nanostores 1.2.0 - State management
- @nanostores/react 1.1.0 - React bindings

**Testing:**
- Vitest 4.1.2 - Unit testing
- Playwright 1.58.2 - E2E testing
- Testing Library - React component testing (@testing-library/react 16.3.2)

**Build/Dev:**
- TypeScript 5.8.2 - Type checking
- ESLint 9.22.0 - Linting (typescript-eslint, react-hooks, react-refresh plugins)
- tsx 4.21.0 - TypeScript execution for server

## Key Dependencies

**Critical:**
- `@modelcontextprotocol/sdk` 1.28.0 - MCP client for AI tool integration
- `simple-git` 3.33.0 - Git operations
- `ws` 8.18.3 - WebSocket server for terminal
- `zod` 4.3.6 - Schema validation
- `dotenv` 17.2.3 - Environment variables

**Infrastructure:**
- `archiver` 7.0.1 - Archive creation (ZIP)
- `jszip` 3.10.1 - ZIP file handling
- `cors` 2.8.5 - CORS middleware
- `express-rate-limit` 7.5.0 - Rate limiting
- `minimatch` 10.2.4 - File pattern matching

**Utilities:**
- `clsx` 2.1.1 - Conditional class names
- `tailwind-merge` 3.5.0 - Tailwind class merging
- `class-variance-authority` 0.7.1 - Component variants
- `react-markdown` 10.1.0 - Markdown rendering
- `sonner` 2.0.7 - Toast notifications

## Configuration

**Environment:**
- `.env` / `.env.local` - Environment variables (gitignored)
- `.env.example` / `.env.local.example` - Template files
- `dotenv` loads `.env` then `.env.local` (override)

**Build:**
- `vite.config.ts` - Vite configuration with React and TailwindCSS plugins
- `tsconfig.json` - TypeScript configuration (ES2022 target, bundler module resolution)
- Path alias: `@/*` maps to `./*`

**Linting:**
- `eslint.config.mjs` - Flat config with TypeScript strict rules
- Ignores: `dist`, `build`, `node_modules`, `coverage`, `.git`, `project-workspace`

**Testing:**
- `vitest.config.ts` - Vitest configuration (jsdom environment, v8 coverage)
- `playwright.config.ts` - E2E test configuration (Chromium)

## Platform Requirements

**Development:**
- Node.js >=20.0.0
- npm for package management
- Modern browser for development (Chrome recommended for Playwright)

**Production:**
- Deployment target: Render.com (configured via `render.yaml`)
- Runtime: Node.js
- Plan: Free tier available
- Build command: `npm install && npm run build`
- Start command: `npm run start`

---

*Stack analysis: 2026-03-26*