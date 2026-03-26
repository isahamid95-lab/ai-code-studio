import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { X, TerminalSquare, FileTerminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import type { LogEntry } from '../types';
import { createTerminalSocket } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface TerminalPanelProps {
  onClose: () => void;
  logs: LogEntry[];
  isAgentRunning: boolean;
}

type TerminalSessionState = 'idle' | 'connecting' | 'open' | 'closed';

const TerminalPanel = React.memo(function TerminalPanel({ onClose, logs, isAgentRunning }: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<'agent' | 'terminal'>(isAgentRunning ? 'agent' : 'terminal');
  const [terminalState, setTerminalState] = useState<TerminalSessionState>('idle');
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (isAgentRunning) {
      setActiveTab('agent');
    }
  }, [isAgentRunning]);

  const ensureTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) {
      return null;
    }

    const fitAddon = new FitAddon();
    const terminal = new Terminal({
      theme: { background: 'transparent', foreground: '#F1F5F9' },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });

    fitAddonRef.current = fitAddon;
    xtermRef.current = terminal;
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminal.onData((data) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
      }
    });

    resizeObserverRef.current = new ResizeObserver(() => {
      fitAddonRef.current?.fit();
    });
    resizeObserverRef.current.observe(terminalRef.current);

    return terminal;
  }, []);

  const connectTerminal = useCallback(() => {
    const terminal = xtermRef.current ?? ensureTerminal();
    if (!terminal || socketRef.current) {
      return;
    }

    const socket = createTerminalSocket();
    socketRef.current = socket;
    setTerminalState('connecting');

    socket.addEventListener('open', () => {
      setTerminalState('open');
      terminal.writeln('Connected to terminal');
    });

    socket.addEventListener('message', (event) => {
      terminal.write(String(event.data));
    });

    socket.addEventListener('close', () => {
      socketRef.current = null;
      setTerminalState('closed');
      terminal.writeln('\r\nTerminal disconnected');
    });

    socket.addEventListener('error', () => {
      terminal.writeln('\r\nTerminal connection error');
    });
  }, [ensureTerminal]);

  useEffect(() => {
    if (activeTab === 'terminal') {
      connectTerminal();
    }
  }, [activeTab, connectTerminal]);

  useEffect(() => () => {
    resizeObserverRef.current?.disconnect();
    socketRef.current?.close();
    xtermRef.current?.dispose();
    resizeObserverRef.current = null;
    socketRef.current = null;
    xtermRef.current = null;
    fitAddonRef.current = null;
  }, []);

  const handleTerminalTabClick = () => {
    setActiveTab('terminal');
    if (terminalState !== 'open') {
      connectTerminal();
    }
  };

  const renderedLogs = useMemo(() => logs.map((entry, index) => (
    <div
      key={`${entry.timestamp ?? index}-${index}`}
      className={`whitespace-pre-wrap break-words ${
        entry.type === 'error'
          ? 'text-red-300'
          : entry.type === 'success'
            ? 'text-emerald-300'
            : entry.type === 'warning'
              ? 'text-amber-300'
              : 'text-text/75'
      }`}
    >
      {entry.text}
    </div>
  )), [logs]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 280, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="border-t border-white/[0.06] bg-background/60 backdrop-blur-md flex flex-col shrink-0 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('agent')}
            aria-label="View Agent Output"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'agent' ? 'bg-white/[0.06] text-text/70' : 'text-text/30 hover:text-text/50'
            }`}
          >
            <TerminalSquare size={12} />
            Agent Output
          </button>
          <button
            onClick={handleTerminalTabClick}
            aria-label="View Terminal"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'terminal' ? 'bg-white/[0.06] text-text/70' : 'text-text/30 hover:text-text/50'
            }`}
          >
            <FileTerminal size={12} />
            Terminal
          </button>
          {activeTab === 'terminal' && terminalState !== 'open' && (
            <span className="text-[10px] text-text/30 uppercase tracking-[0.15em]">
              {terminalState === 'connecting' ? 'Connecting' : terminalState === 'closed' ? 'Reconnect available' : 'Idle'}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Close Terminal"
          className="p-1 text-text/20 hover:text-text/50 cursor-pointer transition-all rounded-md hover:bg-white/[0.04] ml-2 focus-visible:ring-2 focus-visible:ring-primary"
          title="Close Terminal"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 w-full overflow-hidden relative">
        {activeTab === 'agent' ? (
          <div className="h-full overflow-auto px-3 py-2 font-mono text-[12px] space-y-1">
            {renderedLogs}
          </div>
        ) : (
          <div ref={terminalRef} className="h-full w-full p-2" />
        )}
      </div>
    </motion.div>
  );
});

export default TerminalPanel;
