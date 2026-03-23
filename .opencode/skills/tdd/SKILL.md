---
name: tdd
description: Test-driven development workflow with RED-GREEN-REFACTOR cycle
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: testing
---

## What I do

I implement the Test-Driven Development (TDD) methodology:

1. **RED** - Write a failing test first
   - Test describes expected behavior
   - Test fails with clear error message
   - No production code written yet

2. **GREEN** - Make the test pass
   - Write minimal code to pass the test
   - No over-engineering
   - Duplicate code is acceptable temporarily

3. **REFACTOR** - Clean up the code
   - Remove duplication
   - Improve naming
   - Extract functions
   - Keep all tests green

## When to use me

Use this skill when:
- Implementing new features
- Fixing bugs (write regression test first)
- Adding functionality to existing code
- Learning unfamiliar codebases

## Rules

- Test file next to source: `Component.tsx` → `Component.test.tsx`
- Use Vitest: `describe`, `it`, `expect`, `vi`
- Follow AAA pattern: Arrange, Act, Assert
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
