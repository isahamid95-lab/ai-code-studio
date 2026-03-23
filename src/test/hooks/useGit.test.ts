import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../services/api', () => ({
  gitInit: vi.fn(),
  gitGetStatus: vi.fn(),
  gitStage: vi.fn(),
  gitUnstage: vi.fn(),
  gitCommit: vi.fn(),
  gitSetRemote: vi.fn(),
  gitPush: vi.fn(),
  gitPull: vi.fn()
}))

import {
  gitInit,
  gitGetStatus,
  gitStage,
  gitUnstage,
  gitCommit,
  gitSetRemote,
  gitPush,
  gitPull
} from '../../services/api'
import { useGit } from '../../hooks/useGit'

const mockGitInit = gitInit as Mock
const mockGitGetStatus = gitGetStatus as Mock
const mockGitStage = gitStage as Mock
const mockGitUnstage = gitUnstage as Mock
const mockGitCommit = gitCommit as Mock
const mockGitSetRemote = gitSetRemote as Mock
const mockGitPush = gitPush as Mock
const mockGitPull = gitPull as Mock

describe('useGit Hook', () => {
  const mockFetchFiles = vi.fn()
  const mockSetTerminalOutput = vi.fn()
  const mockSetIsTerminalOpen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGitGetStatus.mockResolvedValue({
      currentBranch: 'main',
      staged: [],
      unstaged: [],
      untracked: [],
      remotes: []
    })
  })

  describe('initial state', () => {
    it('should have null git status initially', () => {
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      expect(result.current.gitStatus).toBeNull()
      expect(result.current.commitMessage).toBe('')
      expect(result.current.isGitLoading).toBe(false)
      expect(result.current.remoteUrl).toBe('')
    })
  })

  describe('fetchGitStatus', () => {
    it('should fetch and set git status', async () => {
      const mockStatus = {
        currentBranch: 'feature/test',
        staged: ['file1.ts'],
        unstaged: ['file2.ts'],
        untracked: ['file3.ts'],
        remotes: []
      }
      mockGitGetStatus.mockResolvedValueOnce(mockStatus)
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.fetchGitStatus()
      })
      
      expect(mockGitGetStatus).toHaveBeenCalled()
      expect(result.current.gitStatus).toEqual(mockStatus)
    })

    it('should set remote url from origin remote', async () => {
      mockGitGetStatus.mockResolvedValueOnce({
        currentBranch: 'main',
        remotes: [{ name: 'origin', refs: { push: 'https://github.com/user/repo.git' } }]
      })
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.fetchGitStatus()
      })
      
      expect(result.current.remoteUrl).toBe('https://github.com/user/repo.git')
    })

    it('should handle fetch errors gracefully', async () => {
      mockGitGetStatus.mockRejectedValueOnce(new Error('Git error'))
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.fetchGitStatus()
      })
      
      expect(result.current.gitStatus).toBeNull()
    })
  })

  describe('handleGitInit', () => {
    it('should initialize git repository', async () => {
      mockGitInit.mockResolvedValueOnce({})
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitInit()
      })
      
      expect(mockGitInit).toHaveBeenCalled()
      expect(mockGitGetStatus).toHaveBeenCalled()
    })

    it('should set loading to false after init completes', async () => {
      mockGitInit.mockResolvedValueOnce({})
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      expect(result.current.isGitLoading).toBe(false)
      
      await act(async () => {
        await result.current.handleGitInit()
      })
      
      expect(result.current.isGitLoading).toBe(false)
    })
  })

  describe('handleGitStage', () => {
    it('should stage a file', async () => {
      mockGitStage.mockResolvedValueOnce({})
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitStage('test.ts')
      })
      
      expect(mockGitStage).toHaveBeenCalledWith('test.ts')
      expect(mockGitGetStatus).toHaveBeenCalled()
    })
  })

  describe('handleGitUnstage', () => {
    it('should unstage a file', async () => {
      mockGitUnstage.mockResolvedValueOnce({})
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitUnstage('test.ts')
      })
      
      expect(mockGitUnstage).toHaveBeenCalledWith('test.ts')
      expect(mockGitGetStatus).toHaveBeenCalled()
    })
  })

  describe('handleGitCommit', () => {
    it('should commit with message', async () => {
      mockGitCommit.mockResolvedValueOnce({})
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      act(() => {
        result.current.setCommitMessage('Initial commit')
      })
      
      await act(async () => {
        await result.current.handleGitCommit()
      })
      
      expect(mockGitCommit).toHaveBeenCalledWith('Initial commit')
      expect(result.current.commitMessage).toBe('')
    })

    it('should not commit with empty message', async () => {
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitCommit()
      })
      
      expect(mockGitCommit).not.toHaveBeenCalled()
    })
  })

  describe('handleGitPush', () => {
    it('should push and show success message', async () => {
      mockGitPush.mockResolvedValueOnce({})
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitPush()
      })
      
      expect(mockGitPush).toHaveBeenCalled()
      expect(mockSetTerminalOutput).toHaveBeenCalled()
      expect(mockSetIsTerminalOpen).toHaveBeenCalledWith(true)
    })

    it('should show error message on push failure', async () => {
      mockGitPush.mockResolvedValueOnce({ error: 'Push failed' })
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitPush()
      })
      
      expect(mockSetTerminalOutput).toHaveBeenCalled()
    })
  })

  describe('handleGitPull', () => {
    it('should pull and refresh files', async () => {
      mockGitPull.mockResolvedValueOnce({})
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitPull()
      })
      
      expect(mockGitPull).toHaveBeenCalled()
      expect(mockFetchFiles).toHaveBeenCalled()
    })

    it('should show error message on pull failure', async () => {
      mockGitPull.mockResolvedValueOnce({ error: 'Pull failed' })
      
      const { result } = renderHook(() => useGit(
        mockFetchFiles,
        mockSetTerminalOutput,
        mockSetIsTerminalOpen
      ))
      
      await act(async () => {
        await result.current.handleGitPull()
      })
      
      expect(mockSetTerminalOutput).toHaveBeenCalled()
    })
  })
})