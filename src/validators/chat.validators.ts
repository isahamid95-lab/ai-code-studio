import { z } from 'zod';

/**
 * Chat mesajı validasyonu
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, 'Message content is required')
});

/**
 * Chat isteği validasyonu
 */
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message required'),
  model: z.string().optional(),
  stream: z.boolean().optional()
});

/**
 * Agent isteği validasyonu
 */
export const AgentRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message required'),
  model: z.string().optional(),
  mode: z.enum(['agent', 'plan']).optional()
});

/**
 * Kod açıklama isteği validasyonu
 */
export const ExplainCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  filename: z.string().min(1, 'Filename is required'),
  detailLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional()
});

/**
 * Kod refactor isteği validasyonu
 */
export const RefactorCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  filename: z.string().min(1, 'Filename is required')
});

/**
 * Debug isteği validasyonu
 */
export const DebugCodeSchema = z.object({
  errorMessage: z.string().min(1, 'Error message is required'),
  stackTrace: z.string().optional(),
  codeContext: z.string().optional()
});

/**
 * Kod optimize isteği validasyonu
 */
export const OptimizeCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  filename: z.string().min(1, 'Filename is required')
});
