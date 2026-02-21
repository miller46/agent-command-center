import React from 'react';
import { Link } from 'react-router-dom';
import type { Agent } from '../types/agent';
import { StatusBadge } from './StatusBadge';
import { formatLastActive } from '../utils/formatLastActive';
import { ArrowRight } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getTypePrefix = (type: string) => {
    const prefixes: Record<string, string> = {
      'backend-dev': 'DEV',
      'frontend-dev': 'DEV',
      'database': 'DB',
      'devops': 'OPS',
      'testing': 'TST',
    };
    return prefixes[type] || 'AGT';
  };

  return (
    <Link to={`/agents/${agent.id}`} className="group block">
      <div className="matrix-card matrix-border-glow p-6 h-full transition-all duration-300 group-hover:border-[#00FF41]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#008F11] font-mono">[{getTypePrefix(agent.type)}]</span>
              <h3 className="font-mono text-lg text-[#00FF41] matrix-glow-subtle truncate">
                {agent.name.toUpperCase()}
              </h3>
            </div>
            <p className="text-xs text-[#008F11] font-mono tracking-wider">ID: {agent.id}</p>
          </div>
          <StatusBadge status={agent.status} />
        </div>
        
        {/* Description */}
        {agent.description && (
          <div className="mb-4">
            <p className="text-sm text-[#00FF41] font-mono opacity-80 line-clamp-2 leading-relaxed">
              <span className="text-[#008F11]">&gt; </span>
              {agent.description.toUpperCase()}
            </p>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#003B00]">
          <div className="flex items-center gap-2 text-xs text-[#008F11] font-mono">
            <span>LAST_SEEN:</span>
            <span className="text-[#00FF41]">{formatLastActive(agent.lastActive)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#00FF41] font-mono group-hover:text-white transition-colors">
            <span>ACCESS</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};
