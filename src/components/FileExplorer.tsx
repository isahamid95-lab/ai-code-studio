import React, { useState } from 'react';
import { FileCode2, Plus, Trash2, FolderIcon, MoreHorizontal } from 'lucide-react';
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
      {/* Close context menu on click outside */}
      {contextMenuFileId && (
        <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenuFileId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-secondary border border-white/15 rounded-lg shadow-2xl py-1 min-w-[160px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              onClick={(e) => {
                onDeleteFile(e, contextMenuFileId);
                closeContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/15 transition-colors"
            >
              <Trash2 size={14} />
              Delete File
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Creation Input */}
      {isCreatingFile && (
        <div className="flex flex-col gap-2 px-4 py-2">
          <div className="flex items-center gap-2">
            <FileCode2 size={16} className="text-white/50" />
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
              className="flex-1 bg-secondary/40 text-sm text-text px-3 py-1.5 border border-primary/50 rounded-lg outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pl-6">
            {Object.entries(templates).map(([key, tpl]) => (
              <button
                key={key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSetNewFileName(newFileName || `Untitled${tpl.defaultExt}`);
                  onSetSelectedTemplate(key);
                }}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                  selectedTemplate === key
                    ? 'bg-primary/20 border-primary/50 text-white shadow-lg shadow-primary/10'
                    : 'bg-white/5 border-white/10 text-text/50 hover:text-text/80 hover:bg-white/10'
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
          className={`group w-full flex items-center justify-between px-5 py-2 text-sm cursor-pointer transition-colors border-l-2 ${
            activeTabId === file.id 
              ? 'bg-primary/10 text-primary border-primary' 
              : 'text-text/70 hover:bg-white/5 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <FileCode2 size={16} className={activeTabId === file.id ? 'text-primary' : 'text-text/40'} />
            <span className="truncate">{file.name}</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(e, file.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-text/40 hover:text-red-400 hover:bg-red-500/15 rounded-md transition-all cursor-pointer"
            title="Delete file"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </>
  );
});

export default FileExplorer;
