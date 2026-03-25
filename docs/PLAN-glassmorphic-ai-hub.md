# PLAN: Glassmorphic AI Hub

## 📋 Overview
A modern, premium portfolio and task management hub featuring glassmorphic UI elements and integrated AI assistance. This hub will serve as the primary interface for your projects and daily productivity.

- **Project Type**: WEB (React + Vite + Tailwind CSS)
- **Primary Agent**: `@frontend-specialist`
- **Design System**: Glassmorphism (Glass-panel, Glass-button, Neon accents)

---

## 🎯 Success Criteria
- [ ] Responsive landing page with glassmorphic layout.
- [ ] Task management interface with real-time feedback.
- [ ] Integrated AI Assistant panel (UI-only or mock logic).
- [ ] No purple/violet hex codes (Purple Ban compliance).
- [ ] 0 Lint errors and successful production build.

---

## 🛠️ Tech Stack
- **Frontend**: React 19 (Functional Components)
- **Styling**: Tailwind CSS 4 + Lucide Icons
- **Layout**: CSS Grid/Flexbox with `@layer utilities`
- **Animations**: Framer Motion (for micro-interactions)

---

## 📂 File Structure
```plaintext
project-workspace/src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── GlassContainer.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   └── TaskList.tsx
│   └── ai/
│       └── AIAssistantPanel.tsx
├── hooks/
│   └── useTasks.ts
└── App.tsx (Main Hub Entry)
```

---

## 📝 Task Breakdown

### Phase 1: Foundation
| Task ID | Name | Agent | Skills | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|--------------------------|
| 1.1 | Setup Docs & Base Styles | `@project-planner` | `clean-code` | `src/index.css` → Shared tokens for glassmorphism → Check for `--glass-bg` variables. |
| 1.2 | Layout Components | `@frontend-specialist` | `frontend-design` | Create `GlassContainer.tsx` & `Sidebar.tsx` → Sidebar with premium icons → Visual check on `localhost:3000`. |

### Phase 2: Core Features
| Task ID | Name | Agent | Skills | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|--------------------------|
| 2.1 | Task Management UI | `@frontend-specialist` | `react-best-practices` | `TaskList.tsx` & `TaskCard.tsx` → Render mock tasks with status → Functional check (hover effects). |
| 2.2 | AI Assistant UI | `@frontend-specialist` | `ui-ux-pro-max` | `AIAssistantPanel.tsx` → Glassmorphic chat interface → Check animations and typing effect. |

### Phase 3: Polish & Integration
| Task ID | Name | Agent | Skills | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|--------------------------|
| 3.1 | Responsive Refinement | `@frontend-specialist` | `frontend-design` | Responsive CSS classes → Mobile-friendly layout → Test via browser dev tools. |
| 3.2 | Micro-animations | `@frontend-specialist` | `react-best-practices` | Framer Motion integration → Smooth transitions for tasks → Visual verification. |

---

## ✅ PHASE X: VERIFICATION
- [ ] **Security**: `python .agent/scripts/checklist.py .`
- [ ] **Lint**: `npm run lint`
- [ ] **UX Audit**: `python .agent/scripts/ux_audit.py .`
- [ ] **Build**: `npm run build`
- [ ] **Final Check**: No purple/violet color usage.
