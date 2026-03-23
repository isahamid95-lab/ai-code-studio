---
description: Run comprehensive security review
agent: security-reviewer
subtask: true
---

# Security Command

Run a comprehensive security review for: $ARGUMENTS

## Security Scan

1. **Secrets Detection**: Scan for hardcoded credentials
2. **Input Validation**: Check user input handling
3. **Injection Risks**: SQL, XSS, Command injection
4. **Auth Review**: Authentication and authorization
5. **Dependency Audit**: Check for vulnerable packages

## Scan Commands

```bash
# Check for secrets
grep -rn "api_key\|password\|secret\|token" --include="*.ts" --include="*.tsx"

# Check dependencies
npm audit

# Run security scan
npm run security-audit 2>/dev/null || npx audit-ci
```

## Output Format

```markdown
# Security Report

## Summary
- Total Issues: X
- Critical: X
- High: X
- Medium: X

## Critical Issues
[Immediate action required]

## High Issues
[Fix within 24 hours]

## Recommendations
[Security improvements]
```