import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';
import {
  User,
  Shield,
  Search,
  Filter,
  UserPlus,
  Trash2,
  Lock,
  UserCheck,
  UserX,
  History,
  Loader2,
  X,
} from 'lucide-react';

export function Users() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [newPassword, setNewPassword] = useState('');

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter],
    queryFn: () =>
      api.get(`/users?search=${search}&role=${roleFilter}`),
  });

  // Fetch Audit History
  const { data: historyData } = useQuery({
    queryKey: ['users-audit-history'],
    queryFn: () => api.get('/users/audit-history'),
    enabled: showHistoryModal,
  });

  const users = data?.success ? data.users : [];
  const logs = historyData?.success ? historyData.logs : [];

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (payload: any) => api.post('/users', payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('User created successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setShowCreateModal(false);
        resetCreateForm();
      } else {
        toast.error(res.error || 'Failed to create user');
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: any) => api.patch(`/users/${id}`, payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('User status updated');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        toast.error(res.error || 'Update failed');
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('User deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        toast.error(res.error || 'Failed to delete user');
      }
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, payload }: any) =>
      api.post(`/users/${id}/reset-password`, payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('User password reset successfully');
        setShowResetModal(false);
        setNewPassword('');
      } else {
        toast.error(res.error || 'Password reset failed');
      }
    },
  });

  const resetCreateForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('DRIVER');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !role) return;
    createUserMutation.mutate({ fullName, email, password, role });
  };

  const handleToggleActive = (user: any) => {
    updateUserMutation.mutate({
      id: user.id,
      payload: { fullName: user.fullName, role: user.role, isActive: !user.isActive },
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    resetPasswordMutation.mutate({
      id: selectedUser.id,
      payload: { newPassword },
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      case 'FLEET_MANAGER':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400';
      case 'DRIVER':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400';
      case 'SAFETY_OFFICER':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
      case 'FINANCIAL_ANALYST':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
      default:
        return 'bg-zinc-50 text-zinc-700';
    }
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header controls */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-705 dark:text-zinc-50">User Registry</h1>
          <p className="text-sm text-zinc-450 dark:text-zinc-455 mt-0.5">
            Provision users, edit role scopes, suspend credentials, and track login audits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="h-10 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer hover:shadow-xs"
          >
            <History className="w-3.5 h-3.5" /> Audit Trails
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Filters board */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all duration-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 pr-8 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="FLEET_MANAGER">Fleet Manager</option>
            <option value="DRIVER">Driver</option>
            <option value="SAFETY_OFFICER">Safety Officer</option>
            <option value="FINANCIAL_ANALYST">Financial Analyst</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-24 text-xs font-semibold text-zinc-450 dark:text-zinc-500">
            No matching users registered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#111827]/40 text-zinc-555 font-bold border-b border-zinc-200 dark:border-zinc-800 sticky top-0 uppercase tracking-wider">
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Role System</th>
                  <th className="p-4">Credentials Status</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-semibold text-zinc-650 dark:text-zinc-300">
                {users.map((u: any) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                  >
                    <td className="p-4 text-zinc-705 dark:text-zinc-100 font-extrabold text-sm">{u.fullName}</td>
                    <td className="p-4 font-medium">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${getRoleBadge(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-450 dark:text-zinc-550 font-mono">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            u.isActive
                              ? 'border-amber-250 hover:bg-amber-50 text-amber-600'
                              : 'border-emerald-250 hover:bg-emerald-50 text-emerald-600'
                          }`}
                          title={u.isActive ? 'Suspend User' : 'Activate User'}
                        >
                          {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowResetModal(true);
                          }}
                          className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg cursor-pointer transition-colors"
                          title="Reset User Password"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete user profile permanently?')) {
                              deleteUserMutation.mutate(u.id);
                            }
                          }}
                          className="p-1.5 border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-950/40">
              <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-50 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0F766E]" /> Provision New User
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-455 uppercase mb-1.5 tracking-wider">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">
                  Role Assignment *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden cursor-pointer"
                >
                  <option value="DRIVER">Driver</option>
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="w-full h-11 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {createUserMutation.isPending ? 'Provisioning...' : 'Provision User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-950/40">
              <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-50">Reset Credentials</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-zinc-500">
                You are updating password parameters for <strong className="text-zinc-800 dark:text-zinc-200">{selectedUser?.fullName}</strong>.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-zinc-505 dark:text-zinc-450 uppercase mb-1.5 tracking-wider">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-[#F8FAFC] dark:bg-zinc-950 text-xs font-medium focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-hidden transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full h-11 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/10 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {resetPasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Audit Trails */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-950/40">
              <h3 className="text-sm font-bold text-zinc-705 dark:text-zinc-50 flex items-center gap-2">
                <History className="w-4 h-4 text-[#0F766E]" /> System Audit Trails
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-semibold">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="pb-2">User / Email</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Module</th>
                    <th className="pb-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 font-semibold text-zinc-650 dark:text-zinc-300">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="py-3 text-zinc-705 dark:text-zinc-100 font-bold">
                        {log.user?.fullName || 'System / Anonymous'}
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-medium mt-0.5">{log.user?.email || 'N/A'}</p>
                      </td>
                      <td className="py-3 text-zinc-500 dark:text-zinc-400">{log.action}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 rounded-md">
                          {log.module}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-450 dark:text-zinc-550 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
