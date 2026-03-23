# Coding Style Rules

## TypeScript

```typescript
// ✅ DO: Explicit types
function createUser(name: string, age: number): User { ... }

// ❌ DON'T: Implicit any
function createUser(name, age) { ... }

// ✅ DO: Interfaces for objects
interface User {
  id: string
  name: string
  email: string
}

// ✅ DO: Type unions for flexibility
type Status = 'pending' | 'success' | 'error'

// ❌ DON'T: any type
const data: any = {}

// ✅ DO: unknown for uncertain types
function parseJSON(str: string): unknown { ... }
```

## React

```typescript
// ✅ DO: Functional components
export default function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}

// ✅ DO: useCallback for event handlers passed as props
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies])

// ✅ DO: useMemo for expensive calculations
const filteredItems = useMemo(() => {
  return items.filter(item => item.active)
}, [items])

// ❌ DON'T: Class components
class Button extends React.Component { ... }
```

## File Organization

```
src/
├── components/     # One component per file
├── hooks/          # use*.ts pattern
├── services/       # API calls
├── types/          # TypeScript types
└── utils/          # Pure functions
```

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatPanel` |
| Hooks | camelCase + use | `useChat` |
| Functions | camelCase | `fetchData` |
| Constants | UPPER_SNAKE | `API_URL` |
| Types | PascalCase | `UserData` |
| CSS | kebab-case | `chat-panel` |

## Imports Order

```typescript
// 1. React/external
import React from 'react'

// 2. Internal types
import type { User } from '../types'

// 3. Internal utilities
import { useAuth } from '../hooks/useAuth'

// 4. Components
import Button from './Button'
```
