import type { FileItem, FileTemplate, Language } from '../types';

// --- Language Detection ---
export const detectLanguage = (filename: string): Language => {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.json')) return 'json';
  if (filename.endsWith('.md')) return 'markdown';
  return 'javascript';
};

// --- Initial Files (empty workspace) ---
export const initialFiles: FileItem[] = [];

// --- File Templates ---
export const FILE_TEMPLATES: Record<string, FileTemplate> = {
  'react': {
    name: 'React Component',
    defaultExt: '.tsx',
    content: `import React from 'react';

interface Props {
  title?: string;
}

export default function Component({ title = 'Hello World' }: Props) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-white/70 mt-2">This is a new React component.</p>
    </div>
  );
}
`
  },
  'html': {
    name: 'HTML5 Boilerplate',
    defaultExt: '.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0f0f14;
      color: white;
      margin: 0;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>Welcome to your new HTML file.</p>
</body>
</html>
`
  },
  'node': {
    name: 'Node.js Server',
    defaultExt: '.js',
    content: `const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello from Node.js Server!\\n');
});

server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
});
`
  }
};
