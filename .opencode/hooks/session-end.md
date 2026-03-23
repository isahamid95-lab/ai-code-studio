# Session End Hook

## Purpose

Save state at session end:
- Current file
- Recent files
- Active task
- Key learnings

## Trigger

`session.end`

## Actions

1. Save current file path
2. Update recent files list (max 10)
3. Save active task if exists
4. Extract key learnings to skills

## Learnings Extraction

```
If session modified >3 files:
  → Suggest: /learn "Extract pattern from changes"

If session fixed a bug:
  → Suggest: /skill-create "Bug fix pattern"

If session added tests:
  → Suggest: /skill-create "Testing pattern"
```

## State Update

```typescript
// Save to .opencode/state.json
{
  "lastSession": new Date().toISOString(),
  "activeFile": currentFile,
  "recentFiles": updateRecentFiles(currentFile),
  "activeTask": currentTask,
  "learnings": extractLearnings()
}
```
