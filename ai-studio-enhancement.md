# AI Studio Enhancement Plan

## Overview
The goal of this project is to analyze the existing AI Code Studio application, identify architectural, UX, and functional deficiencies, and transform it into a polished, fully functional web IDE that can seamlessly serve a user without issues. The project currently integrates Vite, React, TailwindCSS, CodeMirror, Framer Motion, and a Node/Express backend that proxies AI requests (Alibaba/Gemini) and manages file operations in a virtual workspace.

## Project Type
WEB

## Success Criteria
- [ ] No compilation or runtime errors in the frontend or backend.
- [ ] AI Assistant, File Explorer, Terminal, and Live Preview features work cohesively.
- [ ] Environment variables and security principles (like preventing path traversals) are robust.
- [ ] The user interface corresponds to a premium, "pro max" standard (glassmorphism smoothly integrated, functional settings).
- [ ] Project successfully passes all priority-based checklist audits.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Framer Motion, React-CodeMirror
- **Backend**: Express.js, child_process (for shell execution), simple-git
- **AI Integration**: @google/genai, Alibaba Qwen (DashScope API) proxy

## File Structure (Relevant Targets)
```
.
├── server.ts                  # Backend proxy and tooling API
├── src/
│   ├── App.tsx                # Main IDE Layout and hook orchestration
│   ├── hooks/                 # Logic separation (useChat, useFiles, useGit)
│   ├── components/            # UI components (ChatPanel, TerminalPanel, etc.)
│   └── index.css              # Global styles and Tailwind
└── project-workspace/         # User's virtual workspace
```

## Task Breakdown

### Task 1: Comprehensive Code & Security Audit 
- **Agent**: `security-auditor` | **Skill**: `vulnerability-scanner`, `code-review-checklist`
- **INPUT**: Current `server.ts` and `App.tsx` codebase.
- **OUTPUT**: Identified security loops in `/api/agent` (e.g. timeout limits, command execution vulnerabilities) and path traversal checks.
- **VERIFY**: `checklist.py` does not display any Priority 0 security warnings.

### Task 2: Frontend UI/UX Polish
- **Agent**: `frontend-specialist` | **Skill**: `ui-ux-pro-max`, `frontend-design`
- **INPUT**: `src/components/` and `src/App.tsx`.
- **OUTPUT**: Optimized glassmorphism background transitions, better contrast on text overlay, fully working settings modal, fixing any layout overflow issues in the terminal/file explorer panels.
- **VERIFY**: Responsive design holds on smaller screens, and no visual overlapping occurs.

### Task 3: Backend Robustness & Tool Optimization
- **Agent**: `backend-specialist` | **Skill**: `nodejs-best-practices`
- **INPUT**: `server.ts` Tool Loop (`/api/agent`).
- **OUTPUT**: Graceful error handling for missing files, preventing infinite loops in the LLM tool call cycle, and better standardizing the SSE output formatting.
- **VERIFY**: Executing `npm run dev` yields a robust server that does not crash when the AI agent hallucinates an incorrect tool call.

### Task 4: Functional Testing & Verification
- **Agent**: `test-engineer` | **Skill**: `webapp-testing`
- **INPUT**: The completed refactored code.
- **OUTPUT**: Verified IDE operations: ability to create a file, run `npm init -y` from AI prompt, and see the terminal output.
- **VERIFY**: The Playwright/manual tests pass and Phase X is cleared.

## Phase X: Verification
- [x] Webpack/Vite build passes successfully.
- [x] Security vulnerabilities audited and closed (Exec sync -> Async).
- [x] UI/UX tokens updated to Pro Max.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-03-22
