import type { FileItem } from '../types';

// --- Enhanced AI Features ---

export async function analyzeCode(code: string, filename: string): Promise<{
  score: number;
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: 'bug' | 'security' | 'performance' | 'style';
    message: string;
    line?: number;
    suggestion: string;
  }>;
  suggestions: string[];
}> {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename })
  });
  
  if (!response.ok) {
    throw new Error('Code analysis failed');
  }
  
  return response.json();
}

export async function generateTests(
  filename: string,
  testFramework: 'vitest' | 'jest' | 'playwright' = 'vitest'
): Promise<{
  testFile: { filename: string; content: string } | null;
  testCount: number;
  coverage: number;
}> {
  const response = await fetch('/api/ai/generate-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, testFramework })
  });
  
  if (!response.ok) {
    throw new Error('Test generation failed');
  }
  
  return response.json();
}

export async function refactorCode(
  filename: string,
  improvements: Array<'performance' | 'readability' | 'security' | 'maintainability'>
): Promise<{
  refactoredCode: string | null;
  changes: string[];
  beforeScore: number;
  afterScore: number;
}> {
  const response = await fetch('/api/ai/refactor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, improvements })
  });
  
  if (!response.ok) {
    throw new Error('Refactoring failed');
  }
  
  return response.json();
}

export async function explainCode(
  code: string,
  filename: string,
  detailLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
): Promise<{
  explanation: string;
  concepts: string[];
  examples: string[];
  resources: string[];
}> {
  const response = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename, detailLevel })
  });
  
  if (!response.ok) {
    throw new Error('Code explanation failed');
  }
  
  return response.json();
}

export async function debugError(
  errorMessage: string,
  stackTrace: string,
  codeContext: string
): Promise<{
  rootCause: string;
  fix: string;
  prevention: string;
}> {
  const response = await fetch('/api/ai/debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ errorMessage, stackTrace, codeContext })
  });
  
  if (!response.ok) {
    throw new Error('Debug analysis failed');
  }
  
  return response.json();
}

export async function optimizePerformance(
  code: string,
  filename: string
): Promise<{
  optimizedCode: string;
  improvements: string[];
  beforeMetrics: { complexity: number; lines: number };
  afterMetrics: { complexity: number; lines: number };
}> {
  const response = await fetch('/api/ai/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename })
  });
  
  if (!response.ok) {
    throw new Error('Performance optimization failed');
  }
  
  return response.json();
}

// --- File System API (existing) ---
export async function fetchFilesFromServer(): Promise<FileItem[] | null> {
  const res = await fetch('/api/files');
  if (!res.ok) return null;
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files : null;
}

export async function saveFileToServer(id: string, content: string): Promise<void> {
  await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, content })
  });
}

export async function deleteFileFromServer(id: string): Promise<void> {
  await fetch('/api/files', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
}

// --- Run Code API (existing) ---
export function runFileOnServer(id: string): Promise<Response> {
  return fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
}

// --- Git API (existing) ---
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

// --- AI Chat API (existing) ---
export function sendChatMessage(model: string, messages: any[]): Promise<Response> {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true })
  });
}

export function sendAgentRequest(model: string, messages: any[], mode: string): Promise<Response> {
  return fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, mode })
  });
}
