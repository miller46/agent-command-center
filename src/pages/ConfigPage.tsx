import React from 'react';
import { Settings } from 'lucide-react';

export const ConfigPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Configuration</h1>
        <p className="text-slate-600">Configure system settings and preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="text-slate-400" size={32} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Configuration Panel</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          System configuration options will be available here.
        </p>
      </div>
    </div>
  );
};
