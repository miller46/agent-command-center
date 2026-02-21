import React, { useState, useEffect } from 'react';
import { AgentCard } from '../components/AgentCard';
import { MatrixRain } from '../components/MatrixRain';
import { mockAgents } from '../data/mockAgents';
import { Plus, Terminal, Activity, AlertCircle } from 'lucide-react';

export const AgentListPage: React.FC = () => {
  const [bootText, setBootText] = useState('');
  const [showContent, setShowContent] = useState(false);

  const statusCounts = {
    idle: mockAgents.filter(a => a.status === 'idle').length,
    busy: mockAgents.filter(a => a.status === 'busy').length,
    error: mockAgents.filter(a => a.status === 'error').length,
  };

  // Terminal boot sequence effect
  useEffect(() => {
    const bootSequence = [
      'INITIALIZING...',
      'LOADING NEURAL NETWORK...',
      'CONNECTING TO AGENT MATRIX...',
      'ESTABLISHING SECURE LINK...',
      'ACCESS GRANTED.',
    ];

    let lineIndex = 0;
    let charIndex = 0;
    let currentText = '';

    const typeInterval = setInterval(() => {
      if (lineIndex < bootSequence.length) {
        const currentLine = bootSequence[lineIndex];
        
        if (charIndex < currentLine.length) {
          currentText += currentLine[charIndex];
          setBootText(currentText);
          charIndex++;
        } else {
          currentText += '\n';
          setBootText(currentText);
          lineIndex++;
          charIndex = 0;
        }
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setShowContent(true), 300);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, []);

  return (
    <>
      <MatrixRain />
      
      <div className="min-h-screen bg-black text-[#00FF41] font-mono relative">
        {/* CRT Overlay Effect */}
        <div className="crt-overlay" />

        <div className="p-6 relative z-10">
          {/* Header Section */}
          <div className="mb-8 border-b border-[#003B00] pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Terminal size={24} className="text-[#00FF41]" />
              <h1 className="text-2xl font-bold matrix-glow">
                AGENT_MATRIX // SYSTEM_MONITOR
              </h1>
            </div>
            <p className="text-[#008F11] text-sm">
              CONNECTED TO NODE // {mockAgents.length} AGENTS REGISTERED
            </p>
          </div>

          {/* Boot Sequence */}
          {!showContent && (
            <div className="mb-8 font-mono text-sm">
              <pre className="text-[#008F11] whitespace-pre-wrap">{bootText}
                <span className="blink-cursor"></span>
              </pre>
            </div>
          )}

          {/* Stats Grid - Minimal Terminal Style */}
          {showContent && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="matrix-card p-4 matrix-border-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-[#00FF41] flex items-center justify-center">
                      <Activity size={16} className="text-[#00FF41]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#00FF41] matrix-glow-subtle">
                        {mockAgents.length.toString().padStart(2, '0')}
                      </p>
                      <p className="text-xs text-[#008F11]">TOTAL_NODES</p>
                    </div>
                  </div>
                </div>

                <div className="matrix-card p-4 matrix-border-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-[#00FF41] flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#00FF41] shadow-[0_0_8px_#00FF41]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#00FF41] matrix-glow-subtle">
                        {statusCounts.idle.toString().padStart(2, '0')}
                      </p>
                      <p className="text-xs text-[#008F11]">ONLINE</p>
                    </div>
                  </div>
                </div>

                <div className="matrix-card p-4 matrix-border-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-[#FFD700] flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#FFD700] shadow-[0_0_8px_#FFD700]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#FFD700]">
                        {statusCounts.busy.toString().padStart(2, '0')}
                      </p>
                      <p className="text-xs text-[#008F11]">BUSY</p>
                    </div>
                  </div>
                </div>

                <div className="matrix-card p-4 matrix-border-glow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-[#FF4136] flex items-center justify-center">
                      <AlertCircle size={16} className="text-[#FF4136]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#FF4136] animate-pulse">
                        {statusCounts.error.toString().padStart(2, '0')}
                      </p>
                      <p className="text-xs text-[#008F11]">ERROR</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between mb-6 border-b border-[#003B00] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#008F11]">$</span>
                  <span className="text-[#00FF41]">list_agents --all</span>
                </div>
                <button className="matrix-button px-4 py-2 text-sm flex items-center gap-2">
                  <Plus size={16} />
                  DEPLOY_AGENT
                </button>
              </div>

              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockAgents.map((agent, index) => (
                  <div 
                    key={agent.id} 
                    className="fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <AgentCard agent={agent} />
                  </div>
                ))}
              </div>

              {/* System Footer */}
              <div className="mt-8 pt-4 border-t border-[#003B00] text-xs text-[#008F11] font-mono">
                <div className="flex items-center justify-between">
                  <span>SYSTEM_STATUS: OPERATIONAL</span>
                  <span>LATENCY: 12ms</span>
                  <span>ENCRYPTION: AES-256</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
