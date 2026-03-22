import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileItem, LogEntry } from '../types';
import { initialFiles, detectLanguage } from '../constants';
import { fetchFilesFromServer, saveFileToServer, deleteFileFromServer, runFileOnServer } from '../services/api';
import { saveProject, loadProject, clearProject } from '../utils/persistence';
import { getWebContainer } from '../lib/webcontainer';

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
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());

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
      setDirtyFileIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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
        setFiles(prevFiles => {
          // Optimization: Check if anything actually changed besides the current active file's content
          // This prevents global re-renders of the explorer and tabs if only the server fs is being polled
          const isSame = prevFiles.length === serverFiles.length && 
            prevFiles.every((f, i) => f.id === serverFiles[i].id && f.name === serverFiles[i].name);
          
          if (isSame) {
            // Only update content if it's different (and not for the active file being edited)
            let hasContentChange = false;
            const updated = prevFiles.map(localFile => {
              const serverFile = serverFiles.find(sf => sf.id === localFile.id);
              if (serverFile && serverFile.content !== localFile.content) {
                if (activeTabId === localFile.id) return localFile; // Skip active file
                hasContentChange = true;
                return { ...localFile, content: serverFile.content };
              }
              return localFile;
            });
            return hasContentChange ? updated : prevFiles;
          }
          
          return serverFiles;
        });
      } else if (serverFiles && serverFiles.length === 0) {
        setFiles([]);
        setOpenTabs([]);
        setActiveTabId('');
      }
    } catch (e) {
      console.error("Failed to fetch files", e);
    }
  }, [activeTabId]);

  useEffect(() => {
    fetchFiles();
    // Throttle File Sync from WebContainer (10s instead of 3s for performance)
    const intervalId = setInterval(fetchFiles, 10000);
    return () => clearInterval(intervalId);
  }, [fetchFiles]);

  // Persistence Auto-Save
  useEffect(() => {
    if (files.length > 0) {
      const chatMessages = (window as any)._chatMessages || [];
      saveProject(files, activeTabId, chatMessages).catch(console.error);
    }
  }, [files, activeTabId]);

  // Initial Restore/Scaffold
  useEffect(() => {
    (async () => {
       const snapshot = await loadProject();
       if (snapshot && snapshot.files.length > 0 && files.length === 0) {
          // Sync restored files back to WC filesystem
          const wc = await getWebContainer();
          for (const file of snapshot.files) {
             await wc.fs.writeFile(file.id, file.content);
          }
          setFiles(snapshot.files);
          setActiveTabId(snapshot.activeId);
          setOpenTabs(snapshot.files.filter(f => f.id === snapshot.activeId).map(f => f.id));
          if (snapshot.chatMessages && (window as any)._setChatMessages) {
             (window as any)._setChatMessages(snapshot.chatMessages);
          }
       }
    })();
  }, []);

  const handleFileChange = useCallback((newContent: string) => {
    setFiles(prev => prev.map(f => f.id === activeTabId ? { ...f, content: newContent } : f));
    setDirtyFileIds(prev => new Set(prev).add(activeTabId));
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

  const closeOtherTabs = useCallback((id: string) => {
    setOpenTabs([id]);
    setActiveTabId(id);
  }, []);

  const closeAllTabs = useCallback(() => {
    setOpenTabs([]);
    setActiveTabId('');
  }, []);

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
      content,
      createdAt: Date.now(),
      updatedAt: Date.now()
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
        return prev.map(f => f.id === existing.id ? { ...f, content, language: lang, updatedAt: Date.now() } : f);
      }
      return [...prev, { id: filename, name: displayName, language: lang, content, createdAt: Date.now(), updatedAt: Date.now() }];
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
    dirtyFileIds,
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
    closeOtherTabs,
    closeAllTabs,
    handleCreateFile,
    handleDeleteFile,
    applyFileFromAgent,
    runCode,
    fetchFiles,
    saveFileToBackend,
  };
}
