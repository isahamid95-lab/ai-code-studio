---
description: Fix build and TypeScript errors with minimal changes
agent: build-error-resolver
subtask: true
---

# Build Fix Command

Fix build/type errors for: $ARGUMENTS

## Process

1. **Run Build**: Identify all errors
2. **Categorize**: TypeScript, Build, Lint errors
3. **Fix Minimal**: Only fix what's broken
4. **Verify**: Tests pass, build succeeds

## Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Run build
npm run build

# Check lint
npm run lint
```

## Rules

- Fix only the errors reported
- No refactoring while fixing
- No new features
- Preserve existing behavior
- Run tests after fixing

## Output

- List of errors found
- Fixes applied
- Verification results