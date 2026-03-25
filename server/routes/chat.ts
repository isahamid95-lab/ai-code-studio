import { Router } from 'express';
import { streamResponse, StreamingBuffer, parseSSE, extractContentFromSSE } from '../services/streaming';
import { ChatRequestSchema } from '../../src/validators/chat.validators';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const validation = ChatRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { model, messages, maxTokens, temperature } = req.body;
    const apiKey = process.env.VITE_ALIBABA_API_KEY;
    const baseUrl = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';

    const requestBody: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (maxTokens) {
      requestBody.max_tokens = maxTokens;
    }
    if (temperature !== undefined) {
      requestBody.temperature = temperature;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    await streamResponse(res, response as unknown as globalThis.Response);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/enhanced', async (req, res) => {
  try {
    const { model, messages, maxTokens, temperature, onProgress } = req.body;
    const apiKey = process.env.VITE_ALIBABA_API_KEY;
    const baseUrl = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';

    const requestBody: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    if (maxTokens) {
      requestBody.max_tokens = maxTokens;
    }
    if (temperature !== undefined) {
      requestBody.temperature = temperature;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const buffer = new StreamingBuffer();
    let totalContent = '';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (!response.body) {
      return res.status(500).json({ error: 'No response body' });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer.append(chunk);

      const lines = buffer.extractLines();
      for (const line of lines) {
        if (line.startsWith('data:')) {
          res.write(line + '\n');

          const events = parseSSE(line);
          const content = extractContentFromSSE(events);
          if (content) {
            totalContent += content;
            if (onProgress) {
              res.write(`event: progress\ndata: ${JSON.stringify({ content, total: totalContent })}\n\n`);
            }
          }
        } else {
          res.write(line + '\n');
        }
      }
    }

    res.write('event: done\ndata: {}\n\n');
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export { router as chatRoutes };