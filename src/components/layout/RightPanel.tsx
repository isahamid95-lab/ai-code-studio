import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRightPanelOpen, useAgentStatus, useAlibabaModel, useIsTerminalOpen } from '../../stores';
import ChatPanel from '../ChatPanel';
import type { ChatMessage, FileItem } from '../../types';

interface RightPanelProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  isGenerating: boolean;
  agentMode: boolean;
  planMode: boolean;
  selectedCode: string;
  activeFile: FileItem | null;
  files: FileItem[];
  onSetChatInput: (value: string) => void;
  onSendMessage: (text: string) => void;
  onSendAgentMessage: (text: string, mode: 'agent' | 'plan') => void;
  onToggleAgentMode: (value: boolean) => void;
  onTogglePlanMode: (value: boolean) => void;
  onSetIsTerminalOpen: (value: boolean) => void;
  onQuickAction: (action: 'explain' | 'bugs' | 'refactor') => void;
  onClearChat: () => void;
  onClose: () => void;
}

export function RightPanel({
  chatMessages,
  chatInput,
  isGenerating,
  agentMode,
  planMode,
  selectedCode,
  activeFile,
  files,
  onSetChatInput,
  onSendMessage,
  onSendAgentMessage,
  onToggleAgentMode,
  onTogglePlanMode,
  onSetIsTerminalOpen,
  onQuickAction,
  onClearChat,
  onClose,
}: RightPanelProps) {
  const rightPanelOpen = useRightPanelOpen();
  const agentStatus = useAgentStatus();
  const alibabaModel = useAlibabaModel();
  const isTerminalOpen = useIsTerminalOpen();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  return (
    <AnimatePresence initial={false}>
      {rightPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="glass-panel rounded-2xl flex flex-col overflow-hidden shrink-0"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text/40">
              AI Assistant
            </span>
            <button
              onClick={onClose}
              aria-label="Close AI Assistant"
              className="p-1 text-text/30 hover:text-text hover:bg-white/[0.06] rounded-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={14} />
            </button>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              chatMessages={chatMessages}
              chatInput={chatInput}
              isGenerating={isGenerating}
              agentMode={agentMode}
              planMode={planMode}
              agentStatus={agentStatus}
              activeFile={activeFile ?? undefined}
              files={files}
              selectedCode={selectedCode}
              alibabaModel={alibabaModel}
              isTerminalOpen={isTerminalOpen}
              chatEndRef={chatEndRef}
              onSetChatInput={onSetChatInput}
              onSetAgentMode={onToggleAgentMode}
              onSetPlanMode={onTogglePlanMode}
              onSetIsTerminalOpen={onSetIsTerminalOpen}
              onSendMessage={onSendMessage}
              onSendAgentMessage={onSendAgentMessage}
              onQuickAction={onQuickAction}
              onClearChat={onClearChat}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}