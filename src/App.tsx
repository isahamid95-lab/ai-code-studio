import { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, FileCode2, Code2,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  X, Lightbulb, Bug, Sparkles, Globe
} from 'lucide-react';

import type { Language, AiProvider } from './types';
import { FILE_TEMPLATES } from './constants';
import { useFiles } from './hooks/useFiles';
import { useGit } from './hooks/useGit';
import { useChat } from './hooks/useChat';
import { useAgent } from './hooks/useAgent';

import Header from './components/Header';
import FileExplorer from './components/FileExplorer';
import GitPanel from './components/GitPanel';
import TerminalPanel from './components/TerminalPanel';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import PreviewPanel from './components/PreviewPanel';

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
  const [leftPanelTab, setLeftPanelTab] = useState<'explorer' | 'git'>('explorer');

  // --- Settings State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<AiProvider>('alibaba');
  const [alibabaApiKey, setAlibabaApiKey] = useState(import.meta.env.VITE_ALIBABA_API_KEY || '');
  const [alibabaModel, setAlibabaModel] = useState('qwen3-coder-plus');

  // --- Preview State ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- Theme Generation State ---
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

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
    fileHook.fetchFiles, // Re-fetch files from server after agent completes
  );

  // Fetch git status on mount
  useEffect(() => {
    gitHook.fetchGitStatus();
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+` or Ctrl+J — Toggle terminal
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === 'j')) {
        e.preventDefault();
        fileHook.setIsTerminalOpen(prev => !prev);
      }
      // Ctrl+B — Toggle left panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        setLeftPanelOpen(prev => !prev);
      }
      // Ctrl+Shift+B — Toggle right panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'B' && e.shiftKey) {
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
  }, [fileHook.runCode]);

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
    <div className="h-screen w-screen overflow-hidden relative text-white font-sans selection:bg-cyan-500/30">
      
      {/* --- Dynamic AI Background --- */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ 
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
          opacity: backgroundUrl ? 1 : 0 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#050505] to-[#111] -z-10" />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[4px]" />

      {/* --- Main App Container --- */}
      <div className="absolute inset-0 p-4 flex flex-col gap-4 z-10">
        
        {/* Top Navigation */}
        <Header
          isGeneratingTheme={isGeneratingTheme}
          onGenerateBackground={generateBackground}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRunCode={fileHook.runCode}
        />

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
                      className={`text-xs font-semibold uppercase tracking-widest transition-colors ${leftPanelTab === 'explorer' ? 'text-cyan-400' : 'text-white/50 hover:text-white/80'}`}
                    >
                      Explorer
                    </button>
                    <button 
                      onClick={() => setLeftPanelTab('git')}
                      className={`text-xs font-semibold uppercase tracking-widest transition-colors ${leftPanelTab === 'git' ? 'text-cyan-400' : 'text-white/50 hover:text-white/80'}`}
                    >
                      Git
                    </button>
                  </div>
                  {leftPanelTab === 'explorer' && (
                    <button 
                      onClick={() => fileHook.setIsCreatingFile(true)}
                      className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto py-2">
                  {leftPanelTab === 'explorer' ? (
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
                  ) : (
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
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* --- Center Column (Editor + Terminal) --- */}
          <section className="glass-panel rounded-2xl flex-1 flex flex-col min-w-0 relative overflow-hidden">
            
            {/* Editor Header / Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 shrink-0 bg-black/20">
              <div className="flex items-center overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  className="p-2 mx-2 text-white/50 hover:text-white transition-colors shrink-0"
                  title="Toggle Explorer (Ctrl+B)"
                >
                  {leftPanelOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>
                
                {fileHook.openTabs.map(tabId => {
                  const file = fileHook.files.find(f => f.id === tabId);
                  if (!file) return null;
                  const isActive = fileHook.activeTabId === tabId;
                  return (
                    <div 
                      key={tabId}
                      onClick={() => fileHook.setActiveTabId(tabId)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm border-r border-white/10 cursor-pointer min-w-[140px] max-w-[200px] transition-all ${
                        isActive ? 'bg-white/5 text-cyan-400 border-b-2 border-b-cyan-400' : 'text-white/50 hover:bg-white/5 border-b-2 border-b-transparent'
                      }`}
                    >
                      <FileCode2 size={14} className="shrink-0" />
                      <span className="truncate flex-1">{file.name}</span>
                      <button 
                        onClick={(e) => fileHook.closeTab(e, tabId)}
                        className={`p-1 rounded-md shrink-0 ${isActive ? 'hover:bg-cyan-500/20 text-cyan-400/70 hover:text-cyan-400' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center pr-3 gap-1 shrink-0">
                <button 
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className={`p-2 transition-colors rounded-md ${isPreviewOpen ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/50 hover:text-white'}`}
                  title="Toggle Live Preview"
                >
                  <Globe size={18} />
                </button>
                <button 
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                  title="Toggle AI Assistant (Ctrl+Shift+B)"
                >
                  {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {fileHook.activeFile ? (
                <>
                  {/* AI Quick Actions Bar */}
                  <div className="flex items-center gap-3 px-5 py-2 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar bg-black/10">
                    <span className="text-xs text-white/40 font-medium mr-1 uppercase tracking-wider">AI Actions</span>
                    <button onClick={() => chatHook.handleQuickAction('explain')} className="glass-button flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-300 rounded-full whitespace-nowrap">
                      <Lightbulb size={12} /> {fileHook.selectedCode ? 'Explain Selection' : 'Explain Code'}
                    </button>
                    <button onClick={() => chatHook.handleQuickAction('bugs')} className="glass-button flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-300 rounded-full whitespace-nowrap">
                      <Bug size={12} /> {fileHook.selectedCode ? 'Find Bugs in Selection' : 'Find Bugs'}
                    </button>
                    <button onClick={() => chatHook.handleQuickAction('refactor')} className="glass-button flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-300 rounded-full whitespace-nowrap">
                      <Sparkles size={12} /> {fileHook.selectedCode ? 'Refactor Selection' : 'Refactor'}
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
                  <Code2 size={64} className="mb-6 opacity-20" />
                  <p className="text-lg font-light">Select a file to start coding</p>
                  <button 
                    onClick={() => fileHook.setIsCreatingFile(true)}
                    className="mt-6 glass-button px-6 py-2.5 text-white rounded-full transition-colors text-sm"
                  >
                    Create New File
                  </button>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <AnimatePresence>
              {isPreviewOpen && (
                <PreviewPanel
                  onClose={() => setIsPreviewOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* Terminal Panel */}
            <AnimatePresence>
              {fileHook.isTerminalOpen && (
                <TerminalPanel
                  terminalOutput={fileHook.terminalOutput}
                  onClear={() => fileHook.setTerminalOutput([])}
                  onClose={() => fileHook.setIsTerminalOpen(false)}
                  onAddOutput={(entry) => fileHook.setTerminalOutput(prev => [...prev, entry])}
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
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* --- Settings Modal --- */}
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
      </AnimatePresence>
    </div>
  );
}
