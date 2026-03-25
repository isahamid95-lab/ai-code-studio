import { atom, computed } from 'nanostores';
import { themes, applyTheme, getDefaultTheme } from '../themes';
import type { Theme } from '../themes';

// Theme state
export const $currentThemeId = atom<string>('midnight');

// Computed: Current theme object
export const $currentTheme = computed($currentThemeId, (themeId) => {
  return themes.find((t) => t.id === themeId) ?? getDefaultTheme();
});

// Computed: Is dark mode
export const $isDarkMode = computed($currentThemeId, (themeId) => themeId !== 'light');

// Computed: All available themes
export const $availableThemes = atom<Theme[]>(themes);

// Actions
export function setCurrentThemeId(themeId: string) {
  $currentThemeId.set(themeId);
}

export function setTheme(theme: Theme) {
  setCurrentThemeId(theme.id);
  applyTheme(theme);
}

export function setThemeById(themeId: string) {
  const theme = themes.find((t) => t.id === themeId);
  if (theme) {
    setTheme(theme);
  }
}

export function toggleDarkMode() {
  const currentId = $currentThemeId.get();
  if (currentId === 'light') {
    setThemeById('midnight');
  } else {
    setThemeById('light');
  }
}

// Initialize theme from localStorage
export function initializeTheme() {
  const stored = localStorage.getItem('ide_theme');
  if (stored) {
    const theme = themes.find((t) => t.id === stored);
    if (theme) {
      setCurrentThemeId(theme.id);
      applyTheme(theme);
      return;
    }
  }
  // Apply default theme
  const defaultTheme = getDefaultTheme();
  setCurrentThemeId(defaultTheme.id);
}

// Reset store
export function resetThemeStore() {
  const defaultTheme = getDefaultTheme();
  $currentThemeId.set(defaultTheme.id);
  applyTheme(defaultTheme);
}