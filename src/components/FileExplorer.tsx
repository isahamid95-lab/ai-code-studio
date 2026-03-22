import React, { useState } from 'react';
import { FileCode2, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FileItem, FileTemplate } from '../types';

interface FileExplorerProps {
  files: FileItem[];
  activeTabId: string;
  isCreatingFile: boolean;
  newFileName: string;
  selectedTemplate: string | null;
  templates: Record<string, FileTemplate>;
  onSetCreatingFile: (val: boolean) => void;
  onSetNewFileName: (val: string) => void;
  onSetSelectedTemplate: (val: string | null) => void;
  onOpenFile: (id: string) => void;
  onDeleteFile: (e: React.MouseEvent, id: string) => void;
  onCreateFile: () => void;
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

const FileExplorer = React.memo(function FileExplorer({
  files,
  activeTabId,
  isCreatingFile,
  newFileName,
  selectedTemplate,
  templates,
  onSetCreatingFile,
  onSetNewFileName,
  onSetSelectedTemplate,
  onOpenFile,
  onDeleteFile,
  onCreateFile,
}: FileExplorerProps) {
  const [contextMenuFileId, setContextMenuFileId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuFileId(fileId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenuFileId(null);

  return (
    <>
      {contextMenuFileId && (
        <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
      )}

      <AnimatePresence>
        {contextMenuFileId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-secondary/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl py-1 min-w-[140px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              onClick={(e) => {
                onDeleteFile(e, contextMenuFileId);
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              Delete File
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Creation */}
      {isCreatingFile && (
        <div className="flex flex-col gap-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <FileCode2 size={14} className="text-text/30 shrink-0" />
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => onSetNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateFile();
                if (e.key === 'Escape') {
                  onSetCreatingFile(false);
                  onSetSelectedTemplate(null);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  onSetCreatingFile(false);
                  onSetSelectedTemplate(null);
                }, 150);
              }}
              placeholder="filename.js"
              className="flex-1 bg-white/[0.04] text-[12px] text-text px-2.5 py-1.5 border border-primary/30 rounded-lg outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap gap-1 pl-6">
            {Object.entries(templates).map(([key, tpl]) => (
              <button
                key={key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSetNewFileName(newFileName || `Untitled${tpl.defaultExt}`);
                  onSetSelectedTemplate(key);
                }}
                className={`text-[9px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  selectedTemplate === key
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-white/[0.02] border-white/[0.06] text-text/35 hover:text-text/60 hover:bg-white/[0.04]'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File List */}
      {files.map(file => (
        <div
          key={file.id}
          onClick={() => onOpenFile(file.id)}
          onContextMenu={(e) => handleContextMenu(e, file.id)}
          className={`group w-full flex items-center justify-between px-4 py-1.5 text-[12px] cursor-pointer transition-all ${
            activeTabId === file.id
              ? 'bg-primary/8 text-text/90 border-l-2 border-primary'
              : 'text-text/50 hover:bg-white/[0.03] hover:text-text/70 border-l-2 border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileCode2 size={13} className={activeTabId === file.id ? 'text-primary' : getFileIconColor(file.name)} />
            <span className="truncate font-medium">{file.name}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(e, file.id);
            }}
            className="opacity-0 group-hover:opacity-60 p-1 text-text/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </>
  );
});

export default FileExplorer;
