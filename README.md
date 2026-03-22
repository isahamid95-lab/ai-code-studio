<div align="center">
<img width="1200" height="475" alt="AI Code Studio Pro" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🚀 AI Code Studio Pro

**Professional AI-Powered Development Environment**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![AI](https://img.shields.io/badge/AI-Qwen3%20%2B%20Gemini-ff6b6b.svg)](https://ai.studio/)

</div>

---

## ✨ Features

### 🎨 Core Features
- **Intelligent Code Editor** - CodeMirror 6 with syntax highlighting
- **AI Chat Assistant** - Real-time coding help
- **AI Agent Mode** - Autonomous code generation
- **Git Integration** - Full Git workflow in the IDE
- **Live Preview** - See changes instantly
- **Terminal** - Built-in terminal output
- **File Explorer** - Project file management
- **AI Background** - Dynamic AI-generated themes

### 🤖 Enhanced AI Features (NEW!)
- **🔍 Code Analysis** - Automatic bug detection, security scanning
- **🧪 Test Generation** - Auto-generate unit tests (Vitest/Jest)
- **♻️ Code Refactoring** - Improve code quality automatically
- **📖 Code Explanation** - Understand complex code
- **🐛 Debug Assistant** - Error analysis and fixes
- **⚡ Performance Optimization** - Speed and memory improvements

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Alibaba DashScope API key (for Qwen AI)
- Optional: Google Gemini API key

### Installation

```bash
# 1. Clone repository
git clone https://github.com/isahamid95-lab/ai-code-studio.git
cd ai-code-studio

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Configure API keys
# Edit .env.local and add your API keys:
VITE_ALIBABA_API_KEY=your_alibaba_key_here
VITE_ALIBABA_BASE_URL=https://coding-intl.dashscope.aliyuncs.com/v1

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

---

## 📖 Usage Guide

### Basic Coding
1. **Create File** - Click `+` in Explorer or Ctrl+N
2. **Write Code** - Use CodeMirror editor with AI assistance
3. **Run Code** - Press F5 or click Run button
4. **Save** - Ctrl+S or auto-save enabled

### AI Chat
1. Open Chat Panel (Ctrl+Shift+B)
2. Type your question
3. Get instant AI-powered answers
4. Quick actions:
   - 💡 Explain Code
   - 🐛 Find Bugs
   - ✨ Refactor

### AI Agent Mode
1. Enable **Agent Mode** in chat settings
2. Describe what you want to build
3. AI creates files automatically
4. Review and test the code

Example prompts:
- "Create a React todo app with localStorage"
- "Build a REST API with Express and PostgreSQL"
- "Add authentication to this app"

### Enhanced AI Features

#### Code Analysis
```typescript
// Select code → Right-click → Analyze Code
// Returns:
- Quality score (0-100)
- Bug detection
- Security issues
- Performance suggestions
```

#### Test Generation
```typescript
// Right-click file → Generate Tests
// Creates: *.test.ts with comprehensive tests
// Supports: Vitest, Jest, Playwright
```

#### Code Refactoring
```typescript
// Select code → Refactor
// Options:
- Performance
- Readability
- Security
- Maintainability
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle left panel |
| `Ctrl+Shift+B` | Toggle right panel (AI) |
| `Ctrl+\`` | Toggle terminal |
| `Ctrl+J` | Toggle terminal |
| `F5` | Run code |
| `Ctrl+S` | Save file |
| `Ctrl+N` | New file |
| `Ctrl+W` | Close tab |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **CodeMirror 6** - Code editor

### Backend
- **Express.js** - Server framework
- **simple-git** - Git operations
- **Vite Dev Server** - Hot reload

### AI
- **Alibaba Qwen3** - Primary coding AI
- **Google Gemini** - Secondary AI (optional)
- **Custom Prompts** - Optimized for coding tasks

---

## 📁 Project Structure

```
ai-code-studio/
├── src/
│   ├── components/      # React components
│   │   ├── ChatPanel.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── GitPanel.tsx
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useAgent.ts
│   │   ├── useChat.ts
│   │   ├── useFiles.ts
│   │   ├── useGit.ts
│   │   └── useEnhancedAgent.ts  # NEW!
│   ├── services/        # API calls
│   │   ├── api.ts
│   │   └── api-enhanced.ts  # NEW!
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main component
├── server.ts            # Express backend
├── project-workspace/   # User projects
├── .env.example         # Environment template
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
VITE_ALIBABA_API_KEY=sk-...        # Alibaba DashScope key
VITE_ALIBABA_BASE_URL=https://...   # API endpoint

# Optional
NODE_ENV=development|production
```

### AI Model Selection

In Settings modal, choose from Qwen, Zhipu, Kimi, and MiniMax models.

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Generate test coverage
npm run test:coverage
```

---

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

### Docker

```bash
# Build image
docker build -t ai-code-studio .

# Run container
docker run -p 3000:3000 ai-code-studio
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google AI Studio](https://ai.studio/) - Inspiration
- [CodeMirror](https://codemirror.net/) - Code editor
- [Vite](https://vitejs.dev/) - Build tool
- [Alibaba Cloud](https://www.alibabacloud.com/) - AI models

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/isahamid95-lab/ai-code-studio/issues)
- **Discussions:** [GitHub Discussions](https://github.com/isahamid95-lab/ai-code-studio/discussions)
- **Email:** support@aicodestudio.dev

---

<div align="center">
Made with ❤️ by @isahamid95-lab
</div>
