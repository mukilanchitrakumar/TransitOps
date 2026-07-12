import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Users, Plus, Search, AlertTriangle, Download, Edit3, Archive, Filter, X } from 'lucide-react';
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
    if (score >= 80) return 'bg-[#0F766E]';
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
    <div className="space-y-6 page-transition">
      {/* Header Panel */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">Drivers</h1>
          <p className="text-sm text-zinc-450 dark:text-zinc-450 mt-0.5">
            Configure operators, contact lists, and safety scorecard levels
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
              <Plus className="w-4 h-4" /> Add Driver Profile
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
              placeholder="Search by name, license number..."
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
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* List Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : data?.data?.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#111827]/40 text-zinc-555 font-bold border-b border-zinc-200 dark:border-zinc-800 sticky top-0 uppercase tracking-wider">
                  <th className="p-4">Driver Name</th>
                  <th className="p-4">License Info</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Safety Score</th>
                  <th className="p-4">Status</th>
                  {isEditable && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-semibold text-zinc-650 dark:text-zinc-300">
                {data.data.map((d: any) => (
                  <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="p-4 text-zinc-705 dark:text-zinc-100 font-extrabold text-sm">{d.fullName}</td>
                    <td className="p-4">
                      <div className="text-zinc-700 dark:text-zinc-200 font-bold">{d.licenseNumber} ({d.licenseCategory || 'Class A'})</div>
                      <span className={`text-[10px] inline-flex items-center gap-1 font-semibold mt-0.5 ${
                        isLicenseExpiringSoon(d.licenseExpiry) ? 'text-amber-500' : new Date(d.licenseExpiry) < new Date() ? 'text-rose-500' : 'text-zinc-450'
                      }`}>
                        {isLicenseExpiringSoon(d.licenseExpiry) && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        Expiry: {new Date(d.licenseExpiry).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{d.phone}</td>
                    <td className="p-4">
                      {d.safetyScore !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            <div className={`h-full ${getSafetyScoreColor(d.safetyScore)}`} style={{ width: `${d.safetyScore}%` }} />
                          </div>
                          <span className="font-extrabold text-[11px]">{d.safetyScore}%</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={d.status} />
                    </td>
                    {isEditable && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleEditClick(d)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                            title="Edit Driver"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(d.id)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                            title="Archive Driver"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
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
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-755 dark:text-zinc-200">No driver profiles registered</h3>
          <p className="text-sm text-zinc-450 dark:text-zinc-450 max-w-sm font-medium">
            Register operators to coordinate trip dispatches, fuel inputs, and safety records.
          </p>
          {isEditable && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Add Your First Driver
            </button>
          )}
        </div>
      )}

      {/* Add Driver Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register Driver Profile">
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Full Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Phone *</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +1 555-0199"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">License Number *</label>
              <input
                type="text"
                required
                value={formLicense}
                onChange={(e) => setFormLicense(e.target.value)}
                placeholder="e.g. DL-98234-X"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">License Category</label>
              <input
                type="text"
                value={formLicenseCategory}
                onChange={(e) => setFormLicenseCategory(e.target.value)}
                placeholder="e.g. Class A"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">License Expiry *</label>
              <input
                type="date"
                required
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Safety Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formSafetyScore}
                onChange={(e) => setFormSafetyScore(parseInt(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">User Link ID</label>
              <input
                type="text"
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
                placeholder="Optional paired user ID"
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Emergency Contact Name</label>
              <input
                type="text"
                value={formEmergencyName}
                onChange={(e) => setFormEmergencyName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Emergency Contact Phone</label>
              <input
                type="text"
                value={formEmergencyPhone}
                onChange={(e) => setFormEmergencyPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Address Details</label>
            <textarea
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden resize-none h-16"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-11 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {createMutation.isPending ? 'Saving...' : 'Add Driver'}
          </button>
        </form>
      </Modal>

      {/* Edit Driver Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Driver Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Driver Status</label>
              <select
                value={driverStatus}
                onChange={(e) => setDriverStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
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
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">License Number</label>
              <input
                type="text"
                required
                value={formLicense}
                onChange={(e) => setFormLicense(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">License Category</label>
              <input
                type="text"
                value={formLicenseCategory}
                onChange={(e) => setFormLicenseCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">License Expiry</label>
              <input
                type="date"
                required
                value={formExpiry}
                onChange={(e) => setFormExpiry(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Phone</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Safety Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formSafetyScore}
                onChange={(e) => setFormSafetyScore(parseInt(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Emergency Contact Name</label>
              <input
                type="text"
                value={formEmergencyName}
                onChange={(e) => setFormEmergencyName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">Emergency Contact Phone</label>
              <input
                type="text"
                value={formEmergencyPhone}
                onChange={(e) => setFormEmergencyPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full h-11 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default Drivers;
