import React from 'react';
import { Code2, Settings, Play, Loader2, ImageIcon } from 'lucide-react';

interface HeaderProps {
  isGeneratingTheme: boolean;
  onGenerateBackground: () => void;
  onOpenSettings: () => void;
  onRunCode: () => void;
}

const Header = React.memo(function Header({
  isGeneratingTheme,
  onGenerateBackground,
  onOpenSettings,
  onRunCode,
}: HeaderProps) {
  return (
    <header className="glass-panel rounded-2xl h-16 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <Code2 size={24} />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white leading-tight">AI Code Studio Pro</h1>
          <p className="text-xs text-cyan-400/80 leading-tight">Glassmorphism Edition</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onGenerateBackground}
          disabled={isGeneratingTheme}
          className="glass-button flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 rounded-full disabled:opacity-50"
        >
          {isGeneratingTheme ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          <span>{isGeneratingTheme ? 'Generating Theme...' : 'Generate AI Theme'}</span>
        </button>

        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-full transition-all border border-white/10"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        <div className="w-px h-6 bg-white/10 mx-2"></div>

        <button 
          onClick={onRunCode}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-full transition-all border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
        >
          <Play size={14} className="fill-current" />
          <span>Run Code</span>
        </button>
      </div>
    </header>
  );
});

export default Header;
