---
name: add-api-route
description: Create a new Express.js API endpoint with validation, error handling, and tests
---

# Add API Route Command

## Usage

Invoke via `/ai-studio:add-api-route`

## Workflow

1. Ask user for endpoint path and HTTP method
2. Ask about request body schema
3. Ask about response format
4. Check if authentication is needed
5. Add route to `server.ts`
6. Add validation with Zod
7. Create TypeScript types
8. Add error handling
9. Create test file

## Example

```bash
/ai-studio:add-api-route POST /api/projects
```

This will:
- Add POST route to server.ts
- Add request validation
- Create project in workspace
- Return structured response
- Add tests
