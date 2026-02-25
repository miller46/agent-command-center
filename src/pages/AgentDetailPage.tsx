import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockAgents } from '../data/mockAgents';
import { StatusBadge } from '../components/StatusBadge';
import { SkillsDisplay } from '../components/SkillsDisplay';
import { useSkills } from '../hooks/useSkills';
import { ArrowLeft, Clock, Activity, Settings, Play, Pause, RotateCcw } from 'lucide-react';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agent = mockAgents.find(a => a.id === id);
  const { skills, loading, error, refetch } = useSkills(id);

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Agent Not Found</h1>
          <p className="text-slate-600 mb-6">The agent you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/agents')}
            className="text-blue-600 hover:text-blue-700 font-medium"
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/agents')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={18} />
          Back to Agents
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              {agent.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-slate-500">{agent.type}</span>
                <span className="text-slate-300">•</span>
                <StatusBadge status={agent.status} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              <Settings size={18} />
              Settings
            </button>
            {agent.status === 'busy' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                <Pause size={18} />
                Pause
              </button>
            ) : agent.status === 'error' ? (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <RotateCcw size={18} />
                Restart
              </button>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
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
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">About</h2>
            <p className="text-slate-600">
              {agent.description || 'No description available for this agent.'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Activity Log</h2>
            <div className="space-y-4">
              {[
                { action: 'Agent initialized', time: '2 hours ago' },
                { action: 'Task completed: Code review', time: '4 hours ago' },
                { action: 'Connected to workspace', time: '1 day ago' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <p className="flex-1 text-slate-700">{log.action}</p>
                  <p className="text-sm text-slate-500">{log.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <SkillsDisplay
              agentId={id || ''}
              skills={skills}
              loading={loading}
              error={error}
              onRetry={refetch}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Agent ID</p>
                <p className="font-medium text-slate-900 font-mono">{agent.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Type</p>
                <p className="font-medium text-slate-900">{agent.type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-medium text-slate-900 capitalize">{agent.status}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={16} />
                  <span>Last Active</span>
                </div>
                <p className="font-medium text-slate-900 mt-1">{formatDate(agent.lastActive)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Activity size={16} />
                  <span>Tasks Completed</span>
                </div>
                <span className="font-semibold text-slate-900">42</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Activity size={16} />
                  <span>Success Rate</span>
                </div>
                <span className="font-semibold text-green-600">98.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                  <Activity size={16} />
                  <span>Avg Response</span>
                </div>
                <span className="font-semibold text-slate-900">2.3s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
