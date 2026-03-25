import { atom, computed } from 'nanostores';
import type { FileItem, LogEntry } from '../types';

// Core file state
export const $files = atom<FileItem[]>([]);
export const $openTabs = atom<string[]>([]);
export const $activeTabId = atom<string>('');
export const $dirtyFileIds = atom<Set<string>>(new Set());

// Terminal state
export const $isTerminalOpen = atom<boolean>(false);
export const $terminalOutput = atom<LogEntry[]>([
  { type: 'info', text: '$ Agent output ready', timestamp: Date.now() },
]);

// File creation state
export const $isCreatingFile = atom<boolean>(false);
export const $newFileName = atom<string>('');
export const $selectedTemplate = atom<string | null>(null);

// Code selection state
export const $selectedCode = atom<string>('');

// Agent running state
export const $isAgentRunning = atom<boolean>(false);

// Computed: Active file
export const $activeFile = computed([$files, $activeTabId], (files, activeTabId) => {
  return files.find((file) => file.id === activeTabId) ?? null;
});

// Actions
export function setFiles(files: FileItem[]) {
  $files.set(files);
}

export function addFile(file: FileItem) {
  $files.set([...$files.get(), file]);
}

export function updateFile(id: string, updates: Partial<FileItem>) {
  $files.set(
    $files.get().map((file) =>
      file.id === id ? { ...file, ...updates, updatedAt: Date.now() } : file
    )
  );
}

export function removeFile(id: string) {
  $files.set($files.get().filter((file) => file.id !== id));
}

export function setOpenTabs(tabs: string[]) {
  $openTabs.set(tabs);
}

export function addOpenTab(id: string) {
  const current = $openTabs.get();
  if (!current.includes(id)) {
    $openTabs.set([...current, id]);
  }
}

export function removeOpenTab(id: string) {
  const current = $openTabs.get();
  $openTabs.set(current.filter((tabId) => tabId !== id));
}

export function setActiveTabId(id: string) {
  $activeTabId.set(id);
}

export function markDirty(id: string) {
  const current = $dirtyFileIds.get();
  const next = new Set(current);
  next.add(id);
  $dirtyFileIds.set(next);
}

export function markClean(id: string) {
  const current = $dirtyFileIds.get();
  const next = new Set(current);
  next.delete(id);
  $dirtyFileIds.set(next);
}

export function setIsTerminalOpen(isOpen: boolean) {
  $isTerminalOpen.set(isOpen);
}

export function addTerminalOutput(entry: LogEntry) {
  $terminalOutput.set([...$terminalOutput.get(), entry]);
}

export function clearTerminalOutput() {
  $terminalOutput.set([{ type: 'info', text: '$ Agent output ready', timestamp: Date.now() }]);
}

export function setIsCreatingFile(isCreating: boolean) {
  $isCreatingFile.set(isCreating);
}

export function setNewFileName(name: string) {
  $newFileName.set(name);
}

export function setSelectedTemplate(template: string | null) {
  $selectedTemplate.set(template);
}

export function setSelectedCode(code: string) {
  $selectedCode.set(code);
}

export function setIsAgentRunning(isRunning: boolean) {
  $isAgentRunning.set(isRunning);
}

// File content change handler
export function handleFileChange(newContent: string) {
  const activeId = $activeTabId.get();
  if (!activeId) return;

  updateFile(activeId, { content: newContent });
  markDirty(activeId);
}

// Open file handler
export function openFile(id: string) {
  addOpenTab(id);
  setActiveTabId(id);
}

// Close tab handler
export function closeTab(id: string) {
  const tabs = $openTabs.get();
  const activeId = $activeTabId.get();

  removeOpenTab(id);

  if (activeId === id) {
    const remainingTabs = tabs.filter((tabId) => tabId !== id);
    setActiveTabId(remainingTabs[remainingTabs.length - 1] ?? '');
  }
}

// Reset store
export function resetFilesStore() {
  $files.set([]);
  $openTabs.set([]);
  $activeTabId.set('');
  $dirtyFileIds.set(new Set());
  $isTerminalOpen.set(false);
  $terminalOutput.set([{ type: 'info', text: '$ Agent output ready', timestamp: Date.now() }]);
  $isCreatingFile.set(false);
  $newFileName.set('');
  $selectedTemplate.set(null);
  $selectedCode.set('');
  $isAgentRunning.set(false);
}