import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Code2, Hash, Box, GitBranch } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Code2 size={24} className="text-text/10 mb-2" />
        <p className="text-xs text-text/30 italic">No symbols detected in this file.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-2">
      {symbols.map((s, i) => (
        <motion.button
          key={`${s.name}-${i}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => onJumpToLine(s.line)}
          className="group w-full flex items-center gap-3 px-5 py-2 hover:bg-white/5 transition-colors text-left"
        >
          <div className={`p-1 rounded-md bg-opacity-10 ${
            s.type === 'function' ? 'text-emerald-400 bg-emerald-400' :
            s.type === 'class' ? 'text-blue-400 bg-blue-400' :
            s.type === 'const' ? 'text-orange-400 bg-orange-400' : 'text-text/40 bg-white/10'
          }`}>
            {s.type === 'function' && <GitBranch size={12} />}
            {s.type === 'class' && <Box size={12} />}
            {s.type === 'const' && <Hash size={12} />}
            {s.type === 'import' && <Code2 size={12} />}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-medium text-text/80 truncate group-hover:text-text">{s.name}</div>
            <div className="text-[10px] text-text/30 group-hover:text-text/50">Line {s.line}</div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};
