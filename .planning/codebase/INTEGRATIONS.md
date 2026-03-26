# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**AI Services:**

**DashScope/Alibaba Cloud (Primary):**
- Used for: AI chat completions, code explanation, refactoring, debugging
- SDK: Native fetch API (OpenAI-compatible endpoint)
- Base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` or `https://coding-intl.dashscope.aliyuncs.com/v1`
- Auth: `DASHSCOPE_API_KEY` / `ALIBABA_API_KEY` / `VITE_ALIBABA_API_KEY`
- Models: `qwen3-coder-plus`, `qwen3-coder-next`, `qwen3.5-plus`, `qwen3-max-2026-01-23`
- Implementation: `server/services/ai-provider.ts`, `server/routes/ai.ts`, `server/routes/chat.ts`

**OpenAI-Compatible (Alternative):**
- Used for: Alternative AI backend (OpenAI, Azure, Ollama, LM Studio, Groq, Together AI)
- SDK: Native fetch API
- Base URL: Configurable via `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- Auth: `OPENAI_API_KEY`
- Implementation: `server/routes/openai.ts`

**Model Context Protocol (MCP):**
- Used for: External tool integration for AI agents
- SDK: `@modelcontextprotocol/sdk` (stdio client transport)
- Configuration: `.mcp.json` defines MCP servers
- Configured servers: `context7` (Upstash), `shadcn`, `TestSprite`
- Implementation: `server/services/mcpClient.ts`

## Data Storage

**Databases:**
- None - Application is stateless for user data
- No ORM or database client

**File Storage:**
- Local filesystem only
- Workspace directory: `project-workspace/` (gitignored)
- Used for: Project files, code editing, git operations
- Archive export: Uses `archiver` for ZIP creation

**Caching:**
- None - No Redis, Memcached, or similar

## Authentication & Identity

**Auth Provider:**
- None - No built-in user authentication
- Security relies on:
  - Local-only CORS (`localhost:3000`, `localhost:5173` in development)
  - Rate limiting per endpoint
  - Terminal WebSocket token validation
- Implementation: CORS config in `server.ts`, rate limiting in `src/middleware/rateLimiter.ts`

## Monitoring & Observability

**Error Tracking:**
- None configured (no Sentry, LogRocket, etc.)

**Logs:**
- Console-based logging
- Terminal WebSocket logs connection events
- MCP client logs server status
- Error handling middleware in `server/middleware/errorHandler.ts`

## CI/CD & Deployment

**Hosting:**
- Platform: Render.com
- Configuration: `render.yaml`
- Service type: Web service (Node.js runtime)
- Health check: `/health` endpoint
- Auto-deploy: Enabled

**CI Pipeline:**
- None configured in repository
- Playwright tests support CI mode via `process.env.CI` detection

## Environment Configuration

**Required env vars:**
```
# Primary AI (at least one required)
VITE_ALIBABA_API_KEY      # Frontend-accessible Alibaba key
ALIBABA_API_KEY           # Server Alibaba key
DASHSCOPE_API_KEY         # Alternative Alibaba key

# Alternative AI (optional)
OPENAI_API_KEY            # OpenAI or compatible service key
OPENAI_BASE_URL           # Optional: Custom OpenAI-compatible URL

# MCP (optional)
MORPH_API_KEY             # Morph MCP integration
CONTEXT7_API_KEY          # Context7 MCP integration
```

**Secrets location:**
- `.env.local` (gitignored, overrides `.env`)
- Render Dashboard environment variables for production

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- AI API calls to DashScope/OpenAI-compatible endpoints
- MCP server communications via stdio transport

## API Routes Summary

**Backend API Endpoints** (defined in `server/routes/index.ts`):

| Route | Purpose |
|-------|---------|
| `/api/files/*` | File system operations |
| `/api/git/*` | Git operations |
| `/api/ai/*` | AI-powered code tools (explain, refactor, debug, optimize) |
| `/api/chat` | Streaming chat completions |
| `/api/agent/*` | AI agent endpoints |
| `/api/agent-enhanced/*` | Enhanced agent with MCP tools |
| `/api/openai/*` | OpenAI-compatible endpoints |
| `/api/processes/*` | Process management |
| `/api/export/*` | Archive/export functionality |
| `/api/exec/*` | Command execution |
| `/preview/*` | Preview server |
| `/api/terminal` | WebSocket terminal |

**Health Check:**
- `GET /health` - Returns `{ status: 'ok', timestamp }`

---

*Integration audit: 2026-03-26*