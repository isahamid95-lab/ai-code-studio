export type Language = 'javascript' | 'typescript' | 'css' | 'html' | 'json' | 'markdown' | 'python' | 'java' | 'cpp' | 'go' | 'rust' | 'other';

export type AiProvider = 'alibaba' | 'gemini';

export interface FileItem {
  id: string;
  name: string;
  content: string;
  language: Language;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp?: number;
  isHidden?: boolean;
  displayText?: string;
}

export interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
  commitsBehind: number;
  commitsAhead: number;
  currentBranch: string;
}

export interface TerminalOutput {
  type: 'info' | 'success' | 'error' | 'warning';
  text: string;
  timestamp: number;
}

export interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warning';
  text: string;
  timestamp?: number;
}

export interface FileTemplate {
  name: string;
  defaultExt: string;
  content: string;
}

// Enhanced AI Types
export interface CodeAnalysis {
  score: number;
  issues: CodeIssue[];
  suggestions: string[];
}

export interface CodeIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'bug' | 'security' | 'performance' | 'style';
  message: string;
  line?: number;
  suggestion: string;
}

export interface TestGenerationResult {
  testFile: {
    filename: string;
    content: string;
  } | null;
  testCount: number;
  coverage: number;
}

export interface RefactoringResult {
  refactoredCode: string | null;
  changes: string[];
  beforeScore: number;
  afterScore: number;
}

export interface CodeExplanation {
  explanation: string;
  concepts: string[];
  examples: string[];
  resources: string[];
}

export interface DebugResult {
  rootCause: string;
  fix: string;
  prevention: string;
}

export interface PerformanceOptimization {
  optimizedCode: string;
  improvements: string[];
  beforeMetrics: {
    complexity: number;
    lines: number;
  };
  afterMetrics: {
    complexity: number;
    lines: number;
  };
}

export const FILE_TEMPLATES: Record<string, string> = {
  'React Component': `import React from 'react';

export default function ComponentName() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}`,
  
  'TypeScript Module': `export interface Config {
  name: string;
  value: number;
}

export function processData(config: Config): string {
  return \`\${config.name}: \${config.value}\`;
}`,
  
  'CSS Styles': `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}`,
  
  'HTML Template': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="script.js"></script>
</body>
</html>`,
  
  'Express Server': `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
  
  'Vitest Test': `import { describe, it, expect } from 'vitest';
import { processData } from '../src/module';

describe('Module Tests', () => {
  it('should process data correctly', () => {
    const result = processData({ name: 'Test', value: 42 });
    expect(result).toBe('Test: 42');
  });
});`
};
