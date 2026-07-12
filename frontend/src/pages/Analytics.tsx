import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  TrendingDown,
  Loader2,
  Activity,
  Gauge,
  Award,
} from 'lucide-react';

export function Analytics() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Load backend metrics
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => api.get('/reports/metrics'),
  });

  const { data: tripsData } = useQuery({
    queryKey: ['analytics-trips'],
    queryFn: () => api.get('/trips'),
  });

  const { data: driversData } = useQuery({
    queryKey: ['analytics-drivers'],
    queryFn: () => api.get('/drivers'),
  });

  const gridStroke = isDark ? '#1E293B' : '#F1F5F9';
  const textStroke = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#111827' : '#ffffff';
  const tooltipBorder = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipColor = isDark ? '#F1F5F9' : '#0F172A';

  if (isLoading || !data?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 page-transition">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
        <p className="text-xs font-semibold text-zinc-450 dark:text-zinc-500">Compiling executive analytics ledger...</p>
      </div>
    );
  }

  const { metrics, charts } = data;
  const trips = tripsData?.success ? tripsData.trips : [];
  const drivers = driversData?.success ? driversData.drivers : [];

  // 1. Process Fuel logs over time (mocked from real logs or trips history)
  const completedTrips = trips.filter((t: any) => t.status === 'COMPLETED');
  const fuelTrendData = completedTrips.slice(0, 7).map((t: any, i: number) => ({
    name: `Trip ${t.tripNumber.slice(-4)}`,
    cost: parseFloat(t.cost || '0') * 0.15 || 45 + (i * 12), // approximate fuel cost at 15% of trip cost
    distance: t.distance || 120 + (i * 30),
  }));

  // 2. Process Driver safety performance metrics
  const safetyData = drivers
    .filter((d: any) => d.safetyScore !== null)
    .slice(0, 5)
    .map((d: any) => ({
      name: d.fullName.split(' ')[0],
      score: d.safetyScore,
    }));

  const COLORS = ['#0F766E', '#0EA5E9', '#F59E0B', '#EF4444', '#64748B'];

  // Handle PDF browser print triggering
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0 page-transition">
      {/* Styles injecting specific print target configurations */}
      <style>{`
        @media print {
          aside, header, nav, button, .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 12px !important;
          }
          .print-full {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Report Header block */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          {/* Logo only visible on print */}
          <div className="hidden print:block mb-2">
            <span className="text-xl font-bold text-teal-800">TransitOps</span>
            <span className="text-xs text-zinc-400 font-medium ml-2">| Enterprise Logbook & Fleet Report</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">Executive Analytics</h1>
          <p className="text-sm text-zinc-450 dark:text-zinc-455 mt-0.5">
            Corporate performance summary and operational metrics
          </p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-500/10 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" /> Export Executive Report
          </button>
        </div>
      </div>

      {/* Date metadata only shown on print */}
      <div className="hidden print:flex justify-between items-center text-xs text-zinc-500 font-semibold border-b border-zinc-200 pb-2 mb-6">
        <span>Report Generated: {new Date().toLocaleString()}</span>
        <span>Scope: Operational Ledger v1.8</span>
      </div>

      {/* KPI Cards Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs print-card card-hover">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Fleet Utilization</span>
              <h3 className="text-2xl font-extrabold text-[#0F766E] mt-1">{metrics.utilization}%</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">Active route capacity</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-[#0F766E] flex items-center justify-center shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs print-card card-hover">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Fleet Health Score</span>
              <h3 className="text-2xl font-extrabold text-[#0F766E] mt-1">{metrics.fleetHealthScore}%</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">Compliance metrics score</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs print-card card-hover">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Trip Success Rate</span>
              <h3 className="text-2xl font-extrabold text-[#0F766E] mt-1">{metrics.factors?.tripCompletion || 0}%</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">Completed dispatches</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/20 text-sky-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs print-card card-hover">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Fuel Cost Sum</span>
              <h3 className="text-2xl font-extrabold text-[#0F766E] mt-1">${metrics.monthlyFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">Current month billing</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-1">
        {/* Fleet Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 print-card">
          <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-200 mb-4">Fleet Status Distribution</h3>
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
                      color: tooltipColor,
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-semibold text-zinc-400">No fleet assets registered in database.</div>
            )}
          </div>
        </div>

        {/* Operating Costs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 print-card">
          <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-200 mb-4">Expense Categories Breakdown</h3>
          <div className="h-60 w-full">
            {charts.expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.expenseBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="category" stroke={textStroke} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={textStroke} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: tooltipColor,
                    }}
                  />
                  <Bar dataKey="amount" fill="#0F766E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-semibold text-zinc-400 h-full flex items-center justify-center">No approved expenses to display.</div>
            )}
          </div>
        </div>

        {/* Fuel Ledger Line Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 print-card">
          <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-200 mb-4">Estimated Fuel Log Trend</h3>
          <div className="h-60 w-full">
            {fuelTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={textStroke} fontSize={10} />
                  <YAxis stroke={textStroke} fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: tooltipColor,
                    }}
                  />
                  <Line type="monotone" dataKey="cost" stroke="#F59E0B" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-semibold text-zinc-400 h-full flex items-center justify-center">No completed dispatches to analyze fuel.</div>
            )}
          </div>
        </div>

        {/* Operator Safety ranking bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 print-card">
          <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-200 mb-4">Driver Safety Scorecards</h3>
          <div className="h-60 w-full">
            {safetyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safetyData} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis type="number" stroke={textStroke} fontSize={10} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke={textStroke} fontSize={10} width={60} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: tooltipColor,
                    }}
                  />
                  <Bar dataKey="score" fill="#0F766E" radius={[0, 6, 6, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs font-semibold text-zinc-400 h-full flex items-center justify-center">No active drivers safety records.</div>
            )}
          </div>
        </div>
      </div>

      {/* Print Footer only visible on print */}
      <div className="hidden print:block text-center text-[10px] text-zinc-400 font-semibold border-t border-zinc-200 pt-4 mt-8">
        Generated by TransitOps Enterprise Fleet Management Suite. All rights reserved.
      </div>
    </div>
  );
}

export default Analytics;
