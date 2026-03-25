import { Router } from 'express';
import { spawn } from 'child_process';
import fsSync from 'fs';
import path from 'path';
import { safePath } from '../utils/workspace';
import { IS_WINDOWS } from '../services/processManager';

const router = Router();

const WORKSPACE_DIR = path.join(process.cwd(), 'project-workspace');

const ALLOWED_COMMANDS = [
  'npm', 'npx', 'yarn', 'pnpm',
  'node', 'tsx', 'ts-node',
  'git',
  'ls', 'dir', 'cat', 'type',
  'pwd', 'cd',
  'mkdir', 'rmdir', 'rm', 'del',
  'cp', 'copy', 'mv', 'move',
  'echo', 'printf',
  'grep', 'find', 'findstr',
  'tsc', 'vite', 'vitest',
];

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  const trimmed = command.trim();
  const firstPart = trimmed.split(/\s+/)[0];
  const baseCommand = firstPart.replace(/\.exe$/i, '');
  
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    return { 
      allowed: false, 
      reason: `Command '${baseCommand}' is not in the allowed list. Allowed commands: ${ALLOWED_COMMANDS.join(', ')}` 
    };
  }
  
  const dangerousPatterns = [
    /\|\s*(rm|del|format|shutdown|reboot)/i,
    /&&\s*(rm|del|format|shutdown|reboot)/i,
    /;\s*(rm|del|format|shutdown|reboot)/i,
    />\s*\/dev\/sd/i,
    /sudo\s/i,
    /chmod\s+[0-7]{3,4}\s+\//i,
    /\$\(/i,
    /`/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return { allowed: false, reason: 'Command contains potentially dangerous patterns' };
    }
  }
  
  return { allowed: true };
}

router.post('/run', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  const fullPath = safePath(id);
  if (!fullPath) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  if (!fsSync.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const child = spawn('npx', ['tsx', fullPath], {
    cwd: WORKSPACE_DIR,
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    res.write(`data: ${JSON.stringify({ type: 'log', text })}\n\n`);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    res.write(`data: ${JSON.stringify({ type: 'error', text })}\n\n`);
  });

  child.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ type: 'exit', code })}\n\n`);
    res.end();
  });

  child.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', text: err.message })}\n\n`);
    res.end();
  });
});

router.post('/exec', (req, res) => {
  const { command } = req.body;
  if (!command || !command.trim()) {
    return res.status(400).json({ error: 'Command is required' });
  }

  const { allowed, reason } = isCommandAllowed(command);
  if (!allowed) {
    return res.status(403).json({ error: reason || 'Command not allowed' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const shell = IS_WINDOWS ? 'cmd' : 'sh';
  const shellArgs = IS_WINDOWS ? ['/c', command] : ['-c', command];
  const child = spawn(shell, shellArgs, {
    cwd: WORKSPACE_DIR,
    env: { ...process.env, FORCE_COLOR: '0', HOME: process.env.HOME || '/root' },
  });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    res.write(`data: ${JSON.stringify({ type: 'log', text })}\n\n`);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    res.write(`data: ${JSON.stringify({ type: 'error', text })}\n\n`);
  });

  child.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ type: 'exit', code })}\n\n`);
    res.end();
  });

  child.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', text: err.message })}\n\n`);
    res.end();
  });
});

export { router as execRoutes };