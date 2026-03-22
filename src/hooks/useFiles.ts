import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileItem, LogEntry } from '../types';
import { initialFiles, detectLanguage } from '../constants';
import { fetchFilesFromServer, saveFileToServer, deleteFileFromServer, runFileOnServer } from '../services/api';

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as unknown as T;
}

export function useFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<LogEntry[]>([
    { type: 'info', text: '$ Terminal ready' }
  ]);

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState('');

  const activeFile = files.find(f => f.id === activeTabId);

  // Save to backend with debounce
  const debouncedSave = useDebouncedCallback(async (id: string, content: string) => {
    try {
      await saveFileToServer(id, content);
    } catch (e) {
      console.error("Failed to save file", e);
    }
  }, 500);

  const saveFileToBackend = useCallback(async (id: string, content: string) => {
    try {
      await saveFileToServer(id, content);
    } catch (e) {
      console.error("Failed to save file", e);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const serverFiles = await fetchFilesFromServer();
      if (serverFiles && serverFiles.length > 0) {
        setFiles(serverFiles);
      } else {
        // Workspace is empty — start clean
        setFiles([]);
        setOpenTabs([]);
        setActiveTabId('');
      }
    } catch (e) {
      console.error("Failed to fetch files", e);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileChange = useCallback((newContent: string) => {
    setFiles(prev => prev.map(f => f.id === activeTabId ? { ...f, content: newContent } : f));
    debouncedSave(activeTabId, newContent);
  }, [activeTabId, debouncedSave]);

  const openFile = useCallback((id: string) => {
    setOpenTabs(prev => prev.includes(id) ? prev : [...prev, id]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== id);
      if (activeTabId === id) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : '');
      }
      return newTabs;
    });
  }, [activeTabId]);

  const handleCreateFile = useCallback((templates: Record<string, { content: string; defaultExt: string }>) => {
    if (!newFileName.trim()) {
      setIsCreatingFile(false);
      setSelectedTemplate(null);
      return;
    }
    const content = selectedTemplate && templates[selectedTemplate] ? templates[selectedTemplate].content : '';
    const newFile: FileItem = {
      id: newFileName.trim(),
      name: newFileName.trim(),
      language: detectLanguage(newFileName.trim()),
      content
    };
    setFiles(prev => [...prev, newFile]);
    setOpenTabs(prev => [...prev, newFile.id]);
    setActiveTabId(newFile.id);
    setNewFileName('');
    setIsCreatingFile(false);
    setSelectedTemplate(null);
    saveFileToBackend(newFile.id, content);
  }, [newFileName, selectedTemplate, saveFileToBackend]);

  const handleDeleteFile = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteFileFromServer(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      setOpenTabs(prev => {
        const newTabs = prev.filter(t => t !== id);
        if (activeTabId === id) {
          setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : '');
        }
        return newTabs;
      });
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  }, [activeTabId]);

  const applyFileFromAgent = useCallback((filename: string, content: string) => {
    const lang = detectLanguage(filename);
    const displayName = filename; // Keep full path for proper tree display
    setFiles(prev => {
      const existing = prev.find(f => f.id === filename || f.name === filename);
      if (existing) {
        return prev.map(f => f.id === existing.id ? { ...f, content, language: lang } : f);
      }
      return [...prev, { id: filename, name: displayName, language: lang, content }];
    });
    setOpenTabs(prev => prev.includes(filename) ? prev : [...prev, filename]);
    setActiveTabId(filename);
    saveFileToBackend(filename, content);
  }, [saveFileToBackend]);

  const runCode = useCallback(async () => {
    if (!activeFile) {
      setIsTerminalOpen(true);
      setTerminalOutput(prev => [...prev, { type: 'error', text: '⚠️ No file selected. Open a file to run it.' }]);
      return;
    }
    if (activeFile.language === 'html') {
      setIsTerminalOpen(true);
      setTerminalOutput(prev => [...prev, { type: 'info', text: `ℹ️ HTML files can be previewed — use the Live Preview feature (coming soon). For now, open the file directly in a browser.` }]);
      return;
    }
    if (activeFile.language === 'css') {
      setIsTerminalOpen(true);
      setTerminalOutput(prev => [...prev, { type: 'info', text: `ℹ️ CSS files cannot be executed directly. Link them in an HTML file for styling.` }]);
      return;
    }
    if (activeFile.language !== 'javascript' && activeFile.language !== 'typescript') {
      setIsTerminalOpen(true);
      setTerminalOutput(prev => [...prev, { type: 'error', text: `⚠️ Cannot execute ${activeFile.language} files in this environment. Only JavaScript and TypeScript are supported.` }]);
      return;
    }

    setIsTerminalOpen(true);
    setTerminalOutput([{ type: 'info', text: `> Executing ${activeFile.name}...` }]);

    try {
      const response = await runFileOnServer(activeFile.id);

      if (!response.ok) {
        const errorData = await response.json();
        setTerminalOutput(prev => [...prev, { type: 'error', text: `Error: ${errorData.error}` }]);
        return;
      }

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'exit') {
                setTerminalOutput(prev => [...prev, { type: 'info', text: `> Execution finished with code ${data.code}.` }]);
              } else {
                setTerminalOutput(prev => [...prev, { type: data.type, text: data.text.trimEnd() }]);
              }
            } catch (e) {
              console.error('Failed to parse SSE data', e);
            }
          }
        }
      }
    } catch (err: any) {
      setTerminalOutput(prev => [...prev, { type: 'error', text: err.toString() }]);
    }
  }, [activeFile]);

  return {
    files, setFiles,
    openTabs, setOpenTabs,
    activeTabId, setActiveTabId,
    activeFile,
    isTerminalOpen, setIsTerminalOpen,
    terminalOutput, setTerminalOutput,
    isCreatingFile, setIsCreatingFile,
    newFileName, setNewFileName,
    selectedTemplate, setSelectedTemplate,
    selectedCode, setSelectedCode,
    handleFileChange,
    openFile,
    closeTab,
    handleCreateFile,
    handleDeleteFile,
    applyFileFromAgent,
    runCode,
    fetchFiles,
    saveFileToBackend,
  };
}
