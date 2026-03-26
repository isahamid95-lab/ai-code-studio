import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Check, Moon, Sun, X } from 'lucide-react'
import { themes, applyTheme, getStoredTheme, getDefaultTheme, type Theme } from '@/src/themes'

interface ThemeSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export default function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getDefaultTheme())

  useEffect(() => {
    const stored = getStoredTheme()
    if (stored) {
      setCurrentTheme(stored)
    }
  }, [])

  const handleSelectTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  const groupedThemes = {
    dark: themes.filter(t => t.id !== 'light'),
    light: themes.filter(t => t.id === 'light')
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden bg-background">
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/15 text-primary">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-text uppercase tracking-widest">Theme Settings</h2>
                    <p className="text-[11px] text-text/50">Choose your preferred color scheme</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close theme settings"
                  className="p-2 text-text/30 hover:text-text hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                {/* Dark Themes */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon size={14} className="text-text/40" />
                    <span className="text-[10px] font-bold text-text/40 uppercase tracking-[0.15em]">Dark Themes</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {groupedThemes.dark.map(theme => (
                      <ThemeCard 
                        key={theme.id}
                        theme={theme}
                        isSelected={currentTheme.id === theme.id}
                        onSelect={() => handleSelectTheme(theme)}
                      />
                    ))}
                  </div>
                </div>

                {/* Light Themes */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sun size={14} className="text-text/40" />
                    <span className="text-[10px] font-bold text-text/40 uppercase tracking-[0.15em]">Light Themes</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {groupedThemes.light.map(theme => (
                      <ThemeCard 
                        key={theme.id}
                        theme={theme}
                        isSelected={currentTheme.id === theme.id}
                        onSelect={() => handleSelectTheme(theme)}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      />
                      <span className="text-[13px] text-text font-medium">{currentTheme.name}</span>
                    </div>
                    <span className="text-[11px] text-text/50">{currentTheme.description}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ThemeCard({ theme, isSelected, onSelect }: { 
  theme: Theme
  isSelected: boolean
  onSelect: () => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative p-3 rounded-xl border transition-all text-left cursor-pointer
        ${isSelected 
          ? 'border-primary/40 bg-primary/10 ring-1 ring-primary/20' 
          : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]'
        }
      `}
    >
      {/* Color Preview */}
      <div className="flex gap-1.5 mb-3">
        <div 
          className="w-4 h-4 rounded-full shadow-sm"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div 
          className="w-4 h-4 rounded-full shadow-sm"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div 
          className="w-4 h-4 rounded-full shadow-sm"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div 
          className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
          style={{ backgroundColor: theme.colors.background }}
        />
      </div>
      
      {/* Name */}
      <span className="text-[12px] font-semibold text-text block">{theme.name}</span>
      
      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-primary"
        >
          <Check size={10} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  )
}