import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Users, Plus, Search, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';

export function Drivers() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const [formName, setFormName] = useState('');
  const [formLicense, setFormLicense] = useState('');
  const [formLicenseCategory, setFormLicenseCategory] = useState('Class A');
  const [formExpiry, setFormExpiry] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSafetyScore, setFormSafetyScore] = useState(90);
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [driverStatus, setDriverStatus] = useState('ACTIVE');

  const isEditable = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']);

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', search, status, page],
    queryFn: () =>
      api.get(`/drivers?search=${encodeURIComponent(search)}&status=${status}&page=${page}&limit=10`),
  });

  const createMutation = useMutation({
    mutationFn: (newDriver: any) => api.post('/drivers', newDriver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver profile created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create driver');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.patch(`/drivers/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver details updated');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Update failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver archived successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to archive driver');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormLicense('');
    setFormLicenseCategory('Class A');
    setFormExpiry('');
    setFormPhone('');
    setFormSafetyScore(90);
    setFormEmergencyName('');
    setFormEmergencyPhone('');
    setFormAddress('');
    setFormUserId('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      fullName: formName,
      licenseNumber: formLicense,
      licenseCategory: formLicenseCategory,
      licenseExpiry: new Date(formExpiry).toISOString(),
      phone: formPhone,
      status: driverStatus,
      safetyScore: formSafetyScore,
      emergencyContactName: formEmergencyName || undefined,
      emergencyContactPhone: formEmergencyPhone || undefined,
      address: formAddress || undefined,
      userId: formUserId || undefined,
    });
  };

  const handleEditClick = (d: any) => {
    setSelectedDriver(d);
    setFormName(d.fullName);
    setFormLicense(d.licenseNumber);
    setFormLicenseCategory(d.licenseCategory || 'Class A');
    setFormExpiry(new Date(d.licenseExpiry).toISOString().slice(0, 10));
    setFormPhone(d.phone);
    setFormSafetyScore(d.safetyScore || 90);
    setFormEmergencyName(d.emergencyContactName || '');
    setFormEmergencyPhone(d.emergencyContactPhone || '');
    setFormAddress(d.address || '');
    setFormUserId(d.userId || '');
    setDriverStatus(d.status);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: selectedDriver.id,
      payload: {
        fullName: formName,
        licenseNumber: formLicense,
        licenseCategory: formLicenseCategory,
        licenseExpiry: new Date(formExpiry).toISOString(),
        phone: formPhone,
        status: driverStatus,
        safetyScore: formSafetyScore,
        emergencyContactName: formEmergencyName || null,
        emergencyContactPhone: formEmergencyPhone || null,
        address: formAddress || null,
        userId: formUserId || null,
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to archive this driver profile?')) {
      deleteMutation.mutate(id);
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const exportCSV = () => {
    if (!data || !data.data || data.data.length === 0) return;
    const headers = ['Full Name', 'License Number', 'License Category', 'License Expiry', 'Phone', 'Status', 'Safety Score'];
    const rows = data.data.map((d: any) => [
      d.fullName,
      d.licenseNumber,
      d.licenseCategory || 'Class A',
      new Date(d.licenseExpiry).toLocaleDateString(),
      d.phone,
      d.status,
      d.safetyScore || 'N/A',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `drivers_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Configure operators, contact lists, and safety scorecard levels.
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
              <Plus className="w-4 h-4" /> Add Driver Profile
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, license number..."
              value={search}
              onChange={(e) => {
                setSearchParams((prev) => {
                  prev.set('search', e.target.value);
                  return prev;
                });
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:bg-white text-zinc-950 dark:text-zinc-50 outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
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
            className="px-3.5 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-zinc-850 dark:text-zinc-202 focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : data?.data?.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-955/40 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-150 dark:border-zinc-800">
                <th className="p-4">Driver Name</th>
                <th className="p-4">License Info</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Safety Score</th>
                <th className="p-4">Status</th>
                {isEditable && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.data.map((d: any) => (
                <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{d.fullName}</td>
                  <td className="p-4 font-medium">
                    <span className="block font-semibold">
                      {d.licenseNumber} ({d.licenseCategory || 'Class A'})
                    </span>
                    <span className={`text-xs inline-flex items-center gap-1 font-semibold ${
                      isLicenseExpiringSoon(d.licenseExpiry) ? 'text-amber-500' : new Date(d.licenseExpiry) < new Date() ? 'text-rose-500' : 'text-zinc-450'
                    }`}>
                      {isLicenseExpiringSoon(d.licenseExpiry) && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      Expiry: {new Date(d.licenseExpiry).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-zinc-700 dark:text-zinc-305">{d.phone}</td>
                  <td className="p-4">
                    {d.safetyScore !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          <div className={`h-full ${getSafetyScoreColor(d.safetyScore)}`} style={{ width: `${d.safetyScore}%` }} />
                        </div>
                        <span className="font-bold text-xs">{d.safetyScore}%</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={d.status} />
                  </td>
                  {isEditable && (
                    <td className="p-4 text-right flex justify-end gap-3.5">
                      <button
                        onClick={() => handleEditClick(d)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(d.id)}
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
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No driver profiles registered</h3>
          <p className="text-sm text-zinc-500 max-w-sm">
            Register operators to coordinate trip dispatches, fuel inputs, and safety records.
          </p>
          {isEditable && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
            >
              Add Your First Driver
            </button>
          )}
        </div>
      )}

      {/* Add Driver Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Driver Profile">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-150"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +1 555-0199"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-150"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">License Number *</label>
              <input
                type="text"
                required
                value={formLicense}
                onChange={(e) => setFormLicense(e.target.value)}
                placeholder="e.g. DL-98234-X"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">License Category</label>
              <input
                type="text"
                value={formLicenseCategory}
                onChange={(e) => setFormLicenseCategory(e.target.value)}
                placeholder="e.g. Class A"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">License Expiry *</label>
              <input
                type="date"
                required
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Safety Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formSafetyScore}
                onChange={(e) => setFormSafetyScore(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">User Link ID (UUID optional)</label>
              <input
                type="text"
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
                placeholder="For login pairing"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={formEmergencyName}
                onChange={(e) => setFormEmergencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Emergency Contact Phone</label>
              <input
                type="text"
                value={formEmergencyPhone}
                onChange={(e) => setFormEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Address Details</label>
            <textarea
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm h-16 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 text-sm cursor-pointer"
          >
            {createMutation.isPending ? 'Saving...' : 'Add Driver'}
          </button>
        </form>
      </Modal>

      {/* Edit Driver Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Driver Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Driver Status</label>
              <select
                value={driverStatus}
                onChange={(e) => setDriverStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">License Number</label>
              <input
                type="text"
                required
                value={formLicense}
                onChange={(e) => setFormLicense(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">License Category</label>
              <input
                type="text"
                value={formLicenseCategory}
                onChange={(e) => setFormLicenseCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">License Expiry</label>
              <input
                type="date"
                required
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Safety Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formSafetyScore}
                onChange={(e) => setFormSafetyScore(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={formEmergencyName}
                onChange={(e) => setFormEmergencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Emergency Contact Phone</label>
              <input
                type="text"
                value={formEmergencyPhone}
                onChange={(e) => setFormEmergencyPhone(e.target.value)}
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
export default Drivers;
