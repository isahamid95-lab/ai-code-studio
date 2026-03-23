import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { FileItem, Language } from '../../types'

vi.mock('../../services/api', () => ({
  fetchFilesFromServer: vi.fn(),
  saveFileToServer: vi.fn(),
  deleteFileFromServer: vi.fn(),
  runFileOnServer: vi.fn(),
}))

vi.mock('../../utils/persistence', () => ({
  loadUiState: vi.fn(),
  saveUiState: vi.fn(() => Promise.resolve()),
  clearUiState: vi.fn(() => Promise.resolve()),
}))

import {
  fetchFilesFromServer,
  saveFileToServer,
  deleteFileFromServer,
  runFileOnServer,
} from '../../services/api'
import { loadUiState, saveUiState } from '../../utils/persistence'
import { useFiles } from '../../hooks/useFiles'

const mockFetchFiles = fetchFilesFromServer as Mock
const mockSaveFile = saveFileToServer as Mock
const mockDeleteFile = deleteFileFromServer as Mock
const mockRunFile = runFileOnServer as Mock
const mockLoadUiState = loadUiState as Mock
const mockSaveUiState = saveUiState as Mock

function buildFile(overrides: Partial<FileItem> = {}): FileItem {
  return {
    id: 'test.ts',
    name: 'test.ts',
    content: 'original',
    language: 'typescript',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

function seedFiles(result: { current: ReturnType<typeof useFiles> }, files: FileItem[]) {
  act(() => {
    result.current.setFiles(files)
  })
}

function renderLocalFilesHook() {
  mockFetchFiles.mockImplementation(() => new Promise(() => {}))
  mockLoadUiState.mockImplementation(() => new Promise(() => {}))
  return renderHook(() => useFiles())
}

describe('useFiles Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchFiles.mockResolvedValue([])
    mockLoadUiState.mockResolvedValue(null)
    mockSaveFile.mockResolvedValue(undefined)
    mockDeleteFile.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
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

  describe('workspace restore', () => {
    it('restores only persisted UI state and drops missing tabs', async () => {
      mockFetchFiles.mockResolvedValue([
        buildFile({ id: 'src/app.ts', name: 'src/app.ts' }),
        buildFile({ id: 'src/utils.ts', name: 'src/utils.ts' }),
      ])
      mockLoadUiState.mockResolvedValueOnce({
        openTabs: ['src/app.ts', 'missing.ts'],
        activeTabId: 'missing.ts',
      })

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(mockFetchFiles).toHaveBeenCalled()
      })

      await act(async () => {
        await result.current.fetchFiles()
      })

      await waitFor(() => {
        expect(result.current.files).toHaveLength(2)
        expect(result.current.openTabs).toEqual(['src/app.ts'])
        expect(result.current.activeTabId).toBe('src/app.ts')
      })
    })
  })

  describe('openFile', () => {
    it('should add file to open tabs and set as active', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [buildFile()])

      act(() => {
        result.current.openFile('test.ts')
      })

      expect(result.current.openTabs).toContain('test.ts')
      expect(result.current.activeTabId).toBe('test.ts')
    })

    it('should not duplicate tabs when opening same file', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [buildFile()])

      act(() => {
        result.current.openFile('test.ts')
        result.current.openFile('test.ts')
      })

      expect(result.current.openTabs.filter((tab) => tab === 'test.ts')).toHaveLength(1)
    })

    it('should maintain multiple tabs in order', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [
        buildFile({ id: 'a.ts', name: 'a.ts' }),
        buildFile({ id: 'b.ts', name: 'b.ts' }),
        buildFile({ id: 'c.ts', name: 'c.ts' }),
      ])

      act(() => {
        result.current.openFile('a.ts')
        result.current.openFile('b.ts')
        result.current.openFile('c.ts')
      })

      expect(result.current.openTabs).toEqual(['a.ts', 'b.ts', 'c.ts'])
    })

    it('persists UI tab state after opening a file', async () => {
      mockFetchFiles.mockResolvedValue([
        buildFile({ id: 'persisted.ts', name: 'persisted.ts' }),
      ])
      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

      act(() => {
        result.current.openFile('persisted.ts')
      })

      await waitFor(() => {
        expect(mockSaveUiState).toHaveBeenCalledWith({
          openTabs: ['persisted.ts'],
          activeTabId: 'persisted.ts',
        })
      })
    })
  })

  describe('closeTab', () => {
    const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent

    it('should remove tab from open tabs', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [buildFile()])

      act(() => {
        result.current.openFile('test.ts')
      })

      act(() => {
        result.current.closeTab(mockEvent, 'test.ts')
      })

      expect(result.current.openTabs).not.toContain('test.ts')
    })

    it('should switch to last tab when closing active tab', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [
        buildFile({ id: 'a.ts', name: 'a.ts' }),
        buildFile({ id: 'b.ts', name: 'b.ts' }),
        buildFile({ id: 'c.ts', name: 'c.ts' }),
      ])

      act(() => {
        result.current.openFile('a.ts')
        result.current.openFile('b.ts')
        result.current.openFile('c.ts')
      })

      act(() => {
        result.current.closeTab(mockEvent, 'c.ts')
      })

      expect(result.current.activeTabId).toBe('b.ts')
    })

    it('should clear active tab when closing last tab', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [buildFile()])

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
      const { result } = renderLocalFilesHook()
      seedFiles(result, [
        buildFile({ id: 'a.ts', name: 'a.ts' }),
        buildFile({ id: 'b.ts', name: 'b.ts' }),
        buildFile({ id: 'c.ts', name: 'c.ts' }),
      ])

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
      const { result } = renderLocalFilesHook()
      seedFiles(result, [
        buildFile({ id: 'a.ts', name: 'a.ts' }),
        buildFile({ id: 'b.ts', name: 'b.ts' }),
      ])

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
      mockFetchFiles.mockResolvedValueOnce([buildFile()])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

      act(() => {
        result.current.openFile('test.ts')
      })

      act(() => {
        result.current.handleFileChange('new content')
      })

      expect(result.current.files.find((file) => file.id === 'test.ts')?.content).toBe('new content')
      expect(result.current.dirtyFileIds.has('test.ts')).toBe(true)
    })

    it('keeps dirty active files local during refresh', async () => {
      mockFetchFiles
        .mockResolvedValueOnce([buildFile({ content: 'server v1' })])
        .mockResolvedValue([buildFile({ content: 'server v2' })])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files[0]?.content).toBe('server v1')
      })

      act(() => {
        result.current.openFile('test.ts')
      })

      act(() => {
        result.current.handleFileChange('local dirty')
      })

      await waitFor(() => {
        expect(result.current.dirtyFileIds.has('test.ts')).toBe(true)
      })

      await act(async () => {
        await result.current.fetchFiles()
      })

      expect(result.current.files[0]?.content).toBe('local dirty')
      expect(result.current.dirtyFileIds.has('test.ts')).toBe(true)
    })

    it('updates clean files from the server on refresh', async () => {
      mockFetchFiles
        .mockResolvedValueOnce([buildFile({ content: 'server v1' })])
        .mockResolvedValue([buildFile({ content: 'server v2' })])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files[0]?.content).toBe('server v1')
      })

      act(() => {
        result.current.openFile('test.ts')
      })

      await act(async () => {
        await result.current.fetchFiles()
      })

      expect(result.current.files[0]?.content).toBe('server v2')
    })
  })

  describe('fetchFiles', () => {
    it('should fetch files from server', async () => {
      mockFetchFiles.mockResolvedValueOnce([
        buildFile({
          id: 'app.ts',
          name: 'app.ts',
          content: 'console.log("hello")',
        }),
      ])

      renderHook(() => useFiles())

      await waitFor(() => {
        expect(mockFetchFiles).toHaveBeenCalled()
      })
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
        'React Component': { content: 'export default function() {}', defaultExt: '.tsx' },
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
      mockFetchFiles.mockResolvedValueOnce([
        buildFile({
          id: 'delete-me.ts',
          name: 'delete-me.ts',
          content: 'test',
        }),
      ])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

      act(() => {
        result.current.openFile('delete-me.ts')
      })

      await act(async () => {
        await result.current.handleDeleteFile(mockEvent, 'delete-me.ts')
      })

      expect(mockDeleteFile).toHaveBeenCalledWith('delete-me.ts')
      expect(result.current.files.find((file) => file.id === 'delete-me.ts')).toBeUndefined()
    })

    it('should close tab when deleting open file', async () => {
      mockFetchFiles.mockResolvedValueOnce([
        buildFile({
          id: 'to-delete.ts',
          name: 'to-delete.ts',
          content: 'test',
        }),
      ])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

      act(() => {
        result.current.openFile('to-delete.ts')
      })

      await act(async () => {
        await result.current.handleDeleteFile(mockEvent, 'to-delete.ts')
      })

      expect(result.current.openTabs).not.toContain('to-delete.ts')
    })
  })

  describe('runCode', () => {
    it('should show terminal when no active file', async () => {
      const { result } = renderHook(() => useFiles())

      await act(async () => {
        await result.current.runCode()
      })

      expect(result.current.isTerminalOpen).toBe(true)
      expect(result.current.terminalOutput.some((entry) => entry.text.includes('No file selected'))).toBe(true)
    })

    it('should show info for HTML files', async () => {
      mockFetchFiles.mockResolvedValueOnce([
        buildFile({
          id: 'index.html',
          name: 'index.html',
          content: '<html></html>',
          language: 'html',
        }),
      ])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

      act(() => {
        result.current.openFile('index.html')
      })

      await act(async () => {
        await result.current.runCode()
      })

      expect(result.current.isTerminalOpen).toBe(true)
      expect(result.current.terminalOutput.some((entry) => entry.text.includes('HTML'))).toBe(true)
    })

    it('should show info for CSS files', async () => {
      mockFetchFiles.mockResolvedValueOnce([
        buildFile({
          id: 'style.css',
          name: 'style.css',
          content: '.test {}',
          language: 'css',
        }),
      ])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

      act(() => {
        result.current.openFile('style.css')
      })

      await act(async () => {
        await result.current.runCode()
      })

      expect(result.current.isTerminalOpen).toBe(true)
      expect(result.current.terminalOutput.some((entry) => entry.text.includes('CSS'))).toBe(true)
    })

    it('should execute JS/TS files', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"type":"log","text":"output"}\n\n'))
          controller.enqueue(new TextEncoder().encode('data: {"type":"exit","code":0}\n\n'))
          controller.close()
        },
      })

      mockRunFile.mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      })

      mockFetchFiles.mockResolvedValueOnce([
        buildFile({
          id: 'script.js',
          name: 'script.js',
          content: 'console.log("test")',
          language: 'javascript',
        }),
      ])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

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
        result.current.setTerminalOutput((previous) => [...previous, { type: 'error', text: 'Error occurred' }])
      })

      expect(result.current.terminalOutput).toHaveLength(2)
      expect(result.current.terminalOutput[1].type).toBe('error')
    })
  })

  describe('state setters', () => {
    it('should set files directly', () => {
      const { result } = renderLocalFilesHook()

      const newFiles: FileItem[] = [
        {
          id: 'direct.ts',
          name: 'direct.ts',
          content: 'direct',
          language: 'typescript' as Language,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      act(() => {
        result.current.setFiles(newFiles)
      })

      expect(result.current.files).toEqual(newFiles)
    })

    it('should set open tabs', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [
        buildFile({ id: 'a.ts', name: 'a.ts' }),
        buildFile({ id: 'b.ts', name: 'b.ts' }),
      ])

      act(() => {
        result.current.setOpenTabs(['a.ts', 'b.ts'])
      })

      expect(result.current.openTabs).toEqual(['a.ts', 'b.ts'])
    })

    it('should set active tab id', () => {
      const { result } = renderLocalFilesHook()
      seedFiles(result, [buildFile({ id: 'active.ts', name: 'active.ts' })])

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
      mockFetchFiles.mockResolvedValueOnce([
        buildFile({
          id: 'active.ts',
          name: 'active.ts',
          content: 'active content',
        }),
      ])

      const { result } = renderHook(() => useFiles())

      await waitFor(() => {
        expect(result.current.files).toHaveLength(1)
      })

      act(() => {
        result.current.openFile('active.ts')
      })

      expect(result.current.activeFile).toBeDefined()
      expect(result.current.activeFile?.id).toBe('active.ts')
    })
  })
})
