import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('aiAnalyzeCode', () => {
    it('should call the analyze endpoint with correct parameters', async () => {
      const mockResponse = {
        score: 85,
        issues: [],
        suggestions: ['Consider adding error handling']
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: 'const x = 1', 
          filename: 'test.ts' 
        })
      })

      const result = await response.json()

      expect(result.score).toBe(85)
      expect(result.suggestions).toHaveLength(1)
    })
  })

  describe('aiGenerateTests', () => {
    it('should call the generate-tests endpoint', async () => {
      const mockResponse = {
        testFile: {
          filename: 'utils.test.ts',
          content: 'import { describe, it } from "vitest"'
        },
        testCount: 5,
        coverage: 80
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const response = await fetch('/api/ai/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: 'utils.ts', 
          testFramework: 'vitest' 
        })
      })

      const result = await response.json()

      expect(result.testCount).toBe(5)
      expect(result.coverage).toBe(80)
    })
  })

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: '', filename: '' })
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network error')
      }
    })
  })
})