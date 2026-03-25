export interface AIAction {
  type: 'file_create' | 'file_edit' | 'file_delete' | 'command' | 'text' | 'code';
  path?: string;
  content?: string;
  command?: string;
  language?: string;
  id?: string;
  title?: string;
}

export interface ParsedArtifact {
  id: string;
  title: string;
  actions: AIAction[];
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

const ARTIFACT_REGEX = /<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/gi;
const ACTION_REGEX = /<boltAction[^>]*>([\s\S]*?)<\/boltAction>/gi;
const FILE_REGEX = /<file[^>]*>([\s\S]*?)<\/file>/gi;
const COMMAND_REGEX = /<command[^>]*>([\s\S]*?)<\/command>/gi;
const CODE_BLOCK_REGEX = /```(\w+)?\s*([\s\S]*?)```/g;

function extractAttribute(tag: string, name: string): string | null {
  const regex = new RegExp(`${name}="([^"]*)"`, 'i');
  const match = tag.match(regex);
  return match ? match[1] : null;
}

export function parseArtifactTags(output: string): ParsedArtifact[] {
  const artifacts: ParsedArtifact[] = [];
  const artifactMatches = output.matchAll(ARTIFACT_REGEX);

  for (const match of artifactMatches) {
    const fullMatch = match[0];
    const artifactTag = fullMatch.match(/<boltArtifact[^>]*>/i)?.[0] || '';
    const artifactContent = match[1];

    const id = extractAttribute(artifactTag, 'id') || `artifact-${Date.now()}`;
    const title = extractAttribute(artifactTag, 'title') || 'Untitled Artifact';

    const actions = parseActions(artifactContent);

    artifacts.push({
      id,
      title,
      actions,
    });
  }

  return artifacts;
}

export function parseActions(content: string): AIAction[] {
  const actions: AIAction[] = [];

  const actionMatches = content.matchAll(ACTION_REGEX);
  for (const match of actionMatches) {
    const fullMatch = match[0];
    const actionTag = fullMatch.match(/<boltAction[^>]*>/i)?.[0] || '';
    const actionContent = match[1];

    const actionType = extractAttribute(actionTag, 'type') || 'text';
    const filePath = extractAttribute(actionTag, 'filePath');

    if (actionType === 'file' && filePath) {
      actions.push({
        type: 'file_create',
        path: filePath,
        content: actionContent.trim(),
      });
    } else if (actionType === 'shell') {
      actions.push({
        type: 'command',
        command: actionContent.trim(),
      });
    } else {
      actions.push({
        type: 'text',
        content: actionContent.trim(),
      });
    }
  }

  const fileMatches = content.matchAll(FILE_REGEX);
  for (const match of fileMatches) {
    const fullMatch = match[0];
    const fileTag = fullMatch.match(/<file[^>]*>/i)?.[0] || '';
    const fileContent = match[1];

    const path = extractAttribute(fileTag, 'path');
    const action = extractAttribute(fileTag, 'action') || 'create';

    if (path) {
      actions.push({
        type: action === 'edit' ? 'file_edit' : 'file_create',
        path,
        content: fileContent.trim(),
      });
    }
  }

  const commandMatches = content.matchAll(COMMAND_REGEX);
  for (const match of commandMatches) {
    const commandContent = match[1];

    actions.push({
      type: 'command',
      command: commandContent.trim(),
    });
  }

  return actions;
}

export function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const matches = text.matchAll(CODE_BLOCK_REGEX);

  for (const match of matches) {
    const language = match[1] || 'text';
    const code = match[2] || '';
    blocks.push({
      language: language.trim(),
      code: code.trim(),
    });
  }

  return blocks;
}

export function parseAIOutput(output: string): AIAction[] {
  const actions: AIAction[] = [];

  const artifacts = parseArtifactTags(output);
  for (const artifact of artifacts) {
    actions.push(...artifact.actions);
  }

  const codeBlocks = extractCodeBlocks(output);
  for (const block of codeBlocks) {
    actions.push({
      type: 'code',
      content: `\`\`\`${block.language}\n${block.code}\n\`\`\``,
      language: block.language,
    });
  }

  if (actions.length === 0) {
    actions.push({
      type: 'text',
      content: output,
    });
  }

  return actions;
}

export function classifyAction(action: AIAction): {
  category: 'file' | 'command' | 'content';
  risk: 'safe' | 'caution' | 'dangerous';
} {
  if (action.type === 'file_delete') {
    return { category: 'file', risk: 'dangerous' };
  }

  if (action.type === 'command') {
    const cmd = action.command?.toLowerCase() || '';
    if (cmd.includes('rm ') || cmd.includes('del ') || cmd.includes('format ')) {
      return { category: 'command', risk: 'dangerous' };
    }
    if (cmd.includes('npm ') || cmd.includes('yarn ') || cmd.includes('pnpm ')) {
      return { category: 'command', risk: 'safe' };
    }
    return { category: 'command', risk: 'caution' };
  }

  if (action.type === 'file_create' || action.type === 'file_edit') {
    return { category: 'file', risk: 'safe' };
  }

  return { category: 'content', risk: 'safe' };
}

export function formatActionForDisplay(action: AIAction): string {
  switch (action.type) {
    case 'file_create':
      return `📄 Create: ${action.path}`;
    case 'file_edit':
      return `✏️ Edit: ${action.path}`;
    case 'file_delete':
      return `🗑️ Delete: ${action.path}`;
    case 'command':
      return `⚡ Run: ${action.command}`;
    case 'code':
      return `💻 Code (${action.language})`;
    default:
      return action.content?.substring(0, 50) || '';
  }
}

export class StreamingParser {
  private buffer: string = '';

  append(chunk: string): void {
    this.buffer += chunk;
  }

  parse(): AIAction[] {
    return parseAIOutput(this.buffer);
  }

  getBuffer(): string {
    return this.buffer;
  }

  clear(): void {
    this.buffer = '';
  }

  extractNewContent(previousLength: number): string {
    return this.buffer.slice(previousLength);
  }
}