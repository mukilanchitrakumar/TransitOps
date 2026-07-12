import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { AiAssistant } from '../components/AiAssistant';
import { Loader2 } from 'lucide-react';

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--zinc-950-val)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F766E' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--zinc-450-val)' }}>
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: 'var(--zinc-950-val)', color: 'var(--zinc-700-val)' }}
    >
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'
        }`}
      >
        <Header isCollapsed={isCollapsed} />
        <main className="flex-1 p-6 mt-16 max-w-[1600px] w-full mx-auto overflow-x-hidden page-transition">
          <Outlet />
        </main>
        <AiAssistant />
      </div>
    </div>
  );
}
export default DashboardLayout;
