# Testing Rules

## Framework

- **Vitest** for unit/integration tests
- **Testing Library** for React components
- **Playwright** for E2E tests

## File Naming

```
Component.tsx → Component.test.tsx
utils.ts → utils.test.ts
api.service.ts → api.service.test.ts
```

## Coverage Requirements

- **80% minimum** coverage
- **100% critical paths** (auth, payments, data mutations)
- All exports must be tested

## Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Tests
  it('should + expected behavior', () => {
    // Arrange
    // Act
    // Assert
  })

  it('should handle edge case', () => {
    // Edge case test
  })
})
```

## Mocking

```typescript
// Mock fetch
global.fetch = vi.fn()

// Mock modules
vi.mock('../services/api', () => ({
  fetchData: vi.fn()
}))

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser })
}))
```

## Commands

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test -- path/to/file.test.ts  # Single file
```
