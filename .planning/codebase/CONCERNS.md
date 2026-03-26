# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**Monolithic App.tsx:**
- Issue: `src/App.tsx` is 846 lines - a God Component containing UI, state management, keyboard shortcuts, theme handling, and business logic
- Files: `src/App.tsx`
- Impact: Difficult to test, maintain, and reason about. Changes require navigating massive file. Prop drilling throughout.
- Fix approach: Split into smaller components (EditorArea, ActivityBar, ModalManager, etc.), extract hooks for keyboard shortcuts, extract theme/layout management

**Duplicate State Management:**
- Issue: Two state systems exist - React hooks (`useFiles`, `useChat`, `useAgent`) in `src/App.tsx` AND a nanostores-based system in `src/stores` (imported but barely used in `src/contexts/AppContext.tsx`)
- Files: `src/App.tsx`, `src/contexts/AppContext.tsx`, `src/stores` (referenced but not fully implemented)
- Impact: Confusion about where state lives, potential sync issues, dead code
- Fix approach: Consolidate to single state management approach - either remove nanostores or migrate hooks to use it

**Hardcoded AI Model:**
- Issue: Agent routes use hardcoded `FIXED_MODEL = 'qwen3.5-plus'` while UI allows model selection
- Files: `server/routes/agent-enhanced.ts` (line 10)
- Impact: User's model selection in settings is ignored for agent requests
- Fix approach: Pass model parameter from frontend to agent routes

## Known Bugs

**Console.log Debug Statements:**
- Symptoms: 63 `console.log/error/warn` statements scattered throughout codebase (production logging noise)
- Files: `src/App.tsx`, `server/utils/workspace.ts`, `server/routes/exec.ts`, `server/websocket/terminal.ts`, `src/hooks/*.ts`
- Trigger: Normal operation creates verbose console output
- Workaround: None currently

**Git Commit Identity:**
- Symptoms: All commits use hardcoded identity "AI Studio User <user@aistudio.local>"
- Files: `server/routes/git.ts` (lines 132-133)
- Trigger: Every git commit operation
- Workaround: None - users cannot set their own git identity

## Security Considerations

**Command Execution Disparity:**
- Risk: `server/routes/exec.ts` has robust command validation (allowlist, dangerous patterns, npm-specific checks) but `server/routes/agent-enhanced.ts` `run_command` tool executes commands directly via spawn with minimal validation
- Files: `server/routes/exec.ts`, `server/routes/agent-enhanced.ts` (lines 111-149)
- Current mitigation: Both use `safePath` and workspace confinement
- Recommendations: Apply the same `isCommandAllowed()` validation from `exec.ts` to the agent's `run_command` tool

**Terminal WebSocket Authentication:**
- Risk: Token validation is minimal (length >= 10 characters) - no cryptographic verification or session binding
- Files: `server/websocket/terminal.ts` (lines 114-128)
- Current mitigation: Token required, connection limits enforced, environment sanitized
- Recommendations: Implement JWT-based authentication with proper session binding, add rate limiting per connection

**API Key Environment Variables:**
- Risk: Multiple fallback environment variables for API keys increases attack surface
- Files: `server/services/ai-provider.ts` (lines 3-4), `server/routes/ai.ts` (lines 6-7), `server/routes/agent-enhanced.ts` (lines 14-15)
- Current mitigation: Keys read from environment only, not logged
- Recommendations: Consolidate to single source of truth (e.g., `AI_API_KEY`), remove VITE_ prefixed keys from server code (those are for frontend)

**CSP Allows Unsafe-Eval:**
- Risk: Content Security Policy includes `'unsafe-inline'` and `'unsafe-eval'` for scripts
- Files: `server.ts` (lines 60-61)
- Current mitigation: Limited to same origin
- Recommendations: Work toward removing unsafe-eval (may require build/bundle changes)

## Performance Bottlenecks

