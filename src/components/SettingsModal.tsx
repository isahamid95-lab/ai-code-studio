import React from 'react';
import { motion } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import type { AiProvider } from '../types';

interface SettingsModalProps {
  aiProvider: AiProvider;
  alibabaApiKey: string;
  alibabaModel: string;
  onSetAiProvider: (val: AiProvider) => void;
  onSetAlibabaApiKey: (val: string) => void;
  onSetAlibabaModel: (val: string) => void;
  onClose: () => void;
}

const SettingsModal = React.memo(function SettingsModal({
  aiProvider,
  alibabaApiKey,
  alibabaModel,
  onSetAiProvider,
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
        className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-cyan-400" />
            Settings
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">AI Provider</label>
            <select
              value={aiProvider}
              onChange={(e) => onSetAiProvider(e.target.value as AiProvider)}
              className="w-full bg-black/40 text-sm text-white px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="gemini">Google Gemini (Default)</option>
              <option value="alibaba">Alibaba Cloud Coding Plan</option>
            </select>
          </div>

          {aiProvider === 'alibaba' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">API Key</label>
                <input
                  type="password"
                  value={alibabaApiKey}
                  onChange={(e) => onSetAlibabaApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/40 text-sm text-white px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-cyan-500/50 transition-colors"
                />
                <p className="text-xs text-white/40">Your key is stored locally in your browser session.</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Model</label>
                <select
                  value={alibabaModel}
                  onChange={(e) => onSetAlibabaModel(e.target.value)}
                  className="w-full bg-black/40 text-sm text-white px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-cyan-500/50 transition-colors"
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
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-full transition-all border border-cyan-500/30"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default SettingsModal;
