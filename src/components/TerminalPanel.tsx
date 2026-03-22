import React, { useState, useRef, useEffect } from 'react';
import { X, TerminalSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LogEntry } from '../types';

interface TerminalPanelProps {
  terminalOutput: LogEntry[];
  onClear: () => void;
  onClose: () => void;
  onAddOutput: (entry: LogEntry) => void;
}

const TerminalPanel = React.memo(function TerminalPanel({
  terminalOutput,
  onClear,
  onClose,
  onAddOutput,
}: TerminalPanelProps) {
  const [commandInput, setCommandInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Focus input when terminal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || isRunning) return;

    // Add to history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setCommandInput('');

    // Show command in terminal
    onAddOutput({ type: 'info', text: `$ ${cmd}` });
    setIsRunning(true);

    try {
      const response = await fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      if (!response.ok) {
        const errData = await response.json();
        onAddOutput({ type: 'error', text: errData.error || 'Command failed' });
        setIsRunning(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'log') {
              onAddOutput({ type: 'log', text: event.text });
            } else if (event.type === 'error') {
              onAddOutput({ type: 'error', text: event.text });
            } else if (event.type === 'exit') {
              if (event.code !== 0) {
                onAddOutput({ type: 'error', text: `Process exited with code ${event.code}` });
              }
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: any) {
      onAddOutput({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(commandInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIdx);
        setCommandInput(commandHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIdx = historyIndex + 1;
        if (newIdx >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommandInput('');
        } else {
          setHistoryIndex(newIdx);
          setCommandInput(commandHistory[newIdx]);
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 280, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-col shrink-0"
    >
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70 uppercase tracking-wider">
          <TerminalSquare size={14} />
          Terminal
          {isRunning && (
            <span className="flex items-center gap-1.5 text-cyan-400 normal-case">
              <Loader2 size={11} className="animate-spin" />
              running...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClear}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Output area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-3 pb-1 font-mono text-[13px] leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalOutput.map((log, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all ${
            log.type === 'error' ? 'text-red-400' : 
            log.type === 'info' ? 'text-cyan-400' : 
            'text-white/80'
          }`}>
            {log.text}
          </div>
        ))}
      </div>

      {/* Command input */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-white/5 bg-black/20">
        <span className="text-emerald-400 font-mono text-sm font-bold shrink-0">$</span>
        <input
          ref={inputRef}
          value={commandInput}
          onChange={e => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder={isRunning ? 'Command running...' : 'Type a command... (npm, node, npx, git, etc.)'}
          className="flex-1 bg-transparent text-sm font-mono text-white outline-none placeholder-white/25 disabled:opacity-50"
          autoFocus
        />
      </div>
    </motion.div>
  );
});

export default TerminalPanel;
