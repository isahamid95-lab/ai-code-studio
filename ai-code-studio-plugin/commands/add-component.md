---
name: add-component
description: Create a new React component with TypeScript types, Tailwind styling, and tests
---

# Add Component Command

## Usage

Invoke via `/ai-studio:add-component`

## Workflow

1. Ask user for component name and purpose
2. Ask about required props
3. Ask about state requirements
4. Create component file in `src/components/`
5. Create types in `src/types/`
6. Create test file in `src/test/components/`
7. Export from component index

## Example

```bash
/ai-studio:add-component UserProfileCard
```

This will:
- Create `src/components/UserProfileCard.tsx`
- Add props interface
- Use glassmorphism styling
- Create test file
- Export from index
