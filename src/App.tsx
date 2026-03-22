import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { GoogleGenAI } from '@google/genai';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, FileCode2, Code2, Loader2,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  X, Lightbulb, Bug, Sparkles, Globe, Trash2, Search, Settings as SettingsIcon, Github
} from 'lucide-react';

import type { Language, AiProvider } from './types';
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
import { Zap } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Language Extension Helper ---
const getLanguageExtension = (lang: Language) => {
  switch (lang) {
    case 'javascript':
    case 'typescript': return javascript({ jsx: true, typescript: lang === 'typescript' });
    case 'css': return css();
    case 'html': return html();
    default: return javascript();
  }
};

export default function App() {
  // --- Panel State ---
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<'explorer' | 'search' | 'git' | 'outline' | 'intel'>('explorer');

  // --- Settings State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<AiProvider>('alibaba');
  const [alibabaApiKey, setAlibabaApiKey] = useState(import.meta.env.VITE_ALIBABA_API_KEY || '');
  const [alibabaModel, setAlibabaModel] = useState('qwen3-coder-plus');

  // --- Preview State ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- Theme Generation State ---
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
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

  // --- Custom Hooks ---
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
    aiProvider,
    alibabaApiKey,
    alibabaModel,
    fileHook.selectedCode,
    setRightPanelOpen,
  );
  // Agent now shares chat state — setChatMessages and setIsGenerating come from chatHook
  const agentHook = useAgent(
    alibabaModel,
    fileHook.applyFileFromAgent,
    chatHook.setChatMessages,
    chatHook.setIsGenerating,
    fileHook.files,
    fileHook.fetchFiles,
  );

  // Fetch git status on mount
  useEffect(() => {
    gitHook.fetchGitStatus();
  }, []);

  // Apply stored theme on mount
  useEffect(() => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      applyTheme(storedTheme)
    }
  }, [])

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K: Command Palette
      if (cmdKey && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      
      // Cmd+Shift+F / Ctrl+Shift+F — Global Search
      if (cmdKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
      
      // Cmd+B / Ctrl+B — Toggle left panel
      if (cmdKey && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        setLeftPanelOpen(prev => !prev);
      }

      // Cmd+J / Ctrl+J — Toggle terminal
      if (cmdKey && (e.key === '`' || e.key === 'j')) {
        e.preventDefault();
        fileHook.setIsTerminalOpen(prev => !prev);
      }

      // Cmd+Shift+B — Toggle right panel
      if (cmdKey && e.key === 'B' && e.shiftKey) {
        e.preventDefault();
        setRightPanelOpen(prev => !prev);
      }

      // F5 — Run code
      if (e.key === 'F5') {
        e.preventDefault();
        fileHook.runCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileHook]);

  // --- Theme Generation ---
  const generateBackground = useCallback(async () => {
    setIsGeneratingTheme(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A breathtaking, dark, futuristic abstract background for a premium coding environment. Deep obsidian blacks, subtle glowing neon cyan and amethyst neural network lines, cinematic lighting, sleek, modern, glassmorphism aesthetic, no text, highly detailed.',
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });
      
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        setBackgroundUrl(imageUrl);
        localStorage.setItem('ide_bg', imageUrl);
      }
    } catch (e) {
      console.error("Failed to generate background", e);
    } finally {
      setIsGeneratingTheme(false);
    }
  }, []);

  useEffect(() => {
    const savedBg = localStorage.getItem('ide_bg');
    if (savedBg) {
      setBackgroundUrl(savedBg);
    } else {
      generateBackground();
    }
  }, []);

  // Handle send — routes to agent or chat based on mode
  const handleSend = useCallback((text: string) => {
    if (agentHook.agentMode) {
      agentHook.sendAgentMessage(text, 'agent');
    } else if (agentHook.planMode) {
      agentHook.sendAgentMessage(text, 'plan');
    } else {
      chatHook.sendMessage(text);
    }
  }, [agentHook.agentMode, agentHook.planMode, agentHook.sendAgentMessage, chatHook.sendMessage]);

  return (
    <div className="h-screen w-screen overflow-hidden relative text-text font-sans selection:bg-primary/30">
      
      {/* --- Dynamic AI Background --- */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ 
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
          opacity: backgroundUrl ? 0.3 : 0 
        }}
      />
      <div className="absolute inset-0 bg-background -z-10" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* --- Main App Container --- */}
      <div className="absolute inset-0 p-4 flex flex-col gap-4 z-10">
        
        {/* Top Navigation */}
        <Suspense fallback={<div className="h-14 glass-panel rounded-2xl animate-pulse" />}>
          <Header
            isGeneratingTheme={isGeneratingTheme}
            onGenerateBackground={generateBackground}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onRunCode={fileHook.runCode}
          />
        </Suspense>

        {/* --- Main Workspace --- */}
        <main className="flex-1 flex gap-4 overflow-hidden">
          
          {/* --- Left Sidebar --- */}
          <AnimatePresence initial={false}>
            {leftPanelOpen && (
              <motion.aside 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="glass-panel rounded-2xl flex flex-col overflow-hidden shrink-0"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setLeftPanelTab('explorer')}
                      className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${leftPanelTab === 'explorer' ? 'text-primary' : 'text-text/30 hover:text-text/60'}`}
                    >
                      Explorer
                    </button>
                    <button 
                      onClick={() => setLeftPanelTab('search')}
                      className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${leftPanelTab === 'search' ? 'text-primary' : 'text-text/30 hover:text-text/60'}`}
                    >
                      Search
                    </button>
                    <button 
                      onClick={() => setLeftPanelTab('git')}
                      className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${leftPanelTab === 'git' ? 'text-primary' : 'text-text/30 hover:text-text/60'}`}
                    >
                      Git
                    </button>
                    <button 
                      onClick={() => setLeftPanelTab('outline')}
                      className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${leftPanelTab === 'outline' ? 'text-primary' : 'text-text/30 hover:text-text/60'}`}
                    >
                      Outline
                    </button>
                    <button 
                      onClick={() => setLeftPanelTab('intel')}
                      className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${leftPanelTab === 'intel' ? 'text-primary' : 'text-text/30 hover:text-text/60'}`}
                      title="AI Intelligence"
                    >
                      <Zap size={14} className={leftPanelTab === 'intel' ? 'animate-pulse' : ''} />
                    </button>
                  </div>
                  {leftPanelTab === 'explorer' && (
                    <button 
                      onClick={() => fileHook.setIsCreatingFile(true)}
                      className="p-1.5 text-text/40 hover:text-text hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto py-2">
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
                    <div className="px-4 py-2 flex flex-col h-full">
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
                        // Future: Scroll editor to line
                      }}
                    />
                  )}
                  {leftPanelTab === 'intel' && (
                    <AIIntelPanel 
                      activeFile={fileHook.activeFile || null} 
                      onRefreshWorkspace={fileHook.fetchFiles}
                    />
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* --- Center Column (Editor + Terminal) --- */}
          <section className="glass-panel rounded-2xl flex-1 flex flex-col min-w-0 relative overflow-hidden">
            
            {/* Editor Header / Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 shrink-0 bg-background/40">
              <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0">
                <button 
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  className="p-3 text-text/50 hover:text-text transition-colors shrink-0 border-r border-white/10 h-full cursor-pointer"
                  title="Toggle Explorer (Ctrl+B)"
                >
                  {leftPanelOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>
                
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
                      className={`flex items-center gap-2 px-5 py-3 text-sm border-r border-white/10 cursor-pointer min-w-[140px] max-w-[220px] transition-all group relative ${
                        isActive ? 'bg-primary/5 text-primary border-b-2 border-b-primary shadow-[inset_0_-8px_20px_rgba(59,130,246,0.05)]' : 'text-text/50 hover:bg-white/5 border-b-2 border-b-transparent hover:text-text/80'
                      }`}
                    >
                      <FileCode2 size={14} className={`shrink-0 ${isActive ? 'text-primary' : 'text-text/30'}`} />
                      <span className="truncate flex-1 font-medium">{file.name}</span>
                      
                      {isDirty && !isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                      )}
                      
                      <button 
                        onClick={(e) => fileHook.closeTab(e, tabId)}
                        className={`p-1 rounded-md shrink-0 transition-opacity ${
                          isActive 
                            ? 'opacity-100 hover:bg-primary/20 text-primary/70 hover:text-primary' 
                            : 'opacity-0 group-hover:opacity-100 hover:bg-white/10 text-text/40 hover:text-text'
                        }`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center pr-3 gap-1 shrink-0 border-l border-white/10 h-full bg-background/40">
                <button 
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className={`p-2 transition-colors rounded-md cursor-pointer ${isPreviewOpen ? 'text-primary bg-primary/10' : 'text-text/50 hover:text-text'}`}
                  title="Toggle Live Preview"
                >
                  <Globe size={18} />
                </button>
                <button 
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="p-2 text-text/50 hover:text-text transition-colors cursor-pointer"
                  title="Toggle AI Assistant (Ctrl+Shift+B)"
                >
                  {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col bg-background/20">
              {fileHook.activeFile && (
                <Breadcrumbs 
                  path={fileHook.activeFile.name} 
                  onNavigate={undefined} // Future: Allow folder navigation
                />
              )}
              
              {fileHook.activeFile ? (
                <>
                  {/* AI Quick Actions Bar */}
                  <div className="flex items-center gap-3 px-5 py-2 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar bg-background/20">
                    <div className="flex items-center gap-2 mr-2">
                       <span className="text-[10px] text-text/40 font-bold uppercase tracking-[0.2em]">AI Intelligence</span>
                       {chatHook.isGenerating && (
                         <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                         />
                       )}
                    </div>
                    
                    <button 
                      disabled={chatHook.isGenerating}
                      onClick={() => chatHook.handleQuickAction('explain')} 
                      className="glass-button flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary/80 rounded-full whitespace-nowrap disabled:opacity-30"
                    >
                      <Lightbulb size={12} /> {fileHook.selectedCode ? 'Explain Selection' : 'Explain Code'}
                    </button>
                    <button 
                      disabled={chatHook.isGenerating}
                      onClick={() => chatHook.handleQuickAction('bugs')} 
                      className="glass-button flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400/80 rounded-full whitespace-nowrap disabled:opacity-30"
                    >
                      <Bug size={12} /> {fileHook.selectedCode ? 'Find Bugs' : 'Find Bugs'}
                    </button>
                    <button 
                      disabled={chatHook.isGenerating}
                      onClick={() => chatHook.handleQuickAction('refactor')} 
                      className="glass-button flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400/80 rounded-full whitespace-nowrap disabled:opacity-30"
                    >
                      <Sparkles size={12} /> {fileHook.selectedCode ? 'Refactor' : 'Refactor'}
                    </button>
                  </div>

                  {/* CodeMirror Editor */}
                  <div className="flex-1 overflow-auto text-[15px]">
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
                <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                  {fileHook.files.length === 0 ? (
                    isScaffolding ? (
                      <div className="flex flex-col items-center">
                        <Loader2 size={48} className="mb-6 animate-spin text-cyan-400" />
                        <p className="text-lg text-white font-light text-center">
                          Scaffolding Environment...<br/>
                          <span className="text-xs text-white/50">Downloading packages and setting up build tools.</span>
                        </p>
                      </div>
                    ) : (
                      <>
                        <Code2 size={64} className="mb-6 text-cyan-500 opacity-80" />
                        <p className="text-xl font-light text-white mb-8">Start an empty project or choose a framework</p>
                        <div className="flex gap-4">
                          <button onClick={() => handleSelectTemplate('npx -y create-vite@latest ./ --template react && npm install')} className="glass-panel px-6 py-4 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2">
                            <span className="text-lg text-cyan-400 font-semibold">React (Vite)</span>
                            <span className="text-xs text-white/50">Lightning fast HMR</span>
                          </button>
                          <button onClick={() => handleSelectTemplate('npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --use-npm --src-dir')} className="glass-panel px-6 py-4 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2">
                            <span className="text-lg text-white font-semibold">Next.js</span>
                            <span className="text-xs text-white/50">Full-stack framework</span>
                          </button>
                          <button onClick={() => handleSelectTemplate('npm init -y && echo "console.log(\'Hello World\');" > index.js && echo "node_modules\\n.git" > .gitignore')} className="glass-panel px-6 py-4 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2">
                            <span className="text-lg text-emerald-400 font-semibold">Vanilla Node</span>
                            <span className="text-xs text-white/50">Blank Node environment</span>
                          </button>
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <Code2 size={64} className="mb-6 opacity-20" />
                      <p className="text-lg font-light">Select a file to start coding</p>
                      <button 
                        onClick={() => fileHook.setIsCreatingFile(true)}
                        className="mt-6 glass-button px-6 py-2.5 text-white rounded-full transition-colors text-sm"
                      >
                        Create New File
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center backdrop-blur-xl"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
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

            {/* Terminal Panel */}
            <AnimatePresence>
              {fileHook.isTerminalOpen && (
                <TerminalPanel
                  onClose={() => fileHook.setIsTerminalOpen(false)}
                />
              )}
            </AnimatePresence>
          </section>

          {/* --- Right Sidebar (AI Assistant) --- */}
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
                aiProvider={aiProvider}
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
              className="fixed z-[70] bg-secondary/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[180px] overflow-hidden"
              style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
            >
              <button
                onClick={() => {
                  fileHook.closeOtherTabs(tabContextMenu.id);
                  setTabContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text/80 hover:bg-primary/20 hover:text-text transition-colors text-left cursor-pointer"
              >
                <X size={14} className="text-text/40" />
                <span>Close Others</span>
              </button>
              <button
                onClick={() => {
                  fileHook.closeAllTabs();
                  setTabContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/15 transition-colors text-left cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Close All Tabs</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AnimatePresence>
          {isSettingsOpen && (
            <SettingsModal
              aiProvider={aiProvider}
              alibabaApiKey={alibabaApiKey}
              alibabaModel={alibabaModel}
              onSetAiProvider={setAiProvider}
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
