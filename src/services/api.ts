import type { FileItem } from '../types';

// --- File System API ---
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
