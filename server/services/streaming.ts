import type { Response as ExpressResponse } from 'express';

export interface StreamOptions {
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string) => void;
}

export interface ParsedSSE {
  event?: string;
  data: string;
}

export function parseSSE(chunk: string): ParsedSSE[] {
  const lines = chunk.split('\n');
  const events: ParsedSSE[] = [];
  let currentEvent: Partial<ParsedSSE> = {};
  let currentData: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      if (currentData.length > 0) {
        events.push({
          event: currentEvent.event,
          data: currentData.join('\n'),
        });
        currentData = [];
      }
      currentEvent.event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      currentData.push(line.slice(5).trim());
    } else if (line === '' && currentData.length > 0) {
      events.push({
        event: currentEvent.event,
        data: currentData.join('\n'),
      });
      currentEvent = {};
      currentData = [];
    }
  }

  if (currentData.length > 0) {
    events.push({
      event: currentEvent.event,
      data: currentData.join('\n'),
    });
  }

  return events;
}

export function extractContentFromSSE(events: ParsedSSE[]): string {
  let content = '';
  for (const event of events) {
    if (event.data === '[DONE]') continue;
    try {
      const parsed = JSON.parse(event.data);
      const delta = parsed.choices?.[0]?.delta;
      if (delta?.content) {
        content += delta.content;
      }
    } catch {
      // Skip non-JSON data
    }
  }
  return content;
}

export async function streamResponse(
  response: ExpressResponse,
  fetchResponse: globalThis.Response,
  onChunk?: (chunk: string) => void
): Promise<void> {
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no');

  if (!fetchResponse.body) {
    throw new Error('No response body');
  }

  const reader = fetchResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (buffer) {
          response.write(buffer);
        }
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          response.write(line + '\n');
          if (onChunk) {
            onChunk(line);
          }
        }
      }
    }

    response.write('data: [DONE]\n\n');
    response.end();
  } catch (error) {
    console.error('[Streaming] Error:', error);
    throw error;
  }
}

export interface MessageDelta {
  role?: string;
  content?: string;
  finish_reason?: string | null;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: MessageDelta;
    finish_reason: string | null;
  }>;
}

export function createStreamChunk(
  id: string,
  model: string,
  content: string,
  finishReason: string | null = null
): string {
  const chunk: StreamChunk = {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: { content },
        finish_reason: finishReason,
      },
    ],
  };
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export function createDoneChunk(): string {
  return 'data: [DONE]\n\n';
}

export class StreamingBuffer {
  private buffer: string = '';

  append(chunk: string): void {
    this.buffer += chunk;
  }

  extractLines(): string[] {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    return lines.filter((line) => line.trim());
  }

  clear(): void {
    this.buffer = '';
  }

  getRemaining(): string {
    return this.buffer;
  }
}

export async function* streamIterator(
  fetchResponse: globalThis.Response
): AsyncGenerator<string, void, unknown> {
  if (!fetchResponse.body) {
    throw new Error('No response body');
  }

  const reader = fetchResponse.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}