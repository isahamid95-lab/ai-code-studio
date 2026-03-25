// Export all validators
export * from './file.validators';
export * from './chat.validators';

// Common schemas
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
