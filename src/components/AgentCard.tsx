import React from 'react';
import { Link } from 'react-router-dom';
import type { Agent } from '../types/agent';
import { StatusBadge } from './StatusBadge';
import { formatLastActive } from '../utils/formatLastActive';
import { ArrowRight, Bot } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getTypeIcon = (type: string) => {
    // Return appropriate styling based on agent type
    const typeStyles: Record<string, { bg: string; text: string }> = {
      'backend-dev': { bg: 'bg-blue-100', text: 'text-blue-600' },
      'frontend-dev': { bg: 'bg-purple-100', text: 'text-purple-600' },
      'database': { bg: 'bg-amber-100', text: 'text-amber-600' },
      'devops': { bg: 'bg-green-100', text: 'text-green-600' },
      'testing': { bg: 'bg-pink-100', text: 'text-pink-600' },
    };
    return typeStyles[type] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  };

  const typeLabels: Record<string, string> = {
    'backend-dev': 'Backend Dev',
    'frontend-dev': 'Frontend Dev',
    'database': 'Database',
    'devops': 'DevOps',
    'testing': 'Testing',
  };

  const styles = getTypeIcon(agent.type);

  return (
    <Link to={`/agents/${agent.id}`} className="group block">
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-full transition-all duration-300 hover:border-blue-300 hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${styles.bg} rounded-lg flex items-center justify-center`}>
              <Bot className={styles.text} size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {agent.name}
              </h3>
              <p className="text-sm text-slate-500">{typeLabels[agent.type] || agent.type}</p>
            </div>
          </div>
          <StatusBadge status={agent.status} />
        </div>
        
        {/* Description */}
        {agent.description && (
          <div className="mb-4">
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {agent.description}
            </p>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Last seen:</span>
            <span className="font-medium text-slate-700">{formatLastActive(agent.lastActive)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
            <span>View</span>
            <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};
