import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { user, logout, hasRole } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem('sidebar_collapsed', (!prev).toString());
      return !prev;
    });
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER'],
    },
    {
      to: '/vehicles',
      label: 'Vehicles',
      icon: Truck,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
    },
    {
      to: '/drivers',
      label: 'Drivers',
      icon: Users,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
    },
    {
      to: '/trips',
      label: 'Trips',
      icon: Route,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER'],
    },
    {
      to: '/maintenances',
      label: 'Maintenance',
      icon: Wrench,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
    },
    {
      to: '/logbook',
      label: 'Logbook',
      icon: Fuel,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER'],
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
    },
  ];

  const visibleItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
              TransitOps
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 mx-auto transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {user && (
          <div className={`p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{user.fullName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
              </div>
            )}
          </div>
        )}

        <nav className="p-3 space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/45 dark:text-indigo-400'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
