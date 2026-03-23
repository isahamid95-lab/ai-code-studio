# Security Rules

## API Keys & Secrets

```typescript
// ❌ NEVER: Hardcoded secrets
const apiKey = 'sk-1234567890'

// ✅ DO: Environment variables
const apiKey = import.meta.env.VITE_API_KEY
```

## Input Validation

```typescript
// ✅ DO: Validate all user input
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ✅ DO: Sanitize before rendering
const sanitized = DOMPurify.sanitize(userContent)
```

## XSS Prevention

```typescript
// ❌ NEVER: Dangerous HTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ DO: Escape user content
<div>{userContent}</div>

// ✅ DO: Use DOMPurify if HTML needed
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

## CSRF Protection

```typescript
// ✅ DO: Use CSRF tokens for mutations
const response = await fetch('/api/update', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken
  }
})
```

## SQL Injection

```typescript
// ❌ NEVER: String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`

// ✅ DO: Parameterized queries
const query = 'SELECT * FROM users WHERE id = ?'
const result = await db.query(query, [userId])
```

## Security Checklist

Before commit:
- [ ] No secrets in code
- [ ] Input validation added
- [ ] XSS prevention in place
- [ ] Authentication checks on protected routes
- [ ] Rate limiting on API endpoints
