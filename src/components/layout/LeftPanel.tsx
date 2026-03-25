import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLeftPanelOpen, useLeftPanelTab } from '../../stores';
import FileExplorer from '../FileExplorer';
import { SearchPanel } from '../SearchPanel';
import GitPanel from '../GitPanel';
import { SymbolOutline } from '../SymbolOutline';
import { AIIntelPanel } from '../AIIntelPanel';
import { MCPServersPanel } from '../MCPServersPanel';
import DashboardPanel from '../DashboardPanel';
import type { FileItem, FileTemplate, GitStatus } from '../../types';

interface LeftPanelProps {
  // File props
  files: FileItem[];
  activeTabId: string;
  isCreatingFile: boolean;
  newFileName: string;
  selectedTemplate: string | null;
  templates: Record<string, FileTemplate>;
  onSetCreatingFile: (value: boolean) => void;
  onSetNewFileName: (name: string) => void;
  onSetSelectedTemplate: (template: string | null) => void;
  onOpenFile: (id: string) => void;
  onDeleteFile: (e: React.MouseEvent, id: string) => void;
  onCreateFile: () => void;
  
  // Git props
  gitStatus: GitStatus;
  isGitLoading: boolean;
  commitMessage: string;
  remoteUrl: string;
  isSettingRemote: boolean;
  onSetCommitMessage: (msg: string) => void;
  onSetRemoteUrl: (url: string) => void;
  onSetIsSettingRemote: (value: boolean) => void;
  onGitInit: () => void;
  onGitStage: (file: string) => void;
  onGitUnstage: (file: string) => void;
  onGitCommit: () => void;
  onGitRemote: () => void;
  onGitPush: () => void;
  onGitPull: () => void;
  
  // Agent props
  onMCPConnect: (name: string) => void;
  
  // Other props
  onRefreshWorkspace: () => void;
  activeFileContent: string;
}

export function LeftPanel({
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
  gitStatus,
  isGitLoading,
  commitMessage,
  remoteUrl,
  isSettingRemote,
  onSetCommitMessage,
  onSetRemoteUrl,
  onSetIsSettingRemote,
  onGitInit,
  onGitStage,
  onGitUnstage,
  onGitCommit,
  onGitRemote,
  onGitPush,
  onGitPull,
  onMCPConnect,
  onRefreshWorkspace,
  activeFileContent,
}: LeftPanelProps) {
  const leftPanelOpen = useLeftPanelOpen();
  const leftPanelTab = useLeftPanelTab();

  const getPanelTitle = () => {
    switch (leftPanelTab) {
      case 'explorer': return 'Explorer';
      case 'search': return 'Search';
      case 'git': return 'Source Control';
      case 'mcp': return 'MCP Hub';
      case 'outline': return 'Outline';
      case 'dashboard': return 'Dashboard';
      case 'intel': return 'AI Intel';
      default: return 'Explorer';
    }
  };

  return (
    <AnimatePresence initial={false}>
      {leftPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel rounded-2xl flex flex-col overflow-hidden shrink-0"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text/40">
              {getPanelTitle()}
            </span>
            {leftPanelTab === 'explorer' && (
              <button
                onClick={() => onSetCreatingFile(true)}
                className="p-1 text-text/30 hover:text-text hover:bg-white/[0.06] rounded-md transition-all cursor-pointer"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {leftPanelTab === 'explorer' && (
              <FileExplorer
                files={files}
                activeTabId={activeTabId}
                isCreatingFile={isCreatingFile}
                newFileName={newFileName}
                selectedTemplate={selectedTemplate}
                templates={templates}
                onSetCreatingFile={onSetCreatingFile}
                onSetNewFileName={onSetNewFileName}
                onSetSelectedTemplate={onSetSelectedTemplate}
                onOpenFile={onOpenFile}
                onDeleteFile={onDeleteFile}
                onCreateFile={onCreateFile}
              />
            )}
            {leftPanelTab === 'search' && (
              <SearchPanel
                files={files}
                onOpenFile={onOpenFile}
              />
            )}
            {leftPanelTab === 'git' && (
              <div className="px-3 py-2 flex flex-col h-full">
                <GitPanel
                  gitStatus={gitStatus}
                  isGitLoading={isGitLoading}
                  commitMessage={commitMessage}
                  remoteUrl={remoteUrl}
                  isSettingRemote={isSettingRemote}
                  onSetCommitMessage={onSetCommitMessage}
                  onSetRemoteUrl={onSetRemoteUrl}
                  onSetIsSettingRemote={onSetIsSettingRemote}
                  onGitInit={onGitInit}
                  onGitStage={onGitStage}
                  onGitUnstage={onGitUnstage}
                  onGitCommit={onGitCommit}
                  onGitRemote={onGitRemote}
                  onGitPush={onGitPush}
                  onGitPull={onGitPull}
                />
              </div>
            )}
            {leftPanelTab === 'outline' && (
              <SymbolOutline
                content={activeFileContent}
                onJumpToLine={(line) => {
                  console.log('Jump to line:', line);
                }}
              />
            )}
            {leftPanelTab === 'intel' && (
              <AIIntelPanel
                activeFile={files.find((f) => f.id === activeTabId) || null}
                onRefreshWorkspace={onRefreshWorkspace}
              />
            )}
            {leftPanelTab === 'mcp' && (
              <MCPServersPanel
                onConnect={onMCPConnect}
              />
            )}
            {leftPanelTab === 'dashboard' && (
              <div className="text-[11px] text-text/30 px-4 py-3">Open full dashboard →</div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}