import { z } from 'zod';

/**
 * Dosya kaydetme validasyonu
 * Path traversal saldırılarını önler
 */
export const FileSaveSchema = z.object({
  id: z.string()
    .min(1, 'File ID is required')
    .refine(id => !id.includes('..') && !id.startsWith('/'), {
      message: 'Invalid file path - path traversal not allowed'
    }),
  content: z.string()
    .max(10 * 1024 * 1024, 'File content cannot exceed 10MB')
});

/**
 * Dosya silme validasyonu
 */
export const FileDeleteSchema = z.object({
  id: z.string()
    .min(1, 'File ID is required')
    .refine(id => !id.includes('..') && !id.startsWith('/'), {
      message: 'Invalid file path - path traversal not allowed'
    })
});

/**
 * Dosya oluşturma validasyonu
 */
export const CreateFileSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .refine(name => !name.includes('..') && !name.startsWith('/') && !name.includes('\\'), {
      message: 'Invalid filename - path traversal not allowed'
    }),
  content: z.string()
});

/**
 * Dosya yeniden adlandırma validasyonu
 */
export const RenameFileSchema = z.object({
  oldPath: z.string()
    .min(1, 'Old path is required')
    .refine(p => !p.includes('..') && !p.startsWith('/'), {
      message: 'Invalid old path'
    }),
  newPath: z.string()
    .min(1, 'New path is required')
    .refine(p => !p.includes('..') && !p.startsWith('/'), {
      message: 'Invalid new path'
    })
});

/**
 * Dosya arama validasyonu
 */
export const SearchFilesSchema = z.object({
  pattern: z.string()
    .min(1, 'Search pattern is required')
    .max(100, 'Search pattern too long')
});
