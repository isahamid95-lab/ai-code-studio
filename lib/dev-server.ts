/**
 * Development server management utilities
 */
import type { ChildProcessWithoutNullStreams } from 'child_process';

export interface ManagedProcessLike {
  pid: number;
  command: string;
  kind?: 'dev-server';
  port?: number;
  spawnedAt?: number;
  process?: ChildProcessWithoutNullStreams;
}

/**
 * Detect if a command is likely to start a dev server
 */
export function isDevServerCommand(command: string): boolean {
  const devServerPatterns = [
    /\b(vite|webpack|parcel|rollup|esbuild)\b/i,
    /\b(npm|yarn|pnpm)\s+(run\s+)?(dev|start)\b/i,
    /\b(react-scripts|next|nuxt|astro)\b/i,
    /\bnode\s+.*server/i,
    /\btsx\s+.*server/i,
    /\bts-node\s+.*server/i,
  ];
  
  return devServerPatterns.some(pattern => pattern.test(command));
}

/**
 * Detect port from dev server output
 */
export function detectPortFromOutput(output: string): number | undefined {
  const portPatterns = [
    /localhost:(\d+)/i,
    /127\.0\.0\.1:(\d+)/i,
    /port\s+(\d+)/i,
    /:(\d{4,5})/,
    /listening.*?(\d{4,5})/i,
  ];
  
  for (const pattern of portPatterns) {
    const match = output.match(pattern);
    if (match) {
      const port = parseInt(match[1], 10);
      if (port >= 1024 && port <= 65535) {
        return port;
      }
    }
  }
  
  return undefined;
}

/**
 * Preflight check for dev server start
 */
export async function preflightDevServerStart(
  command: string,
  managedSnapshots: ManagedProcessLike[],
  isPortAvailable: (port: number) => Promise<boolean>
): Promise<{ shouldStart: boolean; reason?: string; port?: number; error?: string; killPids?: number[] }> {
  if (!isDevServerCommand(command)) {
    return { shouldStart: true };
  }
  
  // Check if a similar process is already running
  const normalizedCommand = command.trim().toLowerCase();
  const existing = managedSnapshots.find(
    p => p.kind === 'dev-server' && p.command.toLowerCase() === normalizedCommand
  );
  
  if (existing) {
    return { 
      shouldStart: false,
      error: `Dev server already running on port ${existing.port || 'unknown'}`,
      killPids: [existing.pid]
    };
  }
  
  return { shouldStart: true };
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  const net = await import('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}
