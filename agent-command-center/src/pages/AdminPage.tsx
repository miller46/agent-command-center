import React from 'react';
import { Shield, Users, Lock, Key } from 'lucide-react';

export const AdminPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin</h1>
        <p className="text-slate-600">Manage system settings and user permissions</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <div className="flex items-center gap-3 text-amber-800">
          <Shield size={20} />
          <span className="font-medium">Admin Section</span>
        </div>
        <p className="text-amber-700 mt-2 text-sm">
          This section is under development. User management and system administration features coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'User Management', icon: Users, description: 'Manage users and their roles', status: 'Coming Soon' },
          { title: 'Permissions', icon: Lock, description: 'Configure access control', status: 'Coming Soon' },
          { title: 'API Keys', icon: Key, description: 'Manage API credentials', status: 'Coming Soon' },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-6 opacity-60">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <item.icon className="text-slate-400" size={24} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-600 text-sm mb-4">{item.description}</p>
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
