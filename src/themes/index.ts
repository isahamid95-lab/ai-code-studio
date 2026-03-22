export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    cta: string
    background: string
    text: string
    accent: string
    border: string
  }
  editorTheme?: string
}

export const themes: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight Blue',
    description: 'Deep blue tones with cyan accents',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E293B',
      cta: '#2563EB',
      background: '#0F172A',
      text: '#F1F5F9',
      accent: '#06B6D4',
      border: '#334155'
    },
    editorTheme: 'oneDark'
  },
  {
    id: 'ocean',
    name: 'Ocean Depths',
    description: 'Aqua and teal ocean vibes',
    colors: {
      primary: '#14B8A6',
      secondary: '#134E4A',
      cta: '#0D9488',
      background: '#042F2E',
      text: '#CCFBF1',
      accent: '#5EEAD4',
      border: '#115E59'
    },
    editorTheme: 'oneDark'
  },
  {
    id: 'forest',
    name: 'Emerald Forest',
    description: 'Green nature-inspired theme',
    colors: {
      primary: '#22C55E',
      secondary: '#14532D',
      cta: '#16A34A',
      background: '#052E16',
      text: '#ECFDF5',
      accent: '#4ADE80',
      border: '#166534'
    },
    editorTheme: 'oneDark'
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm orange and pink tones',
    colors: {
      primary: '#F97316',
      secondary: '#7C2D12',
      cta: '#EA580C',
      background: '#431407',
      text: '#FFF7ED',
      accent: '#FB923C',
      border: '#9A3412'
    },
    editorTheme: 'oneDark'
  },
  {
    id: 'purple',
    name: 'Cosmic Purple',
    description: 'Violet and magenta space theme',
    colors: {
      primary: '#A855F7',
      secondary: '#581C87',
      cta: '#9333EA',
      background: '#2E1065',
      text: '#FAE8FF',
      accent: '#D946EF',
      border: '#7E22CE'
    },
    editorTheme: 'oneDark'
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Soft pink and rose tones',
    colors: {
      primary: '#F43F5E',
      secondary: '#881337',
      cta: '#E11D48',
      background: '#4C0519',
      text: '#FFF1F2',
      accent: '#FB7185',
      border: '#BE123C'
    },
    editorTheme: 'oneDark'
  },
  {
    id: 'light',
    name: 'Light Mode',
    description: 'Clean and bright light theme',
    colors: {
      primary: '#2563EB',
      secondary: '#E2E8F0',
      cta: '#1D4ED8',
      background: '#F8FAFC',
      text: '#1E293B',
      accent: '#0EA5E9',
      border: '#CBD5E1'
    },
    editorTheme: 'light'
  }
]

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  
  root.style.setProperty('--color-primary', theme.colors.primary)
  root.style.setProperty('--color-secondary', theme.colors.secondary)
  root.style.setProperty('--color-cta', theme.colors.cta)
  root.style.setProperty('--color-background', theme.colors.background)
  root.style.setProperty('--color-text', theme.colors.text)
  root.style.setProperty('--color-accent', theme.colors.accent)
  root.style.setProperty('--color-border', theme.colors.border)
  
  // Store preference
  localStorage.setItem('ide_theme', theme.id)
}

export function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem('ide_theme')
  if (!stored) return null
  
  return themes.find(t => t.id === stored) || null
}

export function getDefaultTheme(): Theme {
  return themes[0] // midnight
}