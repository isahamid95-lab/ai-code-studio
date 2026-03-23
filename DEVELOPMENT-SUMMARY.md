# AI Code Studio Pro - Current Development Summary

## Status

The legacy WebContainer-based architecture has been replaced by the approved server-first redesign.

## Current Architecture

- Agent runs through `/api/agent` with SSE streaming
- Files are stored on disk in `project-workspace/`
- Commands run on the local server with `child_process.spawn()`
- Dev servers are managed in-memory and exposed to the preview panel by detected port
- Terminal has two modes:
  - Agent Output
  - Interactive WebSocket shell

## Key Runtime Files

- `server.ts`
- `lib/dev-server.ts`
- `src/hooks/useAgent.ts`
- `src/hooks/useFiles.ts`
- `src/components/TerminalPanel.tsx`
- `src/components/PreviewPanel.tsx`
- `src/utils/persistence.ts`

## Verification

Current verification commands:

```bash
npm test
npm run lint
npm run build
```

## Source Of Truth

For the detailed redesign rationale and implementation scope, use:

- `docs/superpowers/specs/2026-03-23-server-first-agent-redesign.md`
