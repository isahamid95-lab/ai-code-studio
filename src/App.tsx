import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, FileCode2, Code2, Loader2,
  PanelRightClose, PanelRightOpen,
  X, Lightbulb, Bug, Sparkles, Globe, Trash2,
  FolderTree, Search, GitBranch, List, Zap, Network, LayoutDashboard,
  CheckCircle
} from 'lucide-react';

import type { Language } from './types';
import { FILE_TEMPLATES } from './constants';
import { useFiles } from './hooks/useFiles';
import { useGit } from './hooks/useGit';
import { useChat } from './hooks/useChat';
import { useAgent } from './hooks/useAgent';
import { themes, applyTheme, getStoredTheme, getDefaultTheme } from './themes';

const Header = React.lazy(() => import('./components/Header'));
import FileExplorer from './components/FileExplorer';
import GitPanel from './components/GitPanel';
import TerminalPanel from './components/TerminalPanel';
import ChatPanel from './components/ChatPanel';
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const PreviewPanel = React.lazy(() => import('./components/PreviewPanel'));
const CommandPalette = React.lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const ShortcutsModal = React.lazy(() => import('./components/ShortcutsModal').then(m => ({ default: m.ShortcutsModal })));
const ThemeSelector = React.lazy(() => import('./components/ThemeSelector'));
const GlobalSearchModal = React.lazy(() => import('./components/GlobalSearchModal'));
import { Breadcrumbs } from './components/Breadcrumbs';
import { SearchPanel } from './components/SearchPanel';
import { SymbolOutline } from './components/SymbolOutline';
import { AIIntelPanel } from './components/AIIntelPanel';
import { MCPServersPanel } from './components/MCPServersPanel';
import DashboardPanel from './components/DashboardPanel';
import { loadUiState, saveUiState } from './utils/persistence';

const getLanguageExtension = (lang: Language) => {
  switch (lang) {
    case 'javascript':
    case 'typescript': return javascript({ jsx: true, typescript: lang === 'typescript' });
    case 'css': return css();
    case 'html': return html();
    default: return javascript();
  }
};

type LeftTab = 'explorer' | 'search' | 'git' | 'outline' | 'intel' | 'mcp' | 'dashboard';

