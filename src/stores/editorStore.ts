import { atom, computed } from 'nanostores';
import type { Language } from '../types';

// Editor state
export const $editorContent = atom<string>('');
export const $editorLanguage = atom<Language>('javascript');
export const $cursorPosition = atom<{ line: number; column: number }>({ line: 1, column: 1 });
export const $editorSelection = atom<{ from: number; to: number } | null>(null);

// Preview state
export const $isPreviewOpen = atom<boolean>(false);
export const $previewUrl = atom<string | null>(null);
export const $previewPort = atom<number | null>(null);
export const $backgroundUrl = atom<string | null>(null);

// Tab context menu
export const $tabContextMenu = atom<{ x: number; y: number; id: string } | null>(null);

// Computed: Has selection
export const $hasSelection = computed($editorSelection, (selection) => selection !== null && selection.from !== selection.to);

// Actions
export function setEditorContent(content: string) {
  $editorContent.set(content);
}

export function setEditorLanguage(language: Language) {
  $editorLanguage.set(language);
}

export function setCursorPosition(line: number, column: number) {
  $cursorPosition.set({ line, column });
}

export function setEditorSelection(from: number, to: number) {
  $editorSelection.set({ from, to });
}

export function clearEditorSelection() {
  $editorSelection.set(null);
}

export function setIsPreviewOpen(isOpen: boolean) {
  $isPreviewOpen.set(isOpen);
}

export function setPreviewUrl(url: string | null) {
  $previewUrl.set(url);
}

export function setPreviewPort(port: number | null) {
  $previewPort.set(port);
}

export function setBackgroundUrl(url: string | null) {
  $backgroundUrl.set(url);
}

export function setTabContextMenu(contextMenu: { x: number; y: number; id: string } | null) {
  $tabContextMenu.set(contextMenu);
}

// Preview handlers
export function openPreview(url: string, port: number) {
  setPreviewUrl(url);
  setPreviewPort(port);
  setIsPreviewOpen(true);
}

export function closePreview() {
  setIsPreviewOpen(false);
}

// Reset store
export function resetEditorStore() {
  $editorContent.set('');
  $editorLanguage.set('javascript');
  $cursorPosition.set({ line: 1, column: 1 });
  $editorSelection.set(null);
  $isPreviewOpen.set(false);
  $previewUrl.set(null);
  $previewPort.set(null);
  $backgroundUrl.set(null);
  $tabContextMenu.set(null);
}