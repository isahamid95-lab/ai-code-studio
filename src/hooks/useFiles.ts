import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileItem, LogEntry } from '../types';
import { detectLanguage } from '../constants';
import { fetchFilesFromServer, saveFileToServer, deleteFileFromServer, runFileOnServer } from '../services/api';
import { loadUiState, saveUiState, clearUiState, type UiStateSnapshot } from '../utils/persistence';

function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as unknown as T;
}

export function useFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<LogEntry[]>([
    { type: 'info', text: '$ Agent output ready', timestamp: Date.now() },
  ]);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [persistedUiState, setPersistedUiState] = useState<UiStateSnapshot | null | undefined>(undefined);

  const activeFile = files.find((file) => file.id === activeTabId);
  const hasFetchedInitialFilesRef = useRef(false);
  const hasAppliedUiRestoreRef = useRef(false);
  const hasHydratedOpenStateRef = useRef(false);
  const dirtyFileIdsRef = useRef(dirtyFileIds);

  useEffect(() => {
    dirtyFileIdsRef.current = dirtyFileIds;
  }, [dirtyFileIds]);

  const debouncedSave = useDebouncedCallback(async (id: string, content: string) => {
    try {
      await saveFileToServer(id, content);
      setDirtyFileIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to save file', error);
    }
  }, 500);

  const saveFileToBackend = useCallback(async (id: string, content: string) => {
    await saveFileToServer(id, content);
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const serverFiles = await fetchFilesFromServer();
      hasFetchedInitialFilesRef.current = true;

      setFiles((previous) => {
        const currentDirtyFileIds = dirtyFileIdsRef.current;

        if (previous.length === 0) {
          return serverFiles;
        }

        return serverFiles.map((serverFile) => {
          if (currentDirtyFileIds.has(serverFile.id)) {
            const localFile = previous.find((candidate) => candidate.id === serverFile.id);
            return localFile ?? serverFile;
          }

          return serverFile;
        });
      });
    } catch (error) {
      console.error('Failed to fetch files', error);
      hasFetchedInitialFilesRef.current = true;
    }
  }, []);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchFiles();
    }, isAgentRunning ? 3000 : 10000);

    return () => window.clearInterval(intervalId);
  }, [fetchFiles, isAgentRunning]);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const snapshot = await loadUiState();
        if (!isCancelled) {
          setPersistedUiState(snapshot ?? null);
        }
      } catch (error) {
        console.error('Failed to restore tab state', error);
        if (!isCancelled) {
          setPersistedUiState(null);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Clear stale UI state if workspace is empty
  useEffect(() => {
    if (persistedUiState === undefined || files.length > 0) {
      return;
    }

    // Workspace is empty but we have stale UI state - clear it
    if (persistedUiState !== null && (persistedUiState.openTabs?.length ?? 0) > 0) {
      console.log('[useFiles] Clearing stale UI state - workspace is empty');
      void clearUiState();
      setPersistedUiState(null);
    }
  }, [files, persistedUiState]);

  useEffect(() => {
    if (persistedUiState === undefined || !hasFetchedInitialFilesRef.current || hasAppliedUiRestoreRef.current) {
      return;
    }

    const validFileIds = new Set(files.map((file) => file.id));
    const nextOpenTabs = (persistedUiState?.openTabs ?? []).filter((tabId) => validFileIds.has(tabId));
    const nextActiveTabId = persistedUiState?.activeTabId && validFileIds.has(persistedUiState.activeTabId)
      ? persistedUiState.activeTabId
      : nextOpenTabs[0] ?? '';

    setOpenTabs(nextOpenTabs);
    setActiveTabId(nextActiveTabId);
    hasAppliedUiRestoreRef.current = true;
    hasHydratedOpenStateRef.current = true;
  }, [files, persistedUiState]);

  useEffect(() => {
    if (persistedUiState === null && !hasAppliedUiRestoreRef.current) {
      hasAppliedUiRestoreRef.current = true;
      hasHydratedOpenStateRef.current = true;
    }
  }, [persistedUiState]);

  useEffect(() => {
    const validFileIds = new Set(files.map((file) => file.id));
    const nextOpenTabs = openTabs.filter((tabId) => validFileIds.has(tabId));

    if (nextOpenTabs.length !== openTabs.length) {
      setOpenTabs(nextOpenTabs);
    }

    if (activeTabId && !validFileIds.has(activeTabId)) {
      setActiveTabId(nextOpenTabs[0] ?? '');
    }
  }, [files, activeTabId, openTabs]);

  useEffect(() => {
    if (!hasHydratedOpenStateRef.current) {
      return;
    }

    void saveUiState({ openTabs, activeTabId });
  }, [activeTabId, openTabs]);

  const handleFileChange = useCallback((newContent: string) => {
    if (!activeTabId) {
      return;
    }

    setFiles((previous) => previous.map((file) => (
      file.id === activeTabId
        ? { ...file, content: newContent, updatedAt: Date.now() }
        : file
    )));
    setDirtyFileIds((previous) => new Set(previous).add(activeTabId));
    debouncedSave(activeTabId, newContent);
  }, [activeTabId, debouncedSave]);

  const openFile = useCallback((id: string) => {
    setOpenTabs((previous) => previous.includes(id) ? previous : [...previous, id]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    setOpenTabs((previous) => {
      const next = previous.filter((tabId) => tabId !== id);
      if (activeTabId === id) {
        setActiveTabId(next[next.length - 1] ?? '');
      }
      return next;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((id: string) => {
    setOpenTabs([id]);
    setActiveTabId(id);
  }, []);

  const closeAllTabs = useCallback(() => {
    setOpenTabs([]);
    setActiveTabId('');
  }, []);

  const handleCreateFile = useCallback((templates: Record<string, { content: string; defaultExt: string }>) => {
    const nextName = newFileName.trim();
    if (!nextName) {
      setIsCreatingFile(false);
      setSelectedTemplate(null);
      return;
    }

    const content = selectedTemplate ? templates[selectedTemplate]?.content ?? '' : '';
    const nextFile: FileItem = {
      id: nextName,
      name: nextName,
      language: detectLanguage(nextName),
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setFiles((previous) => [...previous, nextFile]);
    setOpenTabs((previous) => [...previous, nextFile.id]);
    setActiveTabId(nextFile.id);
    setNewFileName('');
    setIsCreatingFile(false);
    setSelectedTemplate(null);
    void saveFileToBackend(nextFile.id, content);
  }, [newFileName, saveFileToBackend, selectedTemplate]);

  const handleDeleteFile = useCallback(async (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    await deleteFileFromServer(id);
    setFiles((previous) => previous.filter((file) => file.id !== id));
    setOpenTabs((previous) => {
      const next = previous.filter((tabId) => tabId !== id);
      if (activeTabId === id) {
        setActiveTabId(next[next.length - 1] ?? '');
      }
      return next;
    });
  }, [activeTabId]);

  const appendTerminalOutput = useCallback((entry: LogEntry) => {
    setTerminalOutput((previous) => [...previous, { ...entry, timestamp: entry.timestamp ?? Date.now() }]);
  }, []);

  const clearTerminalOutput = useCallback(() => {
    setTerminalOutput([{ type: 'info', text: '$ Agent output ready', timestamp: Date.now() }]);
  }, []);

  const runCode = useCallback(async () => {
    if (!activeFile) {
      setIsTerminalOpen(true);
      appendTerminalOutput({ type: 'error', text: 'No file selected. Open a file to run it.' });
      return;
    }

    if (activeFile.language === 'html') {
      setIsTerminalOpen(true);
      appendTerminalOutput({ type: 'info', text: 'HTML files are previewed in the Preview panel.' });
      return;
    }

    if (activeFile.language === 'css') {
      setIsTerminalOpen(true);
      appendTerminalOutput({ type: 'info', text: 'CSS files are applied through HTML or app entry points and cannot run directly.' });
      return;
    }

    setIsTerminalOpen(true);
    clearTerminalOutput();

    const response = await runFileOnServer(activeFile.id);
    if (!response.ok || !response.body) {
      appendTerminalOutput({ type: 'error', text: await response.text() });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        const line = chunk.split('\n').find((entry) => entry.startsWith('data: '));
        if (!line) {
          continue;
        }

        const payload = JSON.parse(line.slice(6)) as { type: string; text?: string; code?: number };
        if (payload.type === 'error') {
          appendTerminalOutput({ type: 'error', text: payload.text ?? 'Execution error' });
        } else if (payload.type === 'exit') {
          appendTerminalOutput({ type: 'success', text: `Process exited with code ${payload.code ?? 0}` });
        } else {
          appendTerminalOutput({ type: 'info', text: payload.text ?? '' });
        }
      }
    }
  }, [activeFile, appendTerminalOutput, clearTerminalOutput]);

  return {
    files,
    setFiles,
    openTabs,
    setOpenTabs,
    activeTabId,
    setActiveTabId,
    activeFile,
    dirtyFileIds,
    isTerminalOpen,
    setIsTerminalOpen,
    terminalOutput,
    setTerminalOutput,
    appendTerminalOutput,
    clearTerminalOutput,
    isCreatingFile,
    setIsCreatingFile,
    newFileName,
    setNewFileName,
    selectedTemplate,
    setSelectedTemplate,
    selectedCode,
    setSelectedCode,
    isAgentRunning,
    setIsAgentRunning,
    fetchFiles,
    saveFileToBackend,
    handleFileChange,
    openFile,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    handleCreateFile,
    handleDeleteFile,
    runCode,
  };
}
