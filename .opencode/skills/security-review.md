# Security Review Skill

## Automated Checks

### 1. Secrets Scan

```bash
# Check for hardcoded secrets
grep -r "api_key\s*=\s*['\"]" src/
grep -r "secret\s*=\s*['\"]" src/
grep -r "password\s*=\s*['\"]" src/
```

### 2. XSS Vulnerabilities

```typescript
// Check for dangerous patterns
- dangerouslySetInnerHTML
- innerHTML = userContent
- eval(userInput)
- new Function(userInput)
```

### 3. Input Validation

```typescript
// All user inputs must be validated
- Form inputs
- URL parameters
- API request bodies
- File uploads
```

## Manual Review

### Authentication
- [ ] JWT tokens stored securely (httpOnly cookies)
- [ ] Token expiration enforced
- [ ] Password hashing (bcrypt, argon2)
- [ ] Rate limiting on login

### Authorization
- [ ] Role checks on protected routes
- [ ] Resource ownership verified
- [ ] Admin routes protected

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced
- [ ] CORS configured correctly

## Command

```
/security-review src/
/security-review src/api/auth.ts
```

## Output Format

```markdown
## Security Review: {file}

### 🔴 Critical
- Issues requiring immediate fix

### 🟡 Warnings  
- Potential vulnerabilities

### 🟢 Passed
- Security checks passed

### Recommendations
- Specific fixes
```
