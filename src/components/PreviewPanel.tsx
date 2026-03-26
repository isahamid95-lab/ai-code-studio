import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCcw, ExternalLink, X, Globe, Maximize2, Minimize2,
  Smartphone, Tablet as TabletIcon, Monitor,
} from 'lucide-react';
import { fetchProcesses } from '../services/api';

interface PreviewPanelProps {
  onClose: () => void;
  previewUrl: string | null;
  previewPort: number | null;
  onPreviewUnavailable: () => void;
}

const PreviewPanel = React.memo(function PreviewPanel({
  onClose,
  previewUrl,
  previewPort,
  onPreviewUnavailable,
}: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const normalizedUrl = useMemo(() => previewUrl ?? '', [previewUrl]);

  const handleRefresh = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const handleOpenExternal = () => {
    if (normalizedUrl) {
      window.open(normalizedUrl, '_blank');
    }
  };

  useEffect(() => {
    if (!normalizedUrl || previewPort === null) {
      return;
    }

    const checkPreviewProcess = async () => {
      try {
        const processes = await fetchProcesses();
        const hasPreviewProcess = processes.some((processInfo) => processInfo.kind === 'dev-server' && processInfo.port === previewPort);
        if (!hasPreviewProcess) {
          onPreviewUnavailable();
        }
      } catch (error) {
        console.error('Failed to refresh preview process state', error);
      }
    };

    void checkPreviewProcess();
    const intervalId = window.setInterval(() => {
      void checkPreviewProcess();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [normalizedUrl, onPreviewUnavailable, previewPort]);

  const previewFrame = normalizedUrl ? (
    <iframe
      key={refreshKey}
      src={normalizedUrl}
      className="w-full h-full border-none bg-white"
      title="Live Preview"
    />
  ) : (
    <div className="flex h-full items-center justify-center bg-black/20 text-sm text-text/40">
      No preview available — run a dev server first
    </div>
  );

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col"
      >
        <div className="flex items-center gap-3 px-4 py-2 bg-background/80 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-primary">
            <Globe size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Live Preview</span>
          </div>

          <div className="flex-1 text-xs text-text/35 truncate">{normalizedUrl || 'No preview available'}</div>

          <div className="flex items-center gap-1.5 px-3 border-x border-white/10 mx-2">
            <button
              onClick={() => setViewportMode('mobile')}
              aria-label="Mobile View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${viewportMode === 'mobile' ? 'bg-primary/20 text-primary' : 'text-text/40 hover:text-text hover:bg-white/5'}`}
              title="Mobile View"
            >
              <Smartphone size={14} />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              aria-label="Tablet View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${viewportMode === 'tablet' ? 'bg-primary/20 text-primary' : 'text-text/40 hover:text-text hover:bg-white/5'}`}
              title="Tablet View"
            >
              <TabletIcon size={14} />
            </button>
            <button
              onClick={() => setViewportMode('desktop')}
              aria-label="Desktop View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${viewportMode === 'desktop' ? 'bg-primary/20 text-primary' : 'text-text/40 hover:text-text hover:bg-white/5'}`}
              title="Desktop View"
            >
              <Monitor size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={handleRefresh} aria-label="Refresh" className="p-1.5 text-text/50 hover:text-text hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Refresh">
              <RefreshCcw size={14} />
            </button>
            <button onClick={handleOpenExternal} aria-label="Open in new tab" className="p-1.5 text-text/50 hover:text-text hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Open in new tab">
              <ExternalLink size={14} />
            </button>
            <button onClick={() => setIsFullscreen(false)} aria-label="Exit fullscreen" className="p-1.5 text-text/50 hover:text-text hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Exit fullscreen">
              <Minimize2 size={14} />
            </button>
            <button onClick={onClose} aria-label="Close preview" className="p-1.5 text-text/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Close">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full flex items-center justify-center p-8 overflow-hidden bg-black/20">
          <motion.div
            animate={{
              width: viewportMode === 'mobile' ? 375 : viewportMode === 'tablet' ? 768 : '100%',
              height: viewportMode === 'desktop' ? '100%' : '812px',
            }}
            className="bg-white rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
          >
            {previewFrame}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 350, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-col shrink-0"
    >
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-background/40 shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <Globe size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Live Preview</span>
        </div>

        <div className="flex-1 text-[11px] text-text/35 truncate">{normalizedUrl || 'No preview available'}</div>

        <div className="flex items-center gap-1">
          <button onClick={handleRefresh} aria-label="Refresh" className="p-1.5 text-text/40 hover:text-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Refresh">
            <RefreshCcw size={13} />
          </button>
          <button onClick={handleOpenExternal} aria-label="Open in new tab" className="p-1.5 text-text/40 hover:text-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Open in new tab">
            <ExternalLink size={13} />
          </button>
          <button onClick={() => setIsFullscreen(true)} aria-label="Fullscreen" className="p-1.5 text-text/40 hover:text-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Fullscreen">
            <Maximize2 size={13} />
          </button>
          <button onClick={onClose} aria-label="Close preview" className="p-1.5 text-text/40 hover:text-text transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary" title="Close">
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1">{previewFrame}</div>
    </motion.div>
  );
});

export default PreviewPanel;
