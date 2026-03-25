import React from 'react';
import { X, FileCode2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FileItem } from '../../types';

interface EditorTabsProps {
  openTabs: string[];
  files: FileItem[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabContextMenu: (e: React.MouseEvent, id: string) => void;
}

function getFileIconColor(name: string): string {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return 'text-cyan-400';
  if (name.endsWith('.jsx') || name.endsWith('.js')) return 'text-yellow-400';
  if (name.endsWith('.css') || name.endsWith('.scss')) return 'text-blue-400';
  if (name.endsWith('.html')) return 'text-orange-400';
  if (name.endsWith('.json')) return 'text-emerald-400';
  if (name.endsWith('.md')) return 'text-text/40';
  return 'text-text/35';
}

export function EditorTabs({
  openTabs,
  files,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabContextMenu,
}: EditorTabsProps) {
  const getFileName = (id: string) => {
    const file = files.find((f) => f.id === id);
    return file?.name ?? id;
  };

  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] shrink-0">
      <div className="flex items-center overflow-x-auto scrollbar-hide">
        <AnimatePresence initial={false}>
          {openTabs.map((tabId) => (
            <motion.div
              key={tabId}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-2 px-3 py-2 border-r border-white/[0.06] cursor-pointer group min-w-0 ${
                activeTabId === tabId
                  ? 'bg-white/[0.03] text-text'
                  : 'text-text/50 hover:text-text/80 hover:bg-white/[0.02]'
              }`}
              onClick={() => onTabClick(tabId)}
              onContextMenu={(e) => onTabContextMenu(e, tabId)}
            >
              <FileCode2 size={14} className={getFileIconColor(getFileName(tabId))} />
              <span className="text-xs truncate max-w-[120px]">{getFileName(tabId)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tabId);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-white/[0.1] rounded p-0.5 transition-opacity"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}