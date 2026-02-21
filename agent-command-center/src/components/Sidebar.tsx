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
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Agent Command</h1>
            <p className="text-xs text-slate-400">Center</p>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
      
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Users size={16} />
          </div>
          <div>
            <p className="text-sm font-medium">System Online</p>
            <p className="text-xs text-slate-400">5 agents connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
