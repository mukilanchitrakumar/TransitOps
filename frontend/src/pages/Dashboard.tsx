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
} from 'recharts';

export function Dashboard() {
  const { resolvedTheme } = useTheme();

  const gridStroke = resolvedTheme === 'dark' ? '#27272a' : '#e4e4e7';
  const textStroke = resolvedTheme === 'dark' ? '#71717a' : '#a1a1aa';
  const tooltipBg = resolvedTheme === 'dark' ? '#18181b' : '#ffffff';
  const tooltipBorder = resolvedTheme === 'dark' ? '#27272a' : '#e4e4e7';
  const tooltipColor = resolvedTheme === 'dark' ? '#f4f4f5' : '#18181b';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/reports/metrics'),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading operations cockpit...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || !data.success) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 rounded-2xl border border-rose-100 dark:border-rose-900/30">
        Failed to load operations metrics. Please check connection and try again.
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
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Vehicles On Trip',
      value: metrics.onTripVehicles,
      subtitle: `${metrics.activeTrips} active dispatches`,
      icon: Route,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30',
    },
    {
      title: 'Vehicles in Maintenance',
      value: metrics.maintenanceVehicles,
      subtitle: 'Currently in workshop',
      icon: Activity,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'Active Drivers',
      value: metrics.activeDrivers,
      subtitle: 'Available for trips',
      icon: Users,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
    },
  ];

  const secondaryKpis = [
    {
      title: 'Fleet Utilization',
      value: `${metrics.utilization}%`,
      subtitle: 'Active capacity use ratio',
      icon: TrendingUp,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30',
    },
    {
      title: 'Monthly Fuel Cost',
      value: `$${metrics.monthlyFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Current billing period',
      icon: Fuel,
      color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30',
    },
    {
      title: 'Pending Expense Reviews',
      value: metrics.pendingExpenses,
      subtitle: 'Awaiting manager approval',
      icon: CheckSquare,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
    },
  ];

  const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#71717a'];

  const renderStars = (score: number) => {
    const starCount = Math.round(score / 20);
    return (
      <div className="flex gap-1 text-amber-500 mt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < starCount ? 'fill-amber-500' : 'text-zinc-300 dark:text-zinc-700'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time fleet operations summary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {kpi.title}
                </p>
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {kpi.value}
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  {kpi.subtitle}
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {secondaryKpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.title}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {kpi.title}
                  </p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {kpi.value}
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    {kpi.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-550 dark:text-indigo-400 uppercase tracking-wider">
                Fleet Health Score
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-indigo-650 dark:text-indigo-400">
                  {metrics.fleetHealthScore}%
                </span>
              </div>
              {renderStars(metrics.fleetHealthScore)}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                {metrics.fleetHealthScore >= 90 ? '★★★★★ Excellent' : metrics.fleetHealthScore >= 75 ? '★★★★☆ Good Standing' : '★★★☆☆ Review Needed'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Star className="w-5 h-5 fill-indigo-500 text-indigo-500" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Vehicle Availability</span>
              <span className="text-indigo-600 dark:text-indigo-400">{metrics.factors?.vehicleAvailability || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Driver Safety Average</span>
              <span className="text-indigo-600 dark:text-indigo-400">{metrics.factors?.driverSafety || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Workshop Completion Rate</span>
              <span className="text-indigo-600 dark:text-indigo-400">{metrics.factors?.maintenanceCompletion || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Trip Success Ratio</span>
              <span className="text-indigo-600 dark:text-indigo-400">{metrics.factors?.tripCompletion || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200 mb-4">
              Approved Operational Expenses Breakdown
            </h3>
          </div>
          <div className="h-64 w-full">
            {charts.expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.expenseBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="category" stroke={textStroke} fontSize={11} tickLine={false} />
                  <YAxis stroke={textStroke} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: tooltipColor,
                    }}
                    itemStyle={{ color: tooltipColor }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                No expense metrics recorded yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200 mb-4">
              Fleet Status Distribution
            </h3>
          </div>
          <div className="h-64 w-full relative flex items-center justify-center">
            {charts.statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
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
                      color: tooltipColor,
                    }}
                    itemStyle={{ color: tooltipColor }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
                No active fleet vehicles recorded
              </div>
            )}
            <div className="absolute flex flex-col gap-1 bottom-1 text-xs">
              <div className="flex gap-3 justify-center items-center font-semibold text-zinc-500 dark:text-zinc-400 flex-wrap">
                {charts.statusPie.map((item: any, idx: number) => (
                  <span key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    {item.name} ({item.value})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200">
            Recent Activity Timeline
          </h3>
          <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
            {recentActivity.length > 0 ? (
              recentActivity.map((log: any) => (
                <div key={log.id} className="relative space-y-0.5">
                  <span className="absolute -left-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 bg-indigo-500 inline-block" />
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-205 capitalize">
                    {log.action.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    Module: <span className="uppercase text-zinc-500 dark:text-zinc-450 font-semibold">{log.module}</span> • {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6 font-medium">
                No activity logged yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-md font-bold text-zinc-805 dark:text-zinc-200">
            Business Rules Monitor
          </h3>
          <div className="space-y-3 font-semibold text-xs">
            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-650 dark:text-zinc-400">Overloaded Trips Check</span>
              {businessRules.overloadedTrips === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ No Overloads</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-450 font-bold animate-pulse">⚠ {businessRules.overloadedTrips} Overloaded</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-650 dark:text-zinc-400">Double Booking Safeguard</span>
              {businessRules.doubleBookings === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ No Double Bookings</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-455 font-bold animate-pulse">⚠ {businessRules.doubleBookings} Overlaps Found</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-650 dark:text-zinc-400">Driver Expiry Compliance</span>
              {businessRules.expiredDriversAssigned === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Expiry Blocks Active</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-455 font-bold">⚠ {businessRules.expiredDriversAssigned} Expired Assigned</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-650 dark:text-zinc-400">Maintenance Lockout Checks</span>
              {businessRules.vehiclesAssignedInMaintenance === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Shop Lockout Active</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-455 font-bold">⚠ {businessRules.vehiclesAssignedInMaintenance} Shop Assigned</span>
              )}
            </div>

            {businessRules.expiringLicenses7Days > 0 && (
              <p className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                ⚠ {businessRules.expiringLicenses7Days} licenses expire within 7 days!
              </p>
            )}
            {businessRules.maintenanceDueSoon > 0 && (
              <p className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                ⚠ {businessRules.maintenanceDueSoon} maintenance(s) due within 7 days!
              </p>
            )}
            {businessRules.expiringLicenses7Days === 0 && businessRules.maintenanceDueSoon === 0 && (
              <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                ✓ Fleet operating normally under structural limits
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200">
            Safety & Operational Warnings
          </h3>
          <div className="space-y-3.5">
            {metrics.expiredLicenses > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="text-xs font-semibold">
                  <strong>{metrics.expiredLicenses} Expired Licenses</strong> flagged.
                </div>
              </div>
            )}
            {metrics.upcomingServices > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="text-xs font-semibold">
                  <strong>{metrics.upcomingServices} Services Overdue</strong> soon.
                </div>
              </div>
            )}
            {metrics.expiredLicenses === 0 && metrics.upcomingServices === 0 && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4 font-semibold">
                ✓ No active safety warnings or overdue service alerts.
              </div>
            )}

            {recentMaintenance.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Recent Workshop Tasks
                </h4>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recentMaintenance.map((m: any) => (
                    <div key={m.id} className="py-2 flex justify-between items-center text-[10px]">
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">{m.vehicle.plateNumber}</p>
                        <p className="text-zinc-400 dark:text-zinc-500">{m.description}</p>
                      </div>
                      <span className="font-bold text-zinc-500 dark:text-zinc-400">
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
