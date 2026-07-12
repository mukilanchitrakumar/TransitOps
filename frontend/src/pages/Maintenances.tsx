import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Wrench, Plus, Search, Calendar, Play, CheckSquare, XSquare, Landmark, Download, FileText, Settings, X, ShieldAlert } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';

export function Maintenances() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const vehicleId = searchParams.get('vehicleId') || '';
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState<any>(null);

  // Form states (Create)
  const [formVehicle, setFormVehicle] = useState('');
  const [formType, setFormType] = useState('ROUTINE');
  const [formDescription, setFormDescription] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formEstimatedCost, setFormEstimatedCost] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form states (Complete)
  const [formActualCost, setFormActualCost] = useState('');
  const [formPerformedBy, setFormPerformedBy] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formCompletionNotes, setFormCompletionNotes] = useState('');

  const isEditable = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']);

  // Fetch Maintenances
  const { data, isLoading } = useQuery({
    queryKey: ['maintenances', status, vehicleId, page],
    queryFn: () =>
      api.get(`/maintenances?status=${status}&vehicleId=${vehicleId}&page=${page}&limit=10`),
  });

  // Fetch active vehicles for scheduler dropdown list
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-for-maint'],
    queryFn: () => api.get('/vehicles?limit=100'),
    enabled: isCreateOpen,
  });

  // Mutate create maintenance
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/maintenances', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast.success('Maintenance scheduled successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to schedule maintenance');
    },
  });

  // Mutate start maintenance
  const startMutation = useMutation({
    mutationFn: (id: string) => api.post(`/maintenances/${id}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Maintenance work started. Vehicle status set to MAINTENANCE.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Start failed');
    },
  });

  // Mutate complete maintenance
  const completeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.post(`/maintenances/${id}/complete`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Maintenance work completed. Vehicle returned to ACTIVE.');
      setIsCompleteOpen(false);
      setSelectedMaint(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Completion failed');
    },
  });

  // Mutate cancel maintenance
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/maintenances/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Maintenance work cancelled');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cancellation failed');
    },
  });

  const resetForm = () => {
    setFormVehicle('');
    setFormType('ROUTINE');
    setFormDescription('');
    setFormScheduledDate('');
    setFormEstimatedCost('');
    setFormNotes('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      vehicleId: formVehicle,
      maintenanceType: formType,
      description: formDescription,
      scheduledDate: new Date(formScheduledDate).toISOString(),
      cost: formEstimatedCost ? parseFloat(formEstimatedCost) : undefined,
      notes: formNotes || undefined,
    });
  };

  const handleCompleteClick = (maint: any) => {
    setSelectedMaint(maint);
    setFormActualCost(maint.cost || '');
    setFormPerformedBy('');
    setFormInvoice('');
    setFormCompletionNotes('');
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeMutation.mutate({
      id: selectedMaint.id,
      payload: {
        cost: formActualCost ? parseFloat(formActualCost) : undefined,
        performedBy: formPerformedBy || undefined,
        invoiceNumber: formInvoice || undefined,
        notes: formCompletionNotes || undefined,
      },
    });
  };

  const exportCSV = () => {
    if (!data || !data.data || data.data.length === 0) return;
    const headers = ['Vehicle', 'Type', 'Description', 'Scheduled Date', 'Status', 'Cost'];
    const rows = data.data.map((m: any) => [
      m.vehicle.plateNumber,
      m.maintenanceType,
      m.description,
      new Date(m.scheduledDate).toLocaleDateString(),
      m.status,
      m.cost || '0',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maintenance_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header Section */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">Maintenance Workspace</h1>
          <p className="text-sm text-zinc-450 dark:text-zinc-455 mt-0.5">
            Schedule vehicle checks and track mechanical repair logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="h-10 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer hover:shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {isEditable && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Schedule Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Selector block */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => {
              setSearchParams((prev) => {
                prev.set('status', e.target.value);
                return prev;
              });
            }}
            className="h-10 px-3 pr-8 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table grid layout */}
      {isLoading ? (
        <TableSkeleton />
      ) : data?.data?.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#111827]/40 text-zinc-555 font-bold border-b border-zinc-200 dark:border-zinc-800 sticky top-0 uppercase tracking-wider">
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Task Details</th>
                  <th className="p-4">Scheduled Date</th>
                  <th className="p-4">Cost ($)</th>
                  <th className="p-4">Status</th>
                  {isEditable && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-semibold text-zinc-650 dark:text-zinc-300">
                {data.data.map((m: any) => (
                  <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="p-4 text-zinc-705 dark:text-zinc-100 font-extrabold text-sm">{m.vehicle.plateNumber}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase">
                        {m.maintenanceType}
                      </span>
                      <p className="font-bold text-zinc-700 dark:text-zinc-200 mt-1">{m.description}</p>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400 font-mono">
                      {new Date(m.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-extrabold text-zinc-800 dark:text-zinc-200">
                      ${parseFloat(m.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={m.status} />
                    </td>
                    {isEditable && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {m.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => cancelMutation.mutate(m.id)}
                                className="p-1.5 rounded-lg border border-rose-250 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                                title="Cancel Task"
                              >
                                <XSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startMutation.mutate(m.id)}
                                className="p-1.5 rounded-lg bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] cursor-pointer transition-colors"
                                title="Start Work"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {m.status === 'IN_PROGRESS' && (
                            <>
                              <button
                                onClick={() => cancelMutation.mutate(m.id)}
                                className="p-1.5 rounded-lg border border-rose-250 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                                title="Cancel Task"
                              >
                                <XSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCompleteClick(m)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 cursor-pointer transition-colors"
                                title="Complete Task"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-[#0F766E] flex items-center justify-center">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-705 dark:text-zinc-200">No scheduled repairs</h3>
          <p className="text-sm text-zinc-450 dark:text-zinc-455 max-w-sm font-medium">
            Keep track of mechanical inspections, parts updates, and routines.
          </p>
          {isEditable && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Schedule Repairs Now
            </button>
          )}
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Schedule Mechanical Maintenance">
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Select Vehicle *</label>
              <select
                required
                value={formVehicle}
                onChange={(e) => setFormVehicle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehiclesData?.data?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Type *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
              >
                <option value="ROUTINE">Routine Maintenance</option>
                <option value="REPAIR">Repair Work</option>
                <option value="INSPECTION">Safety Inspection</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Scheduled Date *</label>
              <input
                type="date"
                required
                value={formScheduledDate}
                onChange={(e) => setFormScheduledDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Estimated Cost ($)</label>
              <input
                type="number"
                value={formEstimatedCost}
                onChange={(e) => setFormEstimatedCost(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Task Description *</label>
            <input
              type="text"
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Engine oil and filter replacement"
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Operational Notes</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden resize-none h-16"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-11 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {createMutation.isPending ? 'Scheduling...' : 'Schedule Task'}
          </button>
        </form>
      </Modal>

      {/* Complete Maintenance Modal */}
      <Modal isOpen={isCompleteOpen} onClose={() => setIsCompleteOpen(false)} title="Finalize Maintenance Task">
        <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Actual Invoice Cost ($) *</label>
              <input
                type="number"
                required
                value={formActualCost}
                onChange={(e) => setFormActualCost(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Performed By / Workshop *</label>
              <input
                type="text"
                required
                value={formPerformedBy}
                onChange={(e) => setFormPerformedBy(e.target.value)}
                placeholder="e.g. Ford Service Center"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Invoice Number</label>
            <input
              type="text"
              value={formInvoice}
              onChange={(e) => setFormInvoice(e.target.value)}
              placeholder="e.g. INV-100239"
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">Completion Notes</label>
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
            {completeMutation.isPending ? 'Submitting...' : 'Complete Task'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default Maintenances;
