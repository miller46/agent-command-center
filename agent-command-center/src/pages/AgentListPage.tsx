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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Agents</h1>
        <p className="text-slate-600">Manage and monitor your AI agents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{mockAgents.length}</p>
              <p className="text-sm text-slate-500">Total Agents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusCounts.idle}</p>
              <p className="text-sm text-slate-500">Idle</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusCounts.busy}</p>
              <p className="text-sm text-slate-500">Busy</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusCounts.error}</p>
              <p className="text-sm text-slate-500">Error</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900">All Agents</h2>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
