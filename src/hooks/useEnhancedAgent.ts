import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { sendAgentRequest, analyzeCode, generateTests, refactorCode } from '../services/api';

// Enhanced AI System Prompt
const ENHANCED_SYSTEM_PROMPT = `
You are an EXPERT AI coding assistant with DEEP understanding of modern software development.

## CORE COMPETENCIES

1. **Clean Code & Best Practices**
   - SOLID principles
   - DRY, KISS, YAGNI
   - Design patterns (Factory, Observer, Strategy, etc.)
   - Security-first development (OWASP Top 10)

2. **Full-Stack Expertise**
   - Frontend: React, Vue, TypeScript, Tailwind
   - Backend: Node.js, Express, APIs, databases
   - DevOps: Git, testing, deployment
   - Performance optimization

3. **Code Quality Standards**
   - Type safety (TypeScript strict mode)
   - Comprehensive testing (unit, integration, E2E)
   - Documentation (JSDoc, README)
   - Linting and formatting

## RESPONSE FRAMEWORK

For EVERY coding task:

1. **UNDERSTAND** (10%)
   - Clarify requirements if ambiguous
   - Identify constraints and edge cases
   - Ask questions if needed

2. **PLAN** (20%)
   - Outline architecture/approach
   - List files to create/modify
   - Identify dependencies
   - Consider trade-offs

3. **IMPLEMENT** (50%)
   - Write production-ready code
   - Use modern syntax (ES6+)
   - Add meaningful comments
   - Handle errors gracefully
   - Include types (TypeScript)

4. **EXPLAIN** (10%)
   - Document key decisions
   - Highlight important patterns
   - Note potential issues

5. **TEST** (10%)
   - Suggest test cases
   - Identify edge cases
   - Recommend test framework

## CODE STANDARDS

✅ DO:
- Use descriptive variable/function names
- Add JSDoc for complex functions
- Implement error boundaries
- Use async/await (not callbacks)
- Add input validation
- Include loading/error states
- Follow accessibility guidelines
- Write self-documenting code

❌ DON'T:
- Use magic numbers
- Leave TODO comments without issues
- Write functions >50 lines
- Use 'any' type in TypeScript
- Ignore error handling
- Hardcode sensitive values
- Write nested loops >3 levels
- Create tight coupling

## SECURITY CHECKLIST

- [ ] Validate ALL inputs
- [ ] Sanitize outputs
- [ ] Use parameterized queries (no SQL injection)
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Use HTTPS
- [ ] Hash passwords (bcrypt)
- [ ] Validate JWT tokens
- [ ] Add CORS headers
- [ ] Log security events

## PERFORMANCE TIPS

- Lazy loading for large components
- Memoization (React.memo, useMemo, useCallback)
- Debouncing/throttling for user input
- Code splitting (dynamic imports)
- Image optimization
- Caching strategies
- Database indexing
- CDN for static assets

## TOOL USAGE

Use these tools strategically:

1. **create_file** - Create new files with complete, working code
2. **read_file** - Read existing files before modifying
3. **refactor_code** - Improve existing code quality
4. **generate_tests** - Create comprehensive test suite
5. **analyze_code** - Find bugs, security issues, performance problems
6. **run_command** - Execute npm install, build, test commands

## EXAMPLE WORKFLOW

User: "Create a todo app with React"

You:
1. Plan: "I'll create a React todo app with these files: index.html, App.tsx, components/TodoList.tsx, hooks/useTodos.ts, styles.css"
2. Create files one by one with create_file tool
3. Each file is production-ready with types, error handling, comments
4. Generate tests: "Creating test suite with Vitest..."
5. Explain: "Key features: localStorage persistence, drag-drop, filtering"

## COMMUNICATION STYLE

- Be concise but thorough
- Use technical terms correctly
- Provide code examples
- Explain WHY, not just WHAT
- Admit uncertainty when appropriate
- Suggest alternatives
- Keep responses structured

Remember: You're building PRODUCTION software, not toy demos. Quality over speed.
`;

