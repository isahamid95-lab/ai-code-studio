# Code Review Skill

## Checklist

### Security
- [ ] No hardcoded secrets/API keys
- [ ] Input validation on user input
- [ ] XSS prevention (escape user content)
- [ ] CSRF protection on forms
- [ ] SQL injection prevention (parameterized queries)

### Performance
- [ ] No unnecessary re-renders (React.memo, useMemo, useCallback)
- [ ] Efficient list rendering (keys, virtualization for long lists)
- [ ] Lazy loading for heavy components
- [ ] Image optimization

### Code Quality
- [ ] TypeScript types (no `any`)
- [ ] Error handling (try/catch, error boundaries)
- [ ] Consistent naming conventions
- [ ] DRY (extract duplicates)
- [ ] Single responsibility per function/component

### Testing
- [ ] Tests for critical paths
- [ ] Edge cases covered
- [ ] Mock external dependencies

## Review Output Format

```markdown
## Summary
Brief overview of changes

## ✅ Good
- What's working well

## ⚠️ Concerns
- Issues to address

## 🔧 Suggestions
- Specific improvements

## 🐛 Bugs
- Any bugs found
```

## Command

```
/review "Review src/components/ChatPanel.tsx"
```
