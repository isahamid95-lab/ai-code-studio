import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Code2, Hash, Box, GitBranch, List } from 'lucide-react';

interface SymbolItem {
  name: string;
  line: number;
  type: 'function' | 'class' | 'const' | 'import';
}

interface SymbolOutlineProps {
  content: string;
  onJumpToLine: (line: number) => void;
}

export const SymbolOutline: React.FC<SymbolOutlineProps> = ({ content, onJumpToLine }) => {
  const symbols = useMemo(() => {
    const lines = content.split('\n');
    const detected: SymbolItem[] = [];
    
    // Simple regex matching for common JS/TS/CSS symbols
    const rules = [
      { regex: /^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/, type: 'function' as const },
      { regex: /^(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/, type: 'function' as const },
      { regex: /^(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/, type: 'class' as const },
      { regex: /^(?:export\s+)?const\s+([a-zA-Z0-9_$]+)/, type: 'const' as const },
      { regex: /^import\s+.*\s+from\s+['"](.+)['"]/, type: 'import' as const },
      { regex: /^\s*([.][a-zA-Z0-9_-]+)\s*\{/, type: 'class' as const }, // CSS classes
    ];

    lines.forEach((line, index) => {
      for (const rule of rules) {
        const match = line.match(rule.regex);
        if (match && match[1]) {
          detected.push({
            name: match[1],
            line: index + 1,
            type: rule.type
          });
          break;
        }
      }
    });

    return detected;
  }, [content]);

  if (symbols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-4">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <List size={28} className="text-text/15" />
        </div>
        <p className="text-[11px] text-text/30">No symbols detected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-2 py-2">
      <div className="flex items-center gap-2 mb-2 px-1">
        <List size={13} className="text-primary/60" />
        <span className="text-[10px] font-semibold text-text/30 uppercase tracking-[0.15em]">Symbols</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {symbols.map((s, i) => (
          <motion.button
            key={`${s.name}-${i}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => onJumpToLine(s.line)}
            aria-label={`Jump to ${s.name} at line ${s.line}`}
            className="group w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.04] rounded-md transition-colors text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className={`p-1 rounded-md shrink-0 border border-transparent ${
              s.type === 'function' ? 'text-emerald-400 bg-emerald-500/[0.06] border-emerald-500/10' :
              s.type === 'class' ? 'text-blue-400 bg-blue-500/[0.06] border-blue-500/10' :
              s.type === 'const' ? 'text-amber-400 bg-amber-500/[0.06] border-amber-500/10' : 'text-text/40 bg-white/[0.04] border-white/[0.06]'
            }`}>
              {s.type === 'function' && <GitBranch size={10} />}
              {s.type === 'class' && <Box size={10} />}
              {s.type === 'const' && <Hash size={10} />}
              {s.type === 'import' && <Code2 size={10} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-text/60 truncate group-hover:text-text/90 transition-colors">{s.name}</div>
            </div>
            <div className="text-[9px] text-text/25 font-mono group-hover:text-primary/60 transition-colors shrink-0">L{s.line}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
