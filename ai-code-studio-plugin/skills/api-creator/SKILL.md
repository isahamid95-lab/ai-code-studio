---
name: api-route-creator
description: Create Express.js API routes and endpoints for AI Code Studio Pro backend. Use when adding new API endpoints, updating server.ts, or creating REST/GraphQL APIs.
---

# API Route Creator

## When to Use

- User asks to create a new API endpoint
- User needs to add REST routes to Express server
- User wants to update `server.ts` with new functionality
- Backend API development is needed

## Workflow

### Step 1: Gather Requirements

Ask the user:
1. Endpoint path (e.g., `/api/users`, `/api/projects/:id`)
2. HTTP method (GET, POST, PUT, DELETE, PATCH)
3. Request body schema (what data is needed?)
4. Response format (what should it return?)
5. Authentication required?
6. Database operations needed?

### Step 2: Add Route to server.ts

```typescript
// server.ts

// Add route handler
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }
    
    // Business logic here
    const user = await createUser({ name, email });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create user' 
    });
  }
});
```

### Step 3: Add TypeScript Types

```typescript
// src/types/api.ts
export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: User;
}

export interface ApiError {
  error: string;
  message?: string;
}
```

### Step 4: Add Validation

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email()
});

app.post('/api/users', async (req, res) => {
  try {
    const parsed = CreateUserSchema.parse(req.body);
    // ... rest of handler
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    // ... handle other errors
  }
});
```

### Step 5: Add Tests

```typescript
// tests/api/users.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
  
  it('validates required fields', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
  });
});
```

## API Patterns

### Error Handling

```typescript
try {
  // Operation
} catch (error: any) {
  console.error('Operation failed:', error);
  res.status(500).json({ 
    error: error.message || 'An unexpected error occurred' 
  });
}
```

### Response Format

```typescript
// Success
{
  success: true,
  data: { ... },
  message?: string
}

// Error
{
  success: false,
  error: string,
  details?: any
}
```

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

## Best Practices

- Always use try-catch for async operations
- Validate all input with Zod
- Return consistent response formats
- Use appropriate HTTP status codes
- Log errors but don't expose internals
- Add rate limiting for public endpoints
- Use path traversal protection for file operations
- Sanitize user input

## Example

**User:** "Add an endpoint to create a new project"

**You:**
1. Add `POST /api/projects` route to `server.ts`
2. Add validation schema with Zod
3. Create project in workspace directory
4. Return project data with 201 status
5. Add error handling
6. Create test file
7. Add TypeScript types
