import { useState } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { ChatMessage, LogEntry } from '../../types'

vi.mock('../../services/api', () => ({
  streamAgentRequest: vi.fn(),
}))

import { streamAgentRequest } from '../../services/api'
import { useAgent } from '../../hooks/useAgent'

const mockStreamAgentRequest = streamAgentRequest as Mock

function useAgentHarness(onRefreshFiles: Mock, onServerStarted: Mock) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<LogEntry[]>([])
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

  const agent = useAgent({
    model: 'qwen-plus',
    files: [{ id: 'src/App.tsx' }],
    activeFileId: 'src/App.tsx',
    setChatMessages,
    setIsGenerating,
    setIsAgentRunning,
    setTerminalOutput,
    setIsTerminalOpen,
    onRefreshFiles,
    onServerStarted,
  })

  return {
    ...agent,
    chatMessages,
    isGenerating,
    isAgentRunning,
    terminalOutput,
    isTerminalOpen,
  }
}

describe('useAgent Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a dedicated plan message and streamed response text', async () => {
    const onRefreshFiles = vi.fn(() => Promise.resolve())
    const onServerStarted = vi.fn()

    mockStreamAgentRequest.mockImplementationOnce(async (_model, _messages, _mode, onEvent) => {
      await onEvent({ type: 'plan', content: '1. Scaffold the project' })
      await onEvent({ type: 'text', content: 'Building now' })
      await onEvent({ type: 'done' })
    })

    const { result } = renderHook(() => useAgentHarness(onRefreshFiles, onServerStarted))

    await act(async () => {
      await result.current.sendAgentMessage('Create an app', 'plan')
    })

    const planMessage = result.current.chatMessages.find((message) => message.variant === 'plan')
    const responseMessage = result.current.chatMessages.find((message) => message.role === 'model' && message.variant !== 'plan')

    expect(planMessage?.text).toContain('1. Scaffold the project')
    expect(responseMessage?.text).toContain('Building now')
    expect(onRefreshFiles).toHaveBeenCalledTimes(1)
  })

  it('debounces multiple file events into a single final refresh', async () => {
    const onRefreshFiles = vi.fn(() => Promise.resolve())
    const onServerStarted = vi.fn()

    mockStreamAgentRequest.mockImplementationOnce(async (_model, _messages, _mode, onEvent) => {
      await onEvent({ type: 'file_created', filename: 'src/App.tsx' })
      await onEvent({ type: 'file_edited', filename: 'src/main.tsx' })
      await onEvent({ type: 'done' })
    })

    const { result } = renderHook(() => useAgentHarness(onRefreshFiles, onServerStarted))

    await act(async () => {
      await result.current.sendAgentMessage('Update files', 'agent')
    })

    expect(onRefreshFiles).toHaveBeenCalledTimes(1)
  })

  it('ignores stale events from a previous run', async () => {
    const onRefreshFiles = vi.fn(() => Promise.resolve())
    const onServerStarted = vi.fn()
    let firstOnEvent: ((event: any) => Promise<void>) | null = null
    let secondOnEvent: ((event: any) => Promise<void>) | null = null
    let resolveFirst: (() => void) | null = null
    let resolveSecond: (() => void) | null = null

    mockStreamAgentRequest
      .mockImplementationOnce(async (_model, _messages, _mode, onEvent) => new Promise<void>((resolve) => {
        firstOnEvent = onEvent
        resolveFirst = resolve
      }))
      .mockImplementationOnce(async (_model, _messages, _mode, onEvent) => new Promise<void>((resolve) => {
        secondOnEvent = onEvent
        resolveSecond = resolve
      }))

    const { result } = renderHook(() => useAgentHarness(onRefreshFiles, onServerStarted))
    let firstRun!: Promise<void>
    let secondRun!: Promise<void>

    await act(async () => {
      firstRun = result.current.sendAgentMessage('First task', 'agent')
      await Promise.resolve()
    })

    await act(async () => {
      secondRun = result.current.sendAgentMessage('Second task', 'agent')
      await Promise.resolve()
    })

    await act(async () => {
      await firstOnEvent?.({ type: 'text', content: 'stale output' })
      resolveFirst?.()
      await Promise.resolve()
    })

    await act(async () => {
      await secondOnEvent?.({ type: 'text', content: 'fresh output' })
      await secondOnEvent?.({ type: 'done' })
      resolveSecond?.()
      await Promise.all([firstRun, secondRun])
    })

    await waitFor(() => {
      const modelMessages = result.current.chatMessages
        .filter((message) => message.role === 'model')
        .map((message) => message.text)
        .join('\n')

      expect(modelMessages).toContain('fresh output')
      expect(modelMessages).not.toContain('stale output')
    })
  })
})
