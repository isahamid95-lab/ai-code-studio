declare module 'ws' {
  export class WebSocketServer {
    constructor(options: { noServer?: boolean });
    on(event: 'connection', listener: (socket: any) => void): void;
    handleUpgrade(request: any, socket: any, head: any, callback: (ws: any) => void): void;
    emit(event: 'connection', ws: any, request: any): void;
  }
}
