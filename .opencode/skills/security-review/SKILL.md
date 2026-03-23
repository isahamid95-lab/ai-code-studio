---
name: security-review
description: Security vulnerability scanning and audit checklist
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: security
---

## What I do

I perform security audits and vulnerability scanning:

### Automated Checks

1. **Secrets Scan**
   - API keys, tokens, passwords in code
   - Environment variable usage verification
   - Git history for leaked secrets

2. **XSS Vulnerabilities**
   - `dangerouslySetInnerHTML` usage
   - `innerHTML` assignments
   - `eval()` and `new Function()` calls

3. **Input Validation**
   - Form inputs validation
   - URL parameters sanitization
   - API request body validation
   - File upload restrictions

### Manual Review

**Authentication:**
- JWT tokens stored securely (httpOnly cookies)
- Token expiration enforced
- Password hashing (bcrypt, argon2)
- Rate limiting on login endpoints

**Authorization:**
- Role checks on protected routes
- Resource ownership verification
- Admin routes properly protected

**Data Protection:**
- Sensitive data encrypted at rest
- HTTPS enforced
- CORS configured correctly
- CSP headers set

## When to use me

Use this skill when:
- Before deploying to production
- After authentication changes
- Handling sensitive user data
- Third-party integrations

## Security Checklist

```markdown
- [ ] No secrets in code
- [ ] Input validation added
- [ ] XSS prevention in place
- [ ] Authentication checks on protected routes
- [ ] Rate limiting on API endpoints
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Dependencies audited (npm audit)
```

## Command

```
/security-review src/
/security-review src/api/auth.ts
```