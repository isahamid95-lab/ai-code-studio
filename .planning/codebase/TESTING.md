# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Runner:**
- Vitest 4.1.2
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals: enabled (no need to import `describe`, `it`, `expect`)

**Assertion Library:**
- Vitest built-in assertions (compatible with Jest)
- Testing Library: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`

**Run Commands:**
```bash
npm run test              # Run all tests (vitest run)
npm run test:watch        # Watch mode (vitest)
npm run test:coverage     # Coverage report (vitest run --coverage)
```

## Test File Organization

**Location:**
- Unit tests: Co-located in `src/test/` directory, mirroring source structure
- E2E tests: `tests/e2e/` directory

**Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

**Structure:**
```
src/test/
├── setup.ts                    # Global test setup
├── components/
│   ├── Header.test.tsx
│   ├── FileExplorer.test.tsx
│   ├── TerminalPanel.test.tsx
│   └── PreviewPanel.test.tsx
├── hooks/
│   ├── useAgent.test.ts
│   ├── useChat.test.ts
│   ├── useFiles.test.ts
│   └── useGit.test.ts
├── services/
│   └── api.test.ts
├── constants/
│   └── index.test.ts
└── lib/
    └── dev-server.test.ts

tests/e2e/
└── app.spec.ts
```

## Test Setup

**Global Setup (`src/test/setup.ts`):**
```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ComponentName from '../../components/ComponentName'

describe('ComponentName', () => {
  const mockOnAction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render expected content', () => {
    render(<ComponentName onAction={mockOnAction} />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should call callback on interaction', () => {
    render(<ComponentName onAction={mockOnAction} />)
    fireEvent.click(screen.getByText('Button'))
    expect(mockOnAction).toHaveBeenCalledTimes(1)
  })
})
```

**Hook Testing Pattern:**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('../../services/api', () => ({
  streamAgentRequest: vi.fn(),
}))

import { streamAgentRequest } from '../../services/api'
import { useAgent } from '../../hooks/useAgent'

const mockStreamAgentRequest = streamAgentRequest as Mock

// Harness function to provide all required dependencies
function useAgentHarness(onRefreshFiles: Mock, onServerStarted: Mock) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  // ... other state

  const agent = useAgent({
    model: 'qwen3.5-plus',
    files: [{ id: 'src/App.tsx' }],
    activeFileId: 'src/App.tsx',
    setChatMessages,
    setIsGenerating,
    // ... other dependencies
  })

  return { ...agent, chatMessages, isGenerating }
}

describe('useAgent Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a dedicated plan message', async () => {
    mockStreamAgentRequest.mockImplementationOnce(async (_model, _messages, _mode, onEvent) => {
      await onEvent({ type: 'plan', content: '1. Scaffold the project' })
      await onEvent({ type: 'done' })
    })

    const { result } = renderHook(() => useAgentHarness(vi.fn(), vi.fn()))

    await act(async () => {
      await result.current.sendAgentMessage('Create an app', 'plan')
    })

    expect(result.current.chatMessages.find(m => m.variant === 'plan')?.text).toContain('Scaffold')
  })
})
```

## Mocking

**Framework:** Vitest `vi` object

**Module Mocking:**
```typescript
// At file level, before imports
vi.mock('../../services/api', () => ({
  streamAgentRequest: vi.fn(),
}))

vi.mock('../../utils/export', () => ({
  exportWorkspaceAsZip: vi.fn()
}))

// Import the mocked module
import { streamAgentRequest } from '../../services/api'
const mockStreamAgentRequest = streamAgentRequest as Mock
```

**Global Mocks (in setup.ts):**
```typescript
global.fetch = vi.fn()
```

**Implementation Mocking:**
```typescript
// Single mock implementation
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ data: 'test' })
})

// Multiple implementations in sequence
mockStreamAgentRequest
  .mockImplementationOnce(async () => { /* first call */ })
  .mockImplementationOnce(async () => { /* second call */ })
```

**What to Mock:**
- External API calls (`fetch`, WebSocket)
- Browser APIs (`localStorage`, `matchMedia`, `ResizeObserver`)
- Child components (if testing parent in isolation)
- Time-dependent functions (`setTimeout`, `Date`)

**What NOT to Mock:**
- The unit under test
- Simple utility functions
- Type definitions

## Fixtures and Factories

**Test Data:**
```typescript
// Inline fixtures
const mockFiles: FileItem[] = [
  { id: 'app.ts', name: 'app.ts', content: 'test', language: 'typescript', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'styles.css', name: 'styles.css', content: '.test {}', language: 'css', createdAt: Date.now(), updatedAt: Date.now() },
]

const mockTemplates: Record<string, FileTemplate> = {
  'React Component': { name: 'React Component', defaultExt: '.tsx', content: 'export default function() {}' },
}

// Default props pattern
const defaultProps = {
  files: mockFiles,
  activeTabId: '',
  isCreatingFile: false,
  onSetCreatingFile: vi.fn(),
  // ...
}
```

**Location:**
- Test data defined inline in test files
- Complex fixtures extracted to top of test file or separate fixture file if reused

## Coverage

**Requirements:** Not strictly enforced

**Coverage Configuration:**
```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/types/*',
  ],
}
```

**View Coverage:**
```bash
npm run test:coverage
# Opens HTML report in coverage/index.html
```

## Test Types

**Unit Tests:**
- Focus: Individual functions, hooks, utilities
- Location: `src/test/`
- Pattern: Test public API, mock dependencies

**Integration Tests:**
- Focus: Component interactions, data flow
- Location: `src/test/components/`
- Pattern: Render with real children, test user interactions

**E2E Tests:**
- Framework: Playwright 1.58.2
- Config: `playwright.config.ts`
- Location: `tests/e2e/`
- Pattern: Test full user flows in browser

```typescript
// E2E test example
import { test, expect } from '@playwright/test'

test.describe('AI Code Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application', async ({ page }) => {
    await expect(page.locator('text=AI Code Studio')).toBeVisible()
  })

  test('should toggle sidebar on Cmd+B', async ({ page }) => {
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
    await page.keyboard.press('Meta+b')
    await expect(sidebar).not.toBeVisible()
  })
})
```

**Run E2E Tests:**
```bash
npx playwright test
```

## Common Patterns

**Async Testing:**
```typescript
// Waiting for state updates
await waitFor(() => {
  expect(result.current.chatMessages).toHaveLength(2)
})

// Async act for hooks
await act(async () => {
  await result.current.sendAgentMessage('test', 'agent')
})
```

**Error Testing:**
```typescript
it('should handle API errors gracefully', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'))

  try {
    await fetch('/api/endpoint')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('Network error')
  }
})
```

**Conditional Rendering:**
```typescript
it('should show element when condition is true', () => {
  render(<Component hasActiveFile={true} />)
  expect(screen.getByText('Run')).not.toBeDisabled()
})

it('should disable element when condition is false', () => {
  render(<Component hasActiveFile={false} />)
  expect(screen.getByText('Run')).toBeDisabled()
})
```

**Testing Hook Return Values:**
```typescript
const { result } = renderHook(() => useCustomHook())

// Access current values
expect(result.current.isLoading).toBe(false)

// Trigger updates
act(() => {
  result.current.startLoading()
})

// Assert updates
expect(result.current.isLoading).toBe(true)
```

---

*Testing analysis: 2026-03-26*