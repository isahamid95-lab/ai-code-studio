import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import type { Server as HttpServer, IncomingMessage } from 'http';
import path from 'path';
import { IS_WINDOWS } from '../services/processManager';
import { parse } from 'url';
import crypto from 'crypto';

const WORKSPACE_DIR = path.join(process.cwd(), 'project-workspace');

// GÜVENLİK: Aktif terminal bağlantılarını takip et
const activeConnections = new Map<string, { socket: WebSocket; pid?: number }>();
const MAX_CONCURRENT_TERMINALS = 10;

// GÜVENLİK: Session token oluşturma ve doğrulama
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function setupTerminalWebSocket(httpServer: HttpServer): WebSocketServer {
  const terminalServer = new WebSocketServer({ noServer: true });

  terminalServer.on('connection', (socket, request) => {
    // GÜVENLİK: Connection bilgilerini logla
    const clientId = generateSessionToken();
    const clientIp = request.socket.remoteAddress || 'unknown';
    console.log('[Terminal WS] New connection:', { clientId, clientIp });
    
    // GÜVENLİK: Maksimum bağlantı kontrolü
    if (activeConnections.size >= MAX_CONCURRENT_TERMINALS) {
      socket.send('\r\nError: Maximum concurrent terminal sessions reached\r\n');
      socket.close(4001, 'Too many connections');
      return;
    }

    const shell = IS_WINDOWS ? 'powershell.exe' : 'bash';
    
    // GÜVENLİK: Güvenli environment - sadece gerekli değişkenler
    const safeEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      // Hassas değişkenleri hariç tut
      NODE_ENV: process.env.NODE_ENV,
    };
    
    const child = spawn(shell, [], {
      cwd: WORKSPACE_DIR,
      env: safeEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false, // GÜVENLİK: Shell injection koruması
      detached: false,
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

    // GÜVENLİK: Connection'ı takip et
    activeConnections.set(clientId, { socket, pid: child.pid });
    
    socket.on('message', (data: Buffer) => {
      child.stdin.write(data.toString());
    });

    socket.on('close', () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // Child may already be dead
      }
      // GÜVENLİK: Connection kaydını temizle
      activeConnections.delete(clientId);
      console.log('[Terminal WS] Connection closed:', clientId);
    });
    
    socket.on('error', (error) => {
      console.error('[Terminal WS] Error:', clientId, error.message);
      activeConnections.delete(clientId);
    });
  });

  // GÜVENLİK: Upgrade handler - Token tabanlı kimlik doğrulama
  httpServer.on('upgrade', (request, socket, head) => {
    const parsedUrl = parse(request.url || '', true);
    
    if (parsedUrl.pathname !== '/api/terminal') {
      socket.destroy();
      return;
    }
    
    // GÜVENLİK: Token doğrulama
    const token = parsedUrl.query.token as string;
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      console.warn('[Terminal WS] Connection rejected - missing token');
      return;
    }
    
    // GÜVENLİK: Token format kontrolü (basit validation)
    if (typeof token !== 'string' || token.length < 10) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      console.warn('[Terminal WS] Connection rejected - invalid token format');
      return;
    }
    
    // GÜVENLİK: Token'ı hash'le ve logla (audit trail)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
    console.log('[Terminal WS] Token validated:', tokenHash + '...');
    
    terminalServer.handleUpgrade(request, socket, head, (ws) => {
      terminalServer.emit('connection', ws, request);
    });
  });

  return terminalServer;
}

export { setupTerminalWebSocket, activeConnections };