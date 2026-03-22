import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import { FileMentionsPopup } from './FileMentionsPopup';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Loader2, MoreVertical, Lightbulb,
  TerminalSquare, FileCode2, CheckCircle2, Zap, FolderOpen
} from 'lucide-react';
import type { ChatMessage, FileItem, AiProvider } from '../types';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  isGenerating: boolean;
  agentMode: boolean;
  planMode: boolean;
  agentStatus: string;
  activeFile: FileItem | undefined;
  files: FileItem[];
  selectedCode: string;
  aiProvider: AiProvider;
  alibabaModel: string;
  isTerminalOpen: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onSetChatInput: (val: string) => void;
  onSetAgentMode: (val: boolean) => void;
  onSetPlanMode: (val: boolean) => void;
  onSetIsTerminalOpen: (val: boolean) => void;
  onSendMessage: (text: string) => void;
  onSendAgentMessage: (text: string, mode: 'agent' | 'plan') => void;
  onQuickAction: (action: 'explain' | 'bugs' | 'refactor') => void;
}

// File icon color by extension
function getFileColor(filename: string): string {
  if (filename.endsWith('.html')) return 'text-orange-400';
  if (filename.endsWith('.css') || filename.endsWith('.scss')) return 'text-blue-400';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'text-yellow-400';
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'text-blue-300';
  if (filename.endsWith('.json')) return 'text-green-400';
  if (filename.endsWith('.md')) return 'text-white/60';
  if (filename.endsWith('.svg') || filename.endsWith('.png')) return 'text-pink-400';
  return 'text-cyan-400';
}

function getFileBgColor(filename: string): string {
  if (filename.endsWith('.html')) return 'from-orange-500/20 to-red-500/10 border-orange-500/30';
  if (filename.endsWith('.css') || filename.endsWith('.scss')) return 'from-blue-500/20 to-indigo-500/10 border-blue-500/30';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'from-blue-400/20 to-cyan-500/10 border-blue-400/30';
  if (filename.endsWith('.json')) return 'from-green-500/20 to-emerald-500/10 border-green-500/30';
  return 'from-cyan-500/20 to-purple-500/10 border-cyan-500/30';
}

