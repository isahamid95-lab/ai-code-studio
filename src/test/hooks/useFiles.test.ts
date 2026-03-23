import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { FileItem, Language } from '../../types'

vi.mock('../../services/api', () => ({
  fetchFilesFromServer: vi.fn(),
  saveFileToServer: vi.fn(),
  deleteFileFromServer: vi.fn(),
  runFileOnServer: vi.fn()
}))

vi.mock('../../utils/persistence', () => ({
  saveProject: vi.fn(() => Promise.resolve()),
  loadProject: vi.fn(() => Promise.resolve(null)),
  clearProject: vi.fn()
}))

vi.mock('../../lib/webcontainer', () => ({
  getWebContainer: vi.fn(() => Promise.resolve({
    fs: { writeFile: vi.fn() }
  }))
}))

import { fetchFilesFromServer, saveFileToServer, deleteFileFromServer, runFileOnServer } from '../../services/api'
import { useFiles } from '../../hooks/useFiles'

const mockFetchFiles = fetchFilesFromServer as Mock
const mockSaveFile = saveFileToServer as Mock
const mockDeleteFile = deleteFileFromServer as Mock
const mockRunFile = runFileOnServer as Mock

describe('useFiles Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchFiles.mockResolvedValue([])
  })

  describe('initial state', () => {
    it('should have empty files array initially', () => {
      const { result } = renderHook(() => useFiles())
      
      expect(result.current.files).toEqual([])
      expect(result.current.openTabs).toEqual([])
      expect(result.current.activeTabId).toBe('')
      expect(result.current.dirtyFileIds.size).toBe(0)
    })

    it('should have terminal closed initially', () => {
      const { result } = renderHook(() => useFiles())
      
      expect(result.current.isTerminalOpen).toBe(false)
      expect(result.current.terminalOutput).toHaveLength(1)
      expect(result.current.terminalOutput[0].type).toBe('info')
    })
  })

  describe('openFile', () => {
    it('should add file to open tabs and set as active', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('test.ts')
      })
      
      expect(result.current.openTabs).toContain('test.ts')
      expect(result.current.activeTabId).toBe('test.ts')
    })

    it('should not duplicate tabs when opening same file', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('test.ts')
        result.current.openFile('test.ts')
      })
      
      expect(result.current.openTabs.filter(t => t === 'test.ts')).toHaveLength(1)
    })

    it('should maintain multiple tabs in order', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('a.ts')
        result.current.openFile('b.ts')
        result.current.openFile('c.ts')
      })
      
      expect(result.current.openTabs).toEqual(['a.ts', 'b.ts', 'c.ts'])
    })
  })

  describe('closeTab', () => {
    const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent

    it('should remove tab from open tabs', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('test.ts')
      })
      
      act(() => {
        result.current.closeTab(mockEvent, 'test.ts')
      })
      
      expect(result.current.openTabs).not.toContain('test.ts')
    })

    it('should switch to last tab when closing active tab', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('a.ts')
        result.current.openFile('b.ts')
        result.current.openFile('c.ts')
      })
      
      expect(result.current.activeTabId).toBe('c.ts')
      
      act(() => {
        result.current.closeTab(mockEvent, 'c.ts')
      })
      
      expect(result.current.activeTabId).toBe('b.ts')
    })

    it('should clear active tab when closing last tab', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('test.ts')
      })
      
      act(() => {
        result.current.closeTab(mockEvent, 'test.ts')
      })
      
      expect(result.current.activeTabId).toBe('')
    })
  })

  describe('closeOtherTabs', () => {
    it('should close all tabs except specified', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('a.ts')
        result.current.openFile('b.ts')
        result.current.openFile('c.ts')
      })
      
      act(() => {
        result.current.closeOtherTabs('b.ts')
      })
      
      expect(result.current.openTabs).toEqual(['b.ts'])
      expect(result.current.activeTabId).toBe('b.ts')
    })
  })

  describe('closeAllTabs', () => {
    it('should close all tabs', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.openFile('a.ts')
        result.current.openFile('b.ts')
      })
      
      act(() => {
        result.current.closeAllTabs()
      })
      
      expect(result.current.openTabs).toEqual([])
      expect(result.current.activeTabId).toBe('')
    })
  })

  describe('handleFileChange', () => {
    it('should update file content and mark as dirty', async () => {
      mockFetchFiles.mockResolvedValueOnce([{
        id: 'test.ts',
        name: 'test.ts',
        content: 'original',
        language: 'typescript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }])
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      act(() => {
        result.current.openFile('test.ts')
      })
      
      act(() => {
        result.current.handleFileChange('new content')
      })
      
      expect(result.current.files.find(f => f.id === 'test.ts')?.content).toBe('new content')
      expect(result.current.dirtyFileIds.has('test.ts')).toBe(true)
    })
  })

  describe('fetchFiles', () => {
    it('should fetch files from server', async () => {
      const mockFiles = [{
        id: 'app.ts',
        name: 'app.ts',
        content: 'console.log("hello")',
        language: 'typescript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]
      
      mockFetchFiles.mockResolvedValueOnce(mockFiles)
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      expect(mockFetchFiles).toHaveBeenCalled()
    })
  })

  describe('handleCreateFile', () => {
    it('should create a new file with template', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.setNewFileName('new-component.tsx')
        result.current.setSelectedTemplate('React Component')
      })
      
      const templates = {
        'React Component': { content: 'export default function() {}', defaultExt: '.tsx' }
      }
      
      act(() => {
        result.current.handleCreateFile(templates)
      })
      
      expect(result.current.files).toHaveLength(1)
      expect(result.current.files[0].name).toBe('new-component.tsx')
      expect(result.current.files[0].language).toBe('typescript')
      expect(result.current.openTabs).toContain('new-component.tsx')
      expect(result.current.activeTabId).toBe('new-component.tsx')
      expect(mockSaveFile).toHaveBeenCalledWith('new-component.tsx', 'export default function() {}')
    })

    it('should not create file with empty name', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.setNewFileName('')
        result.current.handleCreateFile({})
      })
      
      expect(result.current.files).toHaveLength(0)
    })

    it('should reset creation state after creating file', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.setNewFileName('test.ts')
        result.current.setIsCreatingFile(true)
      })
      
      act(() => {
        result.current.handleCreateFile({})
      })
      
      expect(result.current.isCreatingFile).toBe(false)
      expect(result.current.newFileName).toBe('')
      expect(result.current.selectedTemplate).toBeNull()
    })
  })

  describe('handleDeleteFile', () => {
    const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent

    it('should delete file from list', async () => {
      mockDeleteFile.mockResolvedValueOnce(undefined)
      mockFetchFiles.mockResolvedValueOnce([{
        id: 'delete-me.ts',
        name: 'delete-me.ts',
        content: 'test',
        language: 'typescript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }])
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      act(() => {
        result.current.openFile('delete-me.ts')
      })
      
      await act(async () => {
        await result.current.handleDeleteFile(mockEvent, 'delete-me.ts')
      })
      
      expect(mockDeleteFile).toHaveBeenCalledWith('delete-me.ts')
      expect(result.current.files.find(f => f.id === 'delete-me.ts')).toBeUndefined()
    })

    it('should close tab when deleting open file', async () => {
      mockDeleteFile.mockResolvedValueOnce(undefined)
      mockFetchFiles.mockResolvedValueOnce([{
        id: 'to-delete.ts',
        name: 'to-delete.ts',
        content: 'test',
        language: 'typescript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }])
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      act(() => {
        result.current.openFile('to-delete.ts')
      })
      
      expect(result.current.openTabs).toContain('to-delete.ts')
      
      await act(async () => {
        await result.current.handleDeleteFile(mockEvent, 'to-delete.ts')
      })
      
      expect(result.current.openTabs).not.toContain('to-delete.ts')
    })
  })

  describe('applyFileFromAgent', () => {
    it('should create new file from agent', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.applyFileFromAgent('agent-created.ts', 'console.log("agent")')
      })
      
      expect(result.current.files).toHaveLength(1)
      expect(result.current.files[0].id).toBe('agent-created.ts')
      expect(result.current.files[0].content).toBe('console.log("agent")')
      expect(result.current.openTabs).toContain('agent-created.ts')
      expect(result.current.activeTabId).toBe('agent-created.ts')
    })

    it('should update existing file from agent', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.applyFileFromAgent('existing.ts', 'original content')
      })
      
      act(() => {
        result.current.applyFileFromAgent('existing.ts', 'updated content')
      })
      
      expect(result.current.files).toHaveLength(1)
      expect(result.current.files[0].content).toBe('updated content')
    })

    it('should save file to backend', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.applyFileFromAgent('backend-save.ts', 'content')
      })
      
      expect(mockSaveFile).toHaveBeenCalledWith('backend-save.ts', 'content')
    })
  })

  describe('runCode', () => {
    it('should show terminal when no active file', async () => {
      const { result } = renderHook(() => useFiles())
      
      await act(async () => {
        await result.current.runCode()
      })
      
      expect(result.current.isTerminalOpen).toBe(true)
      expect(result.current.terminalOutput.some(o => o.text.includes('No file selected'))).toBe(true)
    })

    it('should show info for HTML files', async () => {
      mockFetchFiles.mockResolvedValueOnce([{
        id: 'index.html',
        name: 'index.html',
        content: '<html></html>',
        language: 'html',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }])
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      act(() => {
        result.current.openFile('index.html')
      })
      
      await act(async () => {
        await result.current.runCode()
      })
      
      expect(result.current.isTerminalOpen).toBe(true)
      expect(result.current.terminalOutput.some(o => o.text.includes('HTML'))).toBe(true)
    })

    it('should show info for CSS files', async () => {
      mockFetchFiles.mockResolvedValueOnce([{
        id: 'style.css',
        name: 'style.css',
        content: '.test {}',
        language: 'css',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }])
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      act(() => {
        result.current.openFile('style.css')
      })
      
      await act(async () => {
        await result.current.runCode()
      })
      
      expect(result.current.isTerminalOpen).toBe(true)
      expect(result.current.terminalOutput.some(o => o.text.includes('CSS'))).toBe(true)
    })

    it('should execute JS/TS files', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type":"log","text":"output"}\n\n'))
          controller.enqueue(new TextEncoder().encode('data: {"type":"exit","code":0}\n\n'))
          controller.close()
        }
      })
      
      mockRunFile.mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })
      
      mockFetchFiles.mockResolvedValueOnce([{
        id: 'script.js',
        name: 'script.js',
        content: 'console.log("test")',
        language: 'javascript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }])
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      act(() => {
        result.current.openFile('script.js')
      })
      
      await act(async () => {
        await result.current.runCode()
      })
      
      expect(result.current.isTerminalOpen).toBe(true)
      expect(mockRunFile).toHaveBeenCalledWith('script.js')
    })
  })

  describe('terminal operations', () => {
    it('should toggle terminal', () => {
      const { result } = renderHook(() => useFiles())
      
      expect(result.current.isTerminalOpen).toBe(false)
      
      act(() => {
        result.current.setIsTerminalOpen(true)
      })
      
      expect(result.current.isTerminalOpen).toBe(true)
    })

    it('should add terminal output', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.setTerminalOutput(prev => [...prev, { type: 'error', text: 'Error occurred' }])
      })
      
      expect(result.current.terminalOutput).toHaveLength(2)
      expect(result.current.terminalOutput[1].type).toBe('error')
    })
  })

  describe('state setters', () => {
    it('should set files directly', () => {
      const { result } = renderHook(() => useFiles())
      
      const newFiles: FileItem[] = [{
        id: 'direct.ts',
        name: 'direct.ts',
        content: 'direct',
        language: 'typescript' as Language,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]
      
      act(() => {
        result.current.setFiles(newFiles)
      })
      
      expect(result.current.files).toEqual(newFiles)
    })

    it('should set open tabs', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.setOpenTabs(['a.ts', 'b.ts'])
      })
      
      expect(result.current.openTabs).toEqual(['a.ts', 'b.ts'])
    })

    it('should set active tab id', () => {
      const { result } = renderHook(() => useFiles())
      
      act(() => {
        result.current.setActiveTabId('active.ts')
      })
      
      expect(result.current.activeTabId).toBe('active.ts')
    })
  })

  describe('activeFile', () => {
    it('should return undefined when no active tab', () => {
      const { result } = renderHook(() => useFiles())
      
      expect(result.current.activeFile).toBeUndefined()
    })

    it('should return active file when set', async () => {
      mockFetchFiles.mockResolvedValueOnce([{
        id: 'active.ts',
        name: 'active.ts',
        content: 'active content',
        language: 'typescript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }])
      
      const { result } = renderHook(() => useFiles())
      
      await act(() => new Promise(r => setTimeout(r, 100)))
      
      act(() => {
        result.current.openFile('active.ts')
      })
      
      expect(result.current.activeFile).toBeDefined()
      expect(result.current.activeFile?.id).toBe('active.ts')
    })
  })
})