import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock WebContainer API
vi.mock('@/lib/webcontainer', () => ({
  getWebContainer: vi.fn(() => Promise.resolve({
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      readdir: vi.fn(),
      rm: vi.fn(),
    },
    spawn: vi.fn(),
    on: vi.fn(),
  })),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})