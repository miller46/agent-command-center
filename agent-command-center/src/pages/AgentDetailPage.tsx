import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockAgents } from '../data/mockAgents';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Clock, Activity, Settings, Play, Pause, RotateCcw } from 'lucide-react';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agent = mockAgents.find(a => a.id === id);

  if (!agent) {
    return (
      <div className="p-6 font-terminal">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-matrix mb-2">Agent Not Found</h1>
          <p className="text-matrix-dim mb-6">The agent you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/agents')}
            className="text-matrix hover:text-matrix-dim font-medium"
          >
            ← Back to Agents
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="p-6 font-terminal">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/agents')}
          className="flex items-center gap-2 text-matrix-dim hover:text-matrix mb-4"
        >
          <ArrowLeft size={18} />
          Back to Agents
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-matrix-dark border border-matrix rounded flex items-center justify-center text-matrix text-2xl font-bold">
              {agent.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-matrix">{agent.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-matrix-dim">{agent.type}</span>
                <span className="text-matrix-dim">•</span>
                <StatusBadge status={agent.status} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-matrix-dark border border-matrix-dim rounded hover:border-matrix text-matrix">
              <Settings size={18} />
              Settings
            </button>
            {agent.status === 'busy' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded hover:bg-amber-600">
                <Pause size={18} />
                Pause
              </button>
            ) : agent.status === 'error' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-matrix text-black rounded hover:bg-matrix-dim">
                <RotateCcw size={18} />
                Restart
              </button>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 bg-matrix-green text-black rounded hover:bg-green-600">
                <Play size={18} />
                Start
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-matrix-dark border border-matrix-dim rounded p-6">
            <h2 className="text-lg font-semibold text-matrix mb-4">About</h2>
            <p className="text-matrix-dim">
              {agent.description || 'No description available for this agent.'}
            </p>
          </div>

          <div className="bg-matrix-dark border border-matrix-dim rounded p-6">
            <h2 className="text-lg font-semibold text-matrix mb-4">Activity Log</h2>
            <div className="space-y-4">
              {[
                { action: 'Agent initialized', time: '2 hours ago' },
                { action: 'Task completed: Code review', time: '4 hours ago' },
                { action: 'Connected to workspace', time: '1 day ago' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div className="w-2 h-2 bg-matrix rounded-full" />
                  <p className="flex-1 text-matrix">{log.action}</p>
                  <p className="text-sm text-matrix-dim">{log.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-matrix-dark border border-matrix-dim rounded p-6">
            <h2 className="text-lg font-semibold text-matrix mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-matrix-dim">Agent ID</p>
                <p className="font-medium text-matrix font-mono">{agent.id}</p>
              </div>
              <div>
                <p className="text-sm text-matrix-dim">Type</p>
                <p className="font-medium text-matrix">{agent.type}</p>
              </div>
              <div>
                <p className="text-sm text-matrix-dim">Status</p>
                <p className="font-medium text-matrix capitalize">{agent.status}</p>
              </div>
              <div className="pt-4 border-t border-matrix-dim">
                <div className="flex items-center gap-2 text-matrix-dim">
                  <Clock size={16} />
                  <span>Last Active</span>
                </div>
                <p className="font-medium text-matrix mt-1">{formatDate(agent.lastActive)}</p>
              </div>
            </div>
          </div>

          <div className="bg-matrix-dark border border-matrix-dim rounded p-6">
            <h2 className="text-lg font-semibold text-matrix mb-4">Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-matrix-dim">
                  <Activity size={16} />
                  <span>Tasks Completed</span>
                </div>
                <span className="font-semibold text-matrix">42</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-matrix-dim">
                  <Activity size={16} />
                  <span>Success Rate</span>
                </div>
                <span className="font-semibold text-matrix">98.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-matrix-dim">
                  <Activity size={16} />
                  <span>Avg Response</span>
                </div>
                <span className="font-semibold text-matrix">2.3s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
