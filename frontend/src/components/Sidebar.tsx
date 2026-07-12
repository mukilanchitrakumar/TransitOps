import React from 'react';
import { NavLink } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';
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
  Activity,
  Map,
  Sparkles,
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
      to: '/operations',
      label: 'Live Control',
      icon: Activity,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
    },
    {
      to: '/map',
      label: 'Operations Map',
      icon: Map,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER'],
    },
    {
      to: '/analytics',
      label: 'Executive Analytics',
      icon: Sparkles,
      roles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
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
    {
      to: '/users',
      label: 'User Registry',
      icon: UserIcon,
      roles: ['SUPER_ADMIN'],
    },
  ];

  const visibleItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{
        backgroundColor: 'var(--zinc-900-val)',
        borderRight: '1px solid var(--zinc-200-val)',
        boxShadow: '1px 0 3px rgba(0,0,0,0.03)',
      }}
    >
      <div>
        {/* ── Logo Header ── */}
        <div className="flex items-center justify-between px-4 h-16 border-b" style={{ borderColor: 'var(--zinc-200-val)' }}>
          {isCollapsed ? (
            <button
              onClick={toggleSidebar}
              className="mx-auto p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--zinc-500-val)' }}
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <img src={logoSvg} alt="TransitOps" className="h-9 w-auto" />
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm"
                style={{
                  borderColor: 'var(--zinc-200-val)',
                  color: 'var(--zinc-400-val)',
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* ── User Profile ── */}
        {user && (
          <div
            className={`px-4 py-3 border-b flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}
            style={{ borderColor: 'var(--zinc-200-val)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
              style={{ backgroundColor: '#E6F5F3', color: '#0F766E' }}
            >
              <span className="dark:hidden">{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span className="hidden dark:inline">
                <UserIcon className="w-4 h-4" />
              </span>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--zinc-700-val)' }}>
                  {user.fullName}
                </p>
                <p className="text-[11px] capitalize" style={{ color: 'var(--zinc-450-val)' }}>
                  {user.role.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="px-3 py-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-200px)]">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'sidebar-active'
                      : 'sidebar-inactive'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: '#0F766E', color: '#FFFFFF', boxShadow: '0 1px 3px rgba(15,118,110,0.3)' }
                    : { color: 'var(--zinc-600-val)' }
                }
                title={item.label}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ── Logout ── */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--zinc-200-val)' }}>
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          style={{ color: '#E11D48' }}
          title="Logout"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
