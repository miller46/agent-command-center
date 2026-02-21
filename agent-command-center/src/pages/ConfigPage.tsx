import React from 'react';
import { Settings, Bell, Globe, Database, Cpu } from 'lucide-react';

export const ConfigPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Configuration</h1>
        <p className="text-slate-600">Configure system settings and preferences</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <div className="flex items-center gap-3 text-blue-800">
          <Settings size={20} />
          <span className="font-medium">Configuration Section</span>
        </div>
        <p className="text-blue-700 mt-2 text-sm">
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
          <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-6 opacity-60">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <item.icon className="text-slate-400" size={24} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-600 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
