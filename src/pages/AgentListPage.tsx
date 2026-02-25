import React from 'react';
import { AgentCard } from '../components/AgentCard';
import { mockAgents } from '../data/mockAgents';
import { Plus, Bot, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AgentListPage: React.FC = () => {
  const statusCounts = {
    idle: mockAgents.filter(a => a.status === 'idle').length,
    busy: mockAgents.filter(a => a.status === 'busy').length,
    error: mockAgents.filter(a => a.status === 'error').length,
  };

  const stats = [
    { label: 'Total Agents', value: mockAgents.length, icon: Bot, color: 'blue' as const },
    { label: 'Active Now', value: statusCounts.busy, icon: Activity, color: 'green' as const },
    { label: 'Idle', value: statusCounts.idle, icon: CheckCircle, color: 'purple' as const },
    { label: 'Errors', value: statusCounts.error, icon: AlertCircle, color: 'red' as const },
  ];

  const statColorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Agents</h1>
            <p className="text-slate-600">Manage and monitor your agent fleet</p>
          </div>
          <Link
            to="/agents/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Deploy Agent
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${statColorClasses[stat.color].bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={statColorClasses[stat.color].text} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">All Agents</h2>
          <p className="text-sm text-slate-500">
            Showing {mockAgents.length} agent{mockAgents.length !== 1 && 's'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
};
