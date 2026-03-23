export interface ManagedProcessLike {
  pid: number;
  command: string;
  kind: 'dev-server';
  port?: number;
  spawnedAt: number;
}

export interface DevServerPreflightResult {
  requestedPort?: number;
  killPids: number[];
  error?: string;
}

const DEV_SERVER_PATTERN = /(npm run dev|npx vite|next dev|node server|nodemon|vite --host|npm run start)/i;
const PORT_PATTERN = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)|port\s+(\d+)|http:\/\/[^:]+:(\d+)/i;
const REQUESTED_PORT_PATTERN = /(?:--port(?:=|\s+)|-p\s+)(\d+)|PORT\s*=\s*(\d+)/i;

export function isDevServerCommand(command: string): boolean {
  return DEV_SERVER_PATTERN.test(command);
}

export function detectPortFromOutput(output: string): number | undefined {
  const match = output.match(PORT_PATTERN);
  if (!match) {
    return undefined;
  }

  return parseInt(match[1] || match[2] || match[3], 10);
}

export function parseRequestedPort(command: string): number | undefined {
  const match = command.match(REQUESTED_PORT_PATTERN);
  if (!match) {
    return undefined;
  }

  return parseInt(match[1] || match[2], 10);
}

export async function preflightDevServerStart(
  command: string,
  managedProcesses: ManagedProcessLike[],
  isPortAvailable: (port: number) => Promise<boolean>,
): Promise<DevServerPreflightResult> {
  const requestedPort = parseRequestedPort(command);
  const devServerProcesses = managedProcesses.filter((processInfo) => processInfo.kind === 'dev-server');

  if (requestedPort) {
    const managedProcess = devServerProcesses.find((processInfo) => processInfo.port === requestedPort);
    if (managedProcess) {
      return {
        requestedPort,
        killPids: [managedProcess.pid],
      };
    }

    const portAvailable = await isPortAvailable(requestedPort);
    if (!portAvailable) {
      return {
        requestedPort,
        killPids: [],
        error: `Port ${requestedPort} is already in use by an external process.`,
      };
    }

    return {
      requestedPort,
      killPids: [],
    };
  }

  return {
    killPids: devServerProcesses.map((processInfo) => processInfo.pid),
  };
}
