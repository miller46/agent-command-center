import React from 'react';
import { Bell, Search, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-matrix-dark border-b border-matrix-dim px-6 py-4 flex items-center justify-between font-terminal">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-matrix-dim" size={18} />
          <input
            type="text"
            placeholder="Search agents, tasks..."
            className="pl-10 pr-4 py-2 bg-black border border-matrix-dim rounded text-matrix placeholder-matrix-dim focus:outline-none focus:border-matrix focus:ring-1 focus:ring-matrix w-64 font-terminal"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-matrix hover:bg-matrix-dark border border-transparent hover:border-matrix-dim rounded transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-matrix-green rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-matrix-dim">
          <div className="text-right">
            <p className="text-sm font-medium text-matrix">Admin User</p>
            <p className="text-xs text-matrix-dim">Administrator</p>
          </div>
          <div className="w-10 h-10 bg-matrix-dark border border-matrix rounded-full flex items-center justify-center text-matrix">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};
