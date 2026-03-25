import net from 'net';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { detectPortFromOutput, type ManagedProcessLike } from '../../lib/dev-server';

const IS_WINDOWS = process.platform === 'win32';

interface ManagedProcess extends ManagedProcessLike {
  process: ChildProcessWithoutNullStreams;
}

const managedProcesses = new Map<number, ManagedProcess>();

function spawnWorkspaceProcess(command: string, cwd: string): ChildProcessWithoutNullStreams {
  const shell = IS_WINDOWS ? 'cmd' : 'sh';
  const shellArgs = IS_WINDOWS ? ['/c', command] : ['-c', command];

  return spawn(shell, shellArgs, {
    cwd,
    env: { ...process.env, FORCE_COLOR: '0', CI: 'true', NONINTERACTIVE: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

interface ExecuteOptions {
  timeout?: number;
  onData?: (chunk: string) => void;
  background?: boolean;
  kind?: 'dev-server';
  onPort?: (port: number) => void;
}

interface ExecuteResult {
  output: string;
  exitCode: number;
  port?: number;
}

function executeWorkspaceCommand(
  command: string,
  cwd: string,
  options: ExecuteOptions = {}
): Promise<ExecuteResult> {
  return new Promise((resolve, reject) => {
    const child = spawnWorkspaceProcess(command, cwd);
    let output = '';
    let detectedPort: number | undefined;
    let resolved = false;
    const timeout = options.timeout || 120000;

    const managedEntry: ManagedProcess | null =
      options.background && options.kind === 'dev-server' && child.pid
        ? {
            pid: child.pid,
            command,
            kind: 'dev-server' as const,
            process: child,
            spawnedAt: Date.now(),
          }
        : null;

    if (managedEntry && child.pid) {
      managedProcesses.set(child.pid, managedEntry);
    }

    const timer = setTimeout(() => {
      if (options.background) {
        if (!resolved) {
          resolved = true;
          resolve({ output: output || '(no output)', exitCode: 0, port: detectedPort });
        }
        return;
      }

      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout / 1000}s`));
    }, options.background ? 30000 : timeout);

    child.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      options.onData?.(chunk);
      if (options.background && !detectedPort) {
        detectedPort = detectPortFromOutput(chunk);
        if (detectedPort) {
          if (managedEntry) {
            managedEntry.port = detectedPort;
          }
          options.onPort?.(detectedPort);
          clearTimeout(timer);
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve({ output: output || '(no output)', exitCode: 0, port: detectedPort });
            }
          }, 1000);
        }
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      options.onData?.(chunk);
      if (options.background && !detectedPort) {
        detectedPort = detectPortFromOutput(chunk);
        if (detectedPort) {
          if (managedEntry) {
            managedEntry.port = detectedPort;
          }
          options.onPort?.(detectedPort);
          clearTimeout(timer);
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve({ output: output || '(no output)', exitCode: 0, port: detectedPort });
            }
          }, 1000);
        }
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (managedEntry && child.pid) {
        managedProcesses.delete(child.pid);
      }
      if (!resolved) {
        resolved = true;
        resolve({ output: output || '(no output)', exitCode: code ?? 1, port: detectedPort });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (managedEntry && child.pid) {
        managedProcesses.delete(child.pid);
      }
      if (options.background) {
        if (!resolved) {
          resolved = true;
          resolve({ output: `Spawn error: ${err.message}`, exitCode: 1, port: detectedPort });
        }
        return;
      }

      reject(err);
    });
  });
}

function killManagedProcess(pid: number): boolean {
  const entry = managedProcesses.get(pid);
  if (entry) {
    try {
      entry.process.kill('SIGTERM');
    } catch {
      // Process may already be dead
    }
    managedProcesses.delete(pid);
    return true;
  }
  return false;
}

function killAllManagedProcesses(): void {
  for (const [pid] of managedProcesses) {
    killManagedProcess(pid);
  }
}

function getManagedProcessSnapshot(): ManagedProcessLike[] {
  return Array.from(managedProcesses.values()).map((processInfo) => ({
    pid: processInfo.pid,
    command: processInfo.command,
    kind: processInfo.kind,
    port: processInfo.port,
    spawnedAt: processInfo.spawnedAt,
  }));
}

function hasManagedProcess(pid: number): boolean {
  return managedProcesses.has(pid);
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => {
      resolve(false);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, '127.0.0.1');
  });
}

process.on('SIGTERM', killAllManagedProcesses);
process.on('SIGINT', killAllManagedProcesses);

export {
  spawnWorkspaceProcess,
  executeWorkspaceCommand,
  killManagedProcess,
  killAllManagedProcesses,
  getManagedProcessSnapshot,
  hasManagedProcess,
  isPortAvailable,
  IS_WINDOWS,
};

export type { ExecuteOptions, ExecuteResult };