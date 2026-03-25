import { useState, useCallback } from 'react';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

const STORAGE_KEY = 'hub_tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  const addTask = useCallback((title: string, description = '', priority: Task['priority'] = 'medium') => {
    setTasks(prev => {
      const next: Task[] = [
        ...prev,
        {
          id: crypto.randomUUID(),
          title,
          description,
          status: 'backlog',
          priority,
          createdAt: Date.now(),
        },
      ];
      saveTasks(next);
      return next;
    });
  }, []);

  const updateTaskStatus = useCallback((id: string, status: Task['status']) => {
    setTasks(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, status } : t));
      saveTasks(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveTasks(next);
      return next;
    });
  }, []);

  const backlog = tasks.filter(t => t.status === 'backlog');
  const inProgress = tasks.filter(t => t.status === 'in-progress');
  const done = tasks.filter(t => t.status === 'done');

  return { tasks, backlog, inProgress, done, addTask, updateTaskStatus, deleteTask };
}
