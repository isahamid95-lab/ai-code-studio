# TDD Skill

## Workflow

1. **RED** - Write a failing test first
   - Test describes expected behavior
   - Test fails with clear error
   - No production code yet

2. **GREEN** - Make it pass
   - Write minimal code to pass
   - No over-engineering
   - Duplicate code OK temporarily

3. **REFACTOR** - Clean up
   - Remove duplication
   - Improve naming
   - Extract functions
   - Keep tests green

## Rules

- Test file next to source: `Component.tsx` → `Component.test.tsx`
- Use Vitest: `describe`, `it`, `expect`
- AAA pattern: Arrange, Act, Assert
- One assertion per test (ideally)
- Test names: `should + expected behavior`

## Example

```typescript
// Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await userEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Commands

```
/tdd "Create login form with validation"
/test "Add tests for Button component"
```
