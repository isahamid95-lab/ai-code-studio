import { render, screen, waitFor, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

vi.mock('../../services/api', () => ({
  fetchProcesses: vi.fn(),
}))

import { fetchProcesses } from '../../services/api'
import PreviewPanel from '../../components/PreviewPanel'

const mockFetchProcesses = fetchProcesses as Mock

describe('PreviewPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the empty preview state when no preview is available', () => {
    render(
      <PreviewPanel
        onClose={vi.fn()}
        previewUrl={null}
        previewPort={null}
        onPreviewUnavailable={vi.fn()}
      />,
    )

    expect(screen.getByText('No preview available — run a dev server first')).toBeInTheDocument()
  })

  it('clears preview when the tracked managed process disappears', async () => {
    vi.useFakeTimers()

    mockFetchProcesses
      .mockResolvedValueOnce([
        {
          pid: 1,
          command: 'npm run dev',
          kind: 'dev-server',
          port: 5173,
          spawnedAt: Date.now(),
        },
      ])
      .mockResolvedValueOnce([])

    const onPreviewUnavailable = vi.fn()

    render(
      <PreviewPanel
        onClose={vi.fn()}
        previewUrl="http://localhost:5173"
        previewPort={5173}
        onPreviewUnavailable={onPreviewUnavailable}
      />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(mockFetchProcesses).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(onPreviewUnavailable).toHaveBeenCalledTimes(1)
  })
})
