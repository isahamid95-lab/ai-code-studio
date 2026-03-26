import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import simpleGit from 'simple-git';
import fsSync from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';

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
import { errorHandler, notFoundHandler } from './server/middleware/errorHandler';

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

  // CORS yapılandırması - Sadece localhost için
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? false // Production'da aynı origin'den gelmeli
      : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 saat
  };
  app.use(cors(corsOptions));

  // Content Security Policy (CSP) header'ları
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self' ws: wss:; " +
      "worker-src 'self' blob:; " +
      "frame-ancestors 'none';"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use(notFoundHandler);
  app.use(errorHandler);

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
