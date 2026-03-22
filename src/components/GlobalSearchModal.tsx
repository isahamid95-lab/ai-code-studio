import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileCode2, X, Command, CornerDownLeft } from 'lucide-react'
import type { FileItem } from '@/src/types'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  files: FileItem[]
  onOpenFile: (id: string) => void
}

interface SearchResult {
  file: FileItem
  matches: Array<{
    line: number
    text: string
    startCol: number
    endCol: number
  }>
}

export default function GlobalSearchModal({ isOpen, onClose, files, onOpenFile }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [useRegex, setUseRegex] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const results = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return []

    const searchResults: SearchResult[] = []

    files.forEach(file => {
      const lines = file.content.split('\n')
      const matches: SearchResult['matches'] = []

      lines.forEach((line, lineIndex) => {
        try {
          if (useRegex) {
            const regex = new RegExp(query, caseSensitive ? 'g' : 'gi')
            let match
            while ((match = regex.exec(line)) !== null) {
              matches.push({
                line: lineIndex + 1,
                text: line.trim(),
                startCol: match.index,
                endCol: match.index + match[0].length
              })
            }
          } else {
            const searchLine = caseSensitive ? line : line.toLowerCase()
            const searchQuery = caseSensitive ? query : query.toLowerCase()
            let index = 0

            while ((index = searchLine.indexOf(searchQuery, index)) !== -1) {
              matches.push({
                line: lineIndex + 1,
                text: line.trim(),
                startCol: index,
                endCol: index + query.length
              })
              index += 1
            }
          }
        } catch { /* Invalid regex - skip */ }
      })

      if (matches.length > 0) {
        searchResults.push({ file, matches })
      }
    })

    return searchResults.slice(0, 20)
  }, [query, files, useRegex, caseSensitive])

  const totalMatches = useMemo(() => 
    results.reduce((sum, r) => sum + r.matches.length, 0),
    [results]
  )

  const flatResults = useMemo(() => 
    results.flatMap(r => 
      r.matches.slice(0, 3).map(m => ({ ...r, match: m }))
    ),
    [results]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault()
      onOpenFile(flatResults[selectedIndex].file.id)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const highlightMatch = (text: string, startCol: number, endCol: number) => {
    const displayText = text.slice(0, 100)
    const adjustedStart = Math.min(startCol, displayText.length)
    const adjustedEnd = Math.min(endCol, displayText.length)

    return (
      <>
        {displayText.slice(0, adjustedStart)}
        <span className="bg-primary/30 text-primary rounded px-0.5">
          {displayText.slice(adjustedStart, adjustedEnd)}
        </span>
        {displayText.slice(adjustedEnd)}
      </>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl"
          >
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search className="text-primary shrink-0" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search files... (supports regex)"
                  className="flex-1 bg-transparent text-text placeholder:text-text/30 outline-none text-sm"
                />
                
                {/* Options */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCaseSensitive(!caseSensitive)}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      caseSensitive ? 'bg-primary/20 text-primary' : 'text-text/30 hover:text-text/50'
                    }`}
                  >
                    Aa
                  </button>
                  <button
                    onClick={() => setUseRegex(!useRegex)}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      useRegex ? 'bg-primary/20 text-primary' : 'text-text/30 hover:text-text/50'
                    }`}
                  >
                    .*
                  </button>
                </div>

                <button onClick={onClose} className="text-text/30 hover:text-text">
                  <X size={18} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {query.length >= 2 && (
                  <div className="p-2 border-b border-white/5">
                    <span className="text-xs text-text/40">
                      {totalMatches} results in {results.length} files
                    </span>
                  </div>
                )}

                {flatResults.length === 0 && query.length >= 2 && (
                  <div className="p-8 text-center">
                    <Search className="mx-auto mb-3 text-text/20" size={32} />
                    <p className="text-sm text-text/40">No results found</p>
                  </div>
                )}

                {flatResults.map((result, index) => (
                  <div
                    key={`${result.file.id}-${result.match.line}-${index}`}
                    onClick={() => {
                      onOpenFile(result.file.id)
                      onClose()
                    }}
                    className={`
                      flex items-start gap-3 p-3 cursor-pointer transition-colors
                      ${index === selectedIndex ? 'bg-primary/10' : 'hover:bg-white/5'}
                    `}
                  >
                    <FileCode2 className="text-primary/60 mt-0.5 shrink-0" size={16} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text truncate">
                          {result.file.name}
                        </span>
                        <span className="text-[10px] text-text/30">
                          Line {result.match.line}
                        </span>
                      </div>
                      <div className="text-xs text-text/50 font-mono truncate">
                        {highlightMatch(result.match.text, result.match.startCol, result.match.endCol)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-3 border-t border-white/10 text-[10px] text-text/30">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Command size={10} />K to close
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft size={10} /> to open
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1 bg-white/10 rounded">↑↓</span>
                  <span>to navigate</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}