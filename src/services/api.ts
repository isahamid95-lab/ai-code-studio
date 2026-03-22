import type { FileItem } from '../types';
import { getWebContainer } from '../lib/webcontainer';

// Helper to detect language
function getLanguage(filename: string): any {
  const ext = filename.split('.').pop();
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
    html: 'html', css: 'css', json: 'json', md: 'markdown'
  };
  return map[ext || ''] || 'plaintext';
}

// --- File System API ---
export async function fetchFilesFromServer(): Promise<FileItem[] | null> {
  const wc = await getWebContainer();
  const files: FileItem[] = [];
  
  async function readDir(dir: string, relativePath: string = '') {
    const entries = await wc.fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      
      const fullPath = dir === '/' ? `/${entry.name}` : `${dir}/${entry.name}`;
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        await readDir(fullPath, relPath);
      } else {
        const contentBytes = await wc.fs.readFile(fullPath);
        const content = new TextDecoder().decode(contentBytes);
        files.push({
          id: relPath,
          name: entry.name,
          content,
          language: getLanguage(entry.name),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  }
  
  try {
    await readDir('/');
    return files.length > 0 ? files : null;
  } catch(e) {
    return null;
  }
}

export async function saveFileToServer(id: string, content: string): Promise<void> {
  const wc = await getWebContainer();
  // Ensure directories exist
  const parts = id.split('/');
  let currentPath = '';
  for (let i = 0; i < parts.length - 1; i++) {
    currentPath += '/' + parts[i];
    try { await wc.fs.mkdir(currentPath); } catch (e) { /* ignore if exists */ }
  }
  await wc.fs.writeFile('/' + id, content);
}

export async function deleteFileFromServer(id: string): Promise<void> {
  const wc = await getWebContainer();
  await wc.fs.rm('/' + id);
}

// --- Run Code API ---
export function runFileOnServer(id: string): Promise<Response> {
  return fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
}

// --- Git API ---
export async function gitInit(): Promise<void> {
  await fetch('/api/git/init', { method: 'POST' });
}

export async function gitGetStatus(): Promise<any> {
  const res = await fetch('/api/git/status');
  if (!res.ok) throw new Error('Failed to fetch git status');
  return res.json();
}

export async function gitStage(file: string): Promise<void> {
  await fetch('/api/git/stage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file })
  });
}

export async function gitUnstage(file: string): Promise<void> {
  await fetch('/api/git/unstage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file })
  });
}

export async function gitCommit(message: string): Promise<void> {
  await fetch('/api/git/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
}

export async function gitSetRemote(url: string): Promise<void> {
  await fetch('/api/git/remote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
}

export async function gitPush(): Promise<{ error?: string }> {
  const res = await fetch('/api/git/push', { method: 'POST' });
  return res.json();
}

export async function gitPull(): Promise<{ error?: string }> {
  const res = await fetch('/api/git/pull', { method: 'POST' });
  return res.json();
}

// --- AI Chat API ---
export function sendChatMessage(model: string, messages: any[], rest: any = {}): Promise<Response> {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, ...rest })
  });
}

export function sendAgentRequest(model: string, messages: any[], mode: string): Promise<Response> {
  return fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, mode })
  });
}

// --- Enhanced AI Endpoints ---
export async function aiAnalyzeCode(code: string, filename: string): Promise<any> {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename })
  });
  return res.json();
}

export async function aiGenerateTests(filename: string, testFramework: string = 'jest'): Promise<any> {
  const res = await fetch('/api/ai/generate-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, testFramework })
  });
  return res.json();
}

export async function aiRefactorCode(filename: string, improvements: string[]): Promise<any> {
  const res = await fetch('/api/ai/refactor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, improvements })
  });
  return res.json();
}

export async function aiExplainCode(code: string, filename: string, detailLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'): Promise<any> {
  const res = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename, detailLevel })
  });
  return res.json();
}

export async function aiDebugError(errorMessage: string, stackTrace: string, codeContext: string): Promise<any> {
  const res = await fetch('/api/ai/debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ errorMessage, stackTrace, codeContext })
  });
  return res.json();
}

export async function aiOptimizeCode(code: string, filename: string): Promise<any> {
  const res = await fetch('/api/ai/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename })
  });
  return res.json();
}
