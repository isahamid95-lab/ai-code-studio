import fs from 'fs/promises';
import path from 'path';

const WORKSPACE_DIR = path.join(process.cwd(), 'project-workspace');
const FILE_SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next']);

async function getWorkspaceTree(
  dir: string = WORKSPACE_DIR,
  relativePath: string = '',
  depth: number = 0
): Promise<string> {
  if (depth > 5) return '...';
  let result = '';
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const e of sorted) {
      if (FILE_SKIP.has(e.name)) continue;
      const isDir = e.isDirectory();
      result += `${'  '.repeat(depth)}${isDir ? '📁' : '📄'} ${e.name}\n`;
      if (isDir) {
        result += await getWorkspaceTree(
          path.join(dir, e.name),
          path.join(relativePath, e.name),
          depth + 1
        );
      }
    }
  } catch {
    // Directory read error - skip
  }
  return result;
}

function detectPersona(messages: Array<{ content?: string }>): string {
  const allContent = messages.map((m) => m.content || '').join(' ').toLowerCase();

  if (
    allContent.match(
      /(ui|ux|design|css|tailwind|frontend|react|component|styling|button|layout)/
    )
  ) {
    return 'ROLE: FRONTEND_EXPERT. You are a UI/UX specialist with expertise in modern animations, Tailwind CSS, and responsive design.';
  } else if (
    allContent.match(
      /(backend|server|api|database|sql|express|node|auth|security|docker|endpoint)/
    )
  ) {
    return 'ROLE: BACKEND_EXPERT. You are a systems architect with expertise in Express, Node.js, databases, and performance optimization.';
  } else if (allContent.match(/(bug|error|fix|debug|crash|fail|hatas)/)) {
    return 'ROLE: DEBUG_EXPERT. You are a systematic problem solver who finds root causes, not symptoms.';
  }
  return 'ROLE: FULLSTACK_ORCHESTRATOR. You are the lead architect for building applications from scratch.';
}

async function getAgentMemory(): Promise<string> {
  const memoryPath = path.join(WORKSPACE_DIR, '.ai-memory.json');
  try {
    const memContent = await fs.readFile(memoryPath, 'utf-8');
    const memJson = JSON.parse(memContent);
    if (Object.keys(memJson).length > 0) {
      let memoryStr = `\n--- 🧠 PERSISTENT AGENT MEMORY ---\nThis is permanent memory from past interactions.\n`;
      for (const [k, v] of Object.entries(memJson)) {
        memoryStr += `[${k}]: ${v}\n`;
      }
      return memoryStr + `---------------------------------\n`;
    }
  } catch {
    // Memory file doesn't exist or is invalid
  }
  return '';
}

async function setAgentMemory(key: string, value: string): Promise<void> {
  const memoryPath = path.join(WORKSPACE_DIR, '.ai-memory.json');
  let memory: Record<string, string> = {};
  try {
    const memContent = await fs.readFile(memoryPath, 'utf-8');
    memory = JSON.parse(memContent);
  } catch {
    // File doesn't exist, start with empty memory
  }
  memory[key] = value;
  await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
}

async function getRelevantFilesContext(filePaths: string[]): Promise<string> {
  let context = '';
  for (const filePath of filePaths) {
    try {
      const fullPath = path.join(WORKSPACE_DIR, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      context += `\n--- ${filePath} ---\n${content}\n`;
    } catch {
      // File doesn't exist or can't be read
    }
  }
  return context;
}

export {
  getWorkspaceTree,
  detectPersona,
  getAgentMemory,
  setAgentMemory,
  getRelevantFilesContext,
  WORKSPACE_DIR,
  FILE_SKIP,
};