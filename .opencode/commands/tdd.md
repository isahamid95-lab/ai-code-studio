---
description: Enforce TDD workflow with 80%+ coverage
agent: tdd-guide
subtask: true
---

# TDD Command

Implement the following using strict test-driven development: $ARGUMENTS

## TDD Cycle (MANDATORY)

```
RED → GREEN → REFACTOR → REPEAT
```

## Your Task

### Step 1: Define Interfaces (SCAFFOLD)
- Define TypeScript interfaces for inputs/outputs
- Create function signature with `throw new Error('Not implemented')`

### Step 2: Write Failing Tests (RED)
- Write tests that exercise the interface
- Include happy path, edge cases, and error conditions
- Run tests - verify they FAIL

### Step 3: Implement Minimal Code (GREEN)
- Write just enough code to make tests pass
- Run tests - verify they PASS

### Step 4: Refactor (IMPROVE)
- Extract constants, improve naming
- Remove duplication
- Run tests - verify they still PASS

### Step 5: Check Coverage
- Target: 80% minimum
- 100% for critical business logic

---

**MANDATORY**: Tests must be written BEFORE implementation.