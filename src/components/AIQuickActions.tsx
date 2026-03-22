import { useCallback } from 'react';
import { Sparkles, Bug, Zap, BookOpen, TestTube, Wrench } from 'lucide-react';

interface AIQuickActionsProps {
  selectedCode: string;
  activeFile: any;
  onAnalyze: () => void;
  onFindBugs: () => void;
  onRefactor: () => void;
  onExplain: () => void;
  onGenerateTests: () => void;
  onOptimize: () => void;
}

export default function AIQuickActions({
  selectedCode,
  activeFile,
  onAnalyze,
  onFindBugs,
  onRefactor,
  onExplain,
  onGenerateTests,
  onOptimize,
}: AIQuickActionsProps) {
  const hasSelection = selectedCode.length > 0;
  const hasFile = activeFile !== null;

  const handleAction = useCallback((action: () => void) => {
    if (!hasFile) {
      alert('Please open a file first');
      return;
    }
    action();
  }, [hasFile]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar bg-gradient-to-r from-purple-500/5 to-cyan-500/5">
      <span className="text-xs text-white/40 font-medium mr-1 uppercase tracking-wider">AI Tools</span>
      
      <button
        onClick={() => handleAction(onAnalyze)}
        disabled={!hasFile}
        className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-300 rounded-full whitespace-nowrap
                   bg-cyan-500/10 hover:bg-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Analyze code quality, bugs, and security issues"
      >
        <Sparkles size={12} className="group-hover:scale-110 transition-transform" />
        <span>Analyze</span>
      </button>

      <button
        onClick={() => handleAction(onFindBugs)}
        disabled={!hasFile}
        className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-300 rounded-full whitespace-nowrap
                   bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Find bugs and security vulnerabilities"
      >
        <Bug size={12} className="group-hover:scale-110 transition-transform" />
        <span>Find Bugs</span>
      </button>

      <button
        onClick={() => handleAction(onRefactor)}
        disabled={!hasFile}
        className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-300 rounded-full whitespace-nowrap
                   bg-emerald-500/10 hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refactor code for better quality"
      >
        <Wrench size={12} className="group-hover:scale-110 transition-transform" />
        <span>Refactor</span>
      </button>

      <button
        onClick={() => handleAction(onExplain)}
        disabled={!hasFile}
        className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-300 rounded-full whitespace-nowrap
                   bg-blue-500/10 hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Explain code in detail"
      >
        <BookOpen size={12} className="group-hover:scale-110 transition-transform" />
        <span>Explain</span>
      </button>

      <button
        onClick={() => handleAction(onGenerateTests)}
        disabled={!hasFile}
        className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-orange-300 rounded-full whitespace-nowrap
                   bg-orange-500/10 hover:bg-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate unit tests automatically"
      >
        <TestTube size={12} className="group-hover:scale-110 transition-transform" />
        <span>Tests</span>
      </button>

      <button
        onClick={() => handleAction(onOptimize)}
        disabled={!hasFile}
        className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-yellow-300 rounded-full whitespace-nowrap
                   bg-yellow-500/10 hover:bg-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Optimize for performance"
      >
        <Zap size={12} className="group-hover:scale-110 transition-transform" />
        <span>Optimize</span>
      </button>

      {hasSelection && (
        <span className="text-xs text-white/30 ml-2">
          ({selectedCode.length} chars selected)
        </span>
      )}
    </div>
  );
}
