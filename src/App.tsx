import React, { useState, useEffect, useCallback, Suspense } from 'react';
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
  FolderTree, Search, GitBranch, List, Zap, Network
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

const getLanguageExtension = (lang: Language) => {
  switch (lang) {
    case 'javascript':
    case 'typescript': return javascript({ jsx: true, typescript: lang === 'typescript' });
    case 'css': return css();
    case 'html': return html();
    default: return javascript();
  }
};

type LeftTab = 'explorer' | 'search' | 'git' | 'outline' | 'intel' | 'mcp';

const ACTIVITY_ITEMS: { id: LeftTab; icon: React.ReactNode; label: string }[] = [
  { id: 'explorer', icon: <FolderTree size={18} />, label: 'Explorer' },
  { id: 'search', icon: <Search size={18} />, label: 'Search' },
  { id: 'git', icon: <GitBranch size={18} />, label: 'Git' },
  { id: 'mcp', icon: <Network size={18} />, label: 'MCP Hub' },
  { id: 'outline', icon: <List size={18} />, label: 'Outline' },
  { id: 'intel', icon: <Zap size={18} />, label: 'AI Intel' },
];

export default function App() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<LeftTab>('explorer');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [alibabaApiKey, setAlibabaApiKey] = useState(import.meta.env.VITE_ALIBABA_API_KEY || '');
  const [alibabaModel, setAlibabaModel] = useState('qwen3-coder-plus');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleSelectTemplate = async (cmd: string) => {
    setIsScaffolding(true);
    try {
      const { getWebContainer } = await import('./lib/webcontainer');
      const wc = await getWebContainer();
      const process = await wc.spawn('jsh', ['-c', cmd]);
      await process.exit;
    } catch (e) {
      console.error('Template scaffold failed', e);
    } finally {
      setIsScaffolding(false);
    }
  };

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
    alibabaApiKey,
    alibabaModel,
    fileHook.selectedCode,
    setRightPanelOpen,
  );
  const agentHook = useAgent(
    alibabaModel,
    fileHook.applyFileFromAgent,
    chatHook.setChatMessages,
    chatHook.setIsGenerating,
    fileHook.files,
    fileHook.fetchFiles,
  );

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
                     leftPanelTab === 'outline' ? 'Outline' : 'AI Intel'}
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
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Center Editor Column */}
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
                <div className="flex-1 flex flex-col items-center justify-center">
                  {fileHook.files.length === 0 ? (
                    isScaffolding ? (
                      <div className="flex flex-col items-center">
                        <Loader2 size={40} className="mb-5 animate-spin text-primary" />
                        <p className="text-sm text-text/50 font-medium text-center">
                          Setting up environment...
                        </p>
                        <p className="text-xs text-text/25 mt-1">Installing packages</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-6">
                          <Code2 size={40} className="text-primary/40" />
                        </div>
                        <p className="text-sm font-medium text-text/50 mb-1">Start building</p>
                        <p className="text-xs text-text/25 mb-8">Choose a framework or start from scratch</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSelectTemplate('npx -y create-vite@latest temp-app --template react-ts && cp -r temp-app/. ./ && rm -rf temp-app && npm install')}
                            className="glass-panel px-5 py-3.5 rounded-xl hover:bg-white/[0.06] transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
                          >
                            <span className="text-sm text-primary font-semibold group-hover:text-primary/80">React</span>
                            <span className="text-[10px] text-text/25">Vite + HMR</span>
                          </button>
                          <button
                            onClick={() => handleSelectTemplate('npx -y create-next-app@latest temp-app --ts --tailwind --eslint --app --use-npm --src-dir && cp -r temp-app/. ./ && rm -rf temp-app')}
                            className="glass-panel px-5 py-3.5 rounded-xl hover:bg-white/[0.06] transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
                          >
                            <span className="text-sm text-text/70 font-semibold group-hover:text-text/90">Next.js</span>
                            <span className="text-[10px] text-text/25">Full-stack</span>
                          </button>
                          <button
                            onClick={() => handleSelectTemplate('npm init -y && echo "console.log(\'Hello World\');" > index.js && echo "node_modules\\n.git" > .gitignore')}
                            className="glass-panel px-5 py-3.5 rounded-xl hover:bg-white/[0.06] transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
                          >
                            <span className="text-sm text-emerald-400 font-semibold group-hover:text-emerald-400/80">Node.js</span>
                            <span className="text-[10px] text-text/25">Blank</span>
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-5">
                        <Code2 size={36} className="text-text/15" />
                      </div>
                      <p className="text-sm text-text/35 font-medium">Select a file to edit</p>
                      <button
                        onClick={() => fileHook.setIsCreatingFile(true)}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-xl transition-all border border-primary/15 cursor-pointer"
                      >
                        <Plus size={13} />
                        New File
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview */}
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
              <AnimatePresence>
                {isPreviewOpen && (
                  <PreviewPanel
                    onClose={() => setIsPreviewOpen(false)}
                  />
                )}
              </AnimatePresence>
              {isShortcutsOpen && (
                <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
              )}
            </Suspense>

            {/* Terminal */}
            <AnimatePresence>
              {fileHook.isTerminalOpen && (
                <TerminalPanel
                  onClose={() => fileHook.setIsTerminalOpen(false)}
                />
              )}
            </AnimatePresence>
          </section>

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
