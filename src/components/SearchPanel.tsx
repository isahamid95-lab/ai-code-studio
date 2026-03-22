import React, { useState, useMemo } from 'react';
import { Search, FileCode2, X, ChevronRight } from 'lucide-react';
import { FileItem } from '../types';

interface SearchPanelProps {
  files: FileItem[];
  onOpenFile: (id: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ files, onOpenFile }) => {
  const [query, setQuery] = useState('');
  
  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    
    const searchResults: { file: FileItem; matches: { line: number; text: string }[] }[] = [];
    
    files.forEach(file => {
      const lines = file.content.split('\n');
      const matches: { line: number; text: string }[] = [];
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matches.push({ line: index + 1, text: line.trim() });
        }
      });
      
      if (matches.length > 0) {
        searchResults.push({ file, matches });
      }
    });
    
    return searchResults;
  }, [query, files]);

  return (
    <div className="flex flex-col h-full bg-background/40 backdrop-blur-xl border-r border-white/10 w-80 shrink-0">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-text/70 uppercase tracking-widest flex items-center gap-2">
            <Search size={14} className="text-primary" />
            Search
          </h2>
        </div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in all files..."
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder:text-text/20 focus:outline-none focus:border-primary/50 transition-all font-body"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text/40 hover:text-text cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="mt-2 text-[10px] text-text/30 flex items-center gap-2">
          <span>{results.length} files found</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {results.length === 0 && query.length >= 2 && (
          <div className="flex flex-col items-center justify-center h-40 text-text/20">
            <Search size={32} className="mb-2 opacity-20" />
            <p className="text-sm italic">No results found</p>
          </div>
        )}
        
        {results.map(({ file, matches }) => (
          <div key={file.id} className="mb-4">
            <div 
              onClick={() => onOpenFile(file.id)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-md cursor-pointer group transition-colors"
            >
              <ChevronRight size={12} className="text-text/20 transition-transform group-hover:translate-x-0.5" />
              <FileCode2 size={14} className="text-primary/60" />
              <span className="text-xs font-medium text-text/70 truncate">{file.name}</span>
              <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{matches.length}</span>
            </div>
            
            <div className="ml-6 space-y-1 mt-1">
              {matches.slice(0, 5).map((match, i) => (
                <div 
                  key={i}
                  onClick={() => onOpenFile(file.id)}
                  className="text-[11px] text-text/40 hover:text-text/70 cursor-pointer py-1 px-2 rounded hover:bg-white/5 truncate font-mono border-l border-white/5"
                >
                  <span className="text-primary/40 mr-2">{match.line}</span>
                  {match.text}
                </div>
              ))}
              {matches.length > 5 && (
                <div className="text-[10px] text-text/20 py-1 px-2 italic">
                  + {matches.length - 5} more matches
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
