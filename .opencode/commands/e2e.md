---
description: Generate and run E2E tests with Playwright
agent: e2e-runner
subtask: true
---

# E2E Command

Generate E2E tests for: $ARGUMENTS

## E2E Testing Process

1. **Identify User Flow**: What needs to be tested
2. **Create Test File**: `tests/e2e/[feature].spec.ts`
3. **Write Test**: Follow Page Object Model
4. **Run Test**: Verify it passes

## Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/')

    // Arrange: Set up test data

    // Act: Perform user actions

    // Assert: Verify results
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

## Commands

```bash
# Install Playwright
npx playwright install

# Run tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Generate test
npx playwright codegen http://localhost:5173
```

## Best Practices

- Use Page Object Model
- Test critical user flows
- Keep tests independent
- Use meaningful test names
- Clean up test data