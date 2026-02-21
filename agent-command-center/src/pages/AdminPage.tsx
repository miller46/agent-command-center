import React from 'react';
import { Shield, Users, Lock, Key } from 'lucide-react';

export const AdminPage: React.FC = () => {
  return (
    <div className="p-6 font-terminal">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-matrix mb-2">Admin</h1>
        <p className="text-matrix-dim">Manage system settings and user permissions</p>
      </div>

      <div className="bg-matrix-dark border border-amber-500 rounded p-4 mb-8">
        <div className="flex items-center gap-3 text-amber-500">
          <Shield size={20} />
          <span className="font-medium">Admin Section</span>
        </div>
        <p className="text-matrix-dim mt-2 text-sm">
          This section is under development. User management and system administration features coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'User Management', icon: Users, description: 'Manage users and their roles', status: 'Coming Soon' },
          { title: 'Permissions', icon: Lock, description: 'Configure access control', status: 'Coming Soon' },
          { title: 'API Keys', icon: Key, description: 'Manage API credentials', status: 'Coming Soon' },
        ].map((item) => (
          <div key={item.title} className="bg-matrix-dark border border-matrix-dim rounded p-6 opacity-60">
            <div className="w-12 h-12 bg-black border border-matrix-dim rounded flex items-center justify-center mb-4">
              <item.icon className="text-matrix-dim" size={24} />
            </div>
            <h3 className="font-semibold text-matrix mb-2">{item.title}</h3>
            <p className="text-matrix-dim text-sm mb-4">{item.description}</p>
            <span className="inline-block px-3 py-1 bg-black border border-matrix-dim text-matrix-dim text-xs rounded">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
