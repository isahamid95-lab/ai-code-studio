# AI Code Studio Plugin

Cursor plugin for AI Code Studio Pro - React 19 + TypeScript + Vite + Tailwind CSS v4 development.

## Features

### Rules (Auto-Applied)

- **typescript-react-standards.mdc** - TypeScript & React best practices
- **tailwind-v4-utilities.mdc** - Tailwind CSS v4 guidelines and design system

### Skills (Auto-Triggered)

- **component-builder** - Build React components with TypeScript and Tailwind
- **api-route-creator** - Create Express.js API endpoints

### Commands (Manual Invocation)

- `/ai-studio:add-component` - Create a new React component
- `/ai-studio:add-api-route` - Add a new API endpoint

### Hooks (Automation)

- **beforeFileEdit** - Run `npm run lint` on TypeScript files
- **afterFileEdit** - Remind to run tests

## Installation

1. Open Cursor Settings
2. Go to Plugins
3. Click "Install from Folder"
4. Select this directory

## Usage

### Automatic

The rules and skills will automatically apply when you:
- Create new React/TypeScript files
- Ask about component creation
- Request API endpoint development

### Manual Commands

```bash
/ai-studio:add-component
/ai-studio:add-api-route
```

## Example Workflows

### Create a Component

1. Type: "Create a user profile card component"
2. The `component-builder` skill will activate
3. It will ask about props, state, and styling
4. Component will be created with tests

### Add API Endpoint

1. Type: "Add an endpoint to create projects"
2. The `api-route-creator` skill will activate
3. It will ask about request/response format
4. Route will be added to server.ts with validation

## Development

### Update Rules

Edit `.mdc` files in `rules/` directory

### Update Skills

Edit `SKILL.md` files in `skills/*/` directory

### Add Commands

Create new `.md` files in `commands/` directory

## Testing

After installation:

1. Try creating a component: "Create a button component"
2. Try adding an API route: "Add GET /api/users endpoint"
3. Verify rules apply by checking AI suggestions

## Publishing

To publish to Cursor marketplace:

1. Ensure `plugin.json` is valid
2. Push to GitHub
3. Submit at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)

## License

MIT
