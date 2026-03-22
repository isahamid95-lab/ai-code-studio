import React, { useState, useCallback } from 'react';
import { X, TerminalSquare, Plus, Trash2 } from 'lucide-react';
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
      animate={{ height: 320, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-white/10 bg-background/80 backdrop-blur-md flex flex-col shrink-0 overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-background/40 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text/30 uppercase tracking-[0.2em] px-2 border-r border-white/10 mr-2 shrink-0">
            <TerminalSquare size={13} />
            Output
          </div>
          
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 whitespace-nowrap group ${
                activeSessionId === session.id 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'text-text/40 hover:text-text/70 border border-transparent'
              }`}
            >
              <span>{session.name}</span>
              {sessions.length > 1 && (
                <button 
                  onClick={(e) => removeSession(e, session.id)}
                  className={`p-0.5 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${activeSessionId === session.id ? 'text-primary' : 'text-text/40'}`}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          
          <button 
            onClick={addSession}
            className="p-1.5 text-text/30 hover:text-text hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            title="New Terminal Session"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 ml-4 border-l border-white/10 pl-4">
          <button onClick={onClose} className="p-1 text-text/30 hover:text-text cursor-pointer transition-colors" title="Hide Terminal">
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full bg-black/10 overflow-hidden relative">
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
