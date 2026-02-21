import React from 'react';
import { mockAgents } from '../data/mockAgents';
import { StatusBadge } from '../components/StatusBadge';
import { formatLastActive } from '../utils/formatLastActive';
import { 
  Bot, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const recentAgents = [...mockAgents]
    .sort((a, b) => (b.lastActive?.getTime() || 0) - (a.lastActive?.getTime() || 0))
    .slice(0, 4);

  const stats = [
    { label: 'Total Agents', value: mockAgents.length, icon: Bot, color: 'matrix' },
    { label: 'Active Now', value: mockAgents.filter(a => a.status === 'busy').length, icon: Activity, color: 'amber' },
    { label: 'Tasks Completed', value: 142, icon: CheckCircle, color: 'green' },
    { label: 'Alerts', value: mockAgents.filter(a => a.status === 'error').length, icon: AlertTriangle, color: 'red' },
  ] as const;

  const statColorClasses: Record<(typeof stats)[number]['color'], { bg: string; text: string; border: string }> = {
    matrix: { bg: 'bg-black', text: 'text-matrix', border: 'border-matrix' },
    green: { bg: 'bg-black', text: 'text-matrix', border: 'border-matrix' },
    amber: { bg: 'bg-black', text: 'text-amber-500', border: 'border-amber-500' },
    red: { bg: 'bg-black', text: 'text-red-500', border: 'border-red-500' },
  };

  return (
    <div className="p-6 font-terminal">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-matrix mb-2">Dashboard</h1>
        <p className="text-matrix-dim">Welcome back! Here's what's happening with your agents.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-matrix-dark border border-matrix-dim rounded p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-matrix-dim mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-matrix">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${statColorClasses[stat.color].bg} ${statColorClasses[stat.color].border} border rounded flex items-center justify-center`}>
                <stat.icon className={statColorClasses[stat.color].text} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-matrix-dark border border-matrix-dim rounded p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-matrix">Recent Activity</h2>
            <button className="text-sm text-matrix hover:text-matrix-dim">View All</button>
          </div>

          <div className="space-y-4">
            {[
              { agent: 'Backend Dev Agent', action: 'Completed task: API Integration', time: '5 min ago', type: 'success' },
              { agent: 'Testing Agent', action: 'Started: Test suite execution', time: '12 min ago', type: 'info' },
              { agent: 'Frontend Dev Agent', action: 'Deployed: UI Component library', time: '1 hour ago', type: 'success' },
              { agent: 'DevOps Agent', action: 'Error: Deployment failed', time: '2 hours ago', type: 'error' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded hover:bg-black transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-matrix' : 
                  activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-matrix">{activity.agent}</p>
                  <p className="text-sm text-matrix-dim">{activity.action}</p>
                </div>
                <p className="text-sm text-matrix-dim">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Active Agents */}
        <div className="bg-matrix-dark border border-matrix-dim rounded p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-matrix">Recently Active</h2>
            <button className="text-sm text-matrix hover:text-matrix-dim">View All</button>
          </div>

          <div className="space-y-4">
            {recentAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded hover:bg-black transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-matrix-dark border border-matrix rounded flex items-center justify-center text-matrix font-semibold">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-matrix">{agent.name}</p>
                    <p className="text-sm text-matrix-dim">{agent.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={agent.status} />
                  <div className="flex items-center gap-1 text-sm text-matrix-dim">
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
      <div className="mt-8 bg-matrix-dark border border-matrix rounded p-6 text-matrix">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Quick Actions</h2>
            <p className="text-matrix-dim">Get started with common agent management tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-black border border-matrix hover:bg-matrix hover:text-black rounded transition-colors">
              Deploy New Agent
            </button>
            <button className="px-4 py-2 bg-matrix text-black rounded hover:bg-matrix-dim transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
