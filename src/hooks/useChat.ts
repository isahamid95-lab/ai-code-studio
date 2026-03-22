import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { ChatMessage, FileItem, AiProvider } from '../types';
import { detectLanguage } from '../constants';
import { sendChatMessage } from '../services/api';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function useChat(
  activeFile: FileItem | undefined,
  files: FileItem[],
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>,
  setOpenTabs: React.Dispatch<React.SetStateAction<string[]>>,
  setActiveTabId: React.Dispatch<React.SetStateAction<string>>,
  saveFileToBackend: (id: string, content: string) => Promise<void>,
  aiProvider: AiProvider,
  alibabaApiKey: string,
  alibabaModel: string,
  selectedCode: string,
  setRightPanelOpen: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Welcome to AI Code Studio Pro! I can help you write, explain, or debug your code. How can I assist you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    (window as any)._chatMessages = chatMessages;
    (window as any)._setChatMessages = setChatMessages;
  }, [chatMessages]);

  const applyFilesFromResponse = useCallback(async (responseText: string) => {
    const codeBlockRegex = /```(?:(\w+):([^\n`]+)|([^\s`\n]+\.\w+))?\n([\s\S]*?)```/g;
    const filenameCommentRegex = /^(?:\/\/|#|\/\*)\s*([\w.\-/]+\.\w+)/;

    const filesToApply: { name: string; content: string }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(responseText)) !== null) {
      let filename = match[2] || match[3] || '';
      const code = match[4] || '';

      if (!filename && code) {
        const firstLine = code.split('\n')[0];
        const commentMatch = firstLine.match(filenameCommentRegex);
        if (commentMatch) {
          filename = commentMatch[1];
        }
      }

      if (filename && code.trim()) {
        filesToApply.push({ name: filename.trim(), content: code.trimEnd() });
      }
    }

    for (const { name, content } of filesToApply) {
      const existing = files.find(f => f.name === name);
      if (existing) {
        setFiles(prev => prev.map(f => f.id === existing.id ? { ...f, content } : f));
        await saveFileToBackend(existing.id, content);
      } else {
        const newFile: FileItem = {
          id: name,
          name,
          language: detectLanguage(name),
          content
        };
        setFiles(prev => [...prev, newFile]);
        setOpenTabs(prev => prev.includes(name) ? prev : [...prev, name]);
        setActiveTabId(name);
        await saveFileToBackend(name, content);
      }
    }

    if (filesToApply.length > 0) {
      const names = filesToApply.map(f => f.name).join(', ');
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `✅ Dosyalar uygulandı: **${names}**`
      }]);
    }
  }, [files, setFiles, setOpenTabs, setActiveTabId, saveFileToBackend]);

  const sendMessage = useCallback(async (text: string, isHidden = false, displayText?: string) => {
    if (!text.trim() || isGenerating) return;

    const userMsgId = Date.now().toString();
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text, isHidden, displayText }]);
    setChatInput('');
    setIsGenerating(true);

    const modelMsgId = (Date.now() + 1).toString();
    setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

    try {
      let context = 'You are an expert AI coding assistant integrated into a professional web IDE (AI Code Studio Pro).\n';
      context += `\nIMPORTANT: When you generate code files, ALWAYS specify the filename in the code fence like this:\n`;
      context += '```language:filename.ext\n// code here\n```\n';
      context += `For example: \`\`\`typescript:App.tsx or \`\`\`javascript:index.js\n`;
      context += `This allows the IDE to automatically create/update files. Always use this format for every code file you produce.\n`;
      
      // Detect mentioned files
      const mentions = text.match(/@([\w.\-/]+\.\w+)/g);
      if (mentions) {
        context += '\nThe user has explicitly mentioned the following files for context:\n';
        mentions.forEach(m => {
          const filename = m.slice(1);
          const file = files.find(f => f.name === filename);
          if (file) {
            context += `\n--- File: ${filename} ---\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`;
          }
        });
      }

      if (activeFile && !mentions?.some(m => m.slice(1) === activeFile.name)) {
        context += `\nThe user is currently viewing/editing a file named "${activeFile.name}".\n`;
        context += `Here is the current content of the file:\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\`\n`;
      }
      context += `\nProvide clear, concise answers. Use markdown for code blocks.`;

      if (aiProvider === 'alibaba') {
        if (!alibabaApiKey) {
          throw new Error("Alibaba Cloud API Key is required. Please configure it in Settings.");
        }
        
        const response = await sendChatMessage(alibabaModel || 'qwen3-coder-plus', [
          { role: 'system', content: context },
          { role: 'user', content: text }
        ]);

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || "Failed to generate content from Alibaba Cloud");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === 'data: [DONE]') continue;
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const content = data.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    setChatMessages(prev => prev.map(msg =>
                      msg.id === modelMsgId ? { ...msg, text: msg.text + content } : msg
                    ));
                  }
                } catch (e) {
                  // Ignore incomplete chunk parse errors
                }
              }
            }
          }
        }
        await applyFilesFromResponse(fullResponse);
      } else {
        let fullResponse = '';
        const stream = await ai.models.generateContentStream({
          model: 'gemini-2.0-flash',
          contents: `${context}\n\nUser Request: ${text}`,
        });

        for await (const chunk of stream) {
          const t = chunk.text || '';
          fullResponse += t;
          setChatMessages(prev => prev.map(msg =>
            msg.id === modelMsgId ? { ...msg, text: msg.text + t } : msg
          ));
        }
        await applyFilesFromResponse(fullResponse);
      }
    } catch (error: any) {
      console.error("Error generating content:", error);
      setChatMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, text: 'Sorry, I encountered an error: ' + error.message } : msg
      ));
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, activeFile, aiProvider, alibabaApiKey, alibabaModel, applyFilesFromResponse]);

  const handleQuickAction = useCallback((action: 'explain' | 'bugs' | 'refactor') => {
    if (!activeFile) return;
    setRightPanelOpen(true);
    
    let prompt = '';
    let displayText = '';
    const target = selectedCode ? `the following selected code from ${activeFile.name}:\n\n\`\`\`${activeFile.language}\n${selectedCode}\n\`\`\`\n\n` : `the code in ${activeFile.name}`;
    const displayTarget = selectedCode ? `the selected code in ${activeFile.name}` : `the code in ${activeFile.name}`;

    switch (action) {
      case 'explain': 
        prompt = `Please explain ${target} step by step.`; 
        displayText = `Please explain ${displayTarget} step by step.`;
        break;
      case 'bugs': 
        prompt = `Please review ${target} for any bugs, security issues, or edge cases.`; 
        displayText = `Please review ${displayTarget} for any bugs, security issues, or edge cases.`;
        break;
      case 'refactor': 
        prompt = `Please suggest refactoring improvements for ${target} to make it cleaner and more efficient.`; 
        displayText = `Please suggest refactoring improvements for ${displayTarget} to make it cleaner and more efficient.`;
        break;
    }
    
    sendMessage(prompt, false, displayText);
  }, [activeFile, selectedCode, setRightPanelOpen, sendMessage]);

  return {
    chatMessages, setChatMessages,
    chatInput, setChatInput,
    isGenerating, setIsGenerating,
    chatEndRef,
    sendMessage,
    handleQuickAction,
  };
}
