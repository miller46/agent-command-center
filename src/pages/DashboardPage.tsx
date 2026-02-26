import React, { useEffect, useState } from 'react';
import type { Agent } from '../types/agent';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Bot, 
  Activity, 
  AlertTriangle,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setLoading(false);
      })
      .catch(() => {
        setAgents([]);
        setLoading(false);
      });
  }, []);

  const formatLastActive = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const recentAgents = [...agents]
    .sort((a, b) => (new Date(b.lastActive || 0).getTime() || 0) - (new Date(a.lastActive || 0).getTime() || 0))
    .slice(0, 4);

  const stats = [
    { label: 'Total Agents', value: agents.length, icon: Bot, color: 'blue' },
    { label: 'Active Now', value: agents.filter(a => a.status === 'busy').length, icon: Activity, color: 'green' },
    { label: 'Alerts', value: agents.filter(a => a.status === 'error').length, icon: AlertTriangle, color: 'red' },
  ] as const;

  const statColorClasses: Record<(typeof stats)[number]['color'], { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your agents.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${statColorClasses[stat.color].bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={statColorClasses[stat.color].text} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recently Active Agents */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recently Active</h2>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : recentAgents.length === 0 ? (
          <p className="text-slate-500">No agents available</p>
        ) : (
          <div className="space-y-4">
            {recentAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{agent.name}</p>
                    <p className="text-sm text-slate-500">{agent.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={agent.status} />
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Clock size={14} />
                    <span>{formatLastActive(agent.lastActive)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
