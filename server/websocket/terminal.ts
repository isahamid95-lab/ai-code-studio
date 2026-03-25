import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import type { Server as HttpServer } from 'http';
import path from 'path';
import { IS_WINDOWS } from '../services/processManager';

const WORKSPACE_DIR = path.join(process.cwd(), 'project-workspace');

function setupTerminalWebSocket(httpServer: HttpServer): WebSocketServer {
  const terminalServer = new WebSocketServer({ noServer: true });

  terminalServer.on('connection', (socket) => {
    const shell = IS_WINDOWS ? 'powershell.exe' : 'bash';
    const child = spawn(shell, [], {
      cwd: WORKSPACE_DIR,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data: Buffer) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(data.toString());
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(data.toString());
      }
    });

    child.on('error', (error) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(`\r\nTerminal error: ${error.message}\r\n`);
      }
    });

    child.on('close', (code) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(`\r\nProcess exited with code ${code ?? 0}\r\n`);
        socket.close();
      }
    });

    socket.on('message', (data: Buffer) => {
      child.stdin.write(data.toString());
    });

    socket.on('close', () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // Child may already be dead
      }
    });
  });

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url !== '/api/terminal') {
      socket.destroy();
      return;
    }

    terminalServer.handleUpgrade(request, socket, head, (ws) => {
      terminalServer.emit('connection', ws, request);
    });
  });

  return terminalServer;
}

export { setupTerminalWebSocket };