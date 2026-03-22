import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCcw, ExternalLink, X, Globe, Maximize2, Minimize2
} from 'lucide-react';

interface PreviewPanelProps {
  onClose: () => void;
}

const PreviewPanel = React.memo(function PreviewPanel({ onClose }: PreviewPanelProps) {
  const [previewUrl, setPreviewUrl] = useState('/preview/index.html');
  const [urlInput, setUrlInput] = useState('index.html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const path = urlInput.startsWith('/') ? urlInput.slice(1) : urlInput;
    setPreviewUrl(`/preview/${path}`);
  };

  const handleOpenExternal = () => {
    window.open(previewUrl, '_blank');
  };

  // Auto-refresh on interval (poll for changes)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-black/60 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-cyan-400">
            <Globe size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Live Preview</span>
          </div>
          
          <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center mx-4">
            <div className="flex items-center flex-1 bg-black/40 border border-white/10 rounded-lg overflow-hidden">
              <span className="text-xs text-white/30 px-3 border-r border-white/10">/preview/</span>
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="flex-1 text-xs text-white bg-transparent px-2 py-1.5 outline-none"
                placeholder="index.html"
              />
            </div>
          </form>

          <div className="flex items-center gap-1.5">
            <button onClick={handleRefresh} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Refresh">
              <RefreshCcw size={14} />
            </button>
            <button onClick={handleOpenExternal} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Open in new tab">
              <ExternalLink size={14} />
            </button>
            <button onClick={() => setIsFullscreen(false)} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Exit fullscreen">
              <Minimize2 size={14} />
            </button>
            <button onClick={onClose} className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Close">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          key={refreshKey}
          src={previewUrl}
          className="flex-1 w-full border-none bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Live Preview"
        />
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
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
        <div className="flex items-center gap-2 text-cyan-400">
          <Globe size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Live Preview</span>
        </div>
        
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center mx-3">
          <div className="flex items-center flex-1 bg-black/40 border border-white/10 rounded-lg overflow-hidden">
            <span className="text-[10px] text-white/30 px-2 border-r border-white/10">/preview/</span>
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="flex-1 text-xs text-white bg-transparent px-2 py-1 outline-none"
              placeholder="index.html"
            />
          </div>
        </form>

        <div className="flex items-center gap-1">
          <button onClick={handleRefresh} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Refresh">
            <RefreshCcw size={13} />
          </button>
          <button onClick={handleOpenExternal} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Open in new tab">
            <ExternalLink size={13} />
          </button>
          <button onClick={() => setIsFullscreen(true)} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Fullscreen">
            <Maximize2 size={13} />
          </button>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Close">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        key={refreshKey}
        src={previewUrl}
        className="flex-1 w-full border-none bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title="Live Preview"
      />
    </motion.div>
  );
});

export default PreviewPanel;