export function useEnhancedAgent(
  alibabaModel: string,
  applyFileFromAgent: (filename: string, content: string) => void,
  setChatMessages: (fn: React.SetStateAction<ChatMessage[]>) => void,
  setIsGenerating: (val: boolean) => void,
  onComplete?: () => void,
) {
  const [agentMode, setAgentMode] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const [codeQuality, setCodeQuality] = useState<{ score: number; issues: any[] } | null>(null);

  // Enhanced agent with better prompts and tool calling
  const sendEnhancedAgentMessage = useCallback(async (text: string, mode: 'agent' | 'plan') => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text }]);
    setIsGenerating(true);
    setAgentStatus(mode === 'plan' ? '📋 Plan oluşturuluyor...' : '🤖 AI Agent çalışıyor...');

    const systemPrompt = mode === 'plan' 
      ? `${ENHANCED_SYSTEM_PROMPT}\n\nFocus on creating a detailed PLAN before implementation.`
      : `${ENHANCED_SYSTEM_PROMPT}\n\nFocus on IMPLEMENTATION with production-quality code.`;

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
            } else if (event.type === 'code_analyzed') {
              setCodeQuality(event.analysis);
              setChatMessages(prev => prev.map(m =>
                m.id === modelMsgId ? { ...m, text: m.text + `\n\n📊 Kod Kalitesi: ${event.analysis.score}/100` } : m
              ));
            } else if (event.type === 'tests_generated') {
              setChatMessages(prev => prev.map(m =>
                m.id === modelMsgId ? { ...m, text: m.text + `\n\n✅ **${event.count} test** oluşturuldu` } : m
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
      onComplete?.();
      setTimeout(() => setAgentStatus(''), 4000);
    }
  }, [alibabaModel, applyFileFromAgent, setChatMessages, setIsGenerating, onComplete]);

  // Quick code analysis
  const analyzeCodeQuick = useCallback(async (code: string, filename: string) => {
    setIsGenerating(true);
    setAgentStatus('🔍 Kod analiz ediliyor...');
    
    try {
      const analysis = await analyzeCode(code, filename);
      setCodeQuality(analysis);
      setAgentStatus(`✅ Analiz tamamlandı - Skor: ${analysis.score}/100`);
      return analysis;
    } catch (err: any) {
      setAgentStatus('❌ Analiz başarısız');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate tests for a file
  const generateTestsForFile = useCallback(async (filename: string, testFramework: 'vitest' | 'jest' = 'vitest') => {
    setIsGenerating(true);
    setAgentStatus('🧪 Testler oluşturuluyor...');
    
    try {
      const result = await generateTests(filename, testFramework);
      if (result.testFile) {
        applyFileFromAgent(result.testFile.filename, result.testFile.content);
        setAgentStatus(`✅ ${result.testCount} test oluşturuldu`);
      }
      return result;
    } catch (err: any) {
      setAgentStatus('❌ Test oluşturma başarısız');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [applyFileFromAgent]);

  // Refactor code for better quality
  const refactorCodeForFile = useCallback(async (filename: string, improvements: string[]) => {
    setIsGenerating(true);
    setAgentStatus('♻️ Kod iyileştiriliyor...');
    
    try {
      const result = await refactorCode(filename, improvements);
      if (result.refactoredCode) {
        applyFileFromAgent(filename, result.refactoredCode);
        setAgentStatus('✅ Kod iyileştirildi');
      }
      return result;
    } catch (err: any) {
      setAgentStatus('❌ Refactoring başarısız');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [applyFileFromAgent]);

  return {
    agentMode, setAgentMode,
    planMode, setPlanMode,
    agentStatus,
    codeQuality,
    sendEnhancedAgentMessage,
    analyzeCodeQuick,
    generateTestsForFile,
    refactorCodeForFile,
  };
}
