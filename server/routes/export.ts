import { Router } from 'express';
import archiver from 'archiver';
import path from 'path';

const router = Router();

const WORKSPACE_DIR = path.join(process.cwd(), 'project-workspace');

router.get('/', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="project-export.zip"');

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', function (err) {
      throw err;
    });

    archive.pipe(res);

    archive.glob('**/*', {
      cwd: WORKSPACE_DIR,
      ignore: ['node_modules/**', '.git/**'],
    });

    await archive.finalize();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

export { router as exportRoutes };