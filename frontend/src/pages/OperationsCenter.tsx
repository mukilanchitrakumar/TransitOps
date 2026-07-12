import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Route,
  ShieldCheck,
  Truck,
  Wrench,
  Loader2,
  Lock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export function OperationsCenter() {
  // Setup 5000ms polling for live operations data
  const { data, isLoading, error } = useQuery({
    queryKey: ['realtime-ops-metrics'],
    queryFn: () => api.get('/reports/metrics'),
    refetchInterval: 5000,
  });

  const { data: tripsData } = useQuery({
    queryKey: ['realtime-trips-queue'],
    queryFn: () => api.get('/trips'),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 page-transition">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
        <p className="text-xs font-semibold text-zinc-450 dark:text-zinc-500">Establishing real-time connection telemetry...</p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-xs font-medium flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
        Operations telemetry link offline. Reconnecting automatically...
      </div>
    );
  }

  const { metrics, businessRules, recentMaintenance } = data;
  const trips = tripsData?.success ? tripsData.trips : [];
  const activeDispatches = trips.filter((t: any) => t.status === 'DISPATCHED');

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50 flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#0F766E] animate-pulse" /> Operations Control Room
          </h1>
          <p className="text-sm text-zinc-450 dark:text-zinc-455 mt-0.5">
            Live operations cockpit with 5s automatic database telemetry sync
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Live Telemetry Active
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core Fleet Statistics */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between card-hover">
          <h3 className="text-xs font-bold text-zinc-705 dark:text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
            <Truck className="w-4 h-4 text-zinc-400" /> Vehicle Allocation Matrix
          </h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-zinc-500 dark:text-zinc-400">Available Units</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.activeVehicles}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-zinc-500 dark:text-zinc-400">Active Dispatched</span>
              <span className="font-extrabold text-[#0F766E] dark:text-[#14B8A6]">{metrics.onTripVehicles}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-zinc-500 dark:text-zinc-400">Undergoing Workshop Service</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">{metrics.maintenanceVehicles}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden flex mt-2.5">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(metrics.activeVehicles / (metrics.totalVehicles || 1)) * 100}%` }} />
              <div className="h-full bg-[#0F766E] transition-all duration-500" style={{ width: `${(metrics.onTripVehicles / (metrics.totalVehicles || 1)) * 100}%` }} />
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(metrics.maintenanceVehicles / (metrics.totalVehicles || 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Real-time Alerts */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between card-hover">
          <h3 className="text-xs font-bold text-zinc-705 dark:text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Compliance Warnings
          </h3>
          <div className="space-y-2.5 flex-1 text-xs font-medium">
            {businessRules.expiredDriversAssigned > 0 && (
              <div className="flex items-start gap-2 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Driver License Expiry Alert: Expired operator assigned on active route.</span>
              </div>
            )}
            {businessRules.overloadedTrips > 0 && (
              <div className="flex items-start gap-2 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Overloaded Vehicle warning: Cargo weight exceeds safe vehicle load capacity.</span>
              </div>
            )}
            {businessRules.expiredDriversAssigned === 0 && businessRules.overloadedTrips === 0 && (
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="font-bold">All dispatches comply fully with compliance guidelines.</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Financial Overview */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between card-hover">
          <h3 className="text-xs font-bold text-zinc-705 dark:text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Pending Approvals
          </h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-zinc-500 dark:text-zinc-400">Expense Approvals Pending</span>
              <span className="font-extrabold text-orange-600 dark:text-orange-400">{metrics.pendingExpenses}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="text-zinc-500 dark:text-zinc-400">Monthly Fuel Ledger</span>
              <span className="font-extrabold text-zinc-705 dark:text-zinc-50">${metrics.monthlyFuelCost.toLocaleString()}</span>
            </div>
            <Link
              to="/reports"
              className="mt-2 text-center text-xs font-bold text-[#0F766E] hover:text-[#115E59] border border-zinc-200 dark:border-zinc-800 py-2 rounded-xl block transition-all"
            >
              Go to Financial Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Queue Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Dispatched Trips Board */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-zinc-705 dark:text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
            <Route className="w-4 h-4 text-sky-500" /> Active Dispatch Queue ({activeDispatches.length})
          </h3>
          {activeDispatches.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
              No active vehicle routes currently dispatched.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {activeDispatches.map((trip: any) => (
                <div key={trip.id} className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-800/60 flex justify-between items-center text-xs font-medium hover:border-[#0F766E]/30 transition-all duration-200">
                  <div>
                    <p className="font-bold text-zinc-705 dark:text-zinc-50">{trip.tripNumber}</p>
                    <p className="text-[10px] text-zinc-405 dark:text-zinc-500 mt-0.5">{trip.startLocation} → {trip.endLocation}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 rounded-md">Dispatched</span>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 font-semibold">Cargo: {trip.cargoWeight} kg</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance workshop board */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-zinc-705 dark:text-zinc-200 mb-4 flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2.5">
            <Wrench className="w-4 h-4 text-amber-500" /> Workshop Repair Log ({recentMaintenance.length})
          </h3>
          {recentMaintenance.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
              No active vehicles in service shop.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {recentMaintenance.map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-800/60 flex justify-between items-center text-xs font-medium hover:border-amber-500/30 transition-all duration-200">
                  <div>
                    <p className="font-bold text-zinc-705 dark:text-zinc-50">Vehicle: {m.vehicle?.plateNumber}</p>
                    <p className="text-[10px] text-zinc-405 dark:text-zinc-500 mt-0.5">Task: {m.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      {m.status}
                    </span>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-1 font-semibold">Cost: ${parseFloat(m.cost).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OperationsCenter;
