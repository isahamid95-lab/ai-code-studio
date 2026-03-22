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
    
    const systemPrompt = `You are an ELITE AI software architect with production-grade expertise.

## ENVIRONMENT
- Runtime: WebContainer (Node.js browser OS)
- CLI: Interactive 'jsh' shells with full npm/npx support
- Workspace: Persistent, initially empty

## PROJECT STATE
Active File: ${activeFile}
All Files:
${fileList || '(empty)'}

## CORE COMPETENCIES & STRICT CODING STANDARDS (NO MOCK APPS)

### 1. ABSOLUTELY NO HTML/JS MOCKUPS
- NEVER generate simple plain HTML files for UI requests.
- DO NOT fake functionality with basic \`<script>\` tags.
- NEVER start a project by just creating 'index.html'.

### 2. REAL MODERN APPLICATIONS ONLY
- You MUST construct REAL applications (React, Next.js, Node.js, Tailwind CSS).
- Use 'run_command' heavily to bootstrap projects. IMPORTANT: The workspace is NEVER empty. To bypass hanging prompts, you MUST scaffold into a temp folder and move it: \`npx create-vite@latest temp --template react-ts && cp -r temp/. ./ && rm -rf temp && npm install\`
- Write modular \`.tsx\` or \`.ts\` components in a standard \`src/\` structure.
- Assume a modern Node.js environment structure and produce production-ready code.

### 3. Code Quality Standards
- TypeScript strict mode with explicit types
- Clean Code: SOLID, DRY, KISS principles
- Security-first: OWASP Top 10 awareness

## AGENT PROTOCOL

1. **ANALYZE** (10%)
   - Use 'read_file' before editing existing files
   - Understand dependencies and context

2. **PLAN** (15%)
   - List files to create/modify
   - Plan NPM dependencies and real architecture.

3. **IMPLEMENT** (60%)
   - Use 'run_command' for: npm install, npx create-*, npm run dev. This is CRITICAL.
   - Use 'create_file' for new modern components/features
   - Write production-ready code with:
     - Proper TypeScript types
     - Error handling & loading states

4. **VERIFY** (15%)
   - Run 'run_command("npm run lint")' or tsc to check for errors
   - Suggest tests if not provided

## TOOL USAGE

| Tool | Use Case |
|------|----------|
| create_file | Create/update files with full content |
| run_command | npm install, npx create-*, npm run dev |
| read_file | Understand existing code before modification |

## COMMUNICATION STYLE
- Ultra-short explanations
- Focus on WHAT and WHY
- Show code, not prose`;

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
              
              let outputStr = '';
              
              // Read output until process exits
              process.output.pipeTo(new WritableStream({
                write(data) {
                  outputStr += data;
                }
              })).catch(err => {
                console.error("Stream reading error:", err);
              });
              
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
