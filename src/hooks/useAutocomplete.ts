import { useState, useCallback, useRef, useEffect } from 'react'
import { getAutocompleteSuggestions } from '@/src/services/autocomplete'

interface Suggestion {
  text: string
  displayText: string
  type: 'function' | 'variable' | 'property' | 'keyword' | 'snippet'
  documentation?: string
}

interface AutocompleteState {
  suggestions: Suggestion[]
  selectedIndex: number
  isVisible: boolean
  position: { top: number; left: number }
  prefix: string
}

export function useAutocomplete(
  code: string,
  cursorPosition: number,
  filename: string,
  language: string
) {
  const [state, setState] = useState<AutocompleteState>({
    suggestions: [],
    selectedIndex: 0,
    isVisible: false,
    position: { top: 0, left: 0 },
    prefix: ''
  })

  const requestRef = useRef<{
    code: string
    cursorPosition: number
    filename: string
    language: string
  } | null>(null)

  const updateSuggestions = useCallback(async () => {
    if (!requestRef.current) return

    const { code, cursorPosition, filename, language } = requestRef.current

    // Get prefix at cursor
    const prefixMatch = code.slice(0, cursorPosition).match(/[\w.]+$/)
    const prefix = prefixMatch?.[0] || ''

    if (prefix.length < 2) {
      setState(prev => ({ ...prev, suggestions: [], isVisible: false, prefix: '' }))
      return
    }

    try {
      const response = await getAutocompleteSuggestions({
        code,
        cursorPosition,
        filename,
        language
      })

      // Check if still relevant
      if (requestRef.current?.code !== code) return

      if (response.suggestions.length > 0) {
        setState(prev => ({
          ...prev,
          suggestions: response.suggestions,
          selectedIndex: 0,
          isVisible: true,
          prefix
        }))
      } else {
        setState(prev => ({ ...prev, suggestions: [], isVisible: false, prefix: '' }))
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
      setState(prev => ({ ...prev, suggestions: [], isVisible: false }))
    }
  }, [])

  // Trigger autocomplete on code/cursor change
  useEffect(() => {
    requestRef.current = { code, cursorPosition, filename, language }

    // Debounce
    const timer = setTimeout(updateSuggestions, 150)
    return () => clearTimeout(timer)
  }, [code, cursorPosition, filename, language, updateSuggestions])

  const selectNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: (prev.selectedIndex + 1) % prev.suggestions.length
    }))
  }, [])

  const selectPrevious = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: prev.selectedIndex === 0 
        ? prev.suggestions.length - 1 
        : prev.selectedIndex - 1
    }))
  }, [])

  const acceptSuggestion = useCallback((index?: number) => {
    const selected = state.suggestions[index ?? state.selectedIndex]
    if (!selected) return null

    // Calculate replacement
    const beforeCursor = code.slice(0, cursorPosition)
    const afterCursor = code.slice(cursorPosition)
    const prefixStart = beforeCursor.length - state.prefix.length

    const newCode = 
      beforeCursor.slice(0, prefixStart) + 
      selected.text + 
      afterCursor

    const newCursorPos = prefixStart + selected.text.length

    setState(prev => ({ ...prev, isVisible: false, suggestions: [] }))

    return { code: newCode, cursorPosition: newCursorPos }
  }, [code, cursorPosition, state.suggestions, state.selectedIndex, state.prefix])

  const hide = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }))
  }, [])

  const show = useCallback(() => {
    if (state.suggestions.length > 0) {
      setState(prev => ({ ...prev, isVisible: true }))
    }
  }, [state.suggestions.length])

  return {
    ...state,
    selectNext,
    selectPrevious,
    acceptSuggestion,
    hide,
    show
  }
}