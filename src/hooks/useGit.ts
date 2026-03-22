import { useState, useCallback } from 'react';
import type { LogEntry } from '../types';
import { gitInit, gitGetStatus, gitStage, gitUnstage, gitCommit, gitSetRemote, gitPush, gitPull } from '../services/api';

export function useGit(
  fetchFiles: () => Promise<void>,
  setTerminalOutput: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isGitLoading, setIsGitLoading] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isSettingRemote, setIsSettingRemote] = useState(false);

  const fetchGitStatus = useCallback(async () => {
    try {
      const data = await gitGetStatus();
      setGitStatus(data);
      if (data.remotes && data.remotes.length > 0) {
        const origin = data.remotes.find((r: any) => r.name === 'origin');
        if (origin && origin.refs.push) {
          setRemoteUrl(origin.refs.push);
        }
      }
    } catch (e) {
      console.error("Failed to fetch git status", e);
    }
  }, []);

  const handleGitInit = useCallback(async () => {
    setIsGitLoading(true);
    try {
      await gitInit();
      await fetchGitStatus();
    } finally {
      setIsGitLoading(false);
    }
  }, [fetchGitStatus]);

  const handleGitStage = useCallback(async (file: string) => {
    setIsGitLoading(true);
    try {
      await gitStage(file);
      await fetchGitStatus();
    } finally {
      setIsGitLoading(false);
    }
  }, [fetchGitStatus]);

  const handleGitUnstage = useCallback(async (file: string) => {
    setIsGitLoading(true);
    try {
      await gitUnstage(file);
      await fetchGitStatus();
    } finally {
      setIsGitLoading(false);
    }
  }, [fetchGitStatus]);

  const handleGitCommit = useCallback(async () => {
    if (!commitMessage.trim()) return;
    setIsGitLoading(true);
    try {
      await gitCommit(commitMessage);
      setCommitMessage('');
      await fetchGitStatus();
    } finally {
      setIsGitLoading(false);
    }
  }, [commitMessage, fetchGitStatus]);

  const handleGitRemote = useCallback(async () => {
    if (!remoteUrl.trim()) return;
    setIsGitLoading(true);
    try {
      await gitSetRemote(remoteUrl);
      setIsSettingRemote(false);
      await fetchGitStatus();
    } finally {
      setIsGitLoading(false);
    }
  }, [remoteUrl, fetchGitStatus]);

  const handleGitPush = useCallback(async () => {
    setIsGitLoading(true);
    try {
      const data = await gitPush();
      if (data.error) {
        setTerminalOutput(prev => [...prev, { type: 'error', text: `Git Push Error: ${data.error}` }]);
        setIsTerminalOpen(true);
      } else {
        setTerminalOutput(prev => [...prev, { type: 'info', text: `Successfully pushed to remote.` }]);
        setIsTerminalOpen(true);
      }
      await fetchGitStatus();
    } finally {
      setIsGitLoading(false);
    }
  }, [fetchGitStatus, setTerminalOutput, setIsTerminalOpen]);

  const handleGitPull = useCallback(async () => {
    setIsGitLoading(true);
    try {
      const data = await gitPull();
      if (data.error) {
        setTerminalOutput(prev => [...prev, { type: 'error', text: `Git Pull Error: ${data.error}` }]);
        setIsTerminalOpen(true);
      } else {
        setTerminalOutput(prev => [...prev, { type: 'info', text: `Successfully pulled from remote.` }]);
        setIsTerminalOpen(true);
        fetchFiles();
      }
      await fetchGitStatus();
    } finally {
      setIsGitLoading(false);
    }
  }, [fetchGitStatus, setTerminalOutput, setIsTerminalOpen, fetchFiles]);

  return {
    gitStatus,
    commitMessage, setCommitMessage,
    isGitLoading,
    remoteUrl, setRemoteUrl,
    isSettingRemote, setIsSettingRemote,
    fetchGitStatus,
    handleGitInit,
    handleGitStage,
    handleGitUnstage,
    handleGitCommit,
    handleGitRemote,
    handleGitPush,
    handleGitPull,
  };
}
