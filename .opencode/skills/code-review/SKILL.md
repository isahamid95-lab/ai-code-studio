---
name: code-review
description: Comprehensive code review with security, performance, and quality checklist
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: review
---

## What I do

I perform comprehensive code reviews using a structured checklist:

### Security Review
- No hardcoded secrets or API keys
- Input validation on all user input
- XSS prevention (escape user content)
- CSRF protection on forms
- SQL injection prevention (parameterized queries)

### Performance Review
- No unnecessary re-renders (React.memo, useMemo, useCallback)
- Efficient list rendering (keys, virtualization for long lists)
- Lazy loading for heavy components
- Image optimization

### Code Quality Review
- TypeScript types (no `any`)
- Error handling (try/catch, error boundaries)
- Consistent naming conventions
- DRY principle (extract duplicates)
- Single responsibility per function/component

### Testing Review
- Tests for critical paths
- Edge cases covered
- Mock external dependencies

## When to use me

Use this skill when:
- Before merging pull requests
- After completing a feature
- Reviewing team member's code
- Preparing for production deployment

## Review Output Format

```markdown
## Summary
Brief overview of changes and overall quality

## ✅ Good
- What's working well
- Best practices followed

## ⚠️ Concerns
- Issues to address
- Potential problems

## 🔧 Suggestions
- Specific improvements
- Code examples for fixes

## 🐛 Bugs
- Any bugs found
- Steps to reproduce
```

## Command

```
/review "Review src/components/ChatPanel.tsx"
/review src/hooks/useAgent.ts
```
