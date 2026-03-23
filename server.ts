import express from "express";
import { createServer as createHttpServer } from "http";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import net from "net";
import simpleGit from "simple-git";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import archiver from "archiver";
import { WebSocketServer } from "ws";
import { detectPortFromOutput, isDevServerCommand, preflightDevServerStart, type ManagedProcessLike } from "./lib/dev-server";

import fsSync from 'fs';
import dotenv from 'dotenv';
// Load standard .env first, then override with .env.local if present
dotenv.config();
if (fsSync.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const WORKSPACE_DIR = path.join(process.cwd(), "project-workspace");
if (!fsSync.existsSync(WORKSPACE_DIR)) {
  fsSync.mkdirSync(WORKSPACE_DIR, { recursive: true });
}
const git = simpleGit(WORKSPACE_DIR);

// Enhanced AI API Base URL
const AI_BASE_URL = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';
const AI_API_KEY = process.env.VITE_ALIBABA_API_KEY;

// Path traversal protection
function safePath(userPath: string): string | null {
  const resolved = path.resolve(WORKSPACE_DIR, userPath);
  if (!resolved.startsWith(WORKSPACE_DIR)) {
    return null; // Path traversal attempt
  }
  return resolved;
}

async function ensureWorkspace() {
  // Already ensured synchronously above
}

const IS_WINDOWS = process.platform === 'win32';
const FILE_SKIP = new Set(['.git', 'node_modules', 'dist', 'build', '.next']);

interface ManagedProcess extends ManagedProcessLike {
  process: ChildProcessWithoutNullStreams;
}

interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

function spawnWorkspaceProcess(command: string, cwd: string): ChildProcessWithoutNullStreams {
  const shell = IS_WINDOWS ? 'cmd' : 'sh';
  const shellArgs = IS_WINDOWS ? ['/c', command] : ['-c', command];

  return spawn(shell, shellArgs, {
    cwd,
    env: { ...process.env, FORCE_COLOR: '0', CI: 'true', NONINTERACTIVE: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function executeWorkspaceCommand(command: string, cwd: string, options: {
  timeout?: number;
  onData?: (chunk: string) => void;
  background?: boolean;
  kind?: 'dev-server';
  onPort?: (port: number) => void;
}): Promise<{ output: string; exitCode: number; port?: number }> {
  return new Promise((resolve, reject) => {
    const child = spawnWorkspaceProcess(command, cwd);
    let output = '';
    let detectedPort: number | undefined;
    let resolved = false;
    const timeout = options.timeout || 120000;
    const managedEntry: ManagedProcess | null = options.background && options.kind === 'dev-server'
      ? {
          pid: child.pid!,
          command,
          kind: 'dev-server' as const,
          process: child,
          spawnedAt: Date.now(),
        }
      : null;

    if (managedEntry) {
      managedProcesses.set(child.pid!, managedEntry);
    }

    const timer = setTimeout(() => {
      if (options.background) {
        if (!resolved) {
          resolved = true;
          resolve({ output: output || '(no output)', exitCode: 0, port: detectedPort });
        }
        return;
      }

      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout / 1000}s`));
    }, options.background ? 30000 : timeout);

    child.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      options.onData?.(chunk);
      if (options.background && !detectedPort) {
        detectedPort = detectPortFromOutput(chunk);
        if (detectedPort) {
          if (managedEntry) {
            managedEntry.port = detectedPort;
          }
          options.onPort?.(detectedPort);
          clearTimeout(timer);
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve({ output: output || '(no output)', exitCode: 0, port: detectedPort });
            }
          }, 1000);
        }
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      options.onData?.(chunk);
      if (options.background && !detectedPort) {
        detectedPort = detectPortFromOutput(chunk);
        if (detectedPort) {
          if (managedEntry) {
            managedEntry.port = detectedPort;
          }
          options.onPort?.(detectedPort);
          clearTimeout(timer);
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve({ output: output || '(no output)', exitCode: 0, port: detectedPort });
            }
          }, 1000);
        }
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (managedEntry) {
        managedProcesses.delete(child.pid!);
      }
      if (!resolved) {
        resolved = true;
        resolve({ output: output || '(no output)', exitCode: code ?? 1, port: detectedPort });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (managedEntry) {
        managedProcesses.delete(child.pid!);
      }
      if (options.background) {
        if (!resolved) {
          resolved = true;
          resolve({ output: `Spawn error: ${err.message}`, exitCode: 1, port: detectedPort });
        }
        return;
      }

      reject(err);
    });
  });
}

const managedProcesses = new Map<number, ManagedProcess>();

function killManagedProcess(pid: number) {
  const entry = managedProcesses.get(pid);
  if (entry) {
    try { entry.process.kill('SIGTERM'); } catch {}
    managedProcesses.delete(pid);
  }
}

function killAllManagedProcesses() {
  for (const [pid] of managedProcesses) {
    killManagedProcess(pid);
  }
}

function getManagedProcessSnapshot(): ManagedProcessLike[] {
  return Array.from(managedProcesses.values()).map((processInfo) => ({
    pid: processInfo.pid,
    command: processInfo.command,
    kind: processInfo.kind,
    port: processInfo.port,
    spawnedAt: processInfo.spawnedAt,
  }));
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => {
      resolve(false);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, '127.0.0.1');
  });
}

process.on('SIGTERM', killAllManagedProcesses);
process.on('SIGINT', killAllManagedProcesses);

async function getWorkspaceFiles(dir: string = WORKSPACE_DIR, relativePath: string = ''): Promise<WorkspaceFile[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: WorkspaceFile[] = [];

  for (const entry of entries) {
    if (FILE_SKIP.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...await getWorkspaceFiles(fullPath, relPath));
      continue;
    }

    try {
      const stat = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      files.push({
        id: relPath,
        name: relPath,
        content,
        language: detectLanguage(entry.name),
        createdAt: stat.birthtimeMs || Date.now(),
        updatedAt: stat.mtimeMs || Date.now(),
      });
    } catch {
      continue;
    }
  }

  return files.sort((left, right) => left.id.localeCompare(right.id));
}

async function startServer() {
  await ensureWorkspace();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- Enhanced AI Endpoints ---

  // Code Analysis Endpoint
  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { code, filename } = req.body;
      
      const messages = [
        {
          role: 'system',
          content: `You are a code quality expert. Analyze the code for bugs, security issues, performance problems, and style violations. Return a JSON response with:
          - score: 0-100
          - issues: array of {severity, category, message, line?, suggestion}
          - suggestions: array of improvement tips
          
          Categories: bug, security, performance, style
          Severity: critical, warning, info`
        },
        {
          role: 'user',
          content: `Analyze this ${filename} code:\n\n${code}`
        }
      ];

      const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3-coder-plus',
          messages,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Test Generation Endpoint
  app.post('/api/ai/generate-tests', async (req, res) => {
    try {
      const { filename, testFramework = 'vitest' } = req.body;
      const filePath = path.join(WORKSPACE_DIR, filename);
      const code = await fs.readFile(filePath, 'utf-8');
      
      const testFilename = filename.replace(/\.ts$|\.js$|\.tsx$|\.jsx$/, `.test.ts`);
      
      const messages = [
        {
          role: 'system',
          content: `You are a testing expert. Generate comprehensive unit tests using ${testFramework}. 
          Include:
          - Happy path tests
          - Edge cases
          - Error handling tests
          - Mock external dependencies
          
          Return JSON: { testFile: { filename, content }, testCount, coverage }`
        },
        {
          role: 'user',
          content: `Generate tests for:\n\n${code}`
        }
      ];

      const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3-coder-plus',
          messages,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      // Save test file
      const testPath = path.join(WORKSPACE_DIR, testFilename);
      await fs.writeFile(testPath, result.testFile.content, 'utf-8');
      
      res.json({
        testFile: { filename: testFilename, content: result.testFile.content },
        testCount: result.testCount,
        coverage: result.coverage
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Code Refactoring Endpoint
  app.post('/api/ai/refactor', async (req, res) => {
    try {
      const { filename, improvements } = req.body;
      const filePath = path.join(WORKSPACE_DIR, filename);
      const code = await fs.readFile(filePath, 'utf-8');
      
      const messages = [
        {
          role: 'system',
          content: `You are a refactoring expert. Improve the code for: ${improvements.join(', ')}.
          Return JSON: { refactoredCode, changes: string[], beforeScore, afterScore }`
        },
        {
          role: 'user',
          content: `Refactor this code:\n\n${code}`
        }
      ];

      const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3-coder-plus',
          messages,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      // Save refactored code
      await fs.writeFile(filePath, result.refactoredCode, 'utf-8');
      
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Code Explanation Endpoint
  app.post('/api/ai/explain', async (req, res) => {
    try {
      const { code, filename, detailLevel = 'intermediate' } = req.body;
      
      const messages = [
        {
          role: 'system',
          content: `You are a coding teacher. Explain this code at ${detailLevel} level.
          Return JSON: { explanation, concepts, examples, resources }`
        },
        {
          role: 'user',
          content: `Explain this ${filename} code:\n\n${code}`
        }
      ];

      const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3-coder-plus',
          messages,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const explanation = JSON.parse(data.choices[0].message.content);
      
      res.json(explanation);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Debug Error Endpoint
  app.post('/api/ai/debug', async (req, res) => {
    try {
      const { errorMessage, stackTrace, codeContext } = req.body;
      
      const messages = [
        {
          role: 'system',
          content: `You are a debugging expert. Analyze the error and provide a fix.
          Return JSON: { rootCause, fix, prevention }`
        },
        {
          role: 'user',
          content: `Error: ${errorMessage}\n\nStack Trace: ${stackTrace}\n\nCode Context:\n${codeContext}`
        }
      ];

      const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3-coder-plus',
          messages,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const debug = JSON.parse(data.choices[0].message.content);
      
      res.json(debug);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Performance Optimization Endpoint
  app.post('/api/ai/optimize', async (req, res) => {
    try {
      const { code, filename } = req.body;
      
      const messages = [
        {
          role: 'system',
          content: `You are a performance optimization expert. Optimize this code for speed and memory.
          Return JSON: { optimizedCode, improvements, beforeMetrics, afterMetrics }`
        },
        {
          role: 'user',
          content: `Optimize this ${filename} code:\n\n${code}`
        }
      ];

      const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen3-coder-plus',
          messages,
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const optimization = JSON.parse(data.choices[0].message.content);
      
      res.json(optimization);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Enhanced Context (RAG) Helpers ---
  async function getWorkspaceTree(dir: string, relativePath: string = '', depth: number = 0): Promise<string> {
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
        result += `${'  '.repeat(depth)}${isDir ? '📂' : '📄'} ${e.name}\n`;
        if (isDir) {
          result += await getWorkspaceTree(path.join(dir, e.name), path.join(relativePath, e.name), depth + 1);
        }
      }
    } catch (err) {}
    return result;
  }

  // --- Persona Detection Helper ---
  function detectPersona(messages: any[]): string {
    const allContent = messages.map(m => m.content || '').join(' ').toLowerCase();
    
    if (allContent.match(/(ui|ux|design|css|tailwind|frontend|react|component|styling|button|layout)/)) {
      return "ROLE: FRONTEND_EXPERT. You are a UI/UX specialist with expertise in modern animations, Tailwind CSS, and responsive design.";
    } else if (allContent.match(/(backend|server|api|database|sql|express|node|auth|security|docker|endpoint)/)) {
      return "ROLE: BACKEND_EXPERT. You are a systems architect with expertise in Express, Node.js, databases, and performance optimization.";
    } else if (allContent.match(/(bug|error|fix|debug|crash|fail|hatas)/)) {
      return "ROLE: DEBUG_EXPERT. You are a systematic problem solver who finds root causes, not symptoms.";
    }
    return "ROLE: FULLSTACK_ORCHESTRATOR. You are the lead architect for building applications from scratch.";
  }

  // --- Memory Helper ---
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
    } catch (e) {}
    return '';
  }

  // --- AI Chat Proxy ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, model, stream, ...rest } = req.body;
      const apiKey = process.env.VITE_ALIBABA_API_KEY;
      const baseUrl = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';

      // Inject Workspace Context into System Prompt
      const workspaceTree = await getWorkspaceTree(WORKSPACE_DIR);
      const persona = detectPersona(messages);
      const agentMemory = await getAgentMemory();

      const STRICT_CODING_RULES = `\n\nCRITICAL CODING STANDARDS (NO MOCK APPS):\n` +
        `1. ABSOLUTELY NO HTML/JS MOCKUPS. NEVER generate simple plain HTML files for UI requests.\n` +
        `2. You MUST construct REAL applications in React/Next.js/Tailwind/TypeScript.\n` +
        `3. Assume a modern Node.js environment structure (\`src/components/\` etc) and produce modular .tsx code.\n`;

      const contextPrompt = `Workspace Context (Project Structure):\n${workspaceTree || 'Empty Workspace'}\n\n${persona}\n${agentMemory}` + STRICT_CODING_RULES;
      
      let enhancedMessages = [...messages];
      if (enhancedMessages.length > 0 && enhancedMessages[0].role === 'system') {
        enhancedMessages[0].content += `\n\n${contextPrompt}`;
      } else {
        enhancedMessages.unshift({ role: 'system', content: contextPrompt });
      }

      const isStreaming = stream !== false;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages: enhancedMessages, stream: isStreaming, ...rest })
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: err });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Agent API (Tool Calling Loop) ---
  app.post("/api/agent", async (req, res) => {
    const { messages, model, mode } = req.body;
    const apiKey = process.env.VITE_ALIBABA_API_KEY;
    const baseUrl = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const tools = [
      {
        type: 'function',
        function: {
          name: 'create_file',
          description: 'Create or overwrite a file in the project workspace',
          parameters: {
            type: 'object',
            properties: {
              filename: { type: 'string', description: 'Filename e.g. src/App.tsx' },
              content: { type: 'string', description: 'Full file content' }
            },
            required: ['filename', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'edit_file',
          description: 'Edit specific parts of a file. Use this for targeted changes instead of rewriting entire files.',
          parameters: {
            type: 'object',
            properties: {
              filename: { type: 'string', description: 'File to edit' },
              oldContent: { type: 'string', description: 'The exact text to find and replace' },
              newContent: { type: 'string', description: 'The new text to replace with' }
            },
            required: ['filename', 'oldContent', 'newContent']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'delete_file',
          description: 'Delete a file from the workspace',
          parameters: {
            type: 'object',
            properties: {
              filename: { type: 'string', description: 'File to delete' }
            },
            required: ['filename']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'run_command',
          description: 'Execute a shell command in the project workspace. Use this for: npm init, npx create-vite, npm install, npm run build, node scripts, mkdir, etc. The command runs in the workspace directory.',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Shell command to execute, e.g. "npm init -y" or "npx create-vite@latest . --template react"' }
            },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'install_package',
          description: 'Install npm packages. Prefer this over run_command for package installation.',
          parameters: {
            type: 'object',
            properties: {
              packages: { type: 'array', items: { type: 'string' }, description: 'Package names to install' },
              dev: { type: 'boolean', description: 'Install as devDependency (default: false)' }
            },
            required: ['packages']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_memory',
          description: 'Save important architectural decisions, user preferences, or context to the persistent Agent Memory.',
          parameters: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'What this memory is about (e.g., "UserPreferences", "ArchitectureDesc", "Dependencies")' },
              content: { type: 'string', description: 'The detailed content to remember across sessions.' }
            },
            required: ['key', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read the content of a file',
          parameters: {
            type: 'object',
            properties: { filename: { type: 'string' } },
            required: ['filename']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_files',
          description: 'List all files in the workspace',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_code',
          description: 'Search for code patterns across all files in the workspace',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query or regex pattern' },
              filePattern: { type: 'string', description: 'Glob pattern to filter files (e.g. "*.tsx")' }
            },
            required: ['query']
          }
        }
      }
    ];

    try {
      const workspaceTree = await getWorkspaceTree(WORKSPACE_DIR);
      const persona = detectPersona(messages);
      const agentMemory = await getAgentMemory();
      const contextPrompt = `Workspace Context (Project Structure):\n${workspaceTree || 'Empty Workspace'}\n\n${persona}\n${agentMemory}\n\n`;

      const systemPrompt = {
        role: 'system',
        content: contextPrompt +
          'You are a full-stack development environment running on a real server.\n\n' +
          'ENVIRONMENT:\n' +
          '- CWD: project-workspace/\n' +
          '- Real Node.js runtime, real npm/npx, real filesystem\n' +
          '- All shell commands work natively\n\n' +
          'RULES:\n' +
          '1. Always build REAL applications using React, Next.js, Vite, TypeScript, and Tailwind when appropriate.\n' +
          '2. First use run_command to scaffold real projects, then create_file or edit_file for code changes.\n' +
          '3. Use install_package for dependencies whenever possible.\n' +
          '4. Use read_file before editing existing files.\n' +
          '5. Run npm run dev when the app should be previewable.\n' +
          '6. After creating or editing .ts, .tsx, .js, or .jsx files, run npx tsc --noEmit and fix errors immediately.\n\n' +
          'DO NOT:\n' +
          '- Create plain HTML or JS mockups for app requests\n' +
          '- Build fake applications\n' +
          '- Put everything in a single file\n' +
          '- Skip error checking'
      };
      let conversationMessages: any[] = [systemPrompt, ...messages];

      // Plan mode: generate plan first
      if (mode === 'plan') {
        const planRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              ...conversationMessages,
              { role: 'system', content: 'Generate a detailed numbered plan for building a REAL application. Include exact `run_command` Node.js CLI commands to bootstrap the project (e.g. npx create-vite, npm install). NEVER plan a basic HTML/CSS/JS file structure. Plan a standard modern React/TypeScript/Node project structure inside a `src/` directory. Be explicit on npm packages needed.' }
            ],
            stream: false,
            max_tokens: 1000
          })
        });
        const planData = await planRes.json();
        const planText = planData.choices?.[0]?.message?.content || '';
        send({ type: 'plan', content: planText });
        conversationMessages.push({ role: 'assistant', content: planText });
        conversationMessages.push({ role: 'user', content: 'Good. Now execute the plan — create ALL the files using the create_file tool and run any necessary commands with run_command. Create each file separately (HTML, CSS, JS). Do NOT combine files.' });
      }

      const MAX_ITERATIONS = 25;
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: conversationMessages,
            tools,
            tool_choice: 'auto',
            stream: false
          })
        });

        if (!response.ok) {
          const err = await response.text();
          send({ type: 'error', content: err });
          break;
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;
        if (!message) break;

        if (message.content) {
          send({ type: 'text', content: message.content });
        }

        if (!message.tool_calls || message.tool_calls.length === 0) break;

        conversationMessages.push(message);

        for (const toolCall of message.tool_calls) {
          let result = '';
          try {
            const args = JSON.parse(toolCall.function.arguments);
            send({ type: 'tool_call', tool: toolCall.function.name, filename: args.filename || args.command || '' });
            if (toolCall.function.name === 'create_file') {
              const safeFull = safePath(args.filename);
              if (!safeFull) {
                result = `Error: Invalid file path: ${args.filename}`;
              } else {
                await fs.mkdir(path.dirname(safeFull), { recursive: true });
                await fs.writeFile(safeFull, args.content, 'utf-8');
                send({ type: 'file_created', filename: args.filename, content: args.content });
                result = `Created ${args.filename} (${args.content.length} bytes)`;
                if (args.filename.match(/\.(ts|tsx|js|jsx)$/)) {
                  result += "\nACTION REQUIRED: Code file created. According to the SELF-CORRECTION PROTOCOL, you must now run `npx tsc --noEmit` or `npm run lint` using the run_command tool to verify the code.";
                }
              }
            } else if (toolCall.function.name === 'run_command') {
              send({ type: 'command_start', command: args.command });
              try {
                if (isDevServerCommand(args.command)) {
                  const preflight = await preflightDevServerStart(
                    args.command,
                    getManagedProcessSnapshot(),
                    isPortAvailable,
                  );

                  if (preflight.error) {
                    send({ type: 'command_output', command: args.command, output: `${preflight.error}\n`, error: true });
                    result = `Command error: ${preflight.error}`;
                    continue;
                  }

                  for (const pid of preflight.killPids) {
                    killManagedProcess(pid);
                  }

                  if (preflight.killPids.length > 0) {
                    send({
                      type: 'command_output',
                      command: args.command,
                      output: `Stopped ${preflight.killPids.length} existing managed dev server process(es).\n`,
                    });
                  }

                  const { output, port } = await executeWorkspaceCommand(args.command, WORKSPACE_DIR, {
                    background: true,
                    kind: 'dev-server',
                    onData: (chunk) => send({ type: 'command_output', command: args.command, output: chunk }),
                    onPort: (p) => send({ type: 'server_started', port: p }),
                  });
                  result = port
                    ? `Dev server started on port ${port}. Output: ${output.slice(-500)}`
                    : `Server started but port not detected. Output: ${output.slice(-500)}`;
                } else {
                  const { output, exitCode } = await executeWorkspaceCommand(args.command, WORKSPACE_DIR, {
                    timeout: 120000,
                    onData: (chunk) => send({ type: 'command_output', command: args.command, output: chunk }),
                  });
                  result = exitCode === 0
                    ? output.slice(-2000)
                    : `Command failed (exit ${exitCode}): ${output.slice(-2000)}`;
                }
              } catch (cmdErr: any) {
                const errMsg = cmdErr.message || String(cmdErr);
                send({ type: 'command_output', command: args.command, output: errMsg, error: true });
                result = `Command error: ${errMsg}`;
              }
            } else if (toolCall.function.name === 'read_file') {
              const fullPath = safePath(args.filename);
              result = fullPath
                ? await fs.readFile(fullPath, 'utf-8').catch(() => 'File not found')
                : 'Invalid file path';
            } else if (toolCall.function.name === 'list_files') {
              const fileList: string[] = [];
              async function listDir(dir: string, rel: string = '') {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const e of entries) {
                  if (FILE_SKIP.has(e.name)) continue;
                  const relPath = rel ? `${rel}/${e.name}` : e.name;
                  if (e.isDirectory()) await listDir(path.join(dir, e.name), relPath);
                  else fileList.push(relPath);
                }
              }
              await listDir(WORKSPACE_DIR);
              result = fileList.join('\n') || 'No files';
            } else if (toolCall.function.name === 'edit_file') {
              const safeFull = safePath(args.filename);
              if (!safeFull) {
                result = `Error: Invalid file path: ${args.filename}`;
              } else {
                try {
                  let content = await fs.readFile(safeFull, 'utf-8');
                  if (!content.includes(args.oldContent)) {
                    result = `Error: Could not find the specified text to replace in ${args.filename}`;
                  } else {
                    content = content.replace(args.oldContent, args.newContent);
                    await fs.writeFile(safeFull, content, 'utf-8');
                    send({ type: 'file_edited', filename: args.filename });
                    result = `Edited ${args.filename} successfully`;
                    if (args.filename.match(/\.(ts|tsx|js|jsx)$/)) {
                      result += "\nACTION REQUIRED: Code file modified. According to the SELF-CORRECTION PROTOCOL, you must now run `npx tsc --noEmit` or `npm run lint` using the run_command tool to verify the code.";
                    }
                  }
                } catch (err: any) {
                  result = `Error editing file: ${err.message}`;
                }
              }
            } else if (toolCall.function.name === 'delete_file') {
              const safeFull = safePath(args.filename);
              if (!safeFull) {
                result = `Error: Invalid file path: ${args.filename}`;
              } else {
                try {
                  await fs.unlink(safeFull);
                  send({ type: 'file_deleted', filename: args.filename });
                  result = `Deleted ${args.filename}`;
                } catch (err: any) {
                  result = `Error deleting file: ${err.message}`;
                }
              }
            } else if (toolCall.function.name === 'update_memory') {
              const memoryPath = path.join(WORKSPACE_DIR, '.ai-memory.json');
              let memory: Record<string, string> = {};
              try {
                const memContent = await fs.readFile(memoryPath, 'utf-8');
                memory = JSON.parse(memContent);
              } catch (e) { /* ignore if not exist */ }
              memory[args.key] = args.content;
              await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
              result = `Memory updated successfully. Key: ${args.key}`;
            } else if (toolCall.function.name === 'install_package') {
              const packages = args.packages.join(' ');
              const devFlag = args.dev ? '-D' : '';
              const command = `npm install ${devFlag} ${packages}`.trim();
              send({ type: 'command_start', command });
              try {
                const { output, exitCode } = await executeWorkspaceCommand(command, WORKSPACE_DIR, {
                  timeout: 120000,
                  onData: (chunk) => send({ type: 'command_output', command, output: chunk }),
                });
                result = exitCode === 0 ? output.slice(-2000) : `Install failed (exit ${exitCode}): ${output.slice(-2000)}`;
              } catch (cmdErr: any) {
                const errMsg = cmdErr.message || String(cmdErr);
                send({ type: 'command_output', command, output: errMsg, error: true });
                result = `Install error: ${errMsg}`;
              }
            } else if (toolCall.function.name === 'search_code') {
              const results: { file: string; line: number; content: string }[] = [];
              const query = args.query;
              const filePattern = args.filePattern || '*';
              
              async function searchInDir(dir: string, rel: string = '') {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const e of entries) {
                  if (FILE_SKIP.has(e.name)) continue;
                  const relPath = rel ? `${rel}/${e.name}` : e.name;
                  const fullPath = path.join(dir, e.name);
                  if (e.isDirectory()) {
                    await searchInDir(fullPath, relPath);
                  } else {
                    // Check file pattern
                    const minimatch = (await import('minimatch')).minimatch;
                    if (!minimatch(e.name, filePattern) && filePattern !== '*') continue;
                    
                    try {
                      const content = await fs.readFile(fullPath, 'utf-8');
                      const lines = content.split('\n');
                      lines.forEach((line, idx) => {
                        if (line.toLowerCase().includes(query.toLowerCase())) {
                          results.push({ file: relPath, line: idx + 1, content: line.trim() });
                        }
                      });
                    } catch { /* skip unreadable files */ }
                  }
                }
              }
              await searchInDir(WORKSPACE_DIR);
              result = results.slice(0, 50).map(r => `${r.file}:${r.line}: ${r.content}`).join('\n') || 'No results found';
              send({ type: 'search_results', query, count: results.length });
            }
          } catch (e: any) {
            result = `Error: ${e.message}`;
          }
          conversationMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
        }
      }

      send({ type: 'done' });
      res.end();
    } catch (err: any) {
      send({ type: 'error', content: err.message });
      res.end();
    }
  });

  // --- File System API ---
  app.get("/api/files", async (req, res) => {
    try {
      const files = await getWorkspaceFiles();
      res.json({ files });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const { id, content } = req.body;
      const fullPath = safePath(id);
      if (!fullPath) return res.status(400).json({ error: "Invalid file path" });
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/files", async (req, res) => {
    try {
      const { id } = req.body;
      const fullPath = safePath(id);
      if (!fullPath) return res.status(400).json({ error: "Invalid file path" });
      await fs.unlink(fullPath);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Process Manager API ---
  app.get("/api/processes", (req, res) => {
    const processes = getManagedProcessSnapshot();
    res.json({ processes });
  });

  app.delete("/api/processes/:pid", (req, res) => {
    const pid = parseInt(req.params.pid);
    if (managedProcesses.has(pid)) {
      killManagedProcess(pid);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Process not found" });
    }
  });

  // --- Export API ---
  app.get("/api/export", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="project-export.zip"');

      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      });

      archive.on('error', function(err) {
        throw err;
      });

      // pipe archive data to the client
      archive.pipe(res);

      // append files from a sub-directory, putting its contents at the root of archive
      // Ignore huge folders like node_modules or .git ideally, but for now we ignore via glob
      archive.glob('**/*', {
        cwd: WORKSPACE_DIR,
        ignore: ['node_modules/**', '.git/**']
      });

      await archive.finalize();
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // --- Git API ---
  app.post("/api/git/init", async (req, res) => {
    try {
      await git.init();
      await git.addConfig("user.name", "AI Studio User");
      await git.addConfig("user.email", "user@aistudio.local");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/git/status", async (req, res) => {
    try {
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return res.json({ isRepo: false });
      }
      const status = await git.status();
      const log = await git.log().catch(() => ({ all: [] }));
      const remotes = await git.getRemotes(true);
      res.json({ isRepo: true, status, log: log.all, remotes });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/git/stage", async (req, res) => {
    try {
      const { file } = req.body;
      if (file === ".") {
        await git.add(".");
      } else {
        await git.add(file);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/git/unstage", async (req, res) => {
    try {
      const { file } = req.body;
      if (file === ".") {
        await git.reset(["HEAD"]);
      } else {
        await git.reset(["HEAD", file]);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/git/commit", async (req, res) => {
    try {
      const { message } = req.body;
      await git.addConfig("user.name", "AI Studio User");
      await git.addConfig("user.email", "user@aistudio.local");
      await git.commit(message);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/git/remote", async (req, res) => {
    try {
      const { url } = req.body;
      const remotes = await git.getRemotes();
      if (remotes.find((r) => r.name === "origin")) {
        await git.remote(["set-url", "origin", url]);
      } else {
        await git.addRemote("origin", url);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/git/push", async (req, res) => {
    try {
      await git.push("origin", "master", { "--set-upstream": null });
      res.json({ success: true });
    } catch (err: any) {
      // Try main if master fails
      try {
        await git.push("origin", "main", { "--set-upstream": null });
        res.json({ success: true });
      } catch (err2: any) {
        res.status(500).json({ error: err.message || err2.message });
      }
    }
  });

  app.post("/api/git/pull", async (req, res) => {
    try {
      await git.pull("origin", "master");
      res.json({ success: true });
    } catch (err: any) {
      try {
        await git.pull("origin", "main");
        res.json({ success: true });
      } catch (err2: any) {
        res.status(500).json({ error: err.message || err2.message });
      }
    }
  });

  // --- Run Code API ---
  app.post("/api/run", (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "File ID is required" });
    }

    const fullPath = safePath(id);
    if (!fullPath) {
      return res.status(400).json({ error: "Invalid file path" });
    }
    
    // Check if file exists
    if (!fsSync.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Execute the file using tsx
    const child = spawn("npx", ["tsx", fullPath], {
      cwd: WORKSPACE_DIR,
      env: { ...process.env, FORCE_COLOR: "0" }
    });

    child.stdout.on("data", (data) => {
      const text = data.toString();
      res.write(`data: ${JSON.stringify({ type: "log", text })}\n\n`);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      res.write(`data: ${JSON.stringify({ type: "error", text })}\n\n`);
    });

    child.on("close", (code) => {
      res.write(`data: ${JSON.stringify({ type: "exit", code })}\n\n`);
      res.end();
    });

    child.on("error", (err) => {
      res.write(`data: ${JSON.stringify({ type: "error", text: err.message })}\n\n`);
      res.end();
    });
  });

  // --- Interactive Terminal: Execute any command ---
  app.post("/api/exec", (req, res) => {
    const { command } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ error: "Command is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Parse command — use shell for full command support
    const shell = IS_WINDOWS ? "cmd" : "sh";
    const shellArgs = IS_WINDOWS ? ["/c", command] : ["-c", command];
    const child = spawn(shell, shellArgs, {
      cwd: WORKSPACE_DIR,
      env: { ...process.env, FORCE_COLOR: "0", HOME: process.env.HOME || "/root" },
    });

    child.stdout.on("data", (data) => {
      const text = data.toString();
      res.write(`data: ${JSON.stringify({ type: "log", text })}\n\n`);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      res.write(`data: ${JSON.stringify({ type: "error", text })}\n\n`);
    });

    child.on("close", (code) => {
      res.write(`data: ${JSON.stringify({ type: "exit", code })}\n\n`);
      res.end();
    });

    child.on("error", (err) => {
      res.write(`data: ${JSON.stringify({ type: "error", text: err.message })}\n\n`);
      res.end();
    });
  });

  const httpServer = createHttpServer(app);
  const terminalServer = new WebSocketServer({ noServer: true });

  terminalServer.on("connection", (socket) => {
    const shell = IS_WINDOWS ? "powershell.exe" : "bash";
    const child = spawn(shell, [], {
      cwd: WORKSPACE_DIR,
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    child.stdout.on("data", (data: Buffer) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(data.toString());
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(data.toString());
      }
    });

    child.on("error", (error) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(`\r\nTerminal error: ${error.message}\r\n`);
      }
    });

    child.on("close", (code) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(`\r\nProcess exited with code ${code ?? 0}\r\n`);
        socket.close();
      }
    });

    socket.on("message", (data) => {
      child.stdin.write(data.toString());
    });

    socket.on("close", () => {
      try {
        child.kill("SIGTERM");
      } catch {}
    });
  });

  httpServer.on("upgrade", (request, socket, head) => {
    if (request.url !== "/api/terminal") {
      socket.destroy();
      return;
    }

    terminalServer.handleUpgrade(request, socket, head, (ws) => {
      terminalServer.emit("connection", ws, request);
    });
  });

  // --- Live Preview: serve workspace files ---
  app.get("/preview/*", (req, res) => {
    const filePath = req.params[0] || "index.html";
    const fullPath = safePath(filePath);
    if (!fullPath) {
      return res.status(400).send("Invalid path");
    }
    if (!fsSync.existsSync(fullPath)) {
      return res.status(404).send("File not found");
    }

    // Set proper MIME type
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ts': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
    };
    const contentType = mimeTypes[ext] || 'text/plain';
    res.setHeader('Content-Type', contentType);
    res.sendFile(fullPath);
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    
    // Check if dist folder exists to prevent silent white page
    if (!fsSync.existsSync(distPath)) {
      console.error(`❌ ERROR: 'dist' directory not found at ${distPath}. Build might have failed or not run.`);
    }

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fsSync.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("<h1>404: Build not found</h1><p>The 'dist/index.html' file is missing. Please check your build logs on Render.</p>");
      }
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AI Code Studio running on http://localhost:${PORT}`);
    console.log(`📁 Workspace: ${WORKSPACE_DIR}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

function detectLanguage(filename: string) {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".md")) return "markdown";
  return "javascript";
}

startServer();
