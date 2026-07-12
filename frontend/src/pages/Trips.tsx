import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Route, Plus, Search, MapPin, Navigation, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';

export function Trips() {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  const [formVehicle, setFormVehicle] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [formStartLoc, setFormStartLoc] = useState('');
  const [formEndLoc, setFormEndLoc] = useState('');
  const [formPlannedStart, setFormPlannedStart] = useState('');
  const [formPlannedEnd, setFormPlannedEnd] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formEstCost, setFormEstCost] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCargoWeight, setFormCargoWeight] = useState('');
  const [formPlannedDistance, setFormPlannedDistance] = useState('');

  const [formEndOdometer, setFormEndOdometer] = useState<number | ''>('');
  const [formActualCost, setFormActualCost] = useState('');
  const [formCompletionNotes, setFormCompletionNotes] = useState('');

  const isDispatcher = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']);

  const { data, isLoading } = useQuery({
    queryKey: ['trips', search, status, page],
    queryFn: () =>
      api.get(`/trips?search=${encodeURIComponent(search)}&status=${status}&page=${page}&limit=10`),
  });

  const { data: activeVehicles } = useQuery({
    queryKey: ['active-vehicles'],
    queryFn: () => api.get('/vehicles?status=ACTIVE&limit=100'),
    enabled: isCreateOpen,
  });

  const { data: activeDrivers } = useQuery({
    queryKey: ['active-drivers'],
    queryFn: () => api.get('/drivers?status=ACTIVE&limit=100'),
    enabled: isCreateOpen,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/trips', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip created successfully (DRAFT)');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create trip');
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api.post(`/trips/${id}/dispatch`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Trip dispatched! Vehicle and driver are now on-trip.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Dispatch failed');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.post(`/trips/${id}/complete`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Trip completed successfully');
      setIsCompleteOpen(false);
      setSelectedTrip(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Completion failed');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/trips/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Trip cancelled');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cancellation failed');
    },
  });

  const resetForm = () => {
    setFormVehicle('');
    setFormDriver('');
    setFormStartLoc('');
    setFormEndLoc('');
    setFormPlannedStart('');
    setFormPlannedEnd('');
    setFormPurpose('');
    setFormEstCost('');
    setFormNotes('');
    setFormCargoWeight('');
    setFormPlannedDistance('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      vehicleId: formVehicle,
      driverId: formDriver,
      startLocation: formStartLoc,
      endLocation: formEndLoc,
      plannedStart: new Date(formPlannedStart).toISOString(),
      plannedEnd: new Date(formPlannedEnd).toISOString(),
      purpose: formPurpose || undefined,
      estimatedCost: formEstCost ? parseFloat(formEstCost) : null,
      notes: formNotes || undefined,
      cargoWeight: formCargoWeight ? parseFloat(formCargoWeight) : undefined,
      plannedDistance: formPlannedDistance ? parseFloat(formPlannedDistance) : undefined,
    });
  };

  const handleCompleteClick = (trip: any) => {
    setSelectedTrip(trip);
    setFormEndOdometer(trip.vehicle.currentOdometer);
    setFormActualCost('');
    setFormCompletionNotes('');
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formEndOdometer === '') return;
    completeMutation.mutate({
      id: selectedTrip.id,
      payload: {
        endOdometer: formEndOdometer,
        actualCost: formActualCost ? parseFloat(formActualCost) : null,
        notes: formCompletionNotes || undefined,
      },
    });
  };

  const exportCSV = () => {
    if (!data || !data.data || data.data.length === 0) return;
    const headers = ['Trip Number', 'Driver', 'Vehicle', 'From', 'To', 'Cargo Weight', 'Planned Distance', 'Actual Distance', 'Status'];
    const rows = data.data.map((t: any) => [
      t.tripNumber,
      t.driver.fullName,
      t.vehicle.plateNumber,
      t.startLocation,
      t.endLocation,
      t.cargoWeight || '0',
      t.plannedDistance || '0',
      t.distanceKm || '0',
      t.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trips_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips Cockpit</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Dispatch, monitor, and finalize fleet dispatches.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Export CSV
          </button>
          {isDispatcher && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              <Plus className="w-4 h-4" /> Plan Trip
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by trip number, location..."
              value={search}
              onChange={(e) => {
                setSearchParams((prev) => {
                  prev.set('search', e.target.value);
                  return prev;
                });
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 focus:bg-white text-zinc-950 dark:text-zinc-50 outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setSearchParams((prev) => {
                prev.set('status', e.target.value);
                return prev;
              });
            }}
            className="px-3.5 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-202 focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">All States</option>
            <option value="DRAFT">Draft</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : data?.data?.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.data.map((trip: any) => (
            <div
              key={trip.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Trip ID</span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{trip.tripNumber}</h3>
                </div>
                <StatusBadge status={trip.status} />
              </div>

              <div className="flex items-center justify-between border-t border-b border-zinc-100 dark:border-zinc-800 py-3.5">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Origin</p>
                    <p className="font-semibold text-sm">{trip.startLocation}</p>
                  </div>
                </div>
                <Navigation className="w-4 h-4 text-zinc-300 rotate-90" />
                <div className="flex items-start gap-2.5 text-right justify-end">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Destination</p>
                    <p className="font-semibold text-sm">{trip.endLocation}</p>
                  </div>
                  <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <span className="block text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">Vehicle</span>
                  <span className="font-semibold text-zinc-705 dark:text-zinc-300">{trip.vehicle.plateNumber}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">Driver</span>
                  <span className="font-semibold text-zinc-705 dark:text-zinc-300">{trip.driver.fullName}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">Cargo Weight</span>
                  <span className="font-bold text-zinc-705">{trip.cargoWeight ? `${trip.cargoWeight} kg` : 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">Planned Dist.</span>
                  <span className="font-bold text-zinc-705">{trip.plannedDistance ? `${trip.plannedDistance} km` : 'N/A'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 flex-wrap">
                {trip.status === 'DRAFT' && isDispatcher && (
                  <>
                    <button
                      onClick={() => cancelMutation.mutate(trip.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={() => dispatchMutation.mutate(trip.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Dispatch Trip
                    </button>
                  </>
                )}

                {trip.status === 'DISPATCHED' && (
                  <>
                    {isDispatcher && (
                      <button
                        onClick={() => cancelMutation.mutate(trip.id)}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                    {(isDispatcher || user?.id === trip.driver.userId) && (
                      <button
                        onClick={() => handleCompleteClick(trip)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete Trip
                      </button>
                    )}
                  </>
                )}

                {trip.status === 'COMPLETED' && (
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                    ✓ Completed: {trip.distanceKm} km traveled.
                  </div>
                )}

                {trip.status === 'CANCELLED' && (
                  <div className="text-xs text-rose-500 dark:text-rose-455 font-semibold flex items-center gap-1">
                    Cancelled
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center">
            <Route className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No trips scheduled</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Create dispatches to assign active vehicles and drivers to operations.
          </p>
          {isDispatcher && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
            >
              Plan Your First Trip
            </button>
          )}
        </div>
      )}

      {/* Plan Trip Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Plan Operations Trip">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select Vehicle *</label>
              <select
                required
                value={formVehicle}
                onChange={(e) => setFormVehicle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              >
                <option value="">-- Choose Active Vehicle --</option>
                {activeVehicles?.data?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} - {v.make} {v.model} (Max Load: {v.capacity} kg)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select Driver *</label>
              <select
                required
                value={formDriver}
                onChange={(e) => setFormDriver(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              >
                <option value="">-- Choose Active Driver --</option>
                {activeDrivers?.data?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} (Score: {d.safetyScore || 'N/A'}%)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Origin Location *</label>
              <input
                type="text"
                required
                value={formStartLoc}
                onChange={(e) => setFormStartLoc(e.target.value)}
                placeholder="e.g. Warehouse Zone A"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Destination Location *</label>
              <input
                type="text"
                required
                value={formEndLoc}
                onChange={(e) => setFormEndLoc(e.target.value)}
                placeholder="e.g. Terminal 2 Port"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Planned Start *</label>
              <input
                type="datetime-local"
                required
                value={formPlannedStart}
                onChange={(e) => setFormPlannedStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Planned End *</label>
              <input
                type="datetime-local"
                required
                value={formPlannedEnd}
                onChange={(e) => setFormPlannedEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Cargo Weight (kg) *</label>
              <input
                type="number"
                required
                value={formCargoWeight}
                onChange={(e) => setFormCargoWeight(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Planned Distance (km) *</label>
              <input
                type="number"
                required
                value={formPlannedDistance}
                onChange={(e) => setFormPlannedDistance(e.target.value)}
                placeholder="e.g. 150"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Est. Cost ($)</label>
              <input
                type="number"
                value={formEstCost}
                onChange={(e) => setFormEstCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Trip Purpose</label>
            <input
              type="text"
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
              placeholder="e.g. Cargo delivery"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 text-sm cursor-pointer"
          >
            {createMutation.isPending ? 'Scheduling...' : 'Create Draft Trip'}
          </button>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={isCompleteOpen} onClose={() => setIsCompleteOpen(false)} title="Complete Dispatched Trip">
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Start Odometer Reading</p>
            <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              {selectedTrip?.startOdometer || selectedTrip?.vehicle?.currentOdometer || 0} km
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Final Odometer Reading *</label>
            <input
              type="number"
              required
              value={formEndOdometer}
              onChange={(e) => setFormEndOdometer(parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Actual Cost ($)</label>
            <input
              type="number"
              value={formActualCost}
              onChange={(e) => setFormActualCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Operational Notes / Issues</label>
            <textarea
              value={formCompletionNotes}
              onChange={(e) => setFormCompletionNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm h-16 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={completeMutation.isPending}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-emerald-400 text-sm cursor-pointer"
          >
            {completeMutation.isPending ? 'Completing...' : 'Finalize Trip'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default Trips;
