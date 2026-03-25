import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  CheckCircle2,
  Clock,
  ListTodo,
  Sparkles,
  Activity,
  TrendingUp,
  Cpu,
  X,
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../hooks/useTasks';
import TaskCard from './TaskCard';

const COLUMN_CONFIG: { key: Task['status']; label: string; icon: React.ReactNode; accent: string }[] = [
  { key: 'backlog', label: 'Backlog', icon: <ListTodo size={13} />, accent: 'text-text/40' },
  { key: 'in-progress', label: 'In Progress', icon: <Clock size={13} />, accent: 'text-amber-400' },
  { key: 'done', label: 'Done', icon: <CheckCircle2 size={13} />, accent: 'text-emerald-400' },
];

const QUICK_TASKS = [
  'Setup project structure',
  'Design landing page',
  'Implement authentication',
  'Write unit tests',
  'Optimize performance',
  'Deploy to production',
];

function StatCard({ label, value, icon, gradient }: { label: string; value: number; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-4 transition-all hover:bg-white/[0.05] group`}>
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-text/30 mb-1">{label}</p>
          <p className="text-2xl font-bold text-text/80">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-text/30">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (title: string, desc: string, priority: Task['priority']) => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), desc.trim(), priority);
    setTitle('');
    setDesc('');
    setPriority('medium');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[420px] max-w-[90vw]"
          >
            <div className="glass-panel rounded-2xl p-6 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-text/80">New Task</h3>
                </div>
                <button onClick={onClose} className="p-1.5 text-text/30 hover:text-text/60 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-text/30 mb-2 block">Title</label>
                  <input
                    ref={inputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="What needs to be done?"
                    className="glass-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-text/30 mb-2 block">Description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Optional details..."
                    rows={2}
                    className="glass-input w-full px-3.5 py-2.5 text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-text/30 mb-2 block">Priority</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 text-[11px] font-medium rounded-lg border transition-all cursor-pointer capitalize ${
                          priority === p
                            ? p === 'high'
                              ? 'bg-red-500/15 border-red-500/30 text-red-400'
                              : p === 'medium'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/[0.03] border-white/[0.06] text-text/30 hover:bg-white/[0.06]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-text/30 mb-2 block">Quick Add</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TASKS.map((qt) => (
                      <button
                        key={qt}
                        onClick={() => setTitle(qt)}
                        className="px-2.5 py-1 text-[10px] text-text/30 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-all cursor-pointer"
                      >
                        {qt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="w-full py-2.5 text-sm font-medium rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const DashboardPanel = React.memo(function DashboardPanel() {
  const { tasks, backlog, inProgress, done, addTask, updateTaskStatus, deleteTask } = useTasks();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const columns = [
    { ...COLUMN_CONFIG[0], tasks: backlog },
    { ...COLUMN_CONFIG[1], tasks: inProgress },
    { ...COLUMN_CONFIG[2], tasks: done },
  ];

  const completionRate = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <LayoutDashboard size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-text/90 tracking-tight">Dashboard</h1>
              <p className="text-[11px] text-text/30">Your glassmorphic task hub</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-xl border border-primary/20 transition-all cursor-pointer"
          >
            <Plus size={13} />
            New Task
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total" value={tasks.length} icon={<Activity size={18} />} gradient="bg-blue-500" />
          <StatCard label="In Progress" value={inProgress.length} icon={<Clock size={18} />} gradient="bg-amber-500" />
          <StatCard label="Completed" value={done.length} icon={<CheckCircle2 size={18} />} gradient="bg-emerald-500" />
          <StatCard label="Rate" value={completionRate} icon={<TrendingUp size={18} />} gradient="bg-cyan-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-4 h-full">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={col.accent}>{col.icon}</span>
                  <span className="text-[11px] font-semibold text-text/50 uppercase tracking-[0.1em]">
                    {col.label}
                  </span>
                  <span className="text-[10px] text-text/20 bg-white/[0.04] px-1.5 py-0.5 rounded-md">
                    {col.tasks.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                <AnimatePresence mode="popLayout">
                  {col.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStatus={updateTaskStatus}
                      onDelete={deleteTask}
                    />
                  ))}
                </AnimatePresence>

                {col.tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 opacity-30">
                    <Cpu size={24} className="text-text/15 mb-2" />
                    <p className="text-[11px] text-text/20">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddTaskModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={addTask} />
    </div>
  );
});

export default DashboardPanel;
