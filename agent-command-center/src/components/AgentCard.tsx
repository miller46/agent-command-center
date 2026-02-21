import React from 'react';
import { Link } from 'react-router-dom';
import type { Agent } from '../types/agent';
import { StatusBadge } from './StatusBadge';
import { formatLastActive } from '../utils/formatLastActive';
import { Clock, ArrowRight } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  return (
    <Link to={`/agents/${agent.id}`}>
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
              {agent.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{agent.type}</p>
          </div>
          <StatusBadge status={agent.status} />
        </div>
        
        {agent.description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{agent.description}</p>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock size={14} />
            <span>{formatLastActive(agent.lastActive)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
            View Details
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </Link>
  );
};
