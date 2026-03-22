import React from 'react';
import { ChevronRight, FileCode2, Home } from 'lucide-react';

interface BreadcrumbsProps {
  path: string;
  onNavigate?: (segment: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
  const segments = path.split('/').filter(Boolean);
  
  return (
    <div className="flex items-center gap-1 px-5 py-2 text-[11px] font-medium text-text/40 bg-background/20 border-b border-white/5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 hover:text-text/70 transition-colors cursor-pointer shrink-0">
        <Home size={12} />
        <span>project</span>
      </div>
      
      {segments.length > 0 && <ChevronRight size={10} className="shrink-0" />}
      
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <React.Fragment key={index}>
            <div 
              className={`flex items-center gap-1.5 transition-colors shrink-0 ${
                isLast ? 'text-primary' : 'hover:text-text/70 cursor-pointer'
              }`}
            >
              {isLast && <FileCode2 size={12} />}
              <span>{segment}</span>
            </div>
            {!isLast && <ChevronRight size={10} className="shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};
