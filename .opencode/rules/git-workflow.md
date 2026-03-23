# Git Workflow Rules

## Branch Naming

```
feature/add-authentication
fix/login-bug
refactor/chat-panel
docs/update-readme
test/add-unit-tests
chore/update-deps
```

## Commit Messages

```
feat: Add user authentication
fix: Resolve login redirect bug
refactor: Extract Button component
docs: Update API documentation
style: Fix formatting
test: Add unit tests for ChatPanel
chore: Update dependencies
```

## Pre-Commit Checklist

- [ ] TypeScript passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] Lint passes
- [ ] No console.log in production code
- [ ] No commented-out code

## Git Commands

```bash
# Create feature branch
git checkout -b feature/add-authentication

# Stage changes
git add src/hooks/useAuth.ts
git add src/components/LoginForm.tsx

# Commit
git commit -m "feat: Add user authentication"

# Push
git push -u origin feature/add-authentication

# Create PR
gh pr create --title "feat: Add user authentication" --body "Summary of changes"
```

## Merge Rules

- **Never** force push to main/master
- **Always** rebase before merging
- **Squash** small related commits
- **Keep** significant commits separate

## After Merge

```bash
# Update main
git checkout main
git pull origin main

# Delete feature branch
git branch -d feature/add-authentication
git push origin --delete feature/add-authentication
```
