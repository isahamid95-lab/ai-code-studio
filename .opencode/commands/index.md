# Commands for OpenCode

## /plan

```
Usage: /plan <feature description>

Creates implementation plan with:
1. File structure
2. Dependencies needed
3. Step-by-step tasks
4. Estimated complexity

Example:
/plan "Add user authentication with JWT"
```

## /tdd

```
Usage: /tdd <feature description>

Test-driven development:
1. Write failing tests
2. Implement minimal code
3. Refactor

Example:
/tdd "Create login form with email/password validation"
```

## /review

```
Usage: /review [file path]

Code review with checklist:
- Security
- Performance
- Code quality
- Testing

Example:
/review src/hooks/useAgent.ts
```

## /test

```
Usage: /test <file path>

Generate tests for existing code:
- Unit tests
- Edge cases
- Mock dependencies

Example:
/test src/services/api.ts
```

## /docs

```
Usage: /docs <file path>

Generate/update documentation:
- JSDoc comments
- README sections
- API documentation

Example:
/docs src/hooks/useChat.ts
```

## /fix

```
Usage: /fix <error message or description>

Fix bugs or errors:
1. Analyze error
2. Find root cause
3. Implement fix
4. Add regression test

Example:
/fix "TypeError: Cannot read property 'map' of undefined"
```

## /refactor

```
Usage: /refactor <file path> <goal>

Refactor code:
- Remove duplication
- Improve naming
- Extract functions
- Optimize performance

Example:
/refactor src/App.tsx "Reduce component size"
```
