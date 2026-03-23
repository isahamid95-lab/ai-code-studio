import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

class MockSocket {
  readyState = 0
  send = vi.fn()
  close = vi.fn(() => {
    this.emit('close')
  })
  private listeners = new Map<string, Array<(event?: any) => void>>()

  addEventListener(event: string, listener: (event?: any) => void) {
    const listeners = this.listeners.get(event) ?? []
    listeners.push(listener)
    this.listeners.set(event, listeners)
  }

  emit(event: string, payload?: any) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(payload)
    }
  }
}

const { terminalWriteln } = vi.hoisted(() => ({
  terminalWriteln: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  createTerminalSocket: vi.fn(),
}))

vi.mock('@xterm/xterm', () => ({
  Terminal: class MockTerminal {
    loadAddon = vi.fn()
    open = vi.fn()
    onData = vi.fn()
    writeln = terminalWriteln
    write = vi.fn()
    dispose = vi.fn()
  },
}))

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class MockFitAddon {
    fit = vi.fn()
  },
}))

vi.mock('@xterm/xterm/css/xterm.css', () => ({}))

import { createTerminalSocket } from '../../services/api'
import TerminalPanel from '../../components/TerminalPanel'

const mockCreateTerminalSocket = createTerminalSocket as Mock

describe('TerminalPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not open the terminal socket while the Agent Output tab is active', () => {
    render(
      <TerminalPanel
        onClose={vi.fn()}
        logs={[{ type: 'info', text: 'hello', timestamp: Date.now() }]}
        isAgentRunning={true}
      />,
    )

    expect(mockCreateTerminalSocket).not.toHaveBeenCalled()
    expect(screen.getByText('Agent Output')).toBeInTheDocument()
  })

  it('opens the terminal socket when the Terminal tab is activated and shows reconnect state on close', async () => {
    const socket = new MockSocket()
    mockCreateTerminalSocket.mockReturnValue(socket)

    render(
      <TerminalPanel
        onClose={vi.fn()}
        logs={[]}
        isAgentRunning={true}
      />,
    )

    fireEvent.click(screen.getByText('Terminal'))

    await waitFor(() => {
      expect(mockCreateTerminalSocket).toHaveBeenCalledTimes(1)
    })

    act(() => {
      socket.readyState = WebSocket.OPEN
      socket.emit('open')
      socket.emit('close')
    })

    expect(screen.getByText('Reconnect available')).toBeInTheDocument()
    expect(terminalWriteln).toHaveBeenCalled()
  })
})
