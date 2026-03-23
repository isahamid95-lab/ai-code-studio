# Session Start Hook

## Purpose

Load context at session start:
- Recent files
- Active task
- Git status
- Terminal output

## Trigger

`session.start`

## Actions

1. Read recent files from `.opencode/state.json`
2. Check git status
3. Load active task if exists
4. Display summary

## Example Output

```
📁 Project: AI Code Studio Pro
🌿 Branch: main (↑2 ↓0)
📝 Active: src/hooks/useAgent.ts
📦 Recent: ChatPanel.tsx, api.ts, types.ts
```

## State File

```json
{
  "lastSession": "2026-03-23T10:30:00Z",
  "activeFile": "src/hooks/useAgent.ts",
  "recentFiles": [
    "src/components/ChatPanel.tsx",
    "src/services/api.ts",
    "src/types/index.ts"
  ],
  "activeTask": "Add agent preview auto-open"
}
```
