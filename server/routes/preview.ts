import { Router } from 'express';
import fsSync from 'fs';
import path from 'path';
import { safePath } from '../utils/workspace';

const router = Router();

router.get('/*', (req, res) => {
  const filePath = (req.params as any)[0] || 'index.html';
  const fullPath = safePath(filePath);
  if (!fullPath) {
    return res.status(400).send('Invalid path');
  }
  if (!fsSync.existsSync(fullPath)) {
    return res.status(404).send('File not found');
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
  };
  const contentType = mimeTypes[ext] || 'text/plain';
  res.setHeader('Content-Type', contentType);
  res.sendFile(fullPath);
});

export { router as previewRoutes };