import React from 'react';
import { FolderTree, Search, GitBranch, Network, List, Zap, LayoutDashboard } from 'lucide-react';
import { useLeftPanelOpen, useLeftPanelTab, handleActivityClick } from '../../stores';
import type { LeftTab } from '../../stores';

interface ActivityItem {
  id: LeftTab;
  icon: React.ReactNode;
  label: string;
}

const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 'explorer', icon: <FolderTree size={18} />, label: 'Explorer' },
  { id: 'search', icon: <Search size={18} />, label: 'Search' },
  { id: 'git', icon: <GitBranch size={18} />, label: 'Git' },
  { id: 'mcp', icon: <Network size={18} />, label: 'MCP Hub' },
  { id: 'outline', icon: <List size={18} />, label: 'Outline' },
  { id: 'intel', icon: <Zap size={18} />, label: 'AI Intel' },
  { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
];

export function ActivityBar() {
  const leftPanelOpen = useLeftPanelOpen();
  const leftPanelTab = useLeftPanelTab();

  return (
    <div className="flex flex-col items-center py-2 gap-1 shrink-0">
      {ACTIVITY_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => handleActivityClick(item.id)}
          className={`activity-icon ${
            leftPanelOpen && leftPanelTab === item.id
              ? 'active'
              : 'text-text/30 hover:text-text/60'
          }`}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}