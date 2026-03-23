# Documentation Skill

## JSDoc Comments

```typescript
/**
 * Fetches user data from API
 * 
 * @param userId - The user ID to fetch
 * @param options - Optional configuration
 * @returns Promise resolving to user data
 * @throws Error if fetch fails
 * 
 * @example
 * const user = await fetchUser('123')
 * 
 * @see {@link https://api.example.com/users}
 */
async function fetchUser(
  userId: string,
  options?: FetchOptions
): Promise<User> {
  // Implementation
}
```

## Component Documentation

```typescript
interface ButtonProps {
  /** Button label text */
  label: string
  
  /** Click handler */
  onClick: () => void
  
  /** Button variant (default: 'primary') */
  variant?: 'primary' | 'secondary' | 'danger'
  
  /** Disabled state */
  disabled?: boolean
  
  /** Optional CSS class */
  className?: string
}

/**
 * Button component for user actions
 * 
 * @example
 * <Button label="Click me" onClick={handleClick} />
 * 
 * @example
 * <Button label="Delete" variant="danger" />
 */
export default function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // Implementation
}
```

## README Sections

```markdown
## Installation

```bash
npm install package-name
```

## Usage

```typescript
import { Component } from 'package-name'

function App() {
  return <Component prop="value" />
}
```

## API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Button text |
| `onClick` | `() => void` | - | Click handler |

## Examples

### Basic

\`\`\`tsx
<Button label="Click" onClick={() => {}} />
\`\`\`

### With Variant

\`\`\`tsx
<Button label="Delete" variant="danger" />
\`\`\`
```

## Command

```
/docs src/hooks/useChat.ts
/docs src/components/ChatPanel.tsx
```
