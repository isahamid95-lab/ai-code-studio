import React from 'react';
import { motion } from 'framer-motion';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

const ShortcutRow = ({ keys, label }: { keys: string[], label: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group">
    <span className="text-xs text-text/60 group-hover:text-text transition-colors">{label}</span>
    <div className="flex gap-1">
      {keys.map((k, i) => (
        <span key={i} className="min-w-[24px] h-6 flex items-center justify-center px-1.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold text-text/80 shadow-sm">
          {k === 'Cmd' ? <Command size={10} /> : k}
        </span>
      ))}
    </div>
  </div>
);

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Keyboard size={20} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-2 text-text/40 hover:text-text hover:bg-white/5 rounded-full transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">General</h3>
            <div className="space-y-1">
              <ShortcutRow label="Command Palette" keys={['Cmd', 'K']} />
              <ShortcutRow label="Toggle Sidebar" keys={['Cmd', 'B']} />
              <ShortcutRow label="Toggle AI Chat" keys={['Cmd', 'Shift', 'B']} />
              <ShortcutRow label="Toggle Terminal" keys={['Cmd', 'J']} />
              <ShortcutRow label="Run Current File" keys={['F5']} />
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">Editor</h3>
            <div className="space-y-1">
              <ShortcutRow label="Save File" keys={['Cmd', 'S']} />
              <ShortcutRow label="Find" keys={['Cmd', 'F']} />
              <ShortcutRow label="Select All" keys={['Cmd', 'A']} />
              <ShortcutRow label="Duplicate Line" keys={['Cmd', 'D']} />
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">Chat</h3>
            <div className="space-y-1">
              <ShortcutRow label="Mention File" keys={['@']} />
              <ShortcutRow label="Send Message" keys={['Enter']} />
              <ShortcutRow label="New Line" keys={['Shift', 'Enter']} />
            </div>
          </section>
        </div>

        <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-center">
          <p className="text-[10px] text-text/30 italic">Developed by Antigravity — Smartest AI IDE experience.</p>
        </div>
      </motion.div>
    </div>
  );
};
