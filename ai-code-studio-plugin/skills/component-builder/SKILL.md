---
name: component-builder
description: Build React 19 + TypeScript components with Tailwind CSS v4. Use when creating new UI components, pages, or layouts for AI Code Studio Pro.
---

# React Component Builder

## When to Use

- User asks to create a new React component
- User needs a new page or view
- User wants to add UI elements to the workspace
- Component scaffolding is needed

## Workflow

### Step 1: Gather Requirements

Ask the user:
1. Component name and purpose
2. Props interface (what data does it need?)
3. State requirements (useState, useReducer?)
4. Side effects (useEffect for data fetching?)
5. Styling preference (Tailwind classes or custom CSS?)

### Step 2: Create Component Structure

```tsx
// src/components/ComponentName.tsx
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IconName } from 'lucide-react';

import type { ComponentNameProps } from '../types';

const ComponentName = React.memo(function ComponentName({
  prop1,
  prop2,
}: ComponentNameProps) {
  const [state, setState] = useState<Type>('default');

  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      {/* Component content */}
    </div>
  );
});

export default ComponentName;
```

### Step 3: Create Types

```tsx
// src/types/components.ts
export interface ComponentNameProps {
  prop1: string;
  prop2: number;
  onAction?: () => void;
}
```

### Step 4: Add to Index (if needed)

```tsx
// src/components/index.ts
export { default as ComponentName } from './ComponentName';
```

### Step 5: Test Component

Create a test file:

```tsx
// src/test/components/ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import ComponentName from '../../components/ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop1="test" prop2={42} />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

## Best Practices

- Always use `React.memo` for performance
- Use `useCallback` for event handlers passed as props
- Keep components small and focused
- Use Framer Motion for animations
- Import icons from `lucide-react`
- Follow the existing design system (glassmorphism)
- No inline styles - use Tailwind only

## Example

**User:** "Create a user profile card component"

**You:**
1. Create `src/components/UserProfileCard.tsx`
2. Add props interface with user data
3. Use glass-panel styling
4. Add avatar, name, email, bio
5. Include action buttons (Edit, Delete)
6. Create test file
7. Export from components index
