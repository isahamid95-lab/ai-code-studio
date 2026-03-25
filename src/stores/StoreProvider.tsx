import { useEffect, useRef } from 'react';
import {
  $files,
  $openTabs,
  $activeTabId,
  $isTerminalOpen,
  $terminalOutput,
  $isCreatingFile,
  $newFileName,
  $selectedTemplate,
  $selectedCode,
  $isAgentRunning,
  $chatMessages,
  $chatInput,
  $isGenerating,
  $isPreviewOpen,
  $previewUrl,
  $previewPort,
  $backgroundUrl,
  $tabContextMenu,
  initializeTheme,
  $agentMode,
  $planMode,
  $agentStatus,
  $alibabaApiKey,
  $alibabaModel,
  $leftPanelOpen,
  $rightPanelOpen,
  $leftPanelTab,
  $isSettingsOpen,
  $isShortcutsOpen,
  $isThemeSelectorOpen,
  $isGlobalSearchOpen,
  $isCommandPaletteOpen,
} from './index';
import type { FileItem, ChatMessage, LogEntry } from '../types';
import { db, runMigrations, type ChatMessageRecord, type SettingsRecord } from '../lib/persistence';

interface StoreProviderProps {
  children: React.ReactNode;
}

export function useStoreSync(props: {
  files?: FileItem[];
  openTabs?: string[];
  activeTabId?: string;
  isTerminalOpen?: boolean;
  terminalOutput?: LogEntry[];
  isCreatingFile?: boolean;
  newFileName?: string;
  selectedTemplate?: string | null;
  selectedCode?: string;
  isAgentRunning?: boolean;
  chatMessages?: ChatMessage[];
  chatInput?: string;
  isGenerating?: boolean;
  isPreviewOpen?: boolean;
  previewUrl?: string | null;
  previewPort?: number | null;
  backgroundUrl?: string | null;
  tabContextMenu?: { x: number; y: number; id: string } | null;
  agentMode?: boolean;
  planMode?: boolean;
  agentStatus?: string;
  alibabaApiKey?: string;
  alibabaModel?: string;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  leftPanelTab?: string;
  isSettingsOpen?: boolean;
  isShortcutsOpen?: boolean;
  isThemeSelectorOpen?: boolean;
  isGlobalSearchOpen?: boolean;
  isCommandPaletteOpen?: boolean;
}) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (props.files !== undefined) {
      $files.set(props.files);
    }
  }, [props.files]);

  useEffect(() => {
    if (props.openTabs !== undefined) {
      $openTabs.set(props.openTabs);
    }
  }, [props.openTabs]);

  useEffect(() => {
    if (props.activeTabId !== undefined) {
      $activeTabId.set(props.activeTabId);
    }
  }, [props.activeTabId]);

  useEffect(() => {
    if (props.isTerminalOpen !== undefined) {
      $isTerminalOpen.set(props.isTerminalOpen);
    }
  }, [props.isTerminalOpen]);

  useEffect(() => {
    if (props.terminalOutput !== undefined) {
      $terminalOutput.set(props.terminalOutput);
    }
  }, [props.terminalOutput]);

  useEffect(() => {
    if (props.isCreatingFile !== undefined) {
      $isCreatingFile.set(props.isCreatingFile);
    }
  }, [props.isCreatingFile]);

  useEffect(() => {
    if (props.newFileName !== undefined) {
      $newFileName.set(props.newFileName);
    }
  }, [props.newFileName]);

  useEffect(() => {
    if (props.selectedTemplate !== undefined) {
      $selectedTemplate.set(props.selectedTemplate);
    }
  }, [props.selectedTemplate]);

  useEffect(() => {
    if (props.selectedCode !== undefined) {
      $selectedCode.set(props.selectedCode);
    }
  }, [props.selectedCode]);

  useEffect(() => {
    if (props.isAgentRunning !== undefined) {
      $isAgentRunning.set(props.isAgentRunning);
    }
  }, [props.isAgentRunning]);

  useEffect(() => {
    if (props.chatMessages !== undefined) {
      $chatMessages.set(props.chatMessages);
    }
  }, [props.chatMessages]);

  useEffect(() => {
    if (props.chatInput !== undefined) {
      $chatInput.set(props.chatInput);
    }
  }, [props.chatInput]);

  useEffect(() => {
    if (props.isGenerating !== undefined) {
      $isGenerating.set(props.isGenerating);
    }
  }, [props.isGenerating]);

  useEffect(() => {
    if (props.isPreviewOpen !== undefined) {
      $isPreviewOpen.set(props.isPreviewOpen);
    }
  }, [props.isPreviewOpen]);

  useEffect(() => {
    if (props.previewUrl !== undefined) {
      $previewUrl.set(props.previewUrl);
    }
  }, [props.previewUrl]);

  useEffect(() => {
    if (props.previewPort !== undefined) {
      $previewPort.set(props.previewPort);
    }
  }, [props.previewPort]);

  useEffect(() => {
    if (props.backgroundUrl !== undefined) {
      $backgroundUrl.set(props.backgroundUrl);
    }
  }, [props.backgroundUrl]);

  useEffect(() => {
    if (props.tabContextMenu !== undefined) {
      $tabContextMenu.set(props.tabContextMenu);
    }
  }, [props.tabContextMenu]);

  useEffect(() => {
    if (props.agentMode !== undefined) {
      $agentMode.set(props.agentMode);
    }
  }, [props.agentMode]);

  useEffect(() => {
    if (props.planMode !== undefined) {
      $planMode.set(props.planMode);
    }
  }, [props.planMode]);

  useEffect(() => {
    if (props.agentStatus !== undefined) {
      $agentStatus.set(props.agentStatus);
    }
  }, [props.agentStatus]);

  useEffect(() => {
    if (props.alibabaApiKey !== undefined) {
      $alibabaApiKey.set(props.alibabaApiKey);
    }
  }, [props.alibabaApiKey]);

  useEffect(() => {
    if (props.alibabaModel !== undefined) {
      $alibabaModel.set(props.alibabaModel);
    }
  }, [props.alibabaModel]);

  useEffect(() => {
    if (props.leftPanelOpen !== undefined) {
      $leftPanelOpen.set(props.leftPanelOpen);
    }
  }, [props.leftPanelOpen]);

  useEffect(() => {
    if (props.rightPanelOpen !== undefined) {
      $rightPanelOpen.set(props.rightPanelOpen);
    }
  }, [props.rightPanelOpen]);

  useEffect(() => {
    if (props.leftPanelTab !== undefined) {
      $leftPanelTab.set(props.leftPanelTab);
    }
  }, [props.leftPanelTab]);

  useEffect(() => {
    if (props.isSettingsOpen !== undefined) {
      $isSettingsOpen.set(props.isSettingsOpen);
    }
  }, [props.isSettingsOpen]);

  useEffect(() => {
    if (props.isShortcutsOpen !== undefined) {
      $isShortcutsOpen.set(props.isShortcutsOpen);
    }
  }, [props.isShortcutsOpen]);

  useEffect(() => {
    if (props.isThemeSelectorOpen !== undefined) {
      $isThemeSelectorOpen.set(props.isThemeSelectorOpen);
    }
  }, [props.isThemeSelectorOpen]);

  useEffect(() => {
    if (props.isGlobalSearchOpen !== undefined) {
      $isGlobalSearchOpen.set(props.isGlobalSearchOpen);
    }
  }, [props.isGlobalSearchOpen]);

  useEffect(() => {
    if (props.isCommandPaletteOpen !== undefined) {
      $isCommandPaletteOpen.set(props.isCommandPaletteOpen);
    }
  }, [props.isCommandPaletteOpen]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeTheme();
    }
  }, []);

  return null;
}

