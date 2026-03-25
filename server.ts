import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import simpleGit from 'simple-git';
import fsSync from 'fs';
import dotenv from 'dotenv';

import { apiLimiter, chatLimiter, agentLimiter, fileLimiter } from './src/middleware/rateLimiter';
import {
  fileRoutes,
  gitRoutes,
  aiRoutes,
  chatRoutes,
  processRoutes,
  exportRoutes,
  execRoutes,
  previewRoutes,
  agentRoutes,
} from './server/routes';
import { setupTerminalWebSocket } from './server/websocket/terminal';
import { WORKSPACE_DIR } from './server/services/aiContext';

dotenv.config();
if (fsSync.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

if (!fsSync.existsSync(WORKSPACE_DIR)) {
  fsSync.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));

  app.use('/api/', apiLimiter);
  app.use('/api/chat', chatLimiter);
  app.use('/api/agent', agentLimiter);
  app.use('/api/files', fileLimiter);

  app.use('/api/files', fileRoutes);
  app.use('/api/git', gitRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/processes', processRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api', execRoutes);
  app.use('/preview', previewRoutes);

  const httpServer = createHttpServer(app);
  setupTerminalWebSocket(httpServer);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');

    if (!fsSync.existsSync(distPath)) {
      console.error('ERROR: dist directory not found at ' + distPath);
    }

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fsSync.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('<h1>404: Build not found</h1>');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('AI Code Studio running on http://localhost:' + PORT);
    console.log('Workspace: ' + WORKSPACE_DIR);
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  });
}

startServer();
