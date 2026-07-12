import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Route, Plus, Search, MapPin, Navigation, CheckCircle2, XCircle, Download, FileText, ArrowRight } from 'lucide-react';
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
    <div className="space-y-6 page-transition">
      {/* Header Panel */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">Trips Cockpit</h1>
          <p className="text-sm text-zinc-450 dark:text-zinc-450 mt-0.5">
            Dispatch, monitor, and finalize fleet dispatches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="h-10 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer hover:shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {isDispatcher && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Plan Trip
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
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
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all duration-200"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => {
                setSearchParams((prev) => {
                  prev.set('status', e.target.value);
                  return prev;
                });
              }}
              className="h-10 pl-3 pr-8 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden appearance-none cursor-pointer"
            >
              <option value="">All States</option>
              <option value="DRAFT">Draft</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Grid */}
      {isLoading ? (
        <TableSkeleton />
      ) : data?.data?.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.data.map((trip: any) => (
            <div
              key={trip.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Trip ID</span>
                  <h3 className="text-base font-extrabold text-zinc-705 dark:text-zinc-50">{trip.tripNumber}</h3>
                </div>
                <StatusBadge status={trip.status} />
              </div>

              {/* Waypoints line */}
              <div className="flex items-center justify-between border-t border-b border-zinc-100 dark:border-zinc-800 py-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/20 text-[#0F766E] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Origin</p>
                    <p className="font-bold text-xs text-zinc-700 dark:text-zinc-200">{trip.startLocation}</p>
                  </div>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-4 relative">
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 absolute right-1/2 translate-x-1/2 -top-[9px]" />
                </div>
                <div className="flex items-start gap-2.5 justify-end text-right">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Destination</p>
                    <p className="font-bold text-xs text-zinc-700 dark:text-zinc-200">{trip.endLocation}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Grid specifics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                <div>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Vehicle</span>
                  <span className="text-zinc-705 dark:text-zinc-300 font-bold">{trip.vehicle.plateNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Driver</span>
                  <span className="text-zinc-705 dark:text-zinc-300 font-bold">{trip.driver.fullName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Cargo Weight</span>
                  <span className="text-zinc-705 dark:text-zinc-100 font-bold">{trip.cargoWeight ? `${trip.cargoWeight.toLocaleString()} kg` : 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Planned Dist.</span>
                  <span className="text-zinc-705 dark:text-zinc-100 font-bold">{trip.plannedDistance ? `${trip.plannedDistance} km` : 'N/A'}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3.5 border-t border-zinc-150 dark:border-zinc-800 flex justify-end gap-3 flex-wrap">
                {trip.status === 'DRAFT' && isDispatcher && (
                  <>
                    <button
                      onClick={() => cancelMutation.mutate(trip.id)}
                      className="h-8 px-3.5 rounded-lg border border-rose-200 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={() => dispatchMutation.mutate(trip.id)}
                      className="h-8 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all"
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
                        className="h-8 px-3.5 rounded-lg border border-rose-200 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                    {(isDispatcher || user?.id === trip.driver.userId) && (
                      <button
                        onClick={() => handleCompleteClick(trip)}
                        className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete Trip
                      </button>
                    )}
                  </>
                )}

                {trip.status === 'COMPLETED' && (
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                    ✓ Completed: {trip.distanceKm} km traveled
                  </div>
                )}

                {trip.status === 'CANCELLED' && (
                  <div className="text-xs text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1">
                    Cancelled
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-[#0F766E] flex items-center justify-center">
            <Route className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-705 dark:text-zinc-200">No trips scheduled</h3>
          <p className="text-sm text-zinc-450 dark:text-zinc-450 max-w-sm font-medium">
            Create dispatches to assign active vehicles and drivers to operations.
          </p>
          {isDispatcher && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Plan Your First Trip
            </button>
          )}
        </div>
      )}

      {/* Plan Trip Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Plan Operations Trip">
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Select Vehicle *</label>
              <select
                required
                value={formVehicle}
                onChange={(e) => setFormVehicle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
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
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Select Driver *</label>
              <select
                required
                value={formDriver}
                onChange={(e) => setFormDriver(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
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
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Origin Location *</label>
              <input
                type="text"
                required
                value={formStartLoc}
                onChange={(e) => setFormStartLoc(e.target.value)}
                placeholder="e.g. Warehouse Zone A"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Destination Location *</label>
              <input
                type="text"
                required
                value={formEndLoc}
                onChange={(e) => setFormEndLoc(e.target.value)}
                placeholder="e.g. Terminal 2 Port"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Planned Start *</label>
              <input
                type="datetime-local"
                required
                value={formPlannedStart}
                onChange={(e) => setFormPlannedStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Planned End *</label>
              <input
                type="datetime-local"
                required
                value={formPlannedEnd}
                onChange={(e) => setFormPlannedEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Cargo Weight (kg) *</label>
              <input
                type="number"
                required
                value={formCargoWeight}
                onChange={(e) => setFormCargoWeight(e.target.value)}
                placeholder="e.g. 500"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Planned Distance (km) *</label>
              <input
                type="number"
                required
                value={formPlannedDistance}
                onChange={(e) => setFormPlannedDistance(e.target.value)}
                placeholder="e.g. 150"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Est. Cost ($)</label>
              <input
                type="number"
                value={formEstCost}
                onChange={(e) => setFormEstCost(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Trip Purpose</label>
            <input
              type="text"
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
              placeholder="e.g. Cargo delivery"
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-11 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {createMutation.isPending ? 'Scheduling...' : 'Create Draft Trip'}
          </button>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={isCompleteOpen} onClose={() => setIsCompleteOpen(false)} title="Complete Dispatched Trip">
        <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-1">
          <div className="bg-[#F8FAFC] dark:bg-[#111827]/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Start Odometer</p>
              <p className="text-base font-extrabold text-zinc-705 dark:text-zinc-100">
                {(selectedTrip?.startOdometer || selectedTrip?.vehicle?.currentOdometer || 0).toLocaleString()} km
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/20 text-[#0F766E] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Final Odometer Reading *</label>
            <input
              type="number"
              required
              value={formEndOdometer}
              onChange={(e) => setFormEndOdometer(parseInt(e.target.value) || '')}
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Actual Cost ($)</label>
            <input
              type="number"
              value={formActualCost}
              onChange={(e) => setFormActualCost(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Operational Notes / Issues</label>
            <textarea
              value={formCompletionNotes}
              onChange={(e) => setFormCompletionNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden resize-none h-16"
            />
          </div>
          <button
            type="submit"
            disabled={completeMutation.isPending}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {completeMutation.isPending ? 'Completing...' : 'Finalize Trip'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default Trips;
