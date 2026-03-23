import type { AgentEvent, FileItem, ProcessInfo } from '../types';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

export async function fetchFilesFromServer(): Promise<FileItem[]> {
  const response = await fetch('/api/files');
  const data = await parseJsonResponse<{ files: FileItem[] }>(response);
  return data.files ?? [];
}

export async function saveFileToServer(id: string, content: string): Promise<void> {
  const response = await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, content }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function deleteFileFromServer(id: string): Promise<void> {
  const response = await fetch('/api/files', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function runFileOnServer(id: string): Promise<Response> {
  return fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

export async function fetchProcesses(): Promise<ProcessInfo[]> {
  const response = await fetch('/api/processes');
  const data = await parseJsonResponse<{ processes: ProcessInfo[] }>(response);
  return data.processes ?? [];
}

export async function killProcess(pid: number): Promise<void> {
  const response = await fetch(`/api/processes/${pid}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function gitInit(): Promise<void> {
  const response = await fetch('/api/git/init', { method: 'POST' });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function gitGetStatus(): Promise<any> {
  const response = await fetch('/api/git/status');
  return parseJsonResponse(response);
}

export async function gitStage(file: string): Promise<void> {
  const response = await fetch('/api/git/stage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function gitUnstage(file: string): Promise<void> {
  const response = await fetch('/api/git/unstage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function gitCommit(message: string): Promise<void> {
  const response = await fetch('/api/git/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function gitSetRemote(url: string): Promise<void> {
  const response = await fetch('/api/git/remote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function gitPush(): Promise<{ error?: string }> {
  const response = await fetch('/api/git/push', { method: 'POST' });
  return parseJsonResponse(response);
}

export async function gitPull(): Promise<{ error?: string }> {
  const response = await fetch('/api/git/pull', { method: 'POST' });
  return parseJsonResponse(response);
}

export function sendChatMessage(model: string, messages: any[], rest: Record<string, unknown> = {}): Promise<Response> {
  return fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, ...rest }),
  });
}

export function sendAgentRequest(model: string, messages: any[], mode: string): Promise<Response> {
  return fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, mode }),
  });
}

export async function streamAgentRequest(
  model: string,
  messages: any[],
  mode: string,
  onEvent: (event: AgentEvent) => void | Promise<void>,
): Promise<void> {
  const response = await sendAgentRequest(model, messages, mode);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (!response.body) {
    throw new Error('Agent response body is missing');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const line = chunk
        .split('\n')
        .find((entry) => entry.startsWith('data: '));

      if (!line) {
        continue;
      }

      const payload = line.slice(6).trim();
      if (!payload) {
        continue;
      }

      await onEvent(JSON.parse(payload) as AgentEvent);
    }
  }
}

export function createTerminalSocket(): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new WebSocket(`${protocol}//${window.location.host}/api/terminal`);
}

export async function aiAnalyzeCode(code: string, filename: string): Promise<any> {
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename }),
  });
  return parseJsonResponse(response);
}

export async function aiGenerateTests(filename: string, testFramework: string = 'jest'): Promise<any> {
  const response = await fetch('/api/ai/generate-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, testFramework }),
  });
  return parseJsonResponse(response);
}

export async function aiRefactorCode(filename: string, improvements: string[]): Promise<any> {
  const response = await fetch('/api/ai/refactor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, improvements }),
  });
  return parseJsonResponse(response);
}

export async function aiExplainCode(code: string, filename: string, detailLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'): Promise<any> {
  const response = await fetch('/api/ai/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename, detailLevel }),
  });
  return parseJsonResponse(response);
}

export async function aiDebugError(errorMessage: string, stackTrace: string, codeContext: string): Promise<any> {
  const response = await fetch('/api/ai/debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ errorMessage, stackTrace, codeContext }),
  });
  return parseJsonResponse(response);
}

export async function aiOptimizeCode(code: string, filename: string): Promise<any> {
  const response = await fetch('/api/ai/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename }),
  });
  return parseJsonResponse(response);
}
