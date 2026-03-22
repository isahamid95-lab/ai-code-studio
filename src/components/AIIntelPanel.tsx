import React, { useState } from 'react';
import { 
  Zap, Shield, Bug, Search, Sparkles, 
  TestTube, RefreshCw, BookOpen, AlertCircle, 
  CheckCircle2, ChevronRight, Loader2, BarChart3,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FileItem } from '../types';
import { 
  aiAnalyzeCode, aiGenerateTests, aiRefactorCode, 
  aiExplainCode, aiOptimizeCode 
} from '../services/api';

interface AIIntelPanelProps {
  activeFile: FileItem | null;
  onRefreshWorkspace: () => void;
}

export function AIIntelPanel({ activeFile, onRefreshWorkspace }: AIIntelPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!activeFile) return;
    setLoading('analyze');
    try {
      const result = await aiAnalyzeCode(activeFile.content, activeFile.name);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateTests = async () => {
    if (!activeFile) return;
    setLoading('test');
    try {
      await aiGenerateTests(activeFile.id);
      onRefreshWorkspace();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleRefactor = async () => {
    if (!activeFile) return;
    if (!confirm('This will overwrite the current file with refactored code. Continue?')) return;
    setLoading('refactor');
    try {
      await aiRefactorCode(activeFile.id, ['clean code', 'performance', 'readability']);
      onRefreshWorkspace();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleOptimize = async () => {
    if (!activeFile) return;
    setLoading('optimize');
    try {
      const result = await aiOptimizeCode(activeFile.content, activeFile.name);
      // We could show a diff here in the future
      alert('Optimization suggestions received. Check console for details (UI in progress)');
      console.log('Optimized:', result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-text/20">
          <Sparkles size={32} />
        </div>
        <h3 className="text-sm font-medium text-text/40">Select a file to activate AI Intelligence</h3>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0a0a0a]/50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <Zap size={16} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-widest">AI Intelligence</h2>
          </div>
          {analysis && (
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${
              analysis.score > 80 ? 'bg-green-500/10 text-green-500' : 
              analysis.score > 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
            }`}>
              Score: {analysis.score}
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-2">
          <ActionButton 
            label="Analyze" 
            icon={<Search size={14} />} 
            loading={loading === 'analyze'} 
            onClick={handleAnalyze} 
          />
          <ActionButton 
            label="Generate Tests" 
            icon={<TestTube size={14} />} 
            loading={loading === 'test'} 
            onClick={handleGenerateTests} 
          />
          <ActionButton 
            label="Refactor" 
            icon={<RefreshCw size={14} />} 
            loading={loading === 'refactor'} 
            onClick={handleRefactor} 
          />
          <ActionButton 
            label="Optimize" 
            icon={<Rocket size={14} />} 
            loading={loading === 'optimize'} 
            onClick={handleOptimize} 
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        <AnimatePresence mode="wait">
          {!analysis && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-white/5 bg-white/2 text-center"
            >
              <BarChart3 className="mx-auto mb-2 text-text/20" size={24} />
              <p className="text-xs text-text/40 italic">Run analysis to see code quality metrics</p>
            </motion.div>
          )}

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-32 flex flex-col items-center justify-center gap-3 text-primary"
            >
              <Loader2 className="animate-spin" size={24} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Processing...</span>
            </motion.div>
          )}

          {analysis && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Issues */}
              <section>
                <h3 className="text-[10px] font-bold text-text/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={12} /> Detected Issues ({analysis.issues.length})
                </h3>
                <div className="space-y-2">
                  {analysis.issues.map((issue: any, i: number) => (
                    <IssueItem key={i} issue={issue} />
                  ))}
                  {analysis.issues.length === 0 && (
                    <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center gap-3">
                      <CheckCircle2 className="text-green-500" size={16} />
                      <span className="text-xs text-green-500/80 font-medium">No major issues detected!</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Suggestions */}
              <section>
                <h3 className="text-[10px] font-bold text-text/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles size={12} /> AI Suggestions
                </h3>
                <div className="space-y-2">
                  {analysis.suggestions.map((s: string, i: number) => (
                    <div key={i} className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight size={10} />
                      </div>
                      <p className="text-xs text-text/70 group-hover:text-text leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-white/2 border-t border-white/5">
        <p className="text-[9px] text-text/20 text-center uppercase tracking-widest">
          Powered by Intelligence Engine
        </p>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, loading, onClick }: { label: string, icon: React.ReactNode, loading: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`
        flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all
        ${loading ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text/60 hover:bg-white/10 hover:text-text border border-white/10'}
      `}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

function IssueItem({ issue }: { issue: any }) {
  const getSeverityColor = () => {
    switch(issue.severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getCategoryIcon = () => {
    switch(issue.category) {
      case 'security': return <Shield size={14} />;
      case 'bug': return <Bug size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:bg-white/2 ${getSeverityColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getCategoryIcon()}
          <span className="text-[10px] uppercase font-black">{issue.category}</span>
        </div>
        {issue.line && (
          <span className="text-[10px] font-mono opacity-60">Line {issue.line}</span>
        )}
      </div>
      <p className="text-xs font-medium leading-relaxed">{issue.message}</p>
      {issue.suggestion && (
        <div className="mt-2 p-3 rounded-lg bg-black/20 text-[11px] font-medium italic opacity-80 border-l-2 border-current">
          " {issue.suggestion} "
        </div>
      )}
    </div>
  );
}