const DEBOUNCE_MS = 300;

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    void (async () => {
      try {
        const migrations = await runMigrations();
        console.log('[StoreProvider] Migrations completed:', migrations);

        const [settings, chats] = await Promise.all([
          db.get('settings', 'ui'),
          db.getAll('chats'),
        ]);

        if (settings) {
          if (typeof settings.leftPanelOpen === 'boolean') {
            $leftPanelOpen.set(settings.leftPanelOpen);
          }
          if (typeof settings.rightPanelOpen === 'boolean') {
            $rightPanelOpen.set(settings.rightPanelOpen);
          }
          if (settings.leftPanelTab) {
            $leftPanelTab.set(settings.leftPanelTab);
          }
          if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
          }
          if (settings.openTabs) {
            $openTabs.set(settings.openTabs);
          }
          if (settings.activeTabId) {
            $activeTabId.set(settings.activeTabId);
          }
        }

        if (chats && chats.length > 0) {
          const sortedChats = chats.sort(
            (a, b) => a.timestamp - b.timestamp
          );
          const chatMessages: ChatMessage[] = sortedChats.map((record) => ({
            id: record.id,
            role: record.role,
            text: record.text,
            timestamp: record.timestamp,
            isHidden: record.isHidden,
            displayText: record.displayText,
            variant: record.variant,
          }));
          $chatMessages.set(chatMessages);
        }

        initializeTheme();

        console.log('[StoreProvider] State restored from IndexedDB');
      } catch (error) {
        console.error('[StoreProvider] Failed to restore state:', error);
        initializeTheme();
      }
    })();
  }, []);

  useEffect(() => {
    const saveSettings = debounce(() => {
      const settings: SettingsRecord = {
        id: 'ui',
        leftPanelOpen: $leftPanelOpen.get(),
        rightPanelOpen: $rightPanelOpen.get(),
        leftPanelTab: $leftPanelTab.get() as string,
        theme: document.documentElement.getAttribute('data-theme') || 'dark',
        openTabs: $openTabs.get(),
        activeTabId: $activeTabId.get(),
      };
      void db.set('settings', settings);
    }, DEBOUNCE_MS);

    const unsubLeftPanel = $leftPanelOpen.subscribe(saveSettings);
    const unsubRightPanel = $rightPanelOpen.subscribe(saveSettings);
    const unsubLeftTab = $leftPanelTab.subscribe(saveSettings);
    const unsubOpenTabs = $openTabs.subscribe(saveSettings);
    const unsubActiveTab = $activeTabId.subscribe(saveSettings);

    return () => {
      unsubLeftPanel();
      unsubRightPanel();
      unsubLeftTab();
      unsubOpenTabs();
      unsubActiveTab();
    };
  }, []);

  useEffect(() => {
    const saveChats = debounce(() => {
      const messages = $chatMessages.get();
      void db.clear('chats').then(() => {
        for (const msg of messages) {
          const record: ChatMessageRecord = {
            id: msg.id,
            role: msg.role,
            text: msg.text,
            timestamp: msg.timestamp || Date.now(),
            isHidden: msg.isHidden,
            displayText: msg.displayText,
            variant: msg.variant,
          };
          void db.set('chats', record);
        }
      });
    }, DEBOUNCE_MS);

    const unsubChat = $chatMessages.subscribe(saveChats);
    return () => unsubChat();
  }, []);

  return <>{children}</>;
}