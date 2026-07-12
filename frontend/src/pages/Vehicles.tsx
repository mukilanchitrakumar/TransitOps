import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';

export function Vehicles() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const [formPlate, setFormPlate] = useState('');
  const [formName, setFormName] = useState('');
  const [formMake, setFormMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formCategory, setFormCategory] = useState('VAN');
  const [formOdometer, setFormOdometer] = useState(0);
  const [formCapacity, setFormCapacity] = useState(5);
  const [formFuelType, setFormFuelType] = useState('GASOLINE');
  const [formVin, setFormVin] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAcquisitionCost, setFormAcquisitionCost] = useState('');

  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editNextServiceOdometer, setEditNextServiceOdometer] = useState(0);
  const [editNextServiceDate, setEditNextServiceDate] = useState('');

  const isEditable = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']);

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, status, page],
    queryFn: () =>
      api.get(`/vehicles?search=${encodeURIComponent(search)}&status=${status}&page=${page}&limit=10`),
  });

  const createMutation = useMutation({
    mutationFn: (newVehicle: any) => api.post('/vehicles', newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle registered successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to register vehicle');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.patch(`/vehicles/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update vehicle');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle successfully archived');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Archive failed');
    },
  });

  const resetForm = () => {
    setFormPlate('');
    setFormName('');
    setFormMake('');
    setFormModel('');
    setFormYear(new Date().getFullYear());
    setFormCategory('VAN');
    setFormOdometer(0);
    setFormCapacity(5);
    setFormFuelType('GASOLINE');
    setFormVin('');
    setFormImageUrl('');
    setFormAcquisitionCost('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      plateNumber: formPlate,
      name: formName || undefined,
      make: formMake,
      model: formModel,
      year: formYear,
      category: formCategory,
      currentOdometer: formOdometer,
      capacity: formCapacity,
      fuelType: formFuelType,
      vinNumber: formVin || undefined,
      imageUrl: formImageUrl || undefined,
      acquisitionCost: formAcquisitionCost ? parseFloat(formAcquisitionCost) : undefined,
    });
  };

  const handleEditClick = (v: any) => {
    setSelectedVehicle(v);
    setFormPlate(v.plateNumber);
    setFormName(v.name || '');
    setFormMake(v.make);
    setFormModel(v.model);
    setFormYear(v.year);
    setFormCategory(v.category);
    setFormOdometer(v.currentOdometer);
    setFormCapacity(v.capacity);
    setFormFuelType(v.fuelType);
    setFormVin(v.vinNumber || '');
    setFormImageUrl(v.imageUrl || '');
    setFormAcquisitionCost(v.acquisitionCost ? v.acquisitionCost.toString() : '');
    setEditStatus(v.status);
    setEditNextServiceOdometer(v.nextServiceOdometer || 0);
    setEditNextServiceDate(
      v.nextServiceDate ? new Date(v.nextServiceDate).toISOString().slice(0, 10) : ''
    );
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: selectedVehicle.id,
      payload: {
        plateNumber: formPlate,
        name: formName || null,
        make: formMake,
        model: formModel,
        year: formYear,
        category: formCategory,
        currentOdometer: formOdometer,
        capacity: formCapacity,
        fuelType: formFuelType,
        vinNumber: formVin || null,
        imageUrl: formImageUrl || null,
        status: editStatus,
        nextServiceOdometer: editNextServiceOdometer || null,
        nextServiceDate: editNextServiceDate ? new Date(editNextServiceDate).toISOString() : null,
        acquisitionCost: formAcquisitionCost ? parseFloat(formAcquisitionCost) : null,
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to archive this vehicle?')) {
      deleteMutation.mutate(id);
    }
  };

  const exportCSV = () => {
    if (!data || !data.data || data.data.length === 0) return;
    const headers = ['Plate Number', 'Vehicle Name', 'Make', 'Model', 'Year', 'Category', 'Status', 'Odometer', 'Acquisition Cost'];
    const rows = data.data.map((v: any) => [
      v.plateNumber,
      v.name || 'N/A',
      v.make,
      v.model,
      v.year,
      v.category,
      v.status,
      v.currentOdometer,
      v.acquisitionCost || '0.00',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vehicles_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Audit and configure vehicle assets registry.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Export CSV
          </button>
          {isEditable && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              <Plus className="w-4 h-4" /> Register Vehicle
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
              placeholder="Search plate, model, make..."
              value={search}
              onChange={(e) => {
                setSearchParams((prev) => {
                  prev.set('search', e.target.value);
                  return prev;
                });
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-955 focus:bg-white text-zinc-950 dark:text-zinc-50 outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
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
            className="px-3.5 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-zinc-805 dark:text-zinc-202 focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Out Of Service</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : data?.data?.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-955/40 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-150 dark:border-zinc-800">
                <th className="p-4">Plate Number</th>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Capacity (Max Load)</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Status</th>
                {isEditable && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.data.map((v: any) => (
                <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                    <span className="block">{v.plateNumber}</span>
                    {v.name && <span className="text-xs font-semibold text-zinc-400">Alias: {v.name}</span>}
                  </td>
                  <td className="p-4 font-medium">
                    {v.make} {v.model} ({v.year})
                    {v.acquisitionCost && <span className="block text-xs text-zinc-450">Acquisition: ${parseFloat(v.acquisitionCost).toLocaleString()}</span>}
                  </td>
                  <td className="p-4 uppercase text-xs font-bold text-zinc-500">{v.category}</td>
                  <td className="p-4 font-semibold">{v.capacity} kg</td>
                  <td className="p-4 font-semibold">{v.currentOdometer.toLocaleString()} km</td>
                  <td className="p-4">
                    <StatusBadge status={v.status} />
                  </td>
                  {isEditable && (
                    <td className="p-4 text-right flex justify-end gap-3.5">
                      <button
                        onClick={() => handleEditClick(v)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(v.id)}
                        className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                      >
                        Archive
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No vehicles registered</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Add assets to start tracking dispatches, logs, and maintenance logs.
          </p>
          {isEditable && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
            >
              Add Your First Vehicle
            </button>
          )}
        </div>
      )}

      {/* Register Vehicle Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register New Vehicle">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Plate Number *</label>
              <input
                type="text"
                required
                value={formPlate}
                onChange={(e) => setFormPlate(e.target.value)}
                placeholder="e.g. TX-987-AB"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Vehicle Alias / Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Delivery Van A"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category *</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              >
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Acquisition Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formAcquisitionCost}
                onChange={(e) => setFormAcquisitionCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Make *</label>
              <input
                type="text"
                required
                value={formMake}
                onChange={(e) => setFormMake(e.target.value)}
                placeholder="e.g. Ford"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Model *</label>
              <input
                type="text"
                required
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                placeholder="e.g. Transit"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Year *</label>
              <input
                type="number"
                required
                value={formYear}
                onChange={(e) => setFormYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Odometer (km)</label>
              <input
                type="number"
                value={formOdometer}
                onChange={(e) => setFormOdometer(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Capacity (Max Load kg)</label>
              <input
                type="number"
                value={formCapacity}
                onChange={(e) => setFormCapacity(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Fuel Type</label>
              <input
                type="text"
                value={formFuelType}
                onChange={(e) => setFormFuelType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 text-sm cursor-pointer"
          >
            {createMutation.isPending ? 'Registering...' : 'Register Vehicle'}
          </button>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Vehicle Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Plate Number</label>
              <input
                type="text"
                required
                value={formPlate}
                onChange={(e) => setFormPlate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Operational Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out Of Service</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Vehicle Name / Alias</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Acquisition Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formAcquisitionCost}
                onChange={(e) => setFormAcquisitionCost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Make</label>
              <input
                type="text"
                required
                value={formMake}
                onChange={(e) => setFormMake(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Model</label>
              <input
                type="text"
                required
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Odometer (km)</label>
              <input
                type="number"
                value={formOdometer}
                onChange={(e) => setFormOdometer(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Next Service Date</label>
              <input
                type="date"
                value={editNextServiceDate}
                onChange={(e) => setEditNextServiceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Next Service Odometer (km)</label>
              <input
                type="number"
                value={editNextServiceOdometer}
                onChange={(e) => setEditNextServiceOdometer(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 text-sm cursor-pointer"
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default Vehicles;
