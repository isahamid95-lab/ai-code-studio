import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Flame,
  Minus,
  ChevronDown,
} from 'lucide-react';
import type { Task } from '../hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_CONFIG = {
  high: {
    dot: 'bg-red-400',
    glow: 'shadow-[0_0_12px_rgba(248,113,113,0.25)]',
    label: 'High',
    icon: <Flame size={10} className="text-red-400" />,
  },
  medium: {
    dot: 'bg-amber-400',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.15)]',
    label: 'Medium',
    icon: <Minus size={10} className="text-amber-400" />,
  },
  low: {
    dot: 'bg-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    label: 'Low',
    icon: <ChevronDown size={10} className="text-emerald-400" />,
  },
};

const STATUS_FLOW: Record<Task['status'], Task['status'] | null> = {
  backlog: 'in-progress',
  'in-progress': 'done',
  done: null,
};

const STATUS_BACK: Record<Task['status'], Task['status'] | null> = {
  backlog: null,
  'in-progress': 'backlog',
  done: 'in-progress',
};

const TaskCard = React.memo(function TaskCard({ task, onUpdateStatus, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pri = PRIORITY_CONFIG[task.priority];
  const nextStatus = STATUS_FLOW[task.status];
  const prevStatus = STATUS_BACK[task.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md p-3.5 transition-all duration-200 cursor-default ${pri.glow}`}
    >
      <div className="flex items-start gap-2.5">
        <GripVertical
          size={14}
          className="text-text/10 mt-0.5 shrink-0 group-hover:text-text/20 transition-colors"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${pri.dot} shrink-0`} />
            <span
              className={`text-[12px] font-medium truncate ${
                task.status === 'done' ? 'line-through text-text/30' : 'text-text/80'
              }`}
            >
              {task.title}
            </span>
          </div>
          {task.description && (
            <p className="text-[11px] text-text/30 leading-relaxed ml-3.5 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 ml-3.5">
            <span className="flex items-center gap-1 text-[9px] text-text/25 bg-white/[0.04] px-1.5 py-0.5 rounded-md">
              {pri.icon}
              {pri.label}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 flex items-center gap-0.5"
          >
            {prevStatus && (
              <button
                onClick={() => onUpdateStatus(task.id, prevStatus)}
                className="p-1 text-text/25 hover:text-text/60 hover:bg-white/[0.06] rounded-md transition-all cursor-pointer"
                title={`Move to ${prevStatus}`}
              >
                <ArrowLeft size={12} />
              </button>
            )}
            {nextStatus && (
              <button
                onClick={() => onUpdateStatus(task.id, nextStatus)}
                className="p-1 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-md transition-all cursor-pointer"
                title={`Move to ${nextStatus}`}
              >
                <ArrowRight size={12} />
              </button>
            )}
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-text/20 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default TaskCard;
