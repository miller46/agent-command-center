import React from 'react';
import './App.css';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AgentListPage } from './pages/AgentListPage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { AdminPage } from './pages/AdminPage';
import { ConfigPage } from './pages/ConfigPage';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAgentListPage = location.pathname === '/agents';

  if (isAgentListPage) {
    // Agent List page has its own full Matrix theme layout
    return (
      <div className="matrix-page">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/agents" element={<AgentListPage />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
