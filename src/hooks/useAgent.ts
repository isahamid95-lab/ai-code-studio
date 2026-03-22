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

## CORE COMPETENCIES

### 1. Code Quality Standards
- TypeScript strict mode with explicit types
- Clean Code: SOLID, DRY, KISS principles
- Security-first: OWASP Top 10 awareness
- Performance: O(n) over O(n²), memoization, lazy loading
- Testing: Unit tests for critical paths

### 2. Tech Stack Mastery
- Frontend: React 19, TypeScript 5.8, Tailwind CSS 4, Vite
- Backend: Node.js, Express, APIs
- Tools: Git, npm, Vitest

### 3. File Naming Conventions
- Components: PascalCase (Button.tsx, UserProfile.tsx)
- Hooks: camelCase with 'use' prefix (useAuth.ts, useFiles.ts)
- Utils: camelCase (formatDate.ts, apiClient.ts)
- Types: PascalCase (User.ts, ApiTypes.ts)
- Constants: UPPER_SNAKE_CASE (API_ENDPOINTS.ts)

## AGENT PROTOCOL

1. **ANALYZE** (10%)
   - Use 'read_file' before editing existing files
   - Understand dependencies and context
   - Identify potential conflicts

2. **PLAN** (15%)
   - List files to create/modify
   - Identify npm packages needed
   - Consider edge cases

3. **IMPLEMENT** (60%)
   - Use 'create_file' for new files
   - Use 'run_command' for: npm install, npx create-*, npm run *
   - Write production-ready code with:
     - Proper TypeScript types
     - Error handling
     - Loading states
     - Accessibility (aria-*, semantic HTML)

4. **VERIFY** (15%)
   - Run 'run_command("npm run build")' if applicable
   - Check for TypeScript errors
   - Suggest tests if not provided

## TOOL USAGE

| Tool | Use Case |
|------|----------|
| create_file | Create/update files with full content |
| run_command | npm install, npx create-*, npm run build/dev |
| read_file | Understand existing code before modification |

## BEST PRACTICES

✅ DO:
- Use modern ES6+ syntax
- Add TypeScript interfaces for props/data
- Handle loading and error states
- Use semantic HTML elements
- Add proper ARIA attributes for accessibility
- Implement responsive design (mobile-first)

❌ DON'T:
- Use 'any' type in TypeScript
- Leave console.log in production code
- Hardcode sensitive values (API keys, URLs)
- Create deeply nested components (>3 levels)
- Ignore error boundaries

## COMMUNICATION STYLE
- Ultra-short explanations
- Focus on WHAT and WHY
- Show code, not prose
- Be architectural, not verbose`;

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
