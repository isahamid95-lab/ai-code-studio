import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Terminal, Bot, Server } from 'lucide-react';

export interface TerminalTab {
  id: string;
  name: string;
  type: 'terminal' | 'agent' | 'server';
  isActive: boolean;
  hasOutput: boolean;
}

interface TerminalTabsProps {
  tabs: TerminalTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  maxTabs?: number;
}

const TAB_ICONS = {
  terminal: Terminal,
  agent: Bot,
  server: Server,
};

const TAB_COLORS = {
  terminal: 'text-green-400',
  agent: 'text-blue-400',
  server: 'text-purple-400',
};

export function TerminalTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  maxTabs = 5,
}: TerminalTabsProps) {
  const canAddTab = tabs.length < maxTabs;

  return (
    <div className="terminal-tabs flex items-center gap-1 px-2 py-1 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <AnimatePresence mode="popLayout">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.type];
          const colorClass = TAB_COLORS[tab.type];
          const isActive = tab.id === activeTabId;

          return (
            <motion.button
              key={tab.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => onTabSelect(tab.id)}
              className={`
                terminal-tab group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-sm
                transition-all duration-200 relative
                ${
                  isActive
                    ? 'bg-[var(--color-background)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }
              `}
            >
              <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
              <span className="max-w-24 truncate">{tab.name}</span>
              {tab.hasOutput && !isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-[var(--color-surface-hover)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>

      {canAddTab && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onNewTab}
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
          title="New Terminal"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

export function useTerminalTabs(initialTabs: TerminalTab[] = []) {
  const [tabs, setTabs] = useState<TerminalTab[]>(() =>
    initialTabs.length > 0
      ? initialTabs
      : [{ id: 'terminal-1', name: 'Terminal', type: 'terminal', isActive: true, hasOutput: false }]
  );
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || '');

  const selectTab = useCallback((id: string) => {
    setActiveTabId(id);
    setTabs((prev) =>
      prev.map((tab) => ({
        ...tab,
        isActive: tab.id === id,
        hasOutput: tab.id === id ? false : tab.hasOutput,
      }))
    );
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;

        const tabIndex = prev.findIndex((t) => t.id === id);
        const newTabs = prev.filter((t) => t.id !== id);

        if (id === activeTabId && newTabs.length > 0) {
          const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
          setActiveTabId(newTabs[newActiveIndex].id);
          newTabs[newActiveIndex].isActive = true;
        }

        return newTabs;
      });
    },
    [activeTabId]
  );

  const addTab = useCallback(
    (type: TerminalTab['type'] = 'terminal') => {
      const id = `${type}-${Date.now()}`;
      const names: Record<TerminalTab['type'], string> = {
        terminal: 'Terminal',
        agent: 'Agent',
        server: 'Server',
      };

      const newTab: TerminalTab = {
        id,
        name: `${names[type]} ${tabs.filter((t) => t.type === type).length + 1}`,
        type,
        isActive: true,
        hasOutput: false,
      };

      setTabs((prev) => [...prev.map((t) => ({ ...t, isActive: false })), newTab]);
      setActiveTabId(id);
    },
    [tabs]
  );

  const markHasOutput = useCallback((id: string) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, hasOutput: true } : tab))
    );
  }, []);

  const renameTab = useCallback((id: string, name: string) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, name } : tab))
    );
  }, []);

  return {
    tabs,
    activeTabId,
    selectTab,
    closeTab,
    addTab,
    markHasOutput,
    renameTab,
  };
}

interface TerminalContainerProps {
  tabs: TerminalTab[];
  activeTabId: string;
  children: React.ReactNode;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}

export function TerminalContainer({
  tabs,
  activeTabId,
  children,
  onTabSelect,
  onTabClose,
  onNewTab,
}: TerminalContainerProps) {
  return (
    <div className="terminal-container flex flex-col h-full bg-[var(--color-background)] rounded-lg overflow-hidden border border-[var(--color-border)]">
      <TerminalTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={onTabSelect}
        onTabClose={onTabClose}
        onNewTab={onNewTab}
      />
      <div className="terminal-content flex-1 overflow-hidden">{children}</div>
    </div>
  );
}