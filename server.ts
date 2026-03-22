import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import simpleGit from "simple-git";
import { spawn } from "child_process";

import fsSync from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const WORKSPACE_DIR = path.join(process.cwd(), "project-workspace");
if (!fsSync.existsSync(WORKSPACE_DIR)) {
  fsSync.mkdirSync(WORKSPACE_DIR, { recursive: true });
}
const git = simpleGit(WORKSPACE_DIR);

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

async function startServer() {
  await ensureWorkspace();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- AI Chat Proxy ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, model, stream } = req.body;
      const apiKey = process.env.VITE_ALIBABA_API_KEY;
      const baseUrl = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, stream: true })
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
      }
    ];

    try {
      let conversationMessages: any[] = [...messages];

      // Plan mode: generate plan first
      if (mode === 'plan') {
        const planRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              ...conversationMessages,
              { role: 'system', content: 'Generate a detailed numbered plan. For EACH file specify: filename, purpose, and key contents. ALWAYS separate HTML, CSS, and JavaScript into different files. Never combine everything into a single HTML file. List ALL files that will be created. If the project needs npm packages, include the npm/npx commands you will run.' }
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
              }
            } else if (toolCall.function.name === 'run_command') {
              // Execute shell command and capture output
              send({ type: 'command_start', command: args.command });
              try {
                const { execSync } = require('child_process');
                const output = execSync(args.command, {
                  cwd: WORKSPACE_DIR,
                  timeout: 60000, // 60s timeout
                  encoding: 'utf-8',
                  env: { ...process.env, FORCE_COLOR: '0', HOME: process.env.HOME || '/root' },
                  stdio: ['pipe', 'pipe', 'pipe']
                });
                send({ type: 'command_output', command: args.command, output: output || '(no output)' });
                result = output || '(command completed with no output)';
              } catch (cmdErr: any) {
                const errOutput = cmdErr.stderr || cmdErr.stdout || cmdErr.message;
                send({ type: 'command_output', command: args.command, output: errOutput, error: true });
                result = `Command output: ${errOutput}`;
              }
            } else if (toolCall.function.name === 'read_file') {
              const fullPath = path.join(WORKSPACE_DIR, args.filename);
              result = await fs.readFile(fullPath, 'utf-8').catch(() => 'File not found');
            } else if (toolCall.function.name === 'list_files') {
              const fileList: string[] = [];
              async function listDir(dir: string, rel: string = '') {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const e of entries) {
                  if (e.name === '.git' || e.name === 'node_modules') continue;
                  const relPath = rel ? `${rel}/${e.name}` : e.name;
                  if (e.isDirectory()) await listDir(path.join(dir, e.name), relPath);
                  else fileList.push(relPath);
                }
              }
              await listDir(WORKSPACE_DIR);
              result = fileList.join('\n') || 'No files';
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
      const files: any[] = [];
      async function readDirRecursive(dir: string, relativePath: string = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === ".git") continue;
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relativePath, entry.name);
          if (entry.isDirectory()) {
            await readDirRecursive(fullPath, relPath);
          } else {
            const content = await fs.readFile(fullPath, "utf-8");
            files.push({
              id: relPath, // Use relative path as ID
              name: entry.name,
              content,
              language: detectLanguage(entry.name),
            });
          }
        }
      }
      await readDirRecursive(WORKSPACE_DIR);
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
    const child = spawn("sh", ["-c", command], {
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
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
