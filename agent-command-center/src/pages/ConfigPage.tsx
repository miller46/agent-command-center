import React from 'react';
import { Settings, Bell, Globe, Database, Cpu } from 'lucide-react';

export const ConfigPage: React.FC = () => {
  return (
    <div className="p-6 font-terminal">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-matrix mb-2">Configuration</h1>
        <p className="text-matrix-dim">Configure system settings and preferences</p>
      </div>

      <div className="bg-matrix-dark border border-matrix rounded p-4 mb-8">
        <div className="flex items-center gap-3 text-matrix">
          <Settings size={20} />
          <span className="font-medium">Configuration Section</span>
        </div>
        <p className="text-matrix-dim mt-2 text-sm">
          This section is under development. System configuration options coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'General Settings', icon: Settings, description: 'Basic system configuration' },
          { title: 'Notifications', icon: Bell, description: 'Alert and notification preferences' },
          { title: 'Localization', icon: Globe, description: 'Language and region settings' },
          { title: 'Database', icon: Database, description: 'Database connection settings' },
          { title: 'System Resources', icon: Cpu, description: 'CPU and memory allocation' },
        ].map((item) => (
          <div key={item.title} className="bg-matrix-dark border border-matrix-dim rounded p-6 opacity-60">
            <div className="w-12 h-12 bg-black border border-matrix-dim rounded flex items-center justify-center mb-4">
              <item.icon className="text-matrix-dim" size={24} />
            </div>
            <h3 className="font-semibold text-matrix mb-2">{item.title}</h3>
            <p className="text-matrix-dim text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
