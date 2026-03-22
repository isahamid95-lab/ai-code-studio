import React from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  alibabaApiKey: string;
  alibabaModel: string;
  onSetAlibabaApiKey: (val: string) => void;
  onSetAlibabaModel: (val: string) => void;
  onClose: () => void;
}

const SettingsModal = React.memo(function SettingsModal({
  alibabaApiKey,
  alibabaModel,
  onSetAlibabaApiKey,
  onSetAlibabaModel,
  onClose,
}: SettingsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Settings
          </h2>
          <button onClick={onClose} className="text-text/40 hover:text-text transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex flex-col gap-4 overflow-hidden"
          >
               <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text/80">API Key</label>
                <input
                  type="password"
                  value={alibabaApiKey}
                  onChange={(e) => onSetAlibabaApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-secondary/40 text-sm text-text px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-primary/50 transition-colors"
                />
                <p className="text-xs text-text/40">Your key is stored locally in your browser session.</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text/80">Model</label>
                <select
                  value={alibabaModel}
                  onChange={(e) => onSetAlibabaModel(e.target.value)}
                  className="w-full bg-secondary/40 text-sm text-text px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-primary/50 transition-colors"
                >
                  <optgroup label="Qwen">
                    <option value="qwen3-coder-plus">qwen3-coder-plus (Önerilen)</option>
                    <option value="qwen3-coder-next">qwen3-coder-next</option>
                    <option value="qwen3-max-2026-01-23">qwen3-max (Deep Thinking)</option>
                    <option value="qwen3.5-plus">qwen3.5-plus (Görsel + Düşünme)</option>
                  </optgroup>
                  <optgroup label="Zhipu">
                    <option value="glm-5">glm-5 (Deep Thinking)</option>
                    <option value="glm-4.7">glm-4.7</option>
                  </optgroup>
                  <optgroup label="Kimi">
                    <option value="kimi-k2.5">kimi-k2.5 (Görsel + Düşünme)</option>
                  </optgroup>
                  <optgroup label="MiniMax">
                    <option value="MiniMax-M2.5">MiniMax-M2.5 (Deep Thinking)</option>
              </optgroup>
            </select>
              </div>
            </motion.div>
        </div>
        
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                 localStorage.clear();
                 indexedDB.deleteDatabase('ai-code-studio');
                 window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <Trash2 size={14} />
            Reset Studio
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-primary/20 text-white hover:bg-primary/30 rounded-full transition-all border border-primary/30 cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default SettingsModal;
