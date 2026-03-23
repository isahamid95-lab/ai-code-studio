import { describe, expect, it, vi } from 'vitest'
import {
  detectPortFromOutput,
  parseRequestedPort,
  preflightDevServerStart,
} from '../../../lib/dev-server'

describe('dev-server helpers', () => {
  it('parses requested ports from common command formats', () => {
    expect(parseRequestedPort('npm run dev -- --port 5173')).toBe(5173)
    expect(parseRequestedPort('vite --port=4173')).toBe(4173)
    expect(parseRequestedPort('PORT=3001 npm run dev')).toBe(3001)
  })

  it('detects ports from command output', () => {
    expect(detectPortFromOutput('Local: http://localhost:5173/')).toBe(5173)
    expect(detectPortFromOutput('Server running on port 3000')).toBe(3000)
  })

  it('replaces a managed dev server already using the requested port', async () => {
    const result = await preflightDevServerStart(
      'npm run dev -- --port 5173',
      [
        {
          pid: 42,
          command: 'npm run dev',
          kind: 'dev-server',
          port: 5173,
          spawnedAt: Date.now(),
        },
      ],
      vi.fn(async () => true),
    )

    expect(result).toEqual({
      requestedPort: 5173,
      killPids: [42],
    })
  })

  it('returns an error when an external process owns the requested port', async () => {
    const isPortAvailable = vi.fn(async () => false)

    const result = await preflightDevServerStart(
      'npm run dev -- --port=5173',
      [],
      isPortAvailable,
    )

    expect(result.killPids).toEqual([])
    expect(result.requestedPort).toBe(5173)
    expect(result.error).toContain('Port 5173 is already in use')
    expect(isPortAvailable).toHaveBeenCalledWith(5173)
  })

  it('replaces all managed dev servers when no explicit port is requested', async () => {
    const result = await preflightDevServerStart(
      'npm run dev',
      [
        {
          pid: 10,
          command: 'npm run dev',
          kind: 'dev-server',
          port: 5173,
          spawnedAt: Date.now(),
        },
        {
          pid: 11,
          command: 'vite --host',
          kind: 'dev-server',
          port: 4173,
          spawnedAt: Date.now(),
        },
      ],
      vi.fn(async () => true),
    )

    expect(result.killPids).toEqual([10, 11])
    expect(result.requestedPort).toBeUndefined()
    expect(result.error).toBeUndefined()
  })
})
