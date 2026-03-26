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
    <div className="flex flex-col px-3 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Search size={13} className="text-primary/60" />
        <span className="text-[10px] font-semibold text-text/30 uppercase tracking-[0.15em]">Search</span>
      </div>
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in all files..."
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-text placeholder:text-text/20 focus:outline-none focus:border-primary/40 transition-all"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text/30 hover:text-text/60 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="text-[10px] text-text/20 mb-2">
        {query.length < 2 ? 'Type to search...' : `${results.length} files found`}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && query.length >= 2 && (
          <div className="flex flex-col items-center justify-center py-10 text-text/15">
            <Search size={28} className="mb-2" />
            <p className="text-[11px]">No results found</p>
          </div>
        )}
        
        {results.map(({ file, matches }) => (
          <div key={file.id} className="mb-3">
            <div 
              onClick={() => onOpenFile(file.id)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/[0.04] rounded-md cursor-pointer group transition-colors"
            >
              <ChevronRight size={10} className="text-text/15 transition-transform group-hover:translate-x-0.5" />
              <FileCode2 size={12} className="text-primary/50" />
              <span className="text-[11px] font-medium text-text/60 truncate">{file.name}</span>
              <span className="ml-auto text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{matches.length}</span>
            </div>
            
            <div className="ml-6 space-y-0.5 mt-1">
              {matches.slice(0, 5).map((match, i) => (
                <div 
                  key={i}
                  onClick={() => onOpenFile(file.id)}
                  className="text-[10px] text-text/30 hover:text-text/60 cursor-pointer py-1 px-2 rounded hover:bg-white/[0.03] truncate font-mono border-l border-white/[0.04]"
                >
                  <span className="text-primary/30 mr-2">{match.line}</span>
                  {match.text}
                </div>
              ))}
              {matches.length > 5 && (
                <div className="text-[9px] text-text/15 py-1 px-2">
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
