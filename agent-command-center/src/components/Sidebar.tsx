import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Shield,
  Bot
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/agents', label: 'Agents', icon: <Bot size={20} /> },
  { path: '/admin', label: 'Admin', icon: <Shield size={20} /> },
  { path: '/config', label: 'Config', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-matrix-dark text-matrix border-r border-matrix-dim min-h-screen flex flex-col font-terminal">
      <div className="p-6 border-b border-matrix-dim">
        <div className="flex items-center gap-3">
          <div className="bg-matrix-dark border border-matrix p-2 rounded">
            <Bot size={24} className="text-matrix" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-matrix">Agent Command</h1>
            <p className="text-xs text-matrix-dim">Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
                           (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded transition-colors font-terminal ${
                    isActive
                      ? 'bg-matrix-dark border border-matrix text-matrix glow-matrix'
                      : 'text-matrix-dim hover:bg-matrix-dark hover:text-matrix'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-matrix-dim">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-matrix-green border border-matrix rounded-full flex items-center justify-center">
            <Users size={16} className="text-black" />
          </div>
          <div>
            <p className="text-sm font-medium text-matrix">System Online</p>
            <p className="text-xs text-matrix-dim">5 agents connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
