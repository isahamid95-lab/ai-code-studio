import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileCode2, Command, Zap, Play, Terminal, Trash2, X, Github, Globe } from 'lucide-react';
import { FileItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  onOpenFile: (id: string) => void;
  onRunCode: () => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, onClose, files, onOpenFile, onRunCode, onOpenSettings, onClearChat 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = useMemo(() => [
    { id: 'run', name: 'Run Current File', icon: Play, action: onRunCode, category: 'Actions' },
    { id: 'settings', name: 'Open Settings', icon: Globe, action: onOpenSettings, category: 'Actions' },
    { id: 'clear', name: 'Clear Chat History', icon: Trash2, action: onClearChat, category: 'Chat' },
    { id: 'terminal', name: 'Toggle Terminal', icon: Terminal, action: () => {}, category: 'View' },
    { id: 'github', name: 'GitHub Integration', icon: Github, action: () => {}, category: 'External' },
  ], [onRunCode, onOpenSettings, onClearChat]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    const matchedFiles = files
      .filter(f => f.name.toLowerCase().includes(q))
      .map(f => ({ id: f.id, name: f.name, icon: FileCode2, category: 'Files', type: 'file' }));
    
    const matchedActions = actions
      .filter(a => a.name.toLowerCase().includes(q))
      .map(a => ({ ...a, type: 'action' }));

    return [...matchedActions, ...matchedFiles];
  }, [query, files, actions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(filteredItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  const handleSelect = (item: any) => {
    if (!item) return;
    if (item.type === 'file') {
      onOpenFile(item.id);
    } else if (item.type === 'action') {
      item.action();
    }
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          className="w-full max-w-2xl bg-secondary/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-panel"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center px-4 border-b border-white/10">
            <Search className="text-text/30 mr-3" size={18} />
            <input
              autoFocus
              className="flex-1 h-14 bg-transparent border-none text-text placeholder-text/20 focus:outline-none text-base"
              placeholder="Search files and commands..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
              <span className="text-[10px] text-text/40 font-mono">ESC</span>
            </div>
          </div>

          <div className="max-h-[450px] overflow-y-auto p-2 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text/20 italic">No results for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {['Actions', 'Files', 'Chat', 'View', 'External'].map(category => {
                  const categoryItems = filteredItems.filter(item => item.category === category);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h3 className="px-3 py-2 text-[10px] font-bold text-text/20 uppercase tracking-[0.2em]">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {categoryItems.map((item) => {
                          const globalIndex = filteredItems.indexOf(item);
                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              onClick={() => handleSelect(item)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                selectedIndex === globalIndex 
                                  ? 'bg-primary/20 text-text border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                                  : 'text-text/50 border border-transparent hover:bg-white/5'
                              }`}
                            >
                              <item.icon size={16} className={selectedIndex === globalIndex ? 'text-primary' : 'text-text/30'} />
                              <span className="text-sm font-medium flex-1">{item.name}</span>
                              {selectedIndex === globalIndex && (
                                <Zap size={14} className="text-primary animate-pulse" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 bg-black/40 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-[10px] text-text/30">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-text/30">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↵</kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="text-[10px] text-text/20 font-bold uppercase tracking-widest flex items-center gap-2">
              <Command size={10} />
              Command Palette
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
