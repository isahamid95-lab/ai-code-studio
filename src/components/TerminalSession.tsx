import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getWebContainer } from '../lib/webcontainer';
import { Loader2 } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface TerminalSessionProps {
  id: string;
  isActive: boolean;
  onReady: () => void;
}

export const TerminalSession: React.FC<TerminalSessionProps> = ({ id, isActive, onReady }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const processRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const fitAddon = new FitAddon();
    const terminal = new Terminal({
      theme: { background: 'transparent', foreground: '#F1F5F9' },
      fontFamily: 'monospace',
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });
    
    xtermRef.current = terminal;
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    
    // Resize support
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (processRef.current) {
          processRef.current.resize({ cols: terminal.cols, rows: terminal.rows });
        }
      } catch (e) {}
    });
    resizeObserver.observe(terminalRef.current);

    (async () => {
      try {
        const wc = await getWebContainer();
        const shellProcess = await wc.spawn('jsh', {
          terminal: { cols: terminal.cols, rows: terminal.rows }
        });
        processRef.current = shellProcess;

        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal.write(data);
            }
          })
        );

        const input = shellProcess.input.getWriter();
        terminal.onData((data) => {
          input.write(data);
        });

        setIsReady(true);
        onReady();
      } catch (e) {
        terminal.write('\r\n\x1b[31mFailed to start terminal session.\x1b[0m\r\n');
      }
    })();

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      if (processRef.current) processRef.current.kill();
    };
  }, []);

  return (
    <div className={`h-full w-full relative ${isActive ? 'block' : 'hidden'}`}>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-10 transition-opacity">
          <div className="flex flex-col items-center gap-3">
             <Loader2 size={32} className="animate-spin text-primary" />
             <span className="text-xs text-text/40 font-medium">Session {id} starting...</span>
          </div>
        </div>
      )}
      <div className="h-full w-full p-2" ref={terminalRef} />
    </div>
  );
};
