import React from 'react';
import { Code2, Settings, Play, Download, Keyboard, Palette } from 'lucide-react';
import { exportWorkspaceAsZip } from '../utils/export';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenTheme: () => void;
  onRunCode: () => void;
  hasActiveFile: boolean;
}

const Header = React.memo(function Header({
  onOpenSettings,
  onOpenShortcuts,
  onOpenTheme,
  onRunCode,
  hasActiveFile,
}: HeaderProps) {
  const handleExport = async () => {
    await exportWorkspaceAsZip();
  };

  return (
    <header className="glass-panel rounded-2xl h-14 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative p-2 bg-primary/10 rounded-xl border border-primary/15">
          <Code2 size={20} className="text-primary" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-background" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-text">AI Code Studio</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenTheme}
          className="p-2.5 text-text/40 hover:text-text hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
          title="Theme Settings"
        >
          <Palette size={16} />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2.5 text-text/40 hover:text-text hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          onClick={onOpenShortcuts}
          className="p-2.5 text-text/40 hover:text-text hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
          title="Keyboard Shortcuts"
        >
          <Keyboard size={16} />
        </button>

        <button
          onClick={handleExport}
          className="p-2.5 text-text/40 hover:text-text hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
          title="Export Project"
        >
          <Download size={16} />
        </button>

        <div className="w-px h-5 bg-white/[0.06] mx-1" />

        <button
          onClick={onRunCode}
          disabled={!hasActiveFile}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
            hasActiveFile 
              ? 'bg-primary/15 text-primary hover:bg-primary/25 border-primary/20 cursor-pointer' 
              : 'bg-white/[0.02] text-text/20 border-white/[0.04] cursor-not-allowed'
          }`}
        >
          <Play size={13} className="fill-current" />
          <span>Run</span>
        </button>
      </div>
    </header>
  );
});

export default Header;
