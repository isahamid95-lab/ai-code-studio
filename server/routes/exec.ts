import { Router, type Request, type Response } from 'express';
import { spawn } from 'child_process';
import fsSync from 'fs';
import path from 'path';
import { safePath } from '../utils/workspace';
import { IS_WINDOWS } from '../services/processManager';

const router = Router();

const WORKSPACE_DIR = path.join(process.cwd(), 'project-workspace');

// Güvenlik: Sadece whitelist'teki komutlara izin ver
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

// Güvenlik: Tehlikeli pattern'ler (CWE-78 - OS Command Injection)
const DANGEROUS_PATTERNS = [
  /\$\(/,                    // Command substitution $(...)
  /`[^`]*`/,                 // Backtick execution
  /\|\|/,                    // OR operator
  /&&/,                      // AND operator (allowlist'te kontrol edilecek)
  /;\s*\w/,                  // Command separator
  />\s*[/\\]/,               // Redirect to root
  /<\s*[/\\]/,               // Read from root
  /0x[0-9a-fA-F]+/,          // Hex encoding bypass
  /\\x[0-9a-fA-F]{2}/,       // Hex character encoding
  /\b(eval|exec|system)\b/,  // Dangerous functions
  /\b(sudo|su)\b/,           // Privilege escalation
  /\b(chmod|chown)\b.*\//,   // Permission changes on system paths
  /\b(curl|wget)\b.*\|\s*\w/, // Download and execute
  /\b(nc|netcat)\b/,         // Reverse shell
  /\b(python|perl|ruby)\b.*-c/, // Script execution
];

// Güvenlik: NPM için tehlikeli argümanlar
const NPM_DANGEROUS_ARGS = [
  'uninstall',
  'remove',
  'rm',
  '-g', // Global install
  '--force',
  '--no-save',
];

/**
 * Komut güvenliğini doğrula
 *
 * Güvenlik kontrolleri:
 * 1. Shell injection pattern'leri
 * 2. Allowlist kontrolü
 * 3. Argüman bazlı doğrulama
 * 4. Path traversal koruması
 */
function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  const trimmed = command.trim();
  
  // Boş komut kontrolü
  if (!trimmed) {
    return { allowed: false, reason: 'Command is empty' };
  }
  
  // Uzunluk kontrolü - çok uzun komutları reddet
  if (trimmed.length > 1000) {
    return { allowed: false, reason: 'Command too long' };
  }
  
  // 1. Shell injection pattern'lerini kontrol et
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn('[exec] Dangerous pattern detected:', { pattern: pattern.source, command: trimmed });
      return { allowed: false, reason: 'Potentially dangerous pattern detected' };
    }
  }
  
  // 2. Base komut çıkar ve allowlist kontrolü yap
  const firstPart = trimmed.split(/\s+/)[0];
  const baseCommand = firstPart.replace(/\.exe$/i, '');
  
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    console.warn('[exec] Disallowed command:', baseCommand);
    return {
      allowed: false,
      reason: `Command '${baseCommand}' is not allowed`
    };
  }
  
  // 3. NPM özel kontrolleri
  if (baseCommand === 'npm' || baseCommand === 'npx' || baseCommand === 'yarn' || baseCommand === 'pnpm') {
    for (const dangerousArg of NPM_DANGEROUS_ARGS) {
      if (trimmed.includes(dangerousArg)) {
        console.warn('[exec] Dangerous npm argument:', dangerousArg);
        return { allowed: false, reason: `Dangerous argument '${dangerousArg}' not allowed` };
      }
    }
  }
  
  // 4. Git özel kontrolleri
  if (baseCommand === 'git') {
    const dangerousGit = ['push', '--force', 'reset --hard', 'filter-branch'];
    for (const dangerous of dangerousGit) {
      if (trimmed.includes(dangerous)) {
        console.warn('[exec] Dangerous git command:', dangerous);
        return { allowed: false, reason: `Dangerous git operation '${dangerous}' not allowed` };
      }
    }
  }
  
  // 5. rm/del komutları için ek kontroller
  if (baseCommand === 'rm' || baseCommand === 'del' || baseCommand === 'rmdir') {
    // Recursive ve force flag'leri kontrol et
    if (trimmed.includes('-rf') || trimmed.includes('-fr') || trimmed.includes('/F') || trimmed.includes('/S')) {
      console.warn('[exec] Dangerous recursive delete:', trimmed);
      return { allowed: false, reason: 'Recursive delete not allowed' };
    }
    // Root veya home directory silme girişimleri
    if (trimmed.includes('/*') || trimmed.includes('/home') || trimmed.includes('/Users')) {
      console.warn('[exec] System directory delete attempt:', trimmed);
      return { allowed: false, reason: 'System directory operations not allowed' };
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