import { useState, useCallback, useRef } from 'react';
import type { AgentEvent, ChatMessage, LogEntry } from '../types';
import { streamAgentRequest } from '../services/api';

interface UseAgentOptions {
  model: string;
  files: Array<{ id: string }>;
  activeFileId: string;
  setChatMessages: (fn: React.SetStateAction<ChatMessage[]>) => void;
  setIsGenerating: (value: boolean) => void;
  setIsAgentRunning: (value: boolean) => void;
  setTerminalOutput: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRefreshFiles: () => Promise<void>;
  onServerStarted: (port: number) => void;
}

export function useAgent({
  model,
  files,
  activeFileId,
  setChatMessages,
  setIsGenerating,
  setIsAgentRunning,
  setTerminalOutput,
  setIsTerminalOpen,
  onRefreshFiles,
  onServerStarted,
}: UseAgentOptions) {
  const [agentMode, setAgentMode] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const nextRunIdRef = useRef(0);
  const activeRunIdRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const completedRunIdsRef = useRef<Set<number>>(new Set());

  const isActiveRun = useCallback((runId: number) => activeRunIdRef.current === runId, []);

  const upsertModelMessage = useCallback((messageId: string, content: string, variant: ChatMessage['variant'] = 'default') => {
    setChatMessages((previous) => {
      const existing = previous.find((message) => message.id === messageId);
      if (existing) {
        return previous.map((message) => (
          message.id === messageId
            ? { ...message, text: `${message.text}${content}`, variant }
            : message
        ));
      }

      return [...previous, { id: messageId, role: 'model', text: content, variant }];
    });
  }, [setChatMessages]);

  const appendTerminalLog = useCallback((entry: LogEntry) => {
    setTerminalOutput((previous) => [...previous, { ...entry, timestamp: Date.now() }]);
  }, [setTerminalOutput]);

  const scheduleFileRefresh = useCallback((runId: number) => {
    if (!isActiveRun(runId)) {
      return;
    }

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      if (!isActiveRun(runId)) {
        return;
      }

      refreshTimerRef.current = null;
      void onRefreshFiles();
    }, 150);
  }, [isActiveRun, onRefreshFiles]);

  const flushFileRefresh = useCallback(async (runId: number) => {
    if (!isActiveRun(runId)) {
      return;
    }

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    await onRefreshFiles();
  }, [isActiveRun, onRefreshFiles]);

  const handleAgentEvent = useCallback(async (
    event: AgentEvent,
    runId: number,
    responseMessageId: string,
    planMessageId: string,
  ) => {
    if (!isActiveRun(runId)) {
      return;
    }

    switch (event.type) {
      case 'plan':
        upsertModelMessage(planMessageId, event.content ?? '', 'plan');
        break;
      case 'text':
        upsertModelMessage(responseMessageId, `${event.content ?? ''}\n`);
        break;
      case 'file_created':
      case 'file_edited':
      case 'file_deleted':
        scheduleFileRefresh(runId);
        break;
      case 'command_start':
        setIsTerminalOpen(true);
        appendTerminalLog({ type: 'info', text: `$ ${event.command ?? ''}` });
        setAgentStatus(`Running: ${event.command ?? 'command'}`);
        break;
      case 'command_output':
        setIsTerminalOpen(true);
        appendTerminalLog({
          type: event.error ? 'error' : 'info',
          text: event.output ?? '',
        });
        break;
      case 'tool_call':
        setAgentStatus(`Running: ${event.tool ?? 'tool'}...`);
        break;
      case 'server_started':
        if (typeof event.port === 'number') {
          onServerStarted(event.port);
          appendTerminalLog({ type: 'success', text: `Dev server started on port ${event.port}` });
        }
        break;
      case 'error':
        upsertModelMessage(responseMessageId, `\nError: ${event.content ?? 'Unknown error'}\n`);
        appendTerminalLog({ type: 'error', text: event.content ?? 'Unknown error' });
        setAgentStatus('Agent failed');
        break;
      case 'done':
        await flushFileRefresh(runId);
        if (isActiveRun(runId)) {
          completedRunIdsRef.current.add(runId);
          setAgentStatus('Complete');
        }
        break;
      default:
        break;
    }
  }, [appendTerminalLog, flushFileRefresh, isActiveRun, onServerStarted, scheduleFileRefresh, setIsTerminalOpen, upsertModelMessage]);

  const sendAgentMessage = useCallback(async (text: string, mode: 'agent' | 'plan') => {
    if (!text.trim()) {
      return;
    }

    const runId = ++nextRunIdRef.current;
    activeRunIdRef.current = runId;
    completedRunIdsRef.current.delete(runId);

    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const userMessageId = `${Date.now()}`;
    const responseMessageId = `agent-response-${runId}`;
    const planMessageId = `agent-plan-${runId}`;
    const fileList = files.map((file) => file.id).join('\n');
    const requestMessages = [
      {
        role: 'system',
        content: `Active File: ${activeFileId || 'None'}\nAll Files:\n${fileList || '(empty workspace)'}`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    setChatMessages((previous) => [
      ...previous,
      { id: userMessageId, role: 'user', text },
    ]);

    setIsGenerating(true);
    setIsAgentRunning(true);
    setIsTerminalOpen(true);
    setAgentStatus(mode === 'plan' ? 'Creating plan...' : 'Agent running...');
    setTerminalOutput([{ type: 'info', text: '$ Agent output ready', timestamp: Date.now() }]);

    try {
      await streamAgentRequest(model || 'qwen3.5-plus', requestMessages, mode, async (event) => {
        await handleAgentEvent(event, runId, responseMessageId, planMessageId);
      });

      if (isActiveRun(runId) && !completedRunIdsRef.current.has(runId)) {
        await flushFileRefresh(runId);
      }
    } catch (error: any) {
      if (isActiveRun(runId)) {
        upsertModelMessage(responseMessageId, `\nError: ${error.message}\n`);
        appendTerminalLog({ type: 'error', text: error.message });
        setAgentStatus('Agent failed');
      }
    } finally {
      if (!isActiveRun(runId)) {
        return;
      }

      setIsGenerating(false);
      setIsAgentRunning(false);
      window.setTimeout(() => {
        if (isActiveRun(runId)) {
          setAgentStatus('');
        }
      }, 4000);
    }
  }, [activeFileId, appendTerminalLog, files, flushFileRefresh, handleAgentEvent, isActiveRun, model, setChatMessages, setIsAgentRunning, setIsGenerating, setIsTerminalOpen, setTerminalOutput, upsertModelMessage]);

  return {
    agentMode,
    setAgentMode,
    planMode,
    setPlanMode,
    agentStatus,
    sendAgentMessage,
  };
}
