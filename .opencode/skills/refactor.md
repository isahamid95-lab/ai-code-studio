# Refactor Skill

## When to Refactor

- Function > 50 lines
- Component > 200 lines  
- Duplicate code (2+ occurrences)
- Complex nesting (> 3 levels)
- Long parameter lists (> 4 params)
- Unclear naming

## Patterns

### Extract Function

```typescript
// Before
function process() {
  // 20 lines of validation
  // 30 lines of transformation
  // 15 lines of formatting
}

// After
function process() {
  validate()
  transform()
  format()
}
```

### Extract Component

```typescript
// Before
function App() {
  return (
    <div>
      <Header />
      {/* 100 lines of UI */}
    </div>
  )
}

// After
function App() {
  return (
    <div>
      <Header />
      <MainContent />
    </div>
  )
}
```

### Reduce Nesting

```typescript
// Before
if (user) {
  if (user.active) {
    if (user.role === 'admin') {
      // logic
    }
  }
}

// After
if (!user || !user.active || user.role !== 'admin') return
// logic
```

## Metrics

| Metric | Target |
|--------|--------|
| Function length | < 50 lines |
| Component length | < 200 lines |
| Cyclomatic complexity | < 10 |
| Nesting depth | < 3 levels |
| Parameters | < 4 |

## Command

```
/refactor src/components/ChatPanel.tsx "Reduce size"
/refactor src/hooks/useAgent.ts "Extract sub-hooks"
```
