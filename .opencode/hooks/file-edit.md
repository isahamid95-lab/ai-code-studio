# File Edit Hook

## Purpose

Run checks after file edits:
- Type check
- Lint
- Test (if test file exists)

## Trigger

`file.edit`

## Actions

### 1. TypeScript Check

```bash
npm run lint
```

If fails:
- Show errors
- Suggest fix

### 2. Lint Check

```bash
npm run lint
```

If fails:
- Show lint errors
- Auto-fix if safe

### 3. Test Run

If `*.test.ts` exists for edited file:

```bash
npm run test -- path/to/file.test.ts
```

If fails:
- Show test failures
- Suggest fix

## Output

```
✅ src/hooks/useAgent.ts
  ✓ TypeScript: pass
  ✓ Lint: pass
  ✓ Tests: 12 passing (320ms)
```

## Skip Conditions

- `.md` files
- `.json` files (except package.json)
- `.css` files
