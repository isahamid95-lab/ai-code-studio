import { atom, computed } from 'nanostores';

// Panel state
export const $leftPanelOpen = atom<boolean>(true);
export const $rightPanelOpen = atom<boolean>(true);
export const $leftPanelTab = atom<string>('explorer');
export const $leftPanelWidth = atom<number>(280);
export const $rightPanelWidth = atom<number>(400);

// Modal state
export const $isSettingsOpen = atom<boolean>(false);
export const $isShortcutsOpen = atom<boolean>(false);
export const $isThemeSelectorOpen = atom<boolean>(false);
export const $isGlobalSearchOpen = atom<boolean>(false);
export const $isCommandPaletteOpen = atom<boolean>(false);

// Activity items for left panel
export const ACTIVITY_ITEMS = [
  { id: 'explorer', label: 'Explorer' },
  { id: 'search', label: 'Search' },
  { id: 'git', label: 'Git' },
  { id: 'mcp', label: 'MCP Hub' },
  { id: 'outline', label: 'Outline' },
  { id: 'intel', label: 'AI Intel' },
  { id: 'dashboard', label: 'Dashboard' },
] as const;

export type LeftTab = typeof ACTIVITY_ITEMS[number]['id'];

// Computed: Is any modal open
export const $isAnyModalOpen = computed(
  [$isSettingsOpen, $isShortcutsOpen, $isThemeSelectorOpen, $isGlobalSearchOpen, $isCommandPaletteOpen],
  (settings, shortcuts, theme, search, command) => settings || shortcuts || theme || search || command
);

// Panel actions
export function setLeftPanelOpen(isOpen: boolean) {
  $leftPanelOpen.set(isOpen);
}

export function toggleLeftPanel() {
  $leftPanelOpen.set(!$leftPanelOpen.get());
}

export function setRightPanelOpen(isOpen: boolean) {
  $rightPanelOpen.set(isOpen);
}

export function toggleRightPanel() {
  $rightPanelOpen.set(!$rightPanelOpen.get());
}

export function setLeftPanelTab(tab: LeftTab) {
  $leftPanelTab.set(tab);
}

export function handleActivityClick(tab: LeftTab) {
  const currentTab = $leftPanelTab.get();
  const isPanelOpen = $leftPanelOpen.get();

  if (currentTab === tab && isPanelOpen) {
    setLeftPanelOpen(false);
  } else {
    setLeftPanelTab(tab);
    setLeftPanelOpen(true);
  }
}

export function setLeftPanelWidth(width: number) {
  $leftPanelWidth.set(width);
}

export function setRightPanelWidth(width: number) {
  $rightPanelWidth.set(width);
}

// Modal actions
export function setIsSettingsOpen(isOpen: boolean) {
  $isSettingsOpen.set(isOpen);
}

export function openSettings() {
  setIsSettingsOpen(true);
}

export function closeSettings() {
  setIsSettingsOpen(false);
}

export function setIsShortcutsOpen(isOpen: boolean) {
  $isShortcutsOpen.set(isOpen);
}

export function openShortcuts() {
  setIsShortcutsOpen(true);
}

export function closeShortcuts() {
  setIsShortcutsOpen(false);
}

export function setIsThemeSelectorOpen(isOpen: boolean) {
  $isThemeSelectorOpen.set(isOpen);
}

export function openThemeSelector() {
  setIsThemeSelectorOpen(true);
}

export function closeThemeSelector() {
  setIsThemeSelectorOpen(false);
}

export function setIsGlobalSearchOpen(isOpen: boolean) {
  $isGlobalSearchOpen.set(isOpen);
}

export function openGlobalSearch() {
  setIsGlobalSearchOpen(true);
}

export function closeGlobalSearch() {
  setIsGlobalSearchOpen(false);
}

export function setIsCommandPaletteOpen(isOpen: boolean) {
  $isCommandPaletteOpen.set(isOpen);
}

export function toggleCommandPalette() {
  setIsCommandPaletteOpen(!$isCommandPaletteOpen.get());
}

export function openCommandPalette() {
  setIsCommandPaletteOpen(true);
}

export function closeCommandPalette() {
  setIsCommandPaletteOpen(false);
}

// Close all modals
export function closeAllModals() {
  setIsSettingsOpen(false);
  setIsShortcutsOpen(false);
  setIsThemeSelectorOpen(false);
  setIsGlobalSearchOpen(false);
  setIsCommandPaletteOpen(false);
}

// Reset store
export function resetUiStore() {
  $leftPanelOpen.set(true);
  $rightPanelOpen.set(true);
  $leftPanelTab.set('explorer');
  $leftPanelWidth.set(280);
  $rightPanelWidth.set(400);
  $isSettingsOpen.set(false);
  $isShortcutsOpen.set(false);
  $isThemeSelectorOpen.set(false);
  $isGlobalSearchOpen.set(false);
  $isCommandPaletteOpen.set(false);
}