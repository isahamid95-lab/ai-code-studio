import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { sendAgentRequest } from '../services/api';

export function useAgent(
  alibabaModel: string,
  applyFileFromAgent: (filename: string, content: string) => void,
  setChatMessages: (fn: React.SetStateAction<ChatMessage[]>) => void,
  setIsGenerating: (val: boolean) => void,
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

    const systemPrompt = `You are an expert full-stack AI coding agent working inside "AI Code Studio Pro", a professional web IDE. You build REAL, PRODUCTION-QUALITY applications — not toy demos.

## CRITICAL RULES — MULTI-FILE ARCHITECTURE

1. **NEVER put everything in a single HTML file.** Always create SEPARATE files:
   - \`index.html\` — Clean HTML structure with <link> and <script> references
   - \`style.css\` — All styles, design tokens, animations, responsive design
   - \`script.js\` (or \`app.js\`) — All JavaScript logic, event handling, API calls
   - Additional files as needed (e.g., \`utils.js\`, \`api.js\`, \`components/\`)

2. **Professional code quality:**
   - Use modern ES6+ syntax (const/let, arrow functions, template literals, async/await)
   - Add meaningful comments and documentation
   - Handle errors properly with try/catch
   - Use semantic HTML5 elements
   - Implement responsive design with CSS Grid/Flexbox
   - Add smooth animations and transitions

3. **Real-world features — not placeholders:**
   - Working form validation
   - Real data handling (localStorage, API calls where relevant)
   - Proper loading/error states
   - Keyboard accessibility
   - Mobile-friendly design

4. **Premium visual design:**
   - Modern color palettes (no plain red/blue/green)
   - Smooth gradients, subtle shadows
   - Micro-animations (hover, focus, transitions)
   - Professional typography (use Google Fonts when applicable)
   - Dark mode support when appropriate

5. **File organization:**
   - Keep files focused and single-responsibility
   - Use descriptive filenames
   - For larger projects, use folders (e.g., \`css/\`, \`js/\`, \`components/\`)

## TOOLS
Use the \`create_file\` tool to create each file separately. Always create ALL necessary files — HTML, CSS, JS, config, etc. The workspace serves files via /preview/index.html so the user can see results immediately.

## EXAMPLE STRUCTURE for a Todo App:
- create_file("index.html", "<!DOCTYPE html>...with <link href='style.css'> and <script src='app.js'>")
- create_file("style.css", "/* Modern CSS with variables, grid, animations */")  
- create_file("app.js", "// Complete application logic with classes/modules")

IMPORTANT: Start creating files immediately using tools. Do NOT just explain — EXECUTE by calling create_file for every file.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ];

    const modelMsgId = (Date.now() + 1).toString();
    setChatMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

    try {
      const response = await sendAgentRequest(alibabaModel || 'qwen3-coder-plus', messages, mode);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const createdFiles: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'plan') {
              setChatMessages(prev => prev.map(m =>
                m.id === modelMsgId ? { ...m, text: `## 📋 Plan\n${event.content}\n\n---\n` } : m
              ));
            } else if (event.type === 'text') {
              setChatMessages(prev => prev.map(m =>
                m.id === modelMsgId ? { ...m, text: m.text + event.content } : m
              ));
            } else if (event.type === 'file_created') {
              applyFileFromAgent(event.filename, event.content);
              createdFiles.push(event.filename);
              setAgentStatus(`✅ Oluşturuldu: ${event.filename}`);
              setChatMessages(prev => prev.map(m =>
                m.id === modelMsgId ? { ...m, text: m.text + `\n\n✅ **${event.filename}** oluşturuldu` } : m
              ));
            } else if (event.type === 'done') {
              if (createdFiles.length > 0) {
                setAgentStatus(`✅ Tamamlandı — ${createdFiles.length} dosya oluşturuldu`);
              } else {
                setAgentStatus('');
              }
            } else if (event.type === 'error') {
              setChatMessages(prev => prev.map(m =>
                m.id === modelMsgId ? { ...m, text: m.text + `\n\n❌ Hata: ${event.content}` } : m
              ));
            }
          } catch (e) { /* ignore parse errors */ }
        }
      }
    } catch (err: any) {
      setChatMessages(prev => prev.map(m =>
        m.id === modelMsgId ? { ...m, text: `❌ Hata: ${err.message}` } : m
      ));
    } finally {
      setIsGenerating(false);
      // Sync file list from server to ensure Explorer is accurate
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
