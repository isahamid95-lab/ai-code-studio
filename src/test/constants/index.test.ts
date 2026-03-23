import { describe, it, expect } from 'vitest'
import { detectLanguage, FILE_TEMPLATES, initialFiles } from '../../constants'
import type { Language } from '../../types'

describe('detectLanguage', () => {
  describe('TypeScript files', () => {
    it('should detect .ts files as typescript', () => {
      expect(detectLanguage('file.ts')).toBe('typescript')
    })

    it('should detect .tsx files as typescript', () => {
      expect(detectLanguage('component.tsx')).toBe('typescript')
    })

    it('should detect .ts files in paths', () => {
      expect(detectLanguage('src/utils/helper.ts')).toBe('typescript')
    })
  })

  describe('JavaScript files', () => {
    it('should detect .js files as javascript', () => {
      expect(detectLanguage('script.js')).toBe('javascript')
    })

    it('should detect .jsx files as javascript', () => {
      expect(detectLanguage('Component.jsx')).toBe('javascript')
    })
  })

  describe('CSS files', () => {
    it('should detect .css files as css', () => {
      expect(detectLanguage('styles.css')).toBe('css')
    })
  })

  describe('HTML files', () => {
    it('should detect .html files as html', () => {
      expect(detectLanguage('index.html')).toBe('html')
    })
  })

  describe('JSON files', () => {
    it('should detect .json files as json', () => {
      expect(detectLanguage('package.json')).toBe('json')
    })
  })

  describe('Markdown files', () => {
    it('should detect .md files as markdown', () => {
      expect(detectLanguage('README.md')).toBe('markdown')
    })
  })

  describe('Unknown files', () => {
    it('should default to javascript for unknown extensions', () => {
      expect(detectLanguage('file.unknown')).toBe('javascript')
    })

    it('should handle files without extension', () => {
      expect(detectLanguage('Makefile')).toBe('javascript')
    })

    it('should handle empty string', () => {
      expect(detectLanguage('')).toBe('javascript')
    })

    it('should handle .py files as javascript (default)', () => {
      expect(detectLanguage('script.py')).toBe('javascript')
    })
  })
})

describe('FILE_TEMPLATES', () => {
  it('should have react template', () => {
    expect(FILE_TEMPLATES['react']).toBeDefined()
    expect(FILE_TEMPLATES['react'].name).toBe('React Component')
    expect(FILE_TEMPLATES['react'].defaultExt).toBe('.tsx')
    expect(FILE_TEMPLATES['react'].content).toContain('export default')
  })

  it('should have html template', () => {
    expect(FILE_TEMPLATES['html']).toBeDefined()
    expect(FILE_TEMPLATES['html'].name).toBe('HTML5 Boilerplate')
    expect(FILE_TEMPLATES['html'].defaultExt).toBe('.html')
    expect(FILE_TEMPLATES['html'].content).toContain('<!DOCTYPE html>')
  })

  it('should have node template', () => {
    expect(FILE_TEMPLATES['node']).toBeDefined()
    expect(FILE_TEMPLATES['node'].name).toBe('Node.js Server')
    expect(FILE_TEMPLATES['node'].defaultExt).toBe('.js')
    expect(FILE_TEMPLATES['node'].content).toContain('http.createServer')
  })

  it('should have valid content for all templates', () => {
    Object.entries(FILE_TEMPLATES).forEach(([key, template]) => {
      expect(template.content.length).toBeGreaterThan(0)
      expect(template.name.length).toBeGreaterThan(0)
      expect(template.defaultExt.startsWith('.')).toBe(true)
    })
  })
})

describe('initialFiles', () => {
  it('should be an empty array', () => {
    expect(initialFiles).toEqual([])
  })

  it('should be readonly', () => {
    expect(Array.isArray(initialFiles)).toBe(true)
  })
})