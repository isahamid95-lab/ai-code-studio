import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Database, Github, Server, CheckCircle2, ArrowRight } from 'lucide-react';

interface MCPProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const MCP_PROVIDERS: MCPProvider[] = [
  {
    id: 'github',
    name: 'GitHub MCP',
    description: 'Read repos, manage PRs and issues directly from AI.',
    icon: <Github size={24} />,
    color: 'from-gray-700 to-gray-900 border-gray-600 text-white'
  },
  {
    id: 'supabase',
    name: 'Supabase MCP',
    description: 'Connect to Postgres, Edge Functions, and Auth scopes.',
    icon: <Database size={24} />,
    color: 'from-emerald-600/20 to-emerald-900/40 border-emerald-500/30 text-emerald-400'
  },
  {
    id: 'insforge',
    name: 'InsForge MCP',
    description: 'Advanced deployment, bucket management, and cloud APIs.',
    icon: <Server size={24} />,
    color: 'from-indigo-600/20 to-indigo-900/40 border-indigo-500/30 text-indigo-400'
  }
];

export function MCPServersPanel({ onConnect }: { onConnect: (name: string) => void }) {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});

  const handleConnect = (provider: MCPProvider) => {
    if (connected[provider.id]) return;
    setConnecting(prev => ({ ...prev, [provider.id]: true }));
    setTimeout(() => {
      setConnecting(prev => ({ ...prev, [provider.id]: false }));
      setConnected(prev => ({ ...prev, [provider.id]: true }));
      onConnect(provider.name);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 pb-10">
      <div className="flex items-center gap-2.5 mb-5 px-1">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Network size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text">MCP Hub</h2>
          <p className="text-[10px] text-text/40">Model Context Protocol</p>
        </div>
      </div>

      <p className="text-xs text-text/50 mb-5 px-1 leading-relaxed">
        Connect remote APIs and database schemas dynamically. AI Assistant will automatically acquire specific context and expertise.
      </p>

      <div className="space-y-3">
        {MCP_PROVIDERS.map(p => {
          const isConnected = connected[p.id];
          const isConnecting = connecting[p.id];
          
          return (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl border bg-gradient-to-br transition-all relative overflow-hidden group ${
                isConnected ? 'border-primary/30 from-primary/10 to-transparent shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.05)]' : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r ${p.color}`} />
              
              <div className="flex items-start gap-3 relative z-10">
                <div className={`p-2.5 rounded-xl bg-black/20 shrink-0 ${p.color.split(' ').pop()}`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[13px] font-semibold text-text truncate">{p.name}</h3>
                    {isConnected && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <CheckCircle2 size={10} /> Live
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text/50 leading-relaxed mb-3 pr-2">
                    {p.description}
                  </p>
                  
                  <button
                    onClick={() => handleConnect(p)}
                    disabled={isConnected || isConnecting}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isConnected 
                        ? 'bg-transparent text-text/20 cursor-default' 
                        : isConnecting
                        ? 'bg-white/5 text-text/50'
                        : 'bg-white/5 hover:bg-white/10 text-text/80 hover:text-white border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {isConnecting ? (
                      <div className="w-3 h-3 rounded-full border-2 border-text/30 border-t-text/70 animate-spin" />
                    ) : isConnected ? (
                      'Connected'
                    ) : (
                      <>Connect <ArrowRight size={12} /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
