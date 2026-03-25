import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { FileItem, ChatMessage, GitStatus, LogEntry } from '../types';
import {
  // Stores
  $files,
  $openTabs,
  $activeTabId,
  $chatMessages,
  $isGenerating,
  $agentMode,
  $planMode,
  $leftPanelOpen,
  $rightPanelOpen,
  $leftPanelTab,
  // Actions
  setFiles,
  setOpenTabs,
  setActiveTabId,
  setChatMessages,
  setIsGenerating,
  setAgentMode,
  setPlanMode,
  setLeftPanelOpen,
  setRightPanelOpen,
  setLeftPanelTab,
  addTerminalOutput,
  setIsTerminalOpen,
  setIsAgentRunning,
  setIsCreatingFile,
  setNewFileName,
  setSelectedTemplate,
  setSelectedCode,
} from '../stores';

// Context types
interface AppContextType {
  // Files
  files: FileItem[];
  setFilesState: (files: FileItem[]) => void;
  openTabs: string[];
  setOpenTabsState: (tabs: string[]) => void;
  activeTabId: string;
  setActiveTabIdState: (id: string) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  setChatMessagesState: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  isGenerating: boolean;
  setIsGeneratingState: (value: boolean) => void;
  
  // Agent
  agentMode: boolean;
  setAgentModeState: (value: boolean) => void;
  planMode: boolean;
  setPlanModeState: (value: boolean) => void;
  
  // UI
  leftPanelOpen: boolean;
  setLeftPanelOpenState: (value: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpenState: (value: boolean) => void;
  leftPanelTab: string;
  setLeftPanelTabState: (tab: string) => void;
  
  // Terminal
  addTerminalLog: (entry: LogEntry) => void;
  setTerminalOpen: (value: boolean) => void;
  setAgentRunning: (value: boolean) => void;
  
  // File creation
  setCreatingFile: (value: boolean) => void;
  setNewFileNameState: (name: string) => void;
  setSelectedTemplateState: (template: string | null) => void;
  setSelectedCodeState: (code: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: React.ReactNode;
  // Initial state from hooks (for backward compatibility)
  initialFiles?: FileItem[];
  initialOpenTabs?: string[];
  initialActiveTabId?: string;
  initialChatMessages?: ChatMessage[];
  initialIsGenerating?: boolean;
  initialAgentMode?: boolean;
  initialPlanMode?: boolean;
  initialLeftPanelOpen?: boolean;
  initialRightPanelOpen?: boolean;
  initialLeftPanelTab?: string;
}

export function AppProvider({
  children,
  initialFiles,
  initialOpenTabs,
  initialActiveTabId,
  initialChatMessages,
  initialIsGenerating,
  initialAgentMode,
  initialPlanMode,
  initialLeftPanelOpen,
  initialRightPanelOpen,
  initialLeftPanelTab,
}: AppProviderProps) {
  // Initialize stores with props if provided
  const files = initialFiles ?? $files.get();
  const openTabs = initialOpenTabs ?? $openTabs.get();
  const activeTabId = initialActiveTabId ?? $activeTabId.get();
  const chatMessages = initialChatMessages ?? $chatMessages.get();
  const isGenerating = initialIsGenerating ?? $isGenerating.get();
  const agentMode = initialAgentMode ?? $agentMode.get();
  const planMode = initialPlanMode ?? $planMode.get();
  const leftPanelOpen = initialLeftPanelOpen ?? $leftPanelOpen.get();
  const rightPanelOpen = initialRightPanelOpen ?? $rightPanelOpen.get();
  const leftPanelTab = initialLeftPanelTab ?? $leftPanelTab.get();

  // Setters that update both stores and allow for backward compatibility
  const setFilesState = useCallback((newFiles: FileItem[]) => {
    setFiles(newFiles);
  }, []);

  const setOpenTabsState = useCallback((tabs: string[]) => {
    setOpenTabs(tabs);
  }, []);

  const setActiveTabIdState = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const setChatMessagesState = useCallback((messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (typeof messages === 'function') {
      const currentMessages = $chatMessages.get();
      const newMessages = messages(currentMessages);
      setChatMessages(newMessages);
    } else {
      setChatMessages(messages);
    }
  }, []);

  const setIsGeneratingState = useCallback((value: boolean) => {
    setIsGenerating(value);
  }, []);

  const setAgentModeState = useCallback((value: boolean) => {
    setAgentMode(value);
  }, []);

  const setPlanModeState = useCallback((value: boolean) => {
    setPlanMode(value);
  }, []);

  const setLeftPanelOpenState = useCallback((value: boolean) => {
    setLeftPanelOpen(value);
  }, []);

  const setRightPanelOpenState = useCallback((value: boolean) => {
    setRightPanelOpen(value);
  }, []);

  const setLeftPanelTabState = useCallback((tab: string) => {
    setLeftPanelTab(tab);
  }, []);

  const addTerminalLog = useCallback((entry: LogEntry) => {
    addTerminalOutput(entry);
  }, []);

  const setTerminalOpen = useCallback((value: boolean) => {
    setIsTerminalOpen(value);
  }, []);

  const setAgentRunning = useCallback((value: boolean) => {
    setIsAgentRunning(value);
  }, []);

  const setCreatingFile = useCallback((value: boolean) => {
    setIsCreatingFile(value);
  }, []);

  const setNewFileNameState = useCallback((name: string) => {
    setNewFileName(name);
  }, []);

  const setSelectedTemplateState = useCallback((template: string | null) => {
    setSelectedTemplate(template);
  }, []);

  const setSelectedCodeState = useCallback((code: string) => {
    setSelectedCode(code);
  }, []);

  const value = useMemo(() => ({
    // Files
    files,
    setFilesState,
    openTabs,
    setOpenTabsState,
    activeTabId,
    setActiveTabIdState,
    
    // Chat
    chatMessages,
    setChatMessagesState,
    isGenerating,
    setIsGeneratingState,
    
    // Agent
    agentMode,
    setAgentModeState,
    planMode,
    setPlanModeState,
    
    // UI
    leftPanelOpen,
    setLeftPanelOpenState,
    rightPanelOpen,
    setRightPanelOpenState,
    leftPanelTab,
    setLeftPanelTabState,
    
    // Terminal
    addTerminalLog,
    setTerminalOpen,
    setAgentRunning,
    
    // File creation
    setCreatingFile,
    setNewFileNameState,
    setSelectedTemplateState,
    setSelectedCodeState,
  }), [
    files,
    setFilesState,
    openTabs,
    setOpenTabsState,
    activeTabId,
    setActiveTabIdState,
    chatMessages,
    setChatMessagesState,
    isGenerating,
    setIsGeneratingState,
    agentMode,
    setAgentModeState,
    planMode,
    setPlanModeState,
    leftPanelOpen,
    setLeftPanelOpenState,
    rightPanelOpen,
    setRightPanelOpenState,
    leftPanelTab,
    setLeftPanelTabState,
    addTerminalLog,
    setTerminalOpen,
    setAgentRunning,
    setCreatingFile,
    setNewFileNameState,
    setSelectedTemplateState,
    setSelectedCodeState,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}