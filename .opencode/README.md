# OpenCode ECC Integration

Everything Claude Code (ECC) plugin for OpenCode - agents, commands, hooks, and skills.

## Installation

ECC is already integrated into this project. The `.opencode/` directory contains:

```
.opencode/
├── config.json           # Main configuration with agents & commands
├── plugins/              # ECC hooks plugin
│   ├── index.ts
│   └── ecc-hooks.ts
├── prompts/agents/       # Agent system prompts
│   ├── planner.txt
│   ├── architect.txt
│   ├── code-reviewer.txt
│   ├── security-reviewer.txt
│   ├── tdd-guide.txt
│   ├── build-error-resolver.txt
│   └── e2e-runner.txt
├── commands/             # Slash command templates
│   ├── plan.md
│   ├── tdd.md
│   ├── code-review.md
│   ├── security.md
│   ├── build-fix.md
│   └── e2e.md
├── skills/               # Workflow definitions
├── rules/                # Always-follow guidelines
├── hooks/                # Trigger-based automations
└── instructions/         # Core ECC instructions
```

## Agents (7)

| Agent | Description |
|-------|-------------|
| planner | Implementation planning |
| architect | System design |
| code-reviewer | Code review |
| security-reviewer | Security analysis |
| tdd-guide | Test-driven development |
| build-error-resolver | Build error fixes |
| e2e-runner | E2E testing |

## Commands (6)

| Command | Description |
|---------|-------------|
| `/plan` | Create implementation plan |
| `/tdd` | TDD workflow |
| `/code-review` | Review code changes |
| `/security` | Security review |
| `/build-fix` | Fix build errors |
| `/e2e` | E2E tests |

## Plugin Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| Format | `file.edited` | Auto-format JS/TS |
| TypeCheck | `tool.execute.after` | Check for type errors |
| Console Warn | `file.edited` | Warn about console.log |
| Session | `session.created` | Load context |
| Idle | `session.idle` | Run audits |

## Hook Runtime Controls

```bash
# Set hook strictness
export ECC_HOOK_PROFILE=standard  # minimal | standard | strict

# Disable specific hooks
export ECC_DISABLED_HOOKS="post:edit:format,post:edit:console-warn"
```

## Skills

- **tdd** - RED/GREEN/REFACTOR workflow
- **code-review** - Security, performance, quality checklist
- **security-review** - Vulnerability scanning
- **refactor** - Code improvement patterns
- **test-generator** - Vitest test generation
- **documentation** - JSDoc and README
- **bug-fix** - Debugging workflow

## Rules

- **coding-style** - TypeScript, React, naming conventions
- **testing** - Vitest, 80% coverage, mocking
- **security** - XSS, CSRF, input validation, secrets
- **git-workflow** - Commits, branches, PR process

## Usage

1. Start OpenCode session
2. Use commands: `/plan "Add authentication"`
3. Skills auto-apply based on context
4. Hooks run automatically on triggers

## Project Context

- **Stack**: React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4, Express.js
- **AI**: Alibaba Qwen3 Coder
- **Testing**: Vitest with jsdom
- **Runtime**: WebContainer API