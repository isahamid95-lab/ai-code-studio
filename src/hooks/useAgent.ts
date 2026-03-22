import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { sendChatMessage } from '../services/api';
import { getWebContainer } from '../lib/webcontainer';

export function useAgent(
  alibabaModel: string,
  applyFileFromAgent: (filename: string, content: string) => void,
  setChatMessages: (fn: React.SetStateAction<ChatMessage[]>) => void,
  setIsGenerating: (val: boolean) => void,
  files: any[],
  onComplete?: () => void,
) {
  const [agentMode, setAgentMode] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');

  const sendAgentMessage = useCallback(async (text: string, mode: 'agent' | 'plan') => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text }]);
    setIsGenerating(true);
    setAgentStatus(mode === 'plan' ? '📋 Plan oluşturuluyor...' : '🤖 Agent çalışıyor...');

    const fileList = files.map(f => f.id).join('\n');
    const activeFile = (window as any)._activeFileId || 'None';
    
    const systemPrompt = `You are an elite, senior-tier AI software architect and developer.
You act with the intelligence and autonomous capability of Bolt or Lovable.

ENVIRONMENT:
- Runtime: WebContainer (Pure Node.js browser OS)
- CLI access: Interactive 'jsh' shells
- Target workspace: Empty but persistent

PROJECT STATE:
Active File: ${activeFile}
All Workspace Files:
${fileList || '(empty)'}

AGENT PROTOCOL:
1. **Analyze First**: Use 'read_file' to understand dependencies or existing logic before editing.
2. **Execute via CLI**: Use 'run_command' for bulk tasks (installing packages, running tests, scaffolding).
3. **Atomic Writes**: Use 'create_file' to implement or patch files with clean, production-ready code.
4. **Self-Correct**: If a command fails or a file isn't found, use 'run_command ("ls -R")' to re-verify state.
5. **Auto-Context**: If the user mentions a file with '@' (e.g. "@App.tsx"), immediately use 'read_file' to understand its content.

COMMUNICATION:
- Keep explanations ultra-short. 
- Focus on the technical implementation.
- Be precise, fast, and architectural.`;

    const conversationMessages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ];

    const modelMsgId = (Date.now() + 1).toString();
    setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

    const tools = [
      {
        type: 'function',
        function: {
          name: 'create_file',
          description: 'Create a new file with the specified content',
          parameters: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              content: { type: 'string' }
            },
            required: ['filename', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'run_command',
          description: 'Execute a shell command. Use this for: npm install, npm run dev, mkdir, etc. Ensure non-interactive flags (-y).',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string' }
            },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read the content of an existing file',
          parameters: {
            type: 'object',
            properties: {
              filename: { type: 'string' }
            },
            required: ['filename']
          }
        }
      }
    ];

    try {
      const wc = await getWebContainer();
      const MAX_ITERATIONS = 25;
      const createdFiles: string[] = [];

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await sendChatMessage(alibabaModel || 'qwen3-coder-plus', conversationMessages, {
          tools,
          tool_choice: 'auto',
          stream: false
        });

        if (!response.ok) {
          const err = await response.text();
          setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: m.text + `\n❌ Hata: ${err}` } : m));
          break;
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;
        if (!message) break;

        if (message.content) {
          setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: m.text + message.content + '\n' } : m));
        }

        if (!message.tool_calls || message.tool_calls.length === 0) break;
        
        conversationMessages.push(message);

        for (const toolCall of message.tool_calls) {
          let toolResult = '';
          try {
            const args = JSON.parse(toolCall.function.arguments);
            if (toolCall.function.name === 'create_file') {
              setAgentStatus(`Masaüstüne yazılıyor: ${args.filename}`);
              
              const parts = args.filename.split('/');
              let currentPath = '';
              for (let p = 0; p < parts.length - 1; p++) {
                // Ignore empty parts (e.g. leading slash)
                if(!parts[p]) continue; 
                currentPath += '/' + parts[p];
                try { await wc.fs.mkdir(currentPath); } catch (e) { /* ignore if exists */ }
              }

              await wc.fs.writeFile('/' + args.filename.replace(/^\/+/, ''), args.content);
              createdFiles.push(args.filename);
              applyFileFromAgent(args.filename, args.content);
              toolResult = `Created ${args.filename} successfully.`;
              
              setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: m.text + `\n✅ **${args.filename}** oluşturuldu.\n` } : m));
              
            } else if (toolCall.function.name === 'run_command') {
              setAgentStatus(`Komut çalıştırılıyor: ${args.command}`);
              const process = await wc.spawn('jsh', ['-c', args.command]);
              
              const outputReader = process.output.getReader();
              let outputStr = '';
              
              // Read output until process exits
              process.output.pipeTo(new WritableStream({
                write(data) {
                  outputStr += data;
                }
              }));
              
              const exitCode = await process.exit;
              toolResult = exitCode === 0 ? `Command succeeded. Output: ${outputStr}` : `Command failed with code ${exitCode}. Output: ${outputStr}`;
              
              setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: m.text + `\n⚙️ \`${args.command}\` çalıştırıldı.\n` } : m));
            } else if (toolCall.function.name === 'read_file') {
              setAgentStatus(`Okunuyor: ${args.filename}`);
              try {
                const content = await wc.fs.readFile(args.filename, 'utf-8');
                toolResult = content;
              } catch (err: any) {
                toolResult = `Error reading file: ${err.message}`;
              }
            }
          } catch (e: any) {
            toolResult = `Error executing tool: ${e.message}`;
          }
          
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult
          });
        }
      }

      setAgentStatus(`✅ Tamamlandı — ${createdFiles.length > 0 ? createdFiles.length + ' dosya oluşturuldu' : ''}`);

    } catch (err: any) {
      setChatMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: m.text + `\n❌ Hata: ${err.message}` } : m));
    } finally {
      setIsGenerating(false);
      onComplete?.();
      setTimeout(() => setAgentStatus(''), 4000);
    }
  }, [alibabaModel, applyFileFromAgent, setChatMessages, setIsGenerating, onComplete]);

  return {
    agentMode, setAgentMode,
    planMode, setPlanMode,
    agentStatus,
    sendAgentMessage,
  };
}
