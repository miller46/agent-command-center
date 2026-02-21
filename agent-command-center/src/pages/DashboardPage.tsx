import React from 'react';
import { mockAgents } from '../data/mockAgents';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Bot, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const formatLastActive = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const recentAgents = [...mockAgents]
    .sort((a, b) => (b.lastActive?.getTime() || 0) - (a.lastActive?.getTime() || 0))
    .slice(0, 4);

  const stats = [
    { label: 'Total Agents', value: mockAgents.length, icon: Bot, color: 'blue' },
    { label: 'Active Now', value: mockAgents.filter(a => a.status === 'busy').length, icon: Activity, color: 'green' },
    { label: 'Tasks Completed', value: 142, icon: CheckCircle, color: 'purple' },
    { label: 'Alerts', value: mockAgents.filter(a => a.status === 'error').length, icon: AlertTriangle, color: 'red' },
  ] as const;

  const statColorClasses: Record<(typeof stats)[number]['color'], { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening with your agents.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>

          <div className="space-y-4">
            {[
              { agent: 'Backend Dev Agent', action: 'Completed task: API Integration', time: '5 min ago', type: 'success' },
              { agent: 'Testing Agent', action: 'Started: Test suite execution', time: '12 min ago', type: 'info' },
              { agent: 'Frontend Dev Agent', action: 'Deployed: UI Component library', time: '1 hour ago', type: 'success' },
              { agent: 'DevOps Agent', action: 'Error: Deployment failed', time: '2 hours ago', type: 'error' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' : 
                  activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{activity.agent}</p>
                  <p className="text-sm text-slate-600">{activity.action}</p>
                </div>
                <p className="text-sm text-slate-400">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Active Agents */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recently Active</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>

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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Quick Actions</h2>
            <p className="text-blue-100">Get started with common agent management tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors">
              Deploy New Agent
            </button>
            <button className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
