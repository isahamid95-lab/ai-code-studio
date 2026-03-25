import { Router, type Response } from 'express';
import { WORKSPACE_DIR, getWorkspaceTree, getAgentMemory } from '../services/aiContext';

const router = Router();

function getAiConfig() {
  return {
    baseUrl: process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1',
    apiKey: process.env.VITE_ALIBABA_API_KEY,
  };
}

interface AgentEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'error' | 'done';
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

async function handleAgentRequest(
  messages: Array<{ role: string; content: string }>,
  model: string,
  mode: string,
  res: Response
): Promise<void> {
  const { baseUrl: AI_BASE_URL, apiKey: AI_API_KEY } = getAiConfig();
  
  if (!AI_API_KEY) {
    res.status(500).json({ error: 'AI API key not configured' });
    return;
  }

  const systemPrompt = `You are an AI coding agent with access to the file system. You can read, write, and modify files.

WORKSPACE CONTEXT:
${await getWorkspaceTree()}
${await getAgentMemory()}

CAPABILITIES:
- Read files from the workspace
- Write and modify files
- Execute code and commands
- Help with debugging, refactoring, and code generation

INSTRUCTIONS:
1. Analyze the user's request carefully
2. Plan your approach before making changes
3. Write clean, well-structured code
4. Explain your changes clearly

When you need to create or modify files, use this format:
\`\`\`filepath
file content here
\`\`\`

For example:
\`\`\`src/utils/helper.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}
\`\`\`

Always provide complete file contents when creating or modifying files.`;

  const requestBody = {
    model: model || 'qwen3-coder-plus',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    stream: true,
  };

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!response.body) {
      res.status(500).json({ error: 'No response body' });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            const doneEvent: AgentEvent = { type: 'done' };
            res.write(`data: ${JSON.stringify(doneEvent)}\n\n`);
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            if (content) {
              const event: AgentEvent = { type: 'text', content };
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorEvent: AgentEvent = { type: 'error', content: errorMessage };
    res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    res.end();
  }
}

router.post('/', async (req, res) => {
  const { messages, model, mode } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  await handleAgentRequest(messages, model, mode, res);
});

export { router as agentRoutes };