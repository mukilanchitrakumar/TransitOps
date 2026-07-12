import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Download, Truck, Users, Route, Fuel, Landmark } from 'lucide-react';
import { toast } from 'sonner';

export function Reports() {
  const { hasRole } = useAuth();
  const isAuthorized = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']);

  // Fetch summaries for preview stats
  const { data: metrics } = useQuery({
    queryKey: ['report-metrics'],
    queryFn: () => api.get('/reports/metrics'),
  });

  const downloadCSV = async (module: 'vehicles' | 'drivers' | 'trips' | 'fuel' | 'expenses') => {
    try {
      let path = '';
      let filename = '';
      if (module === 'vehicles') {
        path = '/vehicles?limit=1000';
        filename = 'vehicles_report.csv';
      } else if (module === 'drivers') {
        path = '/drivers?limit=1000';
        filename = 'drivers_report.csv';
      } else if (module === 'trips') {
        path = '/trips?limit=1000';
        filename = 'trips_report.csv';
      } else if (module === 'fuel') {
        path = '/fuel-logs?limit=1000';
        filename = 'fuel_logs_report.csv';
      } else if (module === 'expenses') {
        path = '/expenses?limit=1000';
        filename = 'expense_claims_report.csv';
      }

      const res = await api.get(path);
      if (!res.success || !res.data || res.data.length === 0) {
        toast.error('No records available to export');
        return;
      }

      let csvContent = '';
      if (module === 'vehicles') {
        const headers = ['Plate Number', 'Make', 'Model', 'Year', 'Category', 'Status', 'Odometer'];
        const rows = res.data.map((v: any) => [v.plateNumber, v.make, v.model, v.year, v.category, v.status, v.currentOdometer]);
        csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      } else if (module === 'drivers') {
        const headers = ['Full Name', 'License Number', 'Expiry Date', 'Phone', 'Status', 'Safety Score'];
        const rows = res.data.map((d: any) => [d.fullName, d.licenseNumber, new Date(d.licenseExpiry).toLocaleDateString(), d.phone, d.status, d.safetyScore || 'N/A']);
        csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      } else if (module === 'trips') {
        const headers = ['Trip Number', 'Vehicle', 'Driver', 'Origin', 'Destination', 'Status', 'Estimated Cost', 'Distance (km)'];
        const rows = res.data.map((t: any) => [t.tripNumber, t.vehicle.plateNumber, t.driver.fullName, t.startLocation, t.endLocation, t.status, t.estimatedCost, t.distanceKm || 0]);
        csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      } else if (module === 'fuel') {
        const headers = ['Vehicle Plate', 'Driver Name', 'Odometer', 'Quantity (L)', 'Cost ($)', 'Station', 'Efficiency (km/L)'];
        const rows = res.data.map((f: any) => [f.vehicle.plateNumber, f.driver.fullName, f.odometerReading, f.fuelQuantity, f.cost, f.fuelStation || 'N/A', f.efficiency || 'N/A']);
        csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      } else if (module === 'expenses') {
        const headers = ['Category', 'Description', 'Amount ($)', 'Date', 'Status', 'Logged By'];
        const rows = res.data.map((x: any) => [x.category, x.description, x.amount, new Date(x.date).toLocaleDateString(), x.status, x.creator?.fullName || 'N/A']);
        csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      }

      const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${filename} successfully downloaded`);
    } catch (err: any) {
      toast.error('Failed to export CSV report file');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-450 rounded-2xl border border-rose-100 dark:border-rose-900/30">
        You are not authorized to view the Reports Workbench.
      </div>
    );
  }

  const reportsList = [
    { name: 'Vehicles Inventory Ledger', desc: 'List of all fleet vehicles, plate numbers, make, models, and current odometers.', icon: Truck, module: 'vehicles' as const },
    { name: 'Drivers safety Scorecard', desc: 'Summary of active operators, license expiration deadlines, safety score progress.', icon: Users, module: 'drivers' as const },
    { name: 'Operational Trips History', desc: 'Chronological timeline of draft, dispatched, and completed route dispatches.', icon: Route, module: 'trips' as const },
    { name: 'Fuel Consumption Audit', desc: 'Fuel ledger entries, quantity volumes, gas stations, and km/L efficiencies.', icon: Fuel, module: 'fuel' as const },
    { name: 'Expense Ledger Statement', desc: 'Categorized costs (tolls, meals, repairs) with approved amounts and claimant info.', icon: Landmark, module: 'expenses' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Workbench</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Analyze operational statistics and export ledger summaries.
        </p>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Fuel Expenses</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            ${metrics?.metrics?.monthlyFuelCost.toLocaleString() || '0.00'}
          </p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Current billing cycle</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Active Resources</p>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {metrics?.metrics?.activeVehicles || 0} / {metrics?.metrics?.totalVehicles || 0} Vehicles
          </p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Currently operational</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Upcoming Service Alerts</p>
          <p className="text-2xl font-extrabold text-amber-500">
            {metrics?.metrics?.upcomingServices || 0} Assets
          </p>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Due for oil or component checks</span>
        </div>
      </div>

      {/* Reports lists download cards */}
      <div className="space-y-4 pt-4">
        <h3 className="text-md font-bold text-zinc-850 dark:text-zinc-200">
          Available Export Data Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportsList.map((rep) => {
            const Icon = rep.icon;
            return (
              <div
                key={rep.name}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-455 rounded-xl shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{rep.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">{rep.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadCSV(rep.module)}
                  className="p-3.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
export default Reports;
