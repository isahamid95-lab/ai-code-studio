# Test Generator Skill

## Analysis

1. Read source file
2. Identify all exports
3. Identify dependencies
4. Determine test types needed

## Test Types

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('functionName', () => {
  it('should + behavior', () => {
    // Test logic
  })
  
  it('should handle edge case', () => {
    // Edge case
  })
})
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'

describe('Component', () => {
  it('should render', () => {
    render(<Component />)
    expect(screen.getByText('Expected')).toBeInTheDocument()
  })
})
```

### Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react'

describe('useHook', () => {
  it('should + behavior', () => {
    const { result } = renderHook(() => useHook())
    expect(result.current.value).toBe(expected)
  })
})
```

## Mocking Strategy

```typescript
// Mock fetch
global.fetch = vi.fn(() => 
  Promise.resolve({ json: () => Promise.resolve({}) })
)

// Mock modules
vi.mock('axios', () => ({
  default: { get: vi.fn() }
}))

// Mock context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}))
```

## Coverage Targets

| Type | Coverage |
|------|----------|
| Utils | 100% |
| Hooks | 90% |
| Components | 80% |
| Pages | 70% |

## Command

```
/test src/utils/format.ts
/test src/hooks/useChat.ts
/test src/components/Button.tsx
```