// Parse message text to separate regular text from file creation markers
function parseMessageContent(text: string): Array<{ type: 'text' | 'file'; content: string; filename?: string }> {
  const parts: Array<{ type: 'text' | 'file'; content: string; filename?: string }> = [];
  const fileRegex = /\n?\n?✅ \*\*(.+?)\*\* oluşturuldu/g;
  let lastIndex = 0;
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index).trim();
      if (textBefore) parts.push({ type: 'text', content: textBefore });
    }
    parts.push({ type: 'file', content: match[0], filename: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) parts.push({ type: 'text', content: remaining });
  }

  if (parts.length === 0 && text.trim()) {
    parts.push({ type: 'text', content: text });
  }

  return parts;
}
const ChatPanel = React.memo(function ChatPanel({
  chatMessages,
  chatInput,
  isGenerating,
  agentMode,
  planMode,
  agentStatus,
  activeFile,
  selectedCode,
  aiProvider,
  alibabaModel,
  isTerminalOpen,
  chatEndRef,
  onSetChatInput,
  onSetAgentMode,
  onSetPlanMode,
  onSetIsTerminalOpen,
  onSendMessage,
  onSendAgentMessage,
  onQuickAction,
  files,
}: ChatPanelProps) {
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [isMentionPopupOpen, setIsMentionPopupOpen] = React.useState(false);
  const [mentionPosition, setMentionPosition] = React.useState({ top: 0, left: 0 });
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onSetChatInput(value);

    // Detect @ for mentions
    const cursor = e.target.selectionStart;
    const lastAt = value.lastIndexOf('@', cursor - 1);
    
    if (lastAt !== -1 && lastAt >= (value.lastIndexOf(' ', cursor - 1) + 1)) {
      const query = value.slice(lastAt + 1, cursor);
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setIsMentionPopupOpen(true);
        // Position is approximate
        setMentionPosition({ top: 40, left: Math.min(cursor * 7, 200) });
      } else {
        setIsMentionPopupOpen(false);
      }
    } else {
      setIsMentionPopupOpen(false);
    }
  };

  const handleSelectMention = (filename: string) => {
    const value = chatInput;
    const cursor = textareaRef.current?.selectionStart || 0;
    const lastAt = value.lastIndexOf('@', cursor - 1);
    const newValue = value.slice(0, lastAt) + `@${filename} ` + value.slice(cursor);
    onSetChatInput(newValue);
    setIsMentionPopupOpen(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (agentMode) onSendAgentMessage(chatInput, 'agent');
    else if (planMode) onSendAgentMessage(chatInput, 'plan');
    else onSendMessage(chatInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.aside 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 420, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="glass-panel rounded-2xl flex flex-col overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-background/40">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg border ${
            agentMode ? 'bg-primary/20 border-primary/30' : 
            planMode ? 'bg-cta/20 border-cta/30' :
            'bg-primary/20 border-primary/30'
          }`}>
            {agentMode ? <Zap size={16} className="text-primary" /> :
             planMode ? <FolderOpen size={16} className="text-cta" /> :
             <Sparkles size={16} className="text-primary" />}
          </div>
          <div>
            <span className="text-sm font-semibold text-text tracking-wide block">
              {agentMode ? 'AI Agent' : planMode ? 'Plan Mode' : 
               aiProvider === 'alibaba' ? 'AI Assistant' : 'Gemini Assistant'}
            </span>
            {agentMode && (
              <span className="text-[10px] text-primary/70 font-medium">Full-stack kodlama</span>
            )}
          </div>
        </div>
        <button className="text-text/50 hover:text-text cursor-pointer transition-colors"><MoreVertical size={16} /></button>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <AnimatePresence initial={false}>
          {chatMessages.filter(m => !m.isHidden).map((msg) => {
            const parts = msg.role === 'model' ? parseMessageContent(msg.text) : null;
            
            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-primary text-white' : 'bg-gradient-to-br from-primary to-cta text-white transition-all duration-300'
                }`}>
                  {msg.role === 'user' ? 'U' : <Sparkles size={14} />}
                </div>
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className="text-xs text-text/40 mb-1.5 font-medium uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : (aiProvider === 'alibaba' ? alibabaModel || 'Qwen' : 'Gemini')}
                  </div>
                  
                  {msg.role === 'user' ? (
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 inline-block px-4 py-2.5 rounded-2xl rounded-tr-sm text-left shadow-lg text-[14px] leading-relaxed">
                      {msg.displayText || msg.text}
                    </div>
                  ) : parts ? (
                    <div className="space-y-2.5">
                      {parts.map((part, i) => (
                        part.type === 'file' && part.filename ? (
                          <motion.div
                            key={`${msg.id}-file-${i}`}
                            initial={{ opacity: 0, scale: 0.9, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 * i }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r border backdrop-blur-md ${getFileBgColor(part.filename)}`}
                          >
                            <div className={`p-1.5 rounded-lg bg-black/30 ${getFileColor(part.filename)}`}>
                              <FileCode2 size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{part.filename}</div>
                              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                                {part.filename.split('.').pop()?.toUpperCase()} dosyası oluşturuldu
                              </div>
                            </div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 + 0.05 * i, type: 'spring', stiffness: 500 }}
                            >
                              <CheckCircle2 size={18} className="text-emerald-400" />
                            </motion.div>
                          </motion.div>
                        ) : (
                          <div key={`${msg.id}-text-${i}`} className="text-[14px] leading-relaxed text-white/90 markdown-body">
                            <Markdown>{part.content}</Markdown>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-[14px] leading-relaxed text-white/90 markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Generating indicator */}
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cta flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center text-sm text-text/60 gap-3 bg-secondary/40 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 shadow-lg">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>
                  {agentMode ? '🤖 Kod yazılıyor...' : planMode ? '📋 Plan oluşturuluyor...' : '✨ Analiz ediliyor...'}
                </span>
              </div>
              {agentStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 text-xs text-primary/80 font-mono flex items-center gap-2 px-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {agentStatus}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        {/* Mode Toggles */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => { onSetAgentMode(!agentMode); onSetPlanMode(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              agentMode
                ? 'bg-primary/20 border-primary/50 text-white shadow-lg shadow-primary/10'
                : 'bg-white/5 border-white/10 text-text/40 hover:text-text/70'
            }`}
          >
            <Zap size={11} />
            Agent
          </button>
          <button
            onClick={() => { onSetPlanMode(!planMode); onSetAgentMode(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              planMode
                ? 'bg-cta/20 border-cta/50 text-white shadow-lg shadow-cta/10'
                : 'bg-white/5 border-white/10 text-text/40 hover:text-text/70'
            }`}
          >
            <Lightbulb size={11} />
            Plan
          </button>
        </div>

        <div className="relative flex items-end bg-secondary/40 border border-white/10 rounded-2xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              agentMode ? '🤖 Ne inşa etmemi istersiniz?' :
              planMode ? '📋 Proje detaylarını yazın...' :
              activeFile ? `Ask about ${activeFile.name}...` : 'Ask AI anything... (Use @ to mention files)'
            }
            className="w-full max-h-32 min-h-[48px] bg-transparent text-sm p-3.5 outline-none resize-none text-text placeholder-text/30"
            rows={1}
          />
          <FileMentionsPopup
            isOpen={isMentionPopupOpen}
            query={mentionQuery}
            files={files}
            onSelect={handleSelectMention}
            position={mentionPosition}
          />
          <button
            onClick={handleSend}
            disabled={!chatInput.trim() || isGenerating}
            className={`p-2.5 m-1.5 disabled:from-white/10 disabled:to-white/10 text-white disabled:text-text/30 rounded-xl transition-all shrink-0 shadow-lg bg-gradient-to-br cursor-pointer ${
              agentMode ? 'from-primary to-blue-600 hover:opacity-90' :
              planMode ? 'from-cta to-pink-600 hover:opacity-90' :
              'from-primary to-cta hover:opacity-90'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 px-1">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            {agentMode ? 'Agent — gerçek proje oluşturur' : planMode ? 'Plan — önce plan, sonra uygula' : 'AI can make mistakes.'}
          </span>
          <button
            onClick={() => onSetIsTerminalOpen(!isTerminalOpen)}
            className="text-[11px] text-white/50 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <TerminalSquare size={12} />
            {isTerminalOpen ? 'Hide Terminal' : 'Show Terminal'}
          </button>
        </div>
      </div>
    </motion.aside>
  );
});

export default ChatPanel;
