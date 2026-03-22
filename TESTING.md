# AI Code Studio - Enhanced Features Test Guide

## 🧪 Testing Enhanced AI Features

### Prerequisites
1. Install dependencies: `npm install`
2. Configure API key in `.env.local`:
   ```bash
   VITE_ALIBABA_API_KEY=sk-your-key-here
   ```
3. Start dev server: `npm run dev`
4. Open http://localhost:3000

---

## Test 1: Code Analysis ✨

### Steps:
1. Create a new file: `src/example.ts`
2. Paste this code:
```typescript
function calculate(a, b) {
  return a + b;
}

function processData(data) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    result.push(calculate(data[i], 10));
  }
  return result;
}
```

3. Click **AI Tools → Analyze**

### Expected Result:
- Quality score: ~60/100
- Issues detected:
  - ❌ Missing type annotations (TypeScript)
  - ⚠️ No input validation
  - ⚠️ No error handling
  - ℹ️ Could use modern array methods

---

## Test 2: Test Generation 🧪

### Steps:
1. Open any source file (e.g., `src/utils.ts`)
2. Click **AI Tools → Tests**
3. Select test framework: Vitest

### Expected Result:
- New file created: `src/utils.test.ts`
- 5-10 test cases generated
- Includes edge cases
- Mocks external dependencies

---

## Test 3: Code Refactoring ♻️

### Steps:
1. Open a file with messy code
2. Click **AI Tools → Refactor**
3. Select improvements:
   - ✅ Performance
   - ✅ Readability
   - ✅ Security

### Expected Result:
- Code improved with:
  - Better variable names
  - Type safety
  - Error handling
  - Modern syntax
- Before/After score comparison

---

## Test 4: Code Explanation 📖

### Steps:
1. Select complex code snippet
2. Click **AI Tools → Explain**
3. Choose detail level: Beginner

### Expected Result:
- Clear explanation
- Key concepts listed
- Code examples
- Learning resources

---

## Test 5: Debug Assistant 🐛

### Steps:
1. Copy error message
2. Click **AI Tools → Debug** (in chat)
3. Paste error + stack trace

### Expected Result:
- Root cause identified
- Fix provided
- Prevention tips

---

## Test 6: Performance Optimization ⚡

### Steps:
1. Open slow/performance-critical code
2. Click **AI Tools → Optimize**

### Expected Result:
- Optimized code
- List of improvements
- Complexity metrics before/after

---

## 📊 Success Criteria

| Feature | Success Criteria | Status |
|---------|-----------------|--------|
| Code Analysis | Detects 3+ issues | ⏳ |
| Test Generation | Creates 5+ tests | ⏳ |
| Refactoring | Improves score by 20+ | ⏳ |
| Explanation | Clear for beginners | ⏳ |
| Debug | Correct root cause | ⏳ |
| Optimization | Reduces complexity | ⏳ |

---

## 🐛 Known Issues

- [ ] Rate limiting not implemented
- [ ] No offline support
- [ ] Large files may timeout
- [ ] Some languages not supported

---

## 📝 Feedback

If you encounter issues:
1. Check API key is valid
2. Check network connection
3. Check server logs
4. Open GitHub issue

---

## 🎯 Next Steps

After testing:
1. Update API keys if needed
2. Customize AI prompts
3. Add more features
4. Deploy to production
