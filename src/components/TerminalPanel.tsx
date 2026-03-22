import React, { useState, useCallback } from 'react';
import { X, TerminalSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalSession } from './TerminalSession';

interface TerminalPanelProps {
  onClose: () => void;
}

const TerminalPanel = React.memo(function TerminalPanel({ onClose }: TerminalPanelProps) {
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([
    { id: '1', name: 'Terminal 1' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('1');

  const addSession = useCallback(() => {
    const nextId = (Math.max(...sessions.map(s => parseInt(s.id))) + 1).toString();
    setSessions(prev => [...prev, { id: nextId, name: `Terminal ${nextId}` }]);
    setActiveSessionId(nextId);
  }, [sessions]);

  const removeSession = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length === 1) return;
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(next[next.length - 1].id);
      }
      return next;
    });
  }, [sessions, activeSessionId]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 280, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="border-t border-white/[0.06] bg-background/60 backdrop-blur-md flex flex-col shrink-0 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text/25 uppercase tracking-[0.15em] px-2 mr-1 shrink-0">
            <TerminalSquare size={12} />
            Terminal
          </div>

          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all shrink-0 group ${
                activeSessionId === session.id
                  ? 'bg-white/[0.06] text-text/70'
                  : 'text-text/30 hover:text-text/50'
              }`}
            >
              <span>{session.name}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => removeSession(e, session.id)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={9} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addSession}
            className="p-1 text-text/20 hover:text-text/50 hover:bg-white/[0.04] rounded-md transition-all cursor-pointer shrink-0"
            title="New Terminal"
          >
            <Plus size={12} />
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-text/20 hover:text-text/50 cursor-pointer transition-all rounded-md hover:bg-white/[0.04] ml-2"
          title="Close Terminal"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 w-full overflow-hidden relative">
        <AnimatePresence initial={false}>
          {sessions.map(session => (
            <TerminalSession
              key={session.id}
              id={session.id}
              isActive={activeSessionId === session.id}
              onReady={() => {}}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default TerminalPanel;
