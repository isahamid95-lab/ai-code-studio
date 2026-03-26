import React from 'react';
import { ChevronRight, FileCode2, Home } from 'lucide-react';

interface BreadcrumbsProps {
  path: string;
  onNavigate?: (segment: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
  const segments = path.split('/').filter(Boolean);
  
  return (
    <div className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-medium text-text/30 bg-white/[0.01] border-b border-white/[0.04] overflow-x-auto no-scrollbar shrink-0">
      <button
        onClick={() => onNavigate?.('')}
        aria-label="Navigate to project root"
        className="flex items-center gap-1.5 hover:text-text/60 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
      >
        <Home size={11} />
        <span>project</span>
      </button>
      
      {segments.length > 0 && <ChevronRight size={9} className="shrink-0 text-text/15" />}
      
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast ? (
              <div
                className="flex items-center gap-1.5 transition-colors shrink-0 text-text/60"
              >
                <FileCode2 size={11} className="text-primary/60" />
                <span>{segment}</span>
              </div>
            ) : (
              <button
                onClick={() => onNavigate?.(segment)}
                aria-label={`Navigate to ${segment}`}
                className="flex items-center gap-1.5 transition-colors shrink-0 hover:text-text/60 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
              >
                <span>{segment}</span>
              </button>
            )}
            {!isLast && <ChevronRight size={9} className="shrink-0 text-text/15" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};
