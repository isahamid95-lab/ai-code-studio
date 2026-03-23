---
description: Review code for quality, security, and maintainability
agent: code-reviewer
subtask: true
---

# Code Review Command

Review the following code: $ARGUMENTS

## Review Process

1. **Get Changes**: Run `git diff` to see recent changes
2. **Analyze Code**: Check for security, quality, and performance issues
3. **Categorize Issues**: Critical, Warning, Suggestion
4. **Provide Fixes**: Include specific examples

## Checklist

### Security (CRITICAL)
- [ ] No hardcoded credentials
- [ ] Input validation present
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities
- [ ] Proper error handling

### Code Quality (HIGH)
- [ ] Functions under 50 lines
- [ ] Files under 800 lines
- [ ] No deep nesting (>4 levels)
- [ ] No console.log statements
- [ ] Tests for new code

### Performance (MEDIUM)
- [ ] Efficient algorithms
- [ ] No unnecessary re-renders (React)
- [ ] Proper memoization
- [ ] No N+1 queries

### Best Practices (MEDIUM)
- [ ] Good naming conventions
- [ ] No magic numbers
- [ ] Proper error messages
- [ ] Consistent formatting

## Output Format

```
## Summary
[Overall assessment]

## Critical Issues
[Must fix before merge]

## Warnings
[Should fix]

## Suggestions
[Nice to have]

## Verdict
APPROVE / WARNING / BLOCK
```