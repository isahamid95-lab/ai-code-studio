import { Router } from 'express';
import { ExplainCodeSchema, RefactorCodeSchema, DebugCodeSchema, OptimizeCodeSchema } from '../../src/validators';

const router = Router();

const AI_BASE_URL = process.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1';
const AI_API_KEY = process.env.VITE_ALIBABA_API_KEY;

/**
 * POST /api/ai/explain
 * Explain code
 */
router.post('/explain', async (req, res) => {
  try {
    const validation = ExplainCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { code, filename, detailLevel = 'intermediate' } = validation.data;

    if (!AI_API_KEY) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are a coding teacher. Explain this code at ${detailLevel} level. Return JSON: { explanation, concepts, examples, resources }`,
      },
      {
        role: 'user',
        content: `Explain this ${filename} code:\n\n${code}`,
      },
    ];

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen3-coder-plus',
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    let explanation; try { explanation = JSON.parse(data.choices[0].message.content); } catch { explanation = { error: 'Failed to parse AI response', raw: data.choices[0].message.content }; }
    res.json(explanation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/refactor
 * Refactor code
 */
router.post('/refactor', async (req, res) => {
  try {
    const validation = RefactorCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { code, filename } = validation.data;

    if (!AI_API_KEY) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a code refactoring expert. Improve code quality while maintaining functionality. Return JSON: { refactoredCode, improvements }',
      },
      {
        role: 'user',
        content: `Refactor this ${filename} code:\n\n${code}`,
      },
    ];

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen3-coder-plus',
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    let result; try { result = JSON.parse(data.choices[0].message.content); } catch { result = { error: 'Failed to parse AI response', raw: data.choices[0].message.content }; }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/debug
 * Debug errors
 */
router.post('/debug', async (req, res) => {
  try {
    const validation = DebugCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { errorMessage, stackTrace, codeContext } = validation.data;

    if (!AI_API_KEY) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a debugging expert. Analyze the error and provide a fix. Return JSON: { rootCause, fix, prevention }',
      },
      {
        role: 'user',
        content: `Error: ${errorMessage}\n\nStack Trace: ${stackTrace || 'N/A'}\n\nCode Context:\n${codeContext || 'N/A'}`,
      },
    ];

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen3-coder-plus',
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    let debug; try { debug = JSON.parse(data.choices[0].message.content); } catch { debug = { error: 'Failed to parse AI response', raw: data.choices[0].message.content }; }
    res.json(debug);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/optimize
 * Optimize performance
 */
router.post('/optimize', async (req, res) => {
  try {
    const validation = OptimizeCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { code, filename } = validation.data;

    if (!AI_API_KEY) {
      return res.status(500).json({ error: 'AI API key not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a performance optimization expert. Optimize this code for speed and memory. Return JSON: { optimizedCode, improvements, beforeMetrics, afterMetrics }',
      },
      {
        role: 'user',
        content: `Optimize this ${filename} code:\n\n${code}`,
      },
    ];

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen3-coder-plus',
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    let optimization; try { optimization = JSON.parse(data.choices[0].message.content); } catch { optimization = { error: 'Failed to parse AI response', raw: data.choices[0].message.content }; }
    res.json(optimization);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as aiRoutes };