**Large Component Re-renders:**
- Problem: `ChatPanel.tsx` (458 lines) and `OnboardingModal.tsx` (556 lines) will re-render on any prop change
- Files: `src/components/ChatPanel.tsx`, `src/components/OnboardingModal.tsx`
- Cause: Complex components with many props, no memoization strategy
- Improvement path: Split into smaller memoized components, use React.memo strategically, implement virtualization for chat messages list

**File Fetching on Every Tab Switch:**
- Problem: `useFiles` may trigger file refresh operations frequently
- Files: `src/hooks/useFiles.ts`
- Cause: No caching/debouncing strategy for file operations
- Improvement path: Implement React Query or SWR for file operations with proper caching

## Fragile Areas

**Agent Tool Execution:**
- Files: `server/routes/agent-enhanced.ts`
- Why fragile: Tool execution parses AI-generated XML tags, spawns processes without full validation
- Safe modification: Always apply security validation from `exec.ts` before executing any command
- Test coverage: None (no server-side tests exist)

**Streaming Response Handling:**
- Files: `server/routes/agent-enhanced.ts`, `server/services/streaming.ts`, `src/services/api.ts`
- Why fragile: SSE parsing, buffer management, error handling in async generators
- Safe modification: Always test with malformed/incomplete SSE data
- Test coverage: None for streaming logic

**Workspace Path Operations:**
- Files: `server/utils/workspace.ts`
- Why fragile: All file operations depend on `safePath()` - a single bug could allow path traversal
- Safe modification: Add comprehensive test coverage for `safePath()` edge cases
- Test coverage: None

## Scaling Limits

**Concurrent Terminal Sessions:**
- Current capacity: 10 concurrent terminals (hardcoded limit)
- Limit: Defined in `server/websocket/terminal.ts` (line 13)
- Scaling path: Make configurable, add per-user limits

**Rate Limiting Values:**
- Current capacity: Production limits (100 req/15min API, 10 req/min chat, 20 req/5min agent)
- Limit: May be too restrictive for power users
- Scaling path: Implement user-tier based limits, add bypass for authenticated users

**Managed Process Tracking:**
- Current capacity: In-memory Map for process tracking
- Limit: Lost on server restart, no persistence
- Scaling path: Add process persistence for recovery after restart

## Dependencies at Risk

**None identified** - All dependencies appear current and maintained.

## Missing Critical Features

**Server-Side Test Coverage:**
- Problem: Zero test files for server routes, services, or utilities
- Files: `server/` directory has no `*.test.ts` or `*.spec.ts` files
- Blocks: Confident refactoring, security validation testing

**Proper Logging Framework:**
- Problem: Using console.log/error/warn throughout codebase
- Files: Throughout `server/` and `src/`
- Blocks: Production debugging, log aggregation, structured logging

## Test Coverage Gaps

**Server Routes:**
- What's not tested: All Express routes (`files`, `git`, `exec`, `agent-enhanced`, `ai`, `chat`, `openai`)
- Files: `server/routes/*.ts`
- Risk: API contract changes break clients silently, security regressions
- Priority: High

**Security Utilities:**
- What's not tested: `safePath()`, `isCommandAllowed()`, WebSocket token validation
- Files: `server/utils/workspace.ts`, `server/routes/exec.ts`, `server/websocket/terminal.ts`
- Risk: Security bypasses go undetected
- Priority: Critical

**Agent Tool Execution:**
- What's not tested: `executeTool()`, tool parsing, SSE streaming
- Files: `server/routes/agent-enhanced.ts`
- Risk: Tool execution failures, malformed AI responses break parsing
- Priority: High

**Process Management:**
- What's not tested: `spawnWorkspaceProcess()`, `executeWorkspaceCommand()`, process cleanup
- Files: `server/services/processManager.ts`
- Risk: Zombie processes, resource leaks
- Priority: Medium

**Frontend Hooks:**
- What's tested: `useFiles`, `useGit`, `useChat`, `useAgent` (in `src/test/hooks/`)
- What's not tested: `useWebSocket`, hook integration with real API
- Files: `src/hooks/useWebSocket.ts`
- Risk: WebSocket reconnection logic failures
- Priority: Medium

---

*Concerns audit: 2026-03-26*