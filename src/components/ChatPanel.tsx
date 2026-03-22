import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import { FileMentionsPopup } from './FileMentionsPopup';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Loader2, MoreVertical, Lightbulb,
  TerminalSquare, FileCode2, CheckCircle2, Zap, FolderOpen,
  Bot, User, BrainCircuit, ClipboardList, Trash2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import type { ChatMessage, FileItem } from '../types';

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
  onClearChat: () => void;
}

function getFileColor(filename: string): string {
  if (filename.endsWith('.html')) return 'text-orange-400';
  if (filename.endsWith('.css') || filename.endsWith('.scss')) return 'text-blue-400';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'text-yellow-400';
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'text-cyan-400';
  if (filename.endsWith('.json')) return 'text-emerald-400';
  if (filename.endsWith('.md')) return 'text-white/50';
  if (filename.endsWith('.svg') || filename.endsWith('.png')) return 'text-pink-400';
  return 'text-primary';
}

function getFileBgColor(filename: string): string {
  if (filename.endsWith('.html')) return 'from-orange-500/15 to-orange-500/5 border-orange-500/20';
  if (filename.endsWith('.css') || filename.endsWith('.scss')) return 'from-blue-500/15 to-blue-500/5 border-blue-500/20';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'from-yellow-500/15 to-yellow-500/5 border-yellow-500/20';
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/20';
  if (filename.endsWith('.json')) return 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20';
  return 'from-primary/15 to-primary/5 border-primary/20';
}

function parseMessageContent(text: string): Array<{ type: 'text' | 'file'; content: string; filename?: string }> {
  const parts: Array<{ type: 'text' | 'file'; content: string; filename?: string }> = [];
  const fileRegex = /\n?\n?✅ \*\*(.+?)\*\* oluşturuldu/g;
  let lastIndex = 0;
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index).trim();
      if (textBefore) parts.push({ type: 'text', content: textBefore });
    }
    parts.push({ type: 'file', content: match[0], filename: match[1] });
    lastIndex = match.index + match[0].length;
  }

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
  onClearChat,
  files,
}: ChatPanelProps) {
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [isMentionPopupOpen, setIsMentionPopupOpen] = React.useState(false);
  const [mentionPosition, setMentionPosition] = React.useState({ top: 0, left: 0 });
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onSetChatInput(value);

    const cursor = e.target.selectionStart;
    const lastAt = value.lastIndexOf('@', cursor - 1);

    if (lastAt !== -1 && lastAt >= (value.lastIndexOf(' ', cursor - 1) + 1)) {
      const query = value.slice(lastAt + 1, cursor);
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setIsMentionPopupOpen(true);
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

  const currentMode = agentMode ? 'agent' : planMode ? 'plan' : 'chat';

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="glass-panel rounded-2xl flex flex-col overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${
            currentMode === 'agent' ? 'bg-primary/15 text-primary' :
            currentMode === 'plan' ? 'bg-amber-500/15 text-amber-400' :
            'bg-primary/15 text-primary'
          }`}>
            {currentMode === 'agent' ? <Zap size={15} /> :
             currentMode === 'plan' ? <ClipboardList size={15} /> :
             <BrainCircuit size={15} />}
          </div>
          <div>
            <span className="text-[13px] font-semibold text-text block leading-tight">
              {currentMode === 'agent' ? 'AI Agent' : currentMode === 'plan' ? 'Plan Mode' : 'AI Assistant'}
            </span>
            <span className="text-[10px] text-text/30 leading-tight">
              {currentMode === 'agent' ? 'Full-stack coding' :
               currentMode === 'plan' ? 'Architecture first' :
               alibabaModel || 'Qwen'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isGenerating && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/15"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-ring" />
              <span className="text-[10px] text-primary font-medium">Working</span>
            </motion.div>
          )}
          <button 
            onClick={onClearChat}
            className="p-1.5 text-text/30 hover:text-red-400 hover:bg-white/[0.04] rounded-lg cursor-pointer transition-all"
            title="Clear Chat"
          >
            <Trash2 size={13} className="lucide lucide-trash-2" />
          </button>
          <button className="p-1.5 text-text/30 hover:text-text/60 hover:bg-white/[0.04] rounded-lg cursor-pointer transition-all" title="More Options">
            <MoreVertical size={13} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {chatMessages.filter(m => !m.isHidden).map((msg) => {
            const parts = msg.role === 'model' ? parseMessageContent(msg.text) : null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-white/[0.08] text-text/60'
                    : 'bg-primary/15 text-primary'
                }`}>
                  {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-white/[0.06] inline-block px-3.5 py-2.5 rounded-2xl rounded-tr-md text-left text-[13px] leading-relaxed text-text/90 max-w-[90%]">
                      {msg.displayText || msg.text}
                    </div>
                  ) : parts ? (
                    <div className="space-y-2">
                      {parts.map((part, i) => (
                        part.type === 'file' && part.filename ? (
                          <motion.div
                            key={`${msg.id}-file-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 * i }}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r border ${getFileBgColor(part.filename)}`}
                          >
                            <div className={`p-1 rounded-md bg-black/20 ${getFileColor(part.filename)}`}>
                              <FileCode2 size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12.5px] font-medium text-text truncate">{part.filename}</div>
                              <div className="text-[9px] text-text/30 uppercase tracking-wider mt-0.5">
                                {part.filename.split('.').pop()?.toUpperCase()} file created
                              </div>
                            </div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.15 + 0.05 * i, type: 'spring', stiffness: 400 }}
                            >
                              <CheckCircle2 size={15} className="text-emerald-400" />
                            </motion.div>
                          </motion.div>
                        ) : (
                          <div key={`${msg.id}-text-${i}`} className="text-[13px] leading-relaxed text-text/85 markdown-body">
                            <Markdown>{part.content}</Markdown>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-[13px] leading-relaxed text-text/85 markdown-body">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Generating Indicator */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5 bg-white/[0.03] px-3.5 py-2.5 rounded-xl border border-white/[0.04]">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                </div>
                <span className="text-xs text-text/40">
                  {currentMode === 'agent' ? 'Generating code...' :
                   currentMode === 'plan' ? 'Creating plan...' :
                   'Thinking...'}
                </span>
              </div>
              {agentStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -5 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  className={`mt-2 text-[10px] font-mono flex items-center gap-2 px-2.5 py-1.5 rounded-md w-fit backdrop-blur-md ${
                    agentStatus.toLowerCase().match(/(lint|tsc|verify|check)/)
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                      : agentStatus.toLowerCase().includes('error')
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                      : 'bg-primary/5 text-primary/70 border border-primary/10'
                  }`}
                >
                  {agentStatus.toLowerCase().match(/(lint|tsc|verify|check)/) ? (
                    <ShieldCheck size={12} className="animate-pulse" />
                  ) : agentStatus.toLowerCase().includes('error') ? (
                    <AlertTriangle size={12} />
                  ) : (
                    <Loader2 size={12} className="animate-spin opacity-70" />
                  )}
                  <span className="truncate max-w-[220px]">
                    {agentStatus.toLowerCase().match(/(lint|tsc|verify|check)/) 
                      ? '🛡️ Self-Correction Active: ' + agentStatus 
                      : agentStatus}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-3 border-t border-white/[0.06]">
        {/* Mode Toggles */}
        <div className="flex gap-1.5 mb-2.5">
          <button
            onClick={() => { onSetAgentMode(!agentMode); onSetPlanMode(false); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              agentMode
                ? 'bg-primary/15 text-primary border border-primary/25'
                : 'text-text/30 hover:text-text/50 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Zap size={11} />
            Agent
          </button>
          <button
            onClick={() => { onSetPlanMode(!planMode); onSetAgentMode(false); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              planMode
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                : 'text-text/30 hover:text-text/50 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <ClipboardList size={11} />
            Plan
          </button>
        </div>

        {/* Input */}
        <div className="relative flex items-end bg-white/[0.03] border border-white/[0.06] rounded-xl focus-within:border-primary/30 focus-within:bg-white/[0.04] transition-all">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              agentMode ? 'What should I build?' :
              planMode ? 'Describe the project...' :
              activeFile ? `Ask about ${activeFile.name}...` : 'Ask anything... (@ to mention files)'
            }
            className="w-full max-h-28 min-h-[44px] bg-transparent text-[13px] p-3 pr-12 outline-none resize-none text-text placeholder-text/20"
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
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all cursor-pointer ${
              chatInput.trim() && !isGenerating
                ? 'bg-primary text-white hover:bg-primary/80'
                : 'bg-white/[0.04] text-text/20'
            }`}
          >
            <Send size={14} />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-2 px-0.5">
          <span className="text-[10px] text-text/20">
            {currentMode === 'agent' ? 'Agent creates real files' :
             currentMode === 'plan' ? 'Plan first, build next' :
             'AI can make mistakes'}
          </span>
          <button
            onClick={() => onSetIsTerminalOpen(!isTerminalOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              isTerminalOpen 
                ? 'bg-primary/20 text-primary border border-primary/20' 
                : 'text-text/40 hover:text-text hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <TerminalSquare size={13} />
            Terminal
          </button>
        </div>
      </div>
    </motion.aside>
  );
});

export default ChatPanel;
