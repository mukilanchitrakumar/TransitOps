import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Fuel, Landmark, Plus, Search, Calendar, Check, X, ClipboardList } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';

export function Logbook() {
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');

  // Modals state
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Form states (Fuel)
  const [fuelVehicle, setFuelVehicle] = useState('');
  const [fuelDriver, setFuelDriver] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState<number | ''>('');
  const [fuelQuantity, setFuelQuantity] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [fuelReceipt, setFuelReceipt] = useState('');
  const [fuelPriceUnit, setFuelPriceUnit] = useState('');
  const [fuelNotes, setFuelNotes] = useState('');

  // Form states (Expense)
  const [expTrip, setExpTrip] = useState('');
  const [expVehicle, setExpVehicle] = useState('');
  const [expCategory, setExpCategory] = useState('TOLL');
  const [expAmount, setExpAmount] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expReceiptUrl, setExpReceiptUrl] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const isManager = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']);

  // Fetch lists
  const { data: fuelData, isLoading: isFuelLoading } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: () => api.get('/fuel-logs?limit=50'),
  });

  const { data: expenseData, isLoading: isExpenseLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/expenses?limit=50'),
  });

  // Fetch helper lists for dropdown selectors
  const { data: vehicles } = useQuery({
    queryKey: ['logbook-vehicles'],
    queryFn: () => api.get('/vehicles?limit=100'),
    enabled: isFuelOpen || isExpenseOpen,
  });

  const { data: drivers } = useQuery({
    queryKey: ['logbook-drivers'],
    queryFn: () => api.get('/drivers?limit=100'),
    enabled: isFuelOpen,
  });

  const { data: trips } = useQuery({
    queryKey: ['logbook-trips'],
    queryFn: () => api.get('/trips?limit=100'),
    enabled: isExpenseOpen,
  });

  // Mutate log fuel
  const logFuelMutation = useMutation({
    mutationFn: (payload: any) => api.post('/fuel-logs', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Fuel entry recorded successfully');
      setIsFuelOpen(false);
      resetFuelForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to log fuel');
    },
  });

  // Mutate create expense
  const logExpenseMutation = useMutation({
    mutationFn: (payload: any) => api.post('/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Expense claim submitted');
      setIsExpenseOpen(false);
      resetExpenseForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit expense');
    },
  });

  // Mutate approve expense
  const approveExpenseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/expenses/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Expense claim approved');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Approval failed');
    },
  });

  // Mutate reject expense
  const rejectExpenseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/expenses/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Expense claim rejected');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rejection failed');
    },
  });

  const resetFuelForm = () => {
    setFuelVehicle('');
    setFuelDriver('');
    setFuelOdometer('');
    setFuelQuantity('');
    setFuelCost('');
    setFuelStation('');
    setFuelReceipt('');
    setFuelPriceUnit('');
    setFuelNotes('');
  };

  const resetExpenseForm = () => {
    setExpTrip('');
    setExpVehicle('');
    setExpCategory('TOLL');
    setExpAmount('');
    setExpDescription('');
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpReceiptUrl('');
    setExpNotes('');
  };

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fuelOdometer === '') return;
    logFuelMutation.mutate({
      vehicleId: fuelVehicle,
      driverId: fuelDriver,
      odometerReading: fuelOdometer,
      fuelQuantity: parseFloat(fuelQuantity),
      cost: parseFloat(fuelCost),
      fuelStation: fuelStation || undefined,
      pricePerUnit: fuelPriceUnit ? parseFloat(fuelPriceUnit) : undefined,
      receiptNumber: fuelReceipt || undefined,
      notes: fuelNotes || undefined,
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logExpenseMutation.mutate({
      tripId: expTrip || undefined,
      vehicleId: expVehicle || undefined,
      amount: parseFloat(expAmount),
      category: expCategory,
      description: expDescription,
      date: new Date(expDate).toISOString(),
      attachmentUrl: expReceiptUrl || undefined,
      notes: expNotes || undefined,
    });
  };

  const exportCSV = () => {
    const isFuel = activeTab === 'fuel';
    if (isFuel) {
      if (!fuelData?.data || fuelData.data.length === 0) return;
      const headers = ['Vehicle', 'Driver', 'Odometer Reading', 'Fuel Quantity (L)', 'Cost ($)', 'Efficiency (km/L)'];
      const rows = fuelData.data.map((f: any) => [
        f.vehicle.plateNumber,
        f.driver.fullName,
        f.odometerReading,
        f.fuelQuantity,
        f.cost,
        f.efficiency ? parseFloat(f.efficiency).toFixed(2) : 'N/A',
      ]);
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `fuel_logs_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (!expenseData?.data || expenseData.data.length === 0) return;
      const headers = ['Category', 'Description', 'Amount ($)', 'Date', 'Status', 'Logged By'];
      const rows = expenseData.data.map((x: any) => [
        x.category,
        x.description,
        x.amount,
        new Date(x.date).toLocaleDateString(),
        x.status,
        x.creator.fullName,
      ]);
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `expenses_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logbook Ledger</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Submit fuel inputs and operational expense claims.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Export CSV
          </button>
          {activeTab === 'fuel' ? (
            <button
              onClick={() => setIsFuelOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              <Plus className="w-4 h-4" /> Log Fuel Fill
            </button>
          ) : (
            <button
              onClick={() => setIsExpenseOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              <Plus className="w-4 h-4" /> Claim Expense
            </button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('fuel')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'fuel'
              ? 'border-indigo-650 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Fuel className="w-4 h-4" /> Fuel Logs
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'expenses'
              ? 'border-indigo-650 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
          }`}
        >
          <Landmark className="w-4 h-4" /> Expense Claims
        </button>
      </div>

      {/* Fuel logs worksheet */}
      {activeTab === 'fuel' && (
        <div className="space-y-6">
          {isFuelLoading ? (
            <TableSkeleton />
          ) : fuelData?.data?.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-150 dark:border-zinc-800">
                    <th className="p-4">Vehicle Plate</th>
                    <th className="p-4">Driver</th>
                    <th className="p-4">Odometer</th>
                    <th className="p-4">Fuel Qty (L)</th>
                    <th className="p-4">Cost ($)</th>
                    <th className="p-4">Fuel Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {fuelData.data.map((f: any) => (
                    <tr key={f.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">{f.vehicle.plateNumber}</td>
                      <td className="p-4 font-medium">{f.driver.fullName}</td>
                      <td className="p-4 font-semibold">{f.odometerReading.toLocaleString()} km</td>
                      <td className="p-4 font-semibold">{f.fuelQuantity} L</td>
                      <td className="p-4 font-bold">${parseFloat(f.cost).toFixed(2)}</td>
                      <td className="p-4">
                        {f.efficiency !== null ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {parseFloat(f.efficiency).toFixed(2)} km/L
                          </span>
                        ) : (
                          <span className="text-zinc-400">Calculated on next fill</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center">
                <Fuel className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No fuel entries logged</h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                Drivers can submit fill-up details to calculate operational consumption metrics.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Expense ledger worksheet */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main ledger list */}
          <div className="lg:col-span-2 space-y-6">
            {isExpenseLoading ? (
              <TableSkeleton />
            ) : expenseData?.data?.length > 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-150 dark:border-zinc-800">
                      <th className="p-4">Category</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {expenseData.data.map((x: any) => (
                      <tr key={x.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="p-4 font-bold text-xs uppercase text-zinc-500">{x.category}</td>
                        <td className="p-4 font-medium">
                          {x.description}
                          {x.creator && <span className="block text-xs text-zinc-400">By: {x.creator.fullName}</span>}
                        </td>
                        <td className="p-4 font-bold">${parseFloat(x.amount).toFixed(2)}</td>
                        <td className="p-4 font-medium text-zinc-500">{new Date(x.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <StatusBadge status={x.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center">
                  <Landmark className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No expense claims logged</h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Log operational tolls, lodging, or repairs.
                </p>
              </div>
            )}
          </div>

          {/* Approvals queue list (Only Manager/Admin visibility) */}
          {isManager && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
              <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-3">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200">Approvals Work Queue</h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {expenseData?.data?.filter((x: any) => x.status === 'PENDING').length > 0 ? (
                  expenseData.data
                    .filter((x: any) => x.status === 'PENDING')
                    .map((x: any) => (
                      <div key={x.id} className="py-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-500 uppercase">{x.category}</span>
                          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-150">${parseFloat(x.amount).toFixed(2)}</span>
                        </div>
                        <p className="text-zinc-650 dark:text-zinc-400 font-medium">{x.description}</p>
                        <p className="text-zinc-400">Claimant: {x.creator?.fullName}</p>
                        
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => rejectExpenseMutation.mutate(x.id)}
                            className="px-2.5 py-1 text-[10px] rounded-lg border border-rose-200 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer flex items-center gap-0.5"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                          <button
                            onClick={() => approveExpenseMutation.mutate(x.id)}
                            className="px-2.5 py-1 text-[10px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer flex items-center gap-0.5"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6 font-medium">
                    ✓ Approvals work queue is empty
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Fuel Modal */}
      <Modal isOpen={isFuelOpen} onClose={() => setIsFuelOpen(false)} title="Log Fuel Fill-Up">
        <form onSubmit={handleFuelSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select Vehicle *</label>
              <select
                required
                value={fuelVehicle}
                onChange={(e) => setFuelVehicle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles?.data?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} - {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select Driver *</label>
              <select
                required
                value={fuelDriver}
                onChange={(e) => setFuelDriver(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              >
                <option value="">-- Choose Driver --</option>
                {drivers?.data?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Odometer (km) *</label>
              <input
                type="number"
                required
                value={fuelOdometer}
                onChange={(e) => setFuelOdometer(parseInt(e.target.value) || '')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Quantity (L) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={fuelQuantity}
                onChange={(e) => setFuelQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Total Cost ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Fuel Station</label>
              <input
                type="text"
                value={fuelStation}
                onChange={(e) => setFuelStation(e.target.value)}
                placeholder="e.g. Shell"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Receipt Number</label>
              <input
                type="text"
                value={fuelReceipt}
                onChange={(e) => setFuelReceipt(e.target.value)}
                placeholder="e.g. RCP-109238"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={logFuelMutation.isPending}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 text-sm cursor-pointer"
          >
            {logFuelMutation.isPending ? 'Saving...' : 'Log Fuel Fill-Up'}
          </button>
        </form>
      </Modal>

      {/* Claim Expense Modal */}
      <Modal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} title="Submit Expense Claim">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category *</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              >
                <option value="FUEL">Fuel</option>
                <option value="TOLL">Tolls</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="MEALS">Meals</option>
                <option value="LODGING">Lodging</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Link to Trip (Optional)</label>
              <select
                value={expTrip}
                onChange={(e) => setExpTrip(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              >
                <option value="">-- General Expense --</option>
                {trips?.data?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber} ({t.startLocation} → {t.endLocation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Link to Vehicle (Optional)</label>
              <select
                value={expVehicle}
                onChange={(e) => setExpVehicle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
              >
                <option value="">-- No Specific Vehicle --</option>
                {vehicles?.data?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} - {v.make}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Receipt Image Attachment URL</label>
              <input
                type="text"
                value={expReceiptUrl}
                onChange={(e) => setExpReceiptUrl(e.target.value)}
                placeholder="https://imgur.com/receipt.jpg"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Expense Description *</label>
            <input
              type="text"
              required
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              placeholder="e.g. Highway toll payment"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={logExpenseMutation.isPending}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 text-sm cursor-pointer"
          >
            {logExpenseMutation.isPending ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
export default Logbook;