const ACTIVITY_ITEMS: { id: LeftTab; icon: React.ReactNode; label: string }[] = [
  { id: 'explorer', icon: <FolderTree size={18} />, label: 'Explorer' },
  { id: 'search', icon: <Search size={18} />, label: 'Search' },
  { id: 'git', icon: <GitBranch size={18} />, label: 'Git' },
  { id: 'mcp', icon: <Network size={18} />, label: 'MCP Hub' },
  { id: 'outline', icon: <List size={18} />, label: 'Outline' },
  { id: 'intel', icon: <Zap size={18} />, label: 'AI Intel' },
  { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
];

export default function App() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<LeftTab>('explorer');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  // GÜVENLİK: API anahtarı artık server-side'da, frontend'de tutulmuyor
  // API key is now server-side only for security - frontend only selects model
  const [alibabaModel, setAlibabaModel] = useState('qwen3.5-plus');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPort, setPreviewPort] = useState<number | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const hasHydratedLayoutRef = useRef(false);

  const fileHook = useFiles();
  const gitHook = useGit(
    fileHook.fetchFiles,
    fileHook.setTerminalOutput,
    fileHook.setIsTerminalOpen,
  );
  const chatHook = useChat(
    fileHook.activeFile,
    fileHook.files,
    fileHook.setFiles,
    fileHook.setOpenTabs,
    fileHook.setActiveTabId,
    fileHook.saveFileToBackend,
    alibabaModel,
    fileHook.selectedCode,
    setRightPanelOpen,
  );
  const agentHook = useAgent({
    model: alibabaModel,
    files: fileHook.files,
    activeFileId: fileHook.activeTabId,
    setChatMessages: chatHook.setChatMessages,
    setIsGenerating: chatHook.setIsGenerating,
    setIsAgentRunning: fileHook.setIsAgentRunning,
    setTerminalOutput: fileHook.setTerminalOutput,
    setIsTerminalOpen: fileHook.setIsTerminalOpen,
    onRefreshFiles: fileHook.fetchFiles,
    onServerStarted: (port) => {
      setPreviewPort(port);
      setPreviewUrl(`http://localhost:${port}`);
      setIsPreviewOpen(true);
    },
  });

  useEffect(() => {
    gitHook.fetchGitStatus();
  }, []);

  useEffect(() => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      applyTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const snapshot = await loadUiState();
        if (isCancelled || !snapshot) {
          return;
        }

        if (typeof snapshot.leftPanelOpen === 'boolean') {
          setLeftPanelOpen(snapshot.leftPanelOpen);
        }

        if (typeof snapshot.rightPanelOpen === 'boolean') {
          setRightPanelOpen(snapshot.rightPanelOpen);
        }

        if (snapshot.leftPanelTab && ACTIVITY_ITEMS.some((item) => item.id === snapshot.leftPanelTab)) {
          setLeftPanelTab(snapshot.leftPanelTab as LeftTab);
        }
      } catch (error) {
        console.error('Failed to restore layout state', error);
      } finally {
        hasHydratedLayoutRef.current = true;
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedLayoutRef.current) {
      return;
    }

    void saveUiState({
      leftPanelOpen,
      rightPanelOpen,
      leftPanelTab,
    });
  }, [leftPanelOpen, leftPanelTab, rightPanelOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      if (cmdKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }

      if (cmdKey && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        setLeftPanelOpen(prev => !prev);
      }

      if (cmdKey && (e.key === '`' || e.key === 'j')) {
        e.preventDefault();
        fileHook.setIsTerminalOpen(prev => !prev);
      }

      if (cmdKey && e.key === 'B' && e.shiftKey) {
        e.preventDefault();
        setRightPanelOpen(prev => !prev);
      }

      if (e.key === 'F5') {
        e.preventDefault();
        fileHook.runCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileHook]);

  useEffect(() => {
    const savedBg = localStorage.getItem('ide_bg');
    if (savedBg) setBackgroundUrl(savedBg);
  }, []);

  const handleSend = useCallback((text: string) => {
    if (agentHook.agentMode) {
      agentHook.sendAgentMessage(text, 'agent');
    } else if (agentHook.planMode) {
      agentHook.sendAgentMessage(text, 'plan');
    } else {
      chatHook.sendMessage(text);
    }
  }, [agentHook.agentMode, agentHook.planMode, agentHook.sendAgentMessage, chatHook.sendMessage]);

  const handleActivityClick = (tab: LeftTab) => {
    if (leftPanelTab === tab && leftPanelOpen) {
      setLeftPanelOpen(false);
    } else {
      setLeftPanelTab(tab);
      setLeftPanelOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative text-text font-sans selection:bg-primary/30">

      {/* Background layers */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
          opacity: backgroundUrl ? 0.15 : 0
        }}
      />
      <div className="absolute inset-0 bg-background" />
      {backgroundUrl && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}

      {/* Main container */}
      <div className="absolute inset-0 flex flex-col z-10">

        {/* Header */}
        <div className="p-3 pb-0">
          <Suspense fallback={<div className="h-14 glass-panel rounded-2xl animate-pulse" />}>
            <Header
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onOpenTheme={() => setIsThemeSelectorOpen(true)}
              onRunCode={fileHook.runCode}
              hasActiveFile={!!fileHook.activeFile}
            />
          </Suspense>
        </div>

        {/* Workspace */}
        <main className="flex-1 flex overflow-hidden p-3 gap-2">

          {/* Activity Bar */}
          <div className="flex flex-col items-center py-2 gap-1 shrink-0">
            {ACTIVITY_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleActivityClick(item.id)}
                className={`activity-icon ${leftPanelOpen && leftPanelTab === item.id ? 'active' : 'text-text/30 hover:text-text/60'}`}
                title={item.label}
                aria-label={item.label}
              >
                {item.icon}
              </button>
            ))}
          </div>

          {/* Left Panel Content */}
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
                    {leftPanelTab === 'explorer' ? 'Explorer' :
                     leftPanelTab === 'search' ? 'Search' :
                     leftPanelTab === 'git' ? 'Source Control' :
                     leftPanelTab === 'mcp' ? 'MCP Hub' :
                     leftPanelTab === 'outline' ? 'Outline' :
                     leftPanelTab === 'dashboard' ? 'Dashboard' : 'AI Intel'}
                  </span>
                  {leftPanelTab === 'explorer' && (
                    <button
                      onClick={() => fileHook.setIsCreatingFile(true)}
                      className="p-1 text-text/30 hover:text-text hover:bg-white/[0.06] rounded-md transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto py-1">
                  {leftPanelTab === 'explorer' && (
                    <FileExplorer
                      files={fileHook.files}
                      activeTabId={fileHook.activeTabId}
                      isCreatingFile={fileHook.isCreatingFile}
                      newFileName={fileHook.newFileName}
                      selectedTemplate={fileHook.selectedTemplate}
                      templates={FILE_TEMPLATES}
                      onSetCreatingFile={fileHook.setIsCreatingFile}
                      onSetNewFileName={fileHook.setNewFileName}
                      onSetSelectedTemplate={fileHook.setSelectedTemplate}
                      onOpenFile={fileHook.openFile}
                      onDeleteFile={fileHook.handleDeleteFile}
                      onCreateFile={() => fileHook.handleCreateFile(FILE_TEMPLATES)}
                    />
                  )}
                  {leftPanelTab === 'search' && (
                    <SearchPanel
                      files={fileHook.files}
                      onOpenFile={fileHook.openFile}
                    />
                  )}
                  {leftPanelTab === 'git' && (
                    <div className="px-3 py-2 flex flex-col h-full">
                      <GitPanel
                        gitStatus={gitHook.gitStatus}
                        isGitLoading={gitHook.isGitLoading}
                        commitMessage={gitHook.commitMessage}
                        remoteUrl={gitHook.remoteUrl}
                        isSettingRemote={gitHook.isSettingRemote}
                        onSetCommitMessage={gitHook.setCommitMessage}
                        onSetRemoteUrl={gitHook.setRemoteUrl}
                        onSetIsSettingRemote={gitHook.setIsSettingRemote}
                        onGitInit={gitHook.handleGitInit}
                        onGitStage={gitHook.handleGitStage}
                        onGitUnstage={gitHook.handleGitUnstage}
                        onGitCommit={gitHook.handleGitCommit}
                        onGitRemote={gitHook.handleGitRemote}
                        onGitPush={gitHook.handleGitPush}
                        onGitPull={gitHook.handleGitPull}
                      />
                    </div>
                  )}
                  {leftPanelTab === 'outline' && (
                    <SymbolOutline
                      content={fileHook.activeFile?.content || ''}
                      onJumpToLine={(line) => {
                        console.log("Jump to line:", line);
                      }}
                    />
                  )}
                  {leftPanelTab === 'intel' && (
                    <AIIntelPanel
                      activeFile={fileHook.activeFile || null}
                      onRefreshWorkspace={fileHook.fetchFiles}
                    />
                  )}
                  {leftPanelTab === 'mcp' && (
                    <MCPServersPanel
                      onConnect={(name) => {
                        agentHook.sendAgentMessage(`[System Notice]: The user has successfully authenticated and connected the remote MCP: "${name}". You now have authorization and context to act as an expert for ${name} API and provide code using it.`, 'agent');
                        setRightPanelOpen(true);
                      }}
                    />
                  )}
                  {leftPanelTab === 'dashboard' && (
                    <div className="text-[11px] text-text/30 px-4 py-3">Open full dashboard →</div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Center Editor Column / Dashboard */}
          {leftPanelTab === 'dashboard' ? (
            <section className="glass-panel rounded-2xl flex-1 flex flex-col min-w-0 relative overflow-hidden">
              <DashboardPanel />
            </section>
          ) : (
          <section className="glass-panel rounded-2xl flex-1 flex flex-col min-w-0 relative overflow-hidden">

            {/* Editor Tabs */}
            <div className="flex items-center justify-between border-b border-white/[0.06] shrink-0">
              <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0">
                {fileHook.openTabs.map(tabId => {
                  const file = fileHook.files.find(f => f.id === tabId);
                  if (!file) return null;
                  const isActive = fileHook.activeTabId === tabId;
                  const isDirty = (fileHook as any).dirtyFileIds?.has(tabId);

                  return (
                    <div
                      key={tabId}
                      onClick={() => fileHook.setActiveTabId(tabId)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setTabContextMenu({ x: e.clientX, y: e.clientY, id: tabId });
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 text-[12px] border-r border-white/[0.04] cursor-pointer min-w-[120px] max-w-[180px] transition-all group relative ${
                        isActive
                          ? 'bg-white/[0.04] text-text'
                          : 'text-text/35 hover:bg-white/[0.02] hover:text-text/60'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <FileCode2 size={13} className={`shrink-0 ${isActive ? 'text-primary' : 'text-text/25'}`} />
                      <span className="truncate flex-1 font-medium">{file.name}</span>

                      {isDirty && !isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      )}

                      <button
                        onClick={(e) => fileHook.closeTab(e, tabId)}
                        className={`p-0.5 rounded shrink-0 transition-opacity ${
                          isActive
                            ? 'opacity-60 hover:opacity-100 hover:bg-white/10 text-text/50'
                            : 'opacity-0 group-hover:opacity-60 hover:bg-white/10 text-text/30'
                        }`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center px-2 gap-1 shrink-0 border-l border-white/[0.04]">
                <button
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className={`p-2 transition-all rounded-lg cursor-pointer ${isPreviewOpen ? 'text-primary bg-primary/10' : 'text-text/30 hover:text-text/60 hover:bg-white/[0.04]'}`}
                  title="Toggle Preview"
                >
                  <Globe size={15} />
                </button>
                <button
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="p-2 text-text/30 hover:text-text/60 hover:bg-white/[0.04] transition-all rounded-lg cursor-pointer"
                  title="Toggle AI"
                >
                  {rightPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                </button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {fileHook.activeFile && (
                <Breadcrumbs
                  path={fileHook.activeFile.name}
                  onNavigate={undefined}
                />
              )}

              {fileHook.activeFile ? (
                <>
                  {/* AI Quick Actions — contextual, subtle */}
                  <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/[0.04] shrink-0">
                    <span className="text-[9px] text-text/20 font-semibold uppercase tracking-[0.2em] mr-1">AI</span>
                    {chatHook.isGenerating && (
                      <div className="w-1 h-1 rounded-full bg-primary pulse-ring" />
                    )}

                    <button
                      disabled={chatHook.isGenerating}
                      onClick={() => chatHook.handleQuickAction('explain')}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-text/30 hover:text-text/60 hover:bg-white/[0.04] rounded-md transition-all disabled:opacity-20 cursor-pointer"
                    >
                      <Lightbulb size={10} /> Explain
                    </button>
                    <button
                      disabled={chatHook.isGenerating}
                      onClick={() => chatHook.handleQuickAction('bugs')}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-text/30 hover:text-red-400/60 hover:bg-red-500/[0.04] rounded-md transition-all disabled:opacity-20 cursor-pointer"
                    >
                      <Bug size={10} /> Bugs
                    </button>
                    <button
                      disabled={chatHook.isGenerating}
                      onClick={() => chatHook.handleQuickAction('refactor')}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-text/30 hover:text-emerald-400/60 hover:bg-emerald-500/[0.04] rounded-md transition-all disabled:opacity-20 cursor-pointer"
                    >
                      <Sparkles size={10} /> Refactor
                    </button>
                  </div>

                  {/* CodeMirror */}
                  <div className="flex-1 overflow-auto text-[14px]">
                    <CodeMirror
                      value={fileHook.activeFile.content}
                      height="100%"
                      theme={oneDark}
                      extensions={[getLanguageExtension(fileHook.activeFile.language)]}
                      onChange={fileHook.handleFileChange}
                      onStatistics={(data) => {
                        fileHook.setSelectedCode(data.selectionCode || '');
                      }}
                      className="h-full"
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        highlightSpecialChars: true,
                        history: true,
                        foldGutter: true,
                        drawSelection: true,
                        dropCursor: true,
                        allowMultipleSelections: true,
                        indentOnInput: true,
                        syntaxHighlighting: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: true,
                        rectangularSelection: true,
                        crosshairCursor: true,
                        highlightActiveLine: true,
                        highlightSelectionMatches: true,
                        closeBracketsKeymap: true,
                        defaultKeymap: true,
                        searchKeymap: true,
                        historyKeymap: true,
                        foldKeymap: true,
                        completionKeymap: true,
                        lintKeymap: true,
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-white/[0.02] to-transparent">
                  {fileHook.files.length === 0 ? (
                    <div className="flex flex-col items-center text-center max-w-2xl px-8">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 mb-8 shadow-2xl shadow-primary/10"
                      >
                        <Code2 size={56} className="text-primary" />
                      </motion.div>
                      <motion.h2 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold text-text mb-3"
                      >
                        Welcome to AI Code Studio Pro
                      </motion.h2>
                      <motion.p 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-text/50 mb-10 max-w-lg"
                      >
                        Your browser-based IDE with AI-powered coding assistance. 
                        Start by creating a new project or opening existing files.
                      </motion.p>
                      
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="w-full"
                      >
                        <p className="text-xs font-semibold text-text/40 uppercase tracking-wider mb-5">Quick Start Templates</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => agentHook.sendAgentMessage('Create a new React + TypeScript + Tailwind project', 'agent')}
                            className="glass-panel px-6 py-5 rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all flex flex-col items-center gap-3 cursor-pointer group border border-white/[0.08] shadow-lg hover:shadow-primary/20"
                          >
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all">
                              <svg className="w-6 h-6 text-blue-400 group-hover:text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                              </svg>
                            </div>
                            <div>
                              <span className="text-base font-bold text-text group-hover:text-primary transition-colors">React</span>
                              <p className="text-xs text-text/40 mt-1">Vite + Tailwind</p>
                            </div>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => agentHook.sendAgentMessage('Create a new Next.js + TypeScript + Tailwind project', 'agent')}
                            className="glass-panel px-6 py-5 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all flex flex-col items-center gap-3 cursor-pointer group border border-white/[0.08] shadow-lg"
                          >
                            <div className="p-3 rounded-xl bg-gradient-to-br from-gray-400/20 to-gray-500/10 group-hover:from-gray-400/30 group-hover:to-gray-500/20 transition-all">
                              <svg className="w-6 h-6 text-gray-300 group-hover:text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 21.75c-5.385 0-9.75-4.365-9.75-9.75S6.615 2.25 12 2.25 21.75 6.615 21.75 12 17.385 21.75 12 21.75zm.563-7.534v-4.5l3.933 2.359a.75.75 0 01.375.646v3.75a.75.75 0 01-1.125.649l-3.933-2.359a.75.75 0 01-.375-.646v-3.75a.75.75 0 011.125-.649l3.933 2.359z"/>
                              </svg>
                            </div>
                            <div>
                              <span className="text-base font-bold text-text group-hover:text-text/90 transition-colors">Next.js</span>
                              <p className="text-xs text-text/40 mt-1">App Router</p>
                            </div>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => agentHook.sendAgentMessage('Create a new Node.js starter project', 'agent')}
                            className="glass-panel px-6 py-5 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col items-center gap-3 cursor-pointer group border border-white/[0.08] shadow-lg hover:shadow-emerald-500/20"
                          >
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 group-hover:from-emerald-500/30 group-hover:to-emerald-600/20 transition-all">
                              <svg className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1.952 7.035c0-.58.385-.965.965-.965h2.893c.58 0 .965.385.965.965v6.9c0 1.93 1.352 2.895 2.895 2.895h1.93c1.543 0 2.895-.965 2.895-2.895V2.895C14.495 1.352 13.143 0 11.6 0H1.93C.385 0 0 1.352 0 2.895v11.6c0 1.543 1.352 2.895 2.895 2.895h7.733c.58 0 .965-.385.965-.965v-1.93c0-.58-.385-.965-.965-.965H2.895c-.58 0-.965-.385-.965-.965V7.035zm13.53 7.73c0 .58.385.965.965.965h2.895c.58 0 .965-.385.965-.965v-2.895c0-.58-.385-.965-.965-.965h-2.895c-.58 0-.965.385-.965.965v2.895zm-2.895-4.825c0-.58.385-.965.965-.965h4.825c.58 0 .965.385.965.965v4.825c0 .58-.385.965-.965.965h-4.825c-.58 0-.965-.385-.965-.965V9.94z"/>
                              </svg>
                            </div>
                            <div>
                              <span className="text-base font-bold text-text group-hover:text-emerald-400 transition-colors">Node.js</span>
                              <p className="text-xs text-text/40 mt-1">Server app</p>
                            </div>
                          </motion.button>
                        </div>
                        
                        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-text/30">
                          <span className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-emerald-400" />
                            AI-powered coding
                          </span>
                          <span className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-emerald-400" />
                            Real-time preview
                          </span>
                          <span className="flex items-center gap-2">
                            <CheckCircle size={12} className="text-emerald-400" />
                            Git integration
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Preview - Hidden */}
            {isShortcutsOpen && (
              <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
            )}

            {/* Terminal */}
            <AnimatePresence>
              {fileHook.isTerminalOpen && (
                <TerminalPanel
                  onClose={() => fileHook.setIsTerminalOpen(false)}
                  logs={fileHook.terminalOutput}
                  isAgentRunning={fileHook.isAgentRunning}
                />
              )}
            </AnimatePresence>
          </section>
          )}

          {/* Right Panel (AI Chat) */}
          <AnimatePresence initial={false}>
            {rightPanelOpen && (
              <ChatPanel
                chatMessages={chatHook.chatMessages}
                chatInput={chatHook.chatInput}
                isGenerating={chatHook.isGenerating}
                agentMode={agentHook.agentMode}
                planMode={agentHook.planMode}
                agentStatus={agentHook.agentStatus}
                activeFile={fileHook.activeFile}
                selectedCode={fileHook.selectedCode}
                alibabaModel={alibabaModel}
                isTerminalOpen={fileHook.isTerminalOpen}
                chatEndRef={chatHook.chatEndRef}
                onSetChatInput={chatHook.setChatInput}
                onSetAgentMode={agentHook.setAgentMode}
                onSetPlanMode={agentHook.setPlanMode}
                onSetIsTerminalOpen={fileHook.setIsTerminalOpen}
                onSendMessage={handleSend}
                onSendAgentMessage={agentHook.sendAgentMessage}
                onQuickAction={chatHook.handleQuickAction}
                onClearChat={() => chatHook.setChatMessages([])}
                files={fileHook.files}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Tab Context Menu */}
      <AnimatePresence>
        {tabContextMenu && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setTabContextMenu(null)}
              onContextMenu={(e) => { e.preventDefault(); setTabContextMenu(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[70] bg-secondary/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl py-1 min-w-[160px]"
              style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
            >
              <button
                onClick={() => {
                  fileHook.closeOtherTabs(tabContextMenu.id);
                  setTabContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-text/60 hover:bg-white/[0.06] hover:text-text transition-colors text-left cursor-pointer"
              >
                <X size={12} className="text-text/30" />
                Close Others
              </button>
              <button
                onClick={() => {
                  fileHook.closeAllTabs();
                  setTabContextMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-red-400/80 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
              >
                <Trash2 size={12} />
                Close All
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {isSettingsOpen && (
            <SettingsModal
              alibabaApiKey={alibabaApiKey}
              alibabaModel={alibabaModel}
              onSetAlibabaApiKey={setAlibabaApiKey}
              onSetAlibabaModel={setAlibabaModel}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
          {isCommandPaletteOpen && (
            <CommandPalette
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              files={fileHook.files}
              onOpenFile={fileHook.openFile}
              onRunCode={fileHook.runCode}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onClearChat={() => {
                if (confirm('Clear chat history?')) {
                  chatHook.setChatMessages([]);
                }
              }}
            />
          )}
          {isThemeSelectorOpen && (
            <ThemeSelector
              isOpen={isThemeSelectorOpen}
              onClose={() => setIsThemeSelectorOpen(false)}
            />
          )}
          {isGlobalSearchOpen && (
            <GlobalSearchModal
              isOpen={isGlobalSearchOpen}
              onClose={() => setIsGlobalSearchOpen(false)}
              files={fileHook.files}
              onOpenFile={fileHook.openFile}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
