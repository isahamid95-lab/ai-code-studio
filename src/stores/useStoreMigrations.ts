import { useEffect, useCallback, useRef } from 'react';
import {
  $files,
  $openTabs,
  $activeTabId,
  $isTerminalOpen,
  $terminalOutput,
  $chatMessages,
  $isGenerating,
  $leftPanelOpen,
  $rightPanelOpen,
  $leftPanelTab,
  $isPreviewOpen,
  $previewUrl,
  $previewPort,
  $agentMode,
  $planMode,
  $agentStatus,
  $alibabaApiKey,
  $alibabaModel,
  $isSettingsOpen,
  $isShortcutsOpen,
  $isThemeSelectorOpen,
  $isGlobalSearchOpen,
  $isCommandPaletteOpen,
} from './index';
import type { FileItem, ChatMessage, LogEntry } from '../types';

export function useStoreMigrations() {
  const hasMigrated = useRef(false);

  useEffect(() => {
    if (hasMigrated.current) return;
    hasMigrated.current = true;

    const savedBg = localStorage.getItem('ide_bg');
    if (savedBg) {
      document.documentElement.style.setProperty('--bg-image', `url(${savedBg})`);
    }
  }, []);
}

export function useStoreSyncHelpers() {
  const syncToStore = useCallback(() => {
    return {
      setFiles: (files: FileItem[]) => $files.set(files),
      setOpenTabs: (tabs: string[]) => $openTabs.set(tabs),
      setActiveTabId: (id: string) => $activeTabId.set(id),
      setIsTerminalOpen: (open: boolean) => $isTerminalOpen.set(open),
      setTerminalOutput: (output: LogEntry[]) => $terminalOutput.set(output),
      setChatMessages: (messages: ChatMessage[]) => $chatMessages.set(messages),
      setIsGenerating: (generating: boolean) => $isGenerating.set(generating),
      setLeftPanelOpen: (open: boolean) => $leftPanelOpen.set(open),
      setRightPanelOpen: (open: boolean) => $rightPanelOpen.set(open),
      setLeftPanelTab: (tab: string) => $leftPanelTab.set(tab),
      setIsPreviewOpen: (open: boolean) => $isPreviewOpen.set(open),
      setPreviewUrl: (url: string | null) => $previewUrl.set(url),
      setPreviewPort: (port: number | null) => $previewPort.set(port),
      setAgentMode: (mode: boolean) => $agentMode.set(mode),
      setPlanMode: (mode: boolean) => $planMode.set(mode),
      setAgentStatus: (status: string) => $agentStatus.set(status),
      setAlibabaApiKey: (key: string) => $alibabaApiKey.set(key),
      setAlibabaModel: (model: string) => $alibabaModel.set(model),
      setIsSettingsOpen: (open: boolean) => $isSettingsOpen.set(open),
      setIsShortcutsOpen: (open: boolean) => $isShortcutsOpen.set(open),
      setIsThemeSelectorOpen: (open: boolean) => $isThemeSelectorOpen.set(open),
      setIsGlobalSearchOpen: (open: boolean) => $isGlobalSearchOpen.set(open),
      setIsCommandPaletteOpen: (open: boolean) => $isCommandPaletteOpen.set(open),
    };
  }, []);

  const getStoreValues = useCallback(() => {
    return {
      files: $files.get(),
      openTabs: $openTabs.get(),
      activeTabId: $activeTabId.get(),
      isTerminalOpen: $isTerminalOpen.get(),
      terminalOutput: $terminalOutput.get(),
      chatMessages: $chatMessages.get(),
      isGenerating: $isGenerating.get(),
      leftPanelOpen: $leftPanelOpen.get(),
      rightPanelOpen: $rightPanelOpen.get(),
      leftPanelTab: $leftPanelTab.get(),
      isPreviewOpen: $isPreviewOpen.get(),
      previewUrl: $previewUrl.get(),
      previewPort: $previewPort.get(),
      agentMode: $agentMode.get(),
      planMode: $planMode.get(),
      agentStatus: $agentStatus.get(),
      alibabaApiKey: $alibabaApiKey.get(),
      alibabaModel: $alibabaModel.get(),
      isSettingsOpen: $isSettingsOpen.get(),
      isShortcutsOpen: $isShortcutsOpen.get(),
      isThemeSelectorOpen: $isThemeSelectorOpen.get(),
      isGlobalSearchOpen: $isGlobalSearchOpen.get(),
      isCommandPaletteOpen: $isCommandPaletteOpen.get(),
    };
  }, []);

  return { syncToStore, getStoreValues };
}