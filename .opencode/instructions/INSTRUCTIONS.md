# ECC Instructions for OpenCode

This project uses Everything Claude Code (ECC) patterns for AI-assisted development.

## Core Principles

### 1. Test-Driven Development
- Write tests FIRST (RED phase)
- Implement minimal code (GREEN phase)
- Refactor while keeping tests green
- Target 80%+ coverage

### 2. Security First
- Never commit secrets or credentials
- Validate all user inputs
- Use parameterized queries
- Sanitize outputs

### 3. Code Quality
- Functions under 50 lines
- Files under 800 lines
- No deep nesting (>4 levels)
- No console.log in production code

### 4. Immutability
- Never mutate state directly
- Use spread operator for updates
- Return new copies from functions

## Available Commands

| Command | Description |
|---------|-------------|
| `/plan` | Create implementation plan |
| `/tdd` | TDD workflow |
| `/code-review` | Code quality review |
| `/security` | Security audit |
| `/build-fix` | Fix build errors |
| `/e2e` | E2E test generation |

## Hook Runtime Controls

```bash
# Set hook strictness
export ECC_HOOK_PROFILE=standard  # minimal | standard | strict

# Disable specific hooks
export ECC_DISABLED_HOOKS="hook-id-1,hook-id-2"
```

## Project Context

- **Stack**: React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4, Express.js
- **AI**: Alibaba Qwen3 Coder
- **Testing**: Vitest with jsdom
- **Runtime**: WebContainer API