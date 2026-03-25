import type { ChatMessage } from '../../src/types';

const AI_BASE_URL = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';
const AI_API_KEY = process.env.VITE_ALIBABA_API_KEY;

export interface AIProviderConfig {
  model: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export async function createChatCompletion(
  messages: ChatMessage[],
  config: AIProviderConfig
): Promise<Response> {
  if (!AI_API_KEY) {
    throw new Error('AI API key is not configured. Please add VITE_ALIBABA_API_KEY to .env.local');
  }

  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.text,
  }));

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: formattedMessages,
      stream: config.stream ?? false,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API Error: ${response.status} - ${error}`);
  }

  return response;
}

export async function* streamChatCompletion(
  messages: ChatMessage[],
  config: AIProviderConfig
): AsyncGenerator<string> {
  const response = await createChatCompletion(messages, { ...config, stream: true });

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content ?? '';
            if (content) {
              yield content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function getDefaultModel(): string {
  return 'qwen3.5-plus';
}

export function getAvailableModels(): string[] {
  return [
    'qwen3.5-plus',
    'qwen3-max-2026-01-23',
    'qwen3-coder-plus',
    'qwen3-coder-next',
    'glm-5',
    'glm-4.7',
    'kimi-k2.5',
    'MiniMax-M2.5',
  ];
}
