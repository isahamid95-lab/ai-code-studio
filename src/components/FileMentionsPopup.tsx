import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode2 } from 'lucide-react';
import { FileItem } from '../types';

interface FileMentionsPopupProps {
  isOpen: boolean;
  query: string;
  files: FileItem[];
  onSelect: (filename: string) => void;
  position: { top: number; left: number };
}

export const FileMentionsPopup: React.FC<FileMentionsPopupProps> = ({ 
  isOpen, query, files, onSelect, position 
}) => {
  const filteredFiles = files
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  if (!isOpen || filteredFiles.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute z-[100] bg-secondary border border-white/10 rounded-xl shadow-2xl p-1.5 w-[220px] glass-panel backdrop-blur-3xl"
      style={{ bottom: position.top + 20, left: position.left }}
    >
      <div className="px-3 py-1.5 text-[9px] font-bold text-text/30 uppercase tracking-widest border-b border-white/5 mb-1">
        Mention File
      </div>
      {filteredFiles.map(file => (
        <button
          key={file.id}
          onClick={() => onSelect(file.name)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-primary/20 hover:text-text text-text/60 transition-all text-sm text-left truncate group"
        >
          <FileCode2 size={14} className="text-text/30 group-hover:text-primary" />
          <span className="truncate">{file.name}</span>
        </button>
      ))}
    </motion.div>
  );
};
