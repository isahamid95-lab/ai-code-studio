import { useStore } from '@nanostores/react';
import {
  // Files store
  $files,
  $openTabs,
  $activeTabId,
  $dirtyFileIds,
  $isTerminalOpen,
  $terminalOutput,
  $isCreatingFile,
  $newFileName,
  $selectedTemplate,
  $selectedCode,
  $isAgentRunning,
  $activeFile,
  // Chat store
  $chatMessages,
  $chatInput,
  $isGenerating,
  $messageCount,
  $lastMessage,
  // Editor store
  $editorContent,
  $editorLanguage,
  $cursorPosition,
  $editorSelection,
  $isPreviewOpen,
  $previewUrl,
  $previewPort,
  $backgroundUrl,
  $tabContextMenu,
  $hasSelection,
  // Theme store
  $currentThemeId,
  $currentTheme,
  $isDarkMode,
  $availableThemes,
  // Agent store
  $agentMode,
  $planMode,
  $agentStatus,
  $activeRunId,
  $completedRunIds,
  $alibabaApiKey,
  $alibabaModel,
  $isAgentActive,
  $agentModeLabel,
  // UI store
  $leftPanelOpen,
  $rightPanelOpen,
  $leftPanelTab,
  $leftPanelWidth,
  $rightPanelWidth,
  $isSettingsOpen,
  $isShortcutsOpen,
  $isThemeSelectorOpen,
  $isGlobalSearchOpen,
  $isCommandPaletteOpen,
  $isAnyModalOpen,
} from './index';

// Files store hooks
export function useFiles() {
  return useStore($files);
}

export function useOpenTabs() {
  return useStore($openTabs);
}

export function useActiveTabId() {
  return useStore($activeTabId);
}

export function useDirtyFileIds() {
  return useStore($dirtyFileIds);
}

export function useIsTerminalOpen() {
  return useStore($isTerminalOpen);
}

export function useTerminalOutput() {
  return useStore($terminalOutput);
}

export function useIsCreatingFile() {
  return useStore($isCreatingFile);
}

export function useNewFileName() {
  return useStore($newFileName);
}

export function useSelectedTemplate() {
  return useStore($selectedTemplate);
}

export function useSelectedCode() {
  return useStore($selectedCode);
}

export function useIsAgentRunning() {
  return useStore($isAgentRunning);
}

export function useActiveFile() {
  return useStore($activeFile);
}

// Chat store hooks
export function useChatMessages() {
  return useStore($chatMessages);
}

export function useChatInput() {
  return useStore($chatInput);
}

export function useIsGenerating() {
  return useStore($isGenerating);
}

export function useMessageCount() {
  return useStore($messageCount);
}

export function useLastMessage() {
  return useStore($lastMessage);
}

// Editor store hooks
export function useEditorContent() {
  return useStore($editorContent);
}

export function useEditorLanguage() {
  return useStore($editorLanguage);
}

export function useCursorPosition() {
  return useStore($cursorPosition);
}

export function useEditorSelection() {
  return useStore($editorSelection);
}

export function useIsPreviewOpen() {
  return useStore($isPreviewOpen);
}

export function usePreviewUrl() {
  return useStore($previewUrl);
}

export function usePreviewPort() {
  return useStore($previewPort);
}

export function useBackgroundUrl() {
  return useStore($backgroundUrl);
}

export function useTabContextMenu() {
  return useStore($tabContextMenu);
}

export function useHasSelection() {
  return useStore($hasSelection);
}

// Theme store hooks
export function useCurrentThemeId() {
  return useStore($currentThemeId);
}

export function useCurrentTheme() {
  return useStore($currentTheme);
}

export function useIsDarkMode() {
  return useStore($isDarkMode);
}

export function useAvailableThemes() {
  return useStore($availableThemes);
}

// Agent store hooks
export function useAgentMode() {
  return useStore($agentMode);
}

export function usePlanMode() {
  return useStore($planMode);
}

export function useAgentStatus() {
  return useStore($agentStatus);
}

export function useActiveRunId() {
  return useStore($activeRunId);
}

export function useCompletedRunIds() {
  return useStore($completedRunIds);
}

export function useAlibabaApiKey() {
  return useStore($alibabaApiKey);
}

export function useAlibabaModel() {
  return useStore($alibabaModel);
}

export function useIsAgentActive() {
  return useStore($isAgentActive);
}

export function useAgentModeLabel() {
  return useStore($agentModeLabel);
}

// UI store hooks
export function useLeftPanelOpen() {
  return useStore($leftPanelOpen);
}

export function useRightPanelOpen() {
  return useStore($rightPanelOpen);
}

export function useLeftPanelTab() {
  return useStore($leftPanelTab);
}

export function useLeftPanelWidth() {
  return useStore($leftPanelWidth);
}

export function useRightPanelWidth() {
  return useStore($rightPanelWidth);
}

export function useIsSettingsOpen() {
  return useStore($isSettingsOpen);
}

export function useIsShortcutsOpen() {
  return useStore($isShortcutsOpen);
}

export function useIsThemeSelectorOpen() {
  return useStore($isThemeSelectorOpen);
}

export function useIsGlobalSearchOpen() {
  return useStore($isGlobalSearchOpen);
}

export function useIsCommandPaletteOpen() {
  return useStore($isCommandPaletteOpen);
}

export function useIsAnyModalOpen() {
  return useStore($isAnyModalOpen);
}