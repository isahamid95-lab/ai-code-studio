import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Check, Monitor, Moon, Sun } from 'lucide-react'
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Palette className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text">Theme Settings</h2>
                    <p className="text-xs text-text/50">Choose your preferred color scheme</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-text/50 hover:text-text text-xl">×</span>
                </button>
              </div>

              {/* Dark Themes */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Moon size={14} className="text-text/50" />
                  <span className="text-xs font-semibold text-text/50 uppercase tracking-wider">Dark Themes</span>
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
                  <Sun size={14} className="text-text/50" />
                  <span className="text-xs font-semibold text-text/50 uppercase tracking-wider">Light Themes</span>
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
              <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: currentTheme.colors.primary }}
                    />
                    <span className="text-sm text-text font-medium">{currentTheme.name}</span>
                  </div>
                  <span className="text-xs text-text/50">{currentTheme.description}</span>
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
        relative p-3 rounded-xl border transition-all text-left
        ${isSelected 
          ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/30' 
          : 'border-white/10 bg-white/5 hover:bg-white/10'
        }
      `}
    >
      {/* Color Preview */}
      <div className="flex gap-1 mb-2">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div 
          className="w-4 h-4 rounded-full border border-white/20"
          style={{ backgroundColor: theme.colors.background }}
        />
      </div>
      
      {/* Name */}
      <span className="text-xs font-medium text-text block">{theme.name}</span>
      
      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 p-1 rounded-full bg-primary"
        >
          <Check size={10} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  )
}