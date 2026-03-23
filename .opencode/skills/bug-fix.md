# Bug Fix Skill

## Workflow

### 1. Reproduce

```
- Get exact error message
- Identify steps to reproduce
- Check browser console
- Check network tab
- Check server logs
```

### 2. Isolate

```
- Find source file
- Identify failing function
- Check recent changes (git blame)
- Check related tests
```

### 3. Analyze

```
- Root cause analysis
- Check edge cases
- Check race conditions
- Check null/undefined
```

### 4. Fix

```
- Minimal change
- Add null checks
- Add error handling
- Update types if needed
```

### 5. Test

```
- Add regression test
- Run existing tests
- Manual verification
- Check related features
```

## Common Patterns

### Null/Undefined

```typescript
// Before
const name = user.profile.name

// After
const name = user?.profile?.name ?? 'Anonymous'
```

### Array Methods

```typescript
// Before
const first = items[0].name

// After
const first = items.at(0)?.name ?? ''
```

### Async Errors

```typescript
// Before
const data = await fetch()

// After
try {
  const data = await fetch()
} catch (err) {
  setError(err.message)
}
```

### Race Conditions

```typescript
// Before
useEffect(() => {
  fetchData()
}, [])

// After
useEffect(() => {
  let cancelled = false
  fetchData().then(data => {
    if (!cancelled) setData(data)
  })
  return () => { cancelled = true }
}, [])
```

## Command

```
/fix "TypeError: Cannot read property 'map' of undefined"
/fix "Component re-renders infinitely"
```
