import { Router, Request, Response, NextFunction } from 'express';
import { FileSaveSchema, FileDeleteSchema, RenameFileSchema, SearchFilesSchema } from '../../src/validators';
import { safePath, getWorkspaceFiles, readFileContent, writeFileContent, deleteFile, renameFile, createDirectory } from '../utils/workspace';
import { minimatch } from 'minimatch';
import { BadRequestError, NotFoundError, InternalError } from '../../server/middleware/errorHandler';

const router = Router();

// Dosya boyut limiti: 1MB
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Dosya boyutu kontrolü
const checkFileSize = (content: string): void => {
  const size = Buffer.byteLength(content, 'utf8');
  if (size > MAX_FILE_SIZE) {
    throw new BadRequestError(`File size exceeds limit (${MAX_FILE_SIZE} bytes). Current size: ${size} bytes`);
  }
};

/**
 * GET /api/files
 * List all files in workspace
 */
router.get('/', asyncHandler(async (req, res, next) => {
  const files = await getWorkspaceFiles();
  res.json({ files });
}));

/**
 * GET /api/files/*
 * Get file content by path
 */
router.get('/*', asyncHandler(async (req, res, next) => {
  const filePath = (req.params as any)[0];
  const validation = FileSaveSchema.safeParse({ id: filePath, content: '' });
  
  if (!validation.success) {
    throw new BadRequestError(validation.error.issues[0].message);
  }

  const content = await readFileContent(filePath);
  if (content === null) {
    throw new NotFoundError('File not found');
  }

  const ext = filePath.split('.').pop() || '';
  const languageMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go',
    java: 'java', cpp: 'cpp', c: 'c',
    html: 'html', css: 'css', scss: 'scss',
    json: 'json', md: 'markdown', yaml: 'yaml',
  };

  res.json({
    id: filePath,
    name: filePath.split('/').pop() || filePath,
    content,
    language: languageMap[ext] || 'plaintext',
  });
}));

/**
 * POST /api/files
 * Create or update file
 */
router.post('/', asyncHandler(async (req, res, next) => {
  const validation = FileSaveSchema.safeParse(req.body);
  if (!validation.success) {
    throw new BadRequestError(validation.error.issues[0].message);
  }

  const { id, content } = validation.data;
  
  // GÜVENLİK: Dosya boyutu kontrolü
  checkFileSize(content);
  
  const success = await writeFileContent(id, content);
  
  if (success) {
    res.json({ success: true, path: id });
  } else {
    throw new InternalError('Failed to write file');
  }
}));

/**
 * DELETE /api/files
 * Delete file
 */
router.delete('/', asyncHandler(async (req, res, next) => {
  const validation = FileDeleteSchema.safeParse(req.body);
  if (!validation.success) {
    throw new BadRequestError(validation.error.issues[0].message);
  }

  const { id } = validation.data;
  const success = await deleteFile(id);
  
  if (success) {
    res.json({ success: true });
  } else {
    throw new NotFoundError('File not found');
  }
}));

/**
 * POST /api/files/rename
 * Rename/move file
 */
router.post('/rename', asyncHandler(async (req, res, next) => {
  const validation = RenameFileSchema.safeParse(req.body);
  if (!validation.success) {
    throw new BadRequestError(validation.error.issues[0].message);
  }

  const { oldPath, newPath } = validation.data;
  const success = await renameFile(oldPath, newPath);
  
  if (success) {
    res.json({ success: true });
  } else {
    throw new InternalError('Failed to rename file');
  }
}));

/**
 * POST /api/files/search
 * Search files by pattern
 */
router.post('/search', asyncHandler(async (req, res, next) => {
  const validation = SearchFilesSchema.safeParse(req.body);
  if (!validation.success) {
    throw new BadRequestError(validation.error.issues[0].message);
  }

  const { pattern } = validation.data;
  const files = await getWorkspaceFiles();
  const matches = files.filter(f => minimatch(f.path, pattern));
  
  res.json(matches);
}));

/**
 * POST /api/files/mkdir
 * Create directory
 */
router.post('/mkdir', asyncHandler(async (req, res, next) => {
  const { path: dirPath } = req.body;
  if (!dirPath) {
    throw new BadRequestError('Path is required');
  }

  const success = await createDirectory(dirPath);
  
  if (success) {
    res.json({ success: true });
  } else {
    throw new InternalError('Failed to create directory');
  }
}));

export { router as fileRoutes };
