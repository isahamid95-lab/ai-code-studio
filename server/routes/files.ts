import { Router } from 'express';
import { FileSaveSchema, FileDeleteSchema, RenameFileSchema, SearchFilesSchema } from '../../src/validators';
import { safePath, getWorkspaceFiles, readFileContent, writeFileContent, deleteFile, renameFile, createDirectory } from '../utils/workspace';
import { minimatch } from 'minimatch';
import type { Request } from 'express';

const router = Router();

/**
 * GET /api/files
 * List all files in workspace
 */
router.get('/', async (req, res) => {
  try {
    const files = await getWorkspaceFiles();
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/files/*
 * Get file content by path
 */
router.get('/*', async (req, res) => {
  try {
    const filePath = (req.params as any)[0];
    const validation = FileSaveSchema.safeParse({ id: filePath, content: '' });
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const content = await readFileContent(filePath);
    if (content === null) {
      return res.status(404).json({ error: 'File not found' });
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files
 * Create or update file
 */
router.post('/', async (req, res) => {
  try {
    const validation = FileSaveSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { id, content } = validation.data;
    const success = await writeFileContent(id, content);
    
    if (success) {
      res.json({ success: true, path: id });
    } else {
      res.status(500).json({ error: 'Failed to write file' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/files
 * Delete file
 */
router.delete('/', async (req, res) => {
  try {
    const validation = FileDeleteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { id } = validation.data;
    const success = await deleteFile(id);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/rename
 * Rename/move file
 */
router.post('/rename', async (req, res) => {
  try {
    const validation = RenameFileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { oldPath, newPath } = validation.data;
    const success = await renameFile(oldPath, newPath);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to rename file' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/search
 * Search files by pattern
 */
router.post('/search', async (req, res) => {
  try {
    const validation = SearchFilesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { pattern } = validation.data;
    const files = await getWorkspaceFiles();
    const matches = files.filter(f => minimatch(f.path, pattern));
    
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/mkdir
 * Create directory
 */
router.post('/mkdir', async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const success = await createDirectory(dirPath);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to create directory' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as fileRoutes };
