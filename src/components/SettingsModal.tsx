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
        className="bg-background border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-text flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Settings
          </h2>
          <button onClick={onClose} className="text-text/30 hover:text-text transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
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
              <label className="text-[12px] font-medium text-text/60">API Key</label>
              <input
                type="password"
                value={alibabaApiKey}
                onChange={(e) => onSetAlibabaApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-white/[0.03] text-[13px] text-text px-3 py-2.5 border border-white/[0.06] rounded-lg outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/15 transition-all"
              />
              <p className="text-[11px] text-text/25">Your key is stored locally in your browser session.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-text/60">Model</label>
              <select
                value={alibabaModel}
                onChange={(e) => onSetAlibabaModel(e.target.value)}
                className="w-full bg-white/[0.03] text-[13px] text-text px-3 py-2.5 border border-white/[0.06] rounded-lg outline-none focus:border-primary/40 transition-all cursor-pointer"
              >
                <optgroup label="Qwen">
                  <option value="qwen3-coder-plus">qwen3-coder-plus (Recommended)</option>
                  <option value="qwen3-coder-next">qwen3-coder-next</option>
                  <option value="qwen3-max-2026-01-23">qwen3-max (Deep Thinking)</option>
                  <option value="qwen3.5-plus">qwen3.5-plus (Vision + Thinking)</option>
                </optgroup>
                <optgroup label="Zhipu">
                  <option value="glm-5">glm-5 (Deep Thinking)</option>
                  <option value="glm-4.7">glm-4.7</option>
                </optgroup>
                <optgroup label="Kimi">
                  <option value="kimi-k2.5">kimi-k2.5 (Vision + Thinking)</option>
                </optgroup>
                <optgroup label="MiniMax">
                  <option value="MiniMax-M2.5">MiniMax-M2.5 (Deep Thinking)</option>
                </optgroup>
              </select>
            </div>
          </motion.div>
        </div>
        
        <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                 localStorage.clear();
                 indexedDB.deleteDatabase('ai-code-studio');
                 window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] rounded-lg transition-all uppercase tracking-wider cursor-pointer"
          >
            <Trash2 size={13} />
            Reset Studio
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2 text-[13px] font-medium bg-primary/15 text-primary hover:bg-primary/25 rounded-xl transition-all border border-primary/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default SettingsModal;
