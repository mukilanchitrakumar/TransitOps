import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Truck,
  Users,
  Route,
  Activity,
  Fuel,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Shield,
  BarChart3,
} from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export function Dashboard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const gridStroke = isDark ? '#1E293B' : '#F1F5F9';
  const textFill = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#111827' : '#ffffff';
  const tooltipBorder = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipColor = isDark ? '#F1F5F9' : '#0F172A';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/reports/metrics'),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 page-transition">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-450 mt-1">Loading operations cockpit...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || !data.success) {
    return (
      <div className="p-5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-sm font-medium">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Failed to load operations metrics. Check your connection and try again.
        </div>
      </div>
    );
  }

  const { metrics, recentActivity, recentMaintenance, charts, businessRules } = data;

  const kpis = [
    {
      title: 'Active Vehicles',
      value: metrics.activeVehicles,
      subtitle: `Out of ${metrics.totalVehicles} registered`,
      icon: Truck,
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      darkIconBg: 'rgba(5,150,105,0.15)',
    },
    {
      title: 'Vehicles On Trip',
      value: metrics.onTripVehicles,
      subtitle: `${metrics.activeTrips} active dispatches`,
      icon: Route,
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      darkIconBg: 'rgba(37,99,235,0.15)',
    },
    {
      title: 'In Maintenance',
      value: metrics.maintenanceVehicles,
      subtitle: 'Currently in workshop',
      icon: Activity,
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      darkIconBg: 'rgba(217,119,6,0.15)',
    },
    {
      title: 'Active Drivers',
      value: metrics.activeDrivers,
      subtitle: 'Available for trips',
      icon: Users,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      darkIconBg: 'rgba(124,58,237,0.15)',
    },
  ];

  const secondaryKpis = [
    {
      title: 'Fleet Utilization',
      value: `${metrics.utilization}%`,
      subtitle: 'Active capacity ratio',
      icon: TrendingUp,
      iconBg: '#F0FDFA',
      iconColor: '#0F766E',
      darkIconBg: 'rgba(15,118,110,0.15)',
    },
    {
      title: 'Monthly Fuel Cost',
      value: `$${metrics.monthlyFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Current billing period',
      icon: Fuel,
      iconBg: '#FAF5FF',
      iconColor: '#9333EA',
      darkIconBg: 'rgba(147,51,234,0.15)',
    },
    {
      title: 'Pending Reviews',
      value: metrics.pendingExpenses,
      subtitle: 'Awaiting approval',
      icon: CheckSquare,
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
      darkIconBg: 'rgba(234,88,12,0.15)',
    },
  ];

  const COLORS = ['#0F766E', '#0EA5E9', '#F59E0B', '#EF4444', '#64748B'];

  const healthScore = metrics.fleetHealthScore;
  const healthLabel = healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Critical';
  const healthColor = healthScore >= 90 ? '#059669' : healthScore >= 75 ? '#0F766E' : healthScore >= 50 ? '#D97706' : '#DC2626';

  return (
    <div className="space-y-6 page-transition">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-450 dark:text-zinc-450 mt-0.5">Real-time fleet operations summary</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-450">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live · Updated every 10s
        </div>
      </div>

      {/* ── Primary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 card-hover"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-450 uppercase tracking-wider">
                    {kpi.title}
                  </p>
                  <div>
                    <h3 className="text-3xl font-extrabold text-zinc-705 dark:text-zinc-50 leading-none">
                      {kpi.value}
                    </h3>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1.5">
                      {kpi.subtitle}
                    </p>
                  </div>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark ? kpi.darkIconBg : kpi.iconBg,
                    color: kpi.iconColor,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Secondary KPIs + Fleet Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {secondaryKpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.title}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-450 uppercase tracking-wider">
                      {kpi.title}
                    </p>
                    <h3 className="text-2xl font-bold text-zinc-705 dark:text-zinc-50">{kpi.value}</h3>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">{kpi.subtitle}</p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isDark ? kpi.darkIconBg : kpi.iconBg,
                      color: kpi.iconColor,
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fleet Health Score */}
        <div
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 card-hover"
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: healthColor }}>
              Fleet Health Score
            </p>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${healthColor}15`, color: healthColor }}
            >
              <Shield className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold" style={{ color: healthColor }}>{healthScore}%</span>
          </div>
          <p className="text-[11px] font-semibold mt-1 mb-3" style={{ color: healthColor }}>{healthLabel}</p>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-3">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${healthScore}%`, backgroundColor: healthColor }} />
          </div>

          <div className="space-y-1.5 text-[10px] font-medium text-zinc-550 dark:text-zinc-450">
            {[
              { label: 'Vehicle Availability', val: metrics.factors?.vehicleAvailability || 0 },
              { label: 'Driver Safety', val: metrics.factors?.driverSafety || 0 },
              { label: 'Workshop Completion', val: metrics.factors?.maintenanceCompletion || 0 },
              { label: 'Trip Success', val: metrics.factors?.tripCompletion || 0 },
            ].map((f) => (
              <div key={f.label} className="flex justify-between">
                <span>{f.label}</span>
                <span className="font-semibold" style={{ color: healthColor }}>{f.val}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense Breakdown Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-100">Expense Breakdown</h3>
              <p className="text-[11px] text-zinc-450 mt-0.5">Approved operational costs by category</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(15,118,110,0.15)' : '#F0FDFA', color: '#0F766E' }}>
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="h-60 w-full">
            {charts.expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.expenseBreakdown} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="category" stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={textFill} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: tooltipColor,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Bar dataKey="amount" fill="#0F766E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">No expense data yet</p>
                <p className="text-[11px] mt-0.5">Create expenses to see analytics here</p>
              </div>
            )}
          </div>
        </div>

        {/* Fleet Status Pie */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-100">Fleet Distribution</h3>
              <p className="text-[11px] text-zinc-450 mt-0.5">Current vehicle status</p>
            </div>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {charts.statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusPie}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {charts.statusPie.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: tooltipColor,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-zinc-400 dark:text-zinc-500">
                <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No fleet data</p>
                <p className="text-[11px] mt-0.5">Register vehicles to begin</p>
              </div>
            )}
          </div>
          {charts.statusPie.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              {charts.statusPie.map((item: any, idx: number) => (
                <span key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {item.name} ({item.value})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Activity / Rules / Warnings ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Activity Timeline */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-100">Activity Timeline</h3>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="space-y-3 relative pl-5">
            <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-zinc-150 dark:bg-zinc-800" />
            {recentActivity.length > 0 ? (
              recentActivity.map((log: any) => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 inline-block" style={{ backgroundColor: '#0F766E' }} />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 capitalize">
                    {log.action.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    <span className="uppercase font-semibold text-zinc-500 dark:text-zinc-450">{log.module}</span> · {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No activity logged yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Rules Monitor */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-100">Compliance Monitor</h3>
            <Shield className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="space-y-2.5 text-xs font-medium">
            {[
              { label: 'Overloaded Trips', val: businessRules.overloadedTrips, ok: 'No Overloads' },
              { label: 'Double Bookings', val: businessRules.doubleBookings, ok: 'No Double Bookings' },
              { label: 'Driver Expiry', val: businessRules.expiredDriversAssigned, ok: 'Expiry Blocks Active' },
              { label: 'Maintenance Lockout', val: businessRules.vehiclesAssignedInMaintenance, ok: 'Shop Lockout Active' },
            ].map((rule) => (
              <div key={rule.label} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <span className="text-zinc-600 dark:text-zinc-400">{rule.label}</span>
                {rule.val === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {rule.ok}
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {rule.val} Found
                  </span>
                )}
              </div>
            ))}

            {(businessRules.expiringLicenses7Days > 0 || businessRules.maintenanceDueSoon > 0) && (
              <div className="pt-2 space-y-1">
                {businessRules.expiringLicenses7Days > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                    ⚠ {businessRules.expiringLicenses7Days} licenses expire within 7 days
                  </p>
                )}
                {businessRules.maintenanceDueSoon > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                    ⚠ {businessRules.maintenanceDueSoon} maintenance(s) due within 7 days
                  </p>
                )}
              </div>
            )}

            {businessRules.expiringLicenses7Days === 0 && businessRules.maintenanceDueSoon === 0 && (
              <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold pt-1">
                ✓ Fleet operating within all structural limits
              </p>
            )}
          </div>
        </div>

        {/* Safety Warnings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-100">Safety & Alerts</h3>
            <AlertTriangle className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="space-y-3">
            {metrics.expiredLicenses > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <strong>{metrics.expiredLicenses}</strong> Expired Licenses flagged
              </div>
            )}
            {metrics.upcomingServices > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <strong>{metrics.upcomingServices}</strong> Services overdue
              </div>
            )}
            {metrics.expiredLicenses === 0 && metrics.upcomingServices === 0 && (
              <div className="text-center py-6 text-zinc-400 dark:text-zinc-500">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No active safety warnings</p>
                <p className="text-[10px] mt-0.5">All systems within compliance</p>
              </div>
            )}

            {recentMaintenance.length > 0 && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Recent Workshop Tasks
                </h4>
                <div className="space-y-2">
                  {recentMaintenance.map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center text-[11px]">
                      <div>
                        <p className="font-semibold text-zinc-700 dark:text-zinc-200">{m.vehicle.plateNumber}</p>
                        <p className="text-zinc-400 dark:text-zinc-500 text-[10px]">{m.description}</p>
                      </div>
                      <span className="font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                        ${parseFloat(m.cost).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
