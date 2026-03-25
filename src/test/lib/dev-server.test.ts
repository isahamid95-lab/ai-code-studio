import { describe, expect, it, vi } from 'vitest'
import {
  detectPortFromOutput,
  isDevServerCommand,
  preflightDevServerStart,
} from '../../../lib/dev-server'

describe('dev-server helpers', () => {
  it('detects dev server commands', () => {
    expect(isDevServerCommand('npm run dev')).toBe(true)
    expect(isDevServerCommand('vite')).toBe(true)
    expect(isDevServerCommand('yarn start')).toBe(true)
    expect(isDevServerCommand('node server.js')).toBe(true)
    expect(isDevServerCommand('echo hello')).toBe(false)
  })

  it('detects ports from command output', () => {
    expect(detectPortFromOutput('Local: http://localhost:5173/')).toBe(5173)
    expect(detectPortFromOutput('Server running on port 3000')).toBe(3000)
    expect(detectPortFromOutput('listening on :8080')).toBe(8080)
  })

  it('allows new dev server start when none running', async () => {
    const result = await preflightDevServerStart(
      'npm run dev',
      [],
      vi.fn(async () => true),
    )

    expect(result.shouldStart).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.killPids).toBeUndefined()
  })

  it('returns error when dev server already running', async () => {
    const result = await preflightDevServerStart(
      'npm run dev',
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

    expect(result.shouldStart).toBe(false)
    expect(result.error).toContain('Dev server already running')
    expect(result.killPids).toEqual([42])
  })

  it('allows multiple dev servers with different commands', async () => {
    const result = await preflightDevServerStart(
      'vite',
      [
        {
          pid: 10,
          command: 'npm run dev',
          kind: 'dev-server',
          port: 5173,
          spawnedAt: Date.now(),
        },
      ],
      vi.fn(async () => true),
    )

    expect(result.shouldStart).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
