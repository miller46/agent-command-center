import React from 'react';
import { AgentCard } from '../components/AgentCard';
import { mockAgents } from '../data/mockAgents';
import { Bot, Plus } from 'lucide-react';

export const AgentListPage: React.FC = () => {
  const statusCounts = {
    idle: mockAgents.filter(a => a.status === 'idle').length,
    busy: mockAgents.filter(a => a.status === 'busy').length,
    error: mockAgents.filter(a => a.status === 'error').length,
  };

  return (
    <div className="p-6 font-terminal">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-matrix mb-2">Agents</h1>
        <p className="text-matrix-dim">Manage and monitor your AI agents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-matrix-dark border border-matrix-dim rounded p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border border-matrix rounded flex items-center justify-center">
              <Bot className="text-matrix" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-matrix">{mockAgents.length}</p>
              <p className="text-sm text-matrix-dim">Total Agents</p>
            </div>
          </div>
        </div>

        <div className="bg-matrix-dark border border-matrix-dim rounded p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border border-matrix rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-matrix-green rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-matrix">{statusCounts.idle}</p>
              <p className="text-sm text-matrix-dim">Idle</p>
            </div>
          </div>
        </div>

        <div className="bg-matrix-dark border border-matrix-dim rounded p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border border-amber-500 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{statusCounts.busy}</p>
              <p className="text-sm text-matrix-dim">Busy</p>
            </div>
          </div>
        </div>

        <div className="bg-matrix-dark border border-matrix-dim rounded p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black border border-red-500 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{statusCounts.error}</p>
              <p className="text-sm text-matrix-dim">Error</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-matrix">All Agents</h2>
        <button className="flex items-center gap-2 bg-matrix-dark border border-matrix text-matrix px-4 py-2 rounded hover:bg-matrix hover:text-black transition-colors font-terminal">
          <Plus size={18} />
          Add Agent
        </button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
};
