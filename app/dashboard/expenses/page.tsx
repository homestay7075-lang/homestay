'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  DollarSign,
  Plus,
  Search,
  PieChart,
  Calendar,
  CreditCard,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  Building,
  Info,
  Layers,
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod } from '@/lib/db/types';
import { formatDateDMY } from '@/lib/utils/dateFormatter';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [buildingFilter, setBuildingFilter] = useState('All');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('Grocery');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('Cash');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Check if current category is building-related (auto-prompts & requires building)
  const isBuildingRelated =
    newCategory === 'Building Rent' ||
    newCategory === 'Electricity' ||
    newCategory === 'Internet' ||
    newCategory === 'Maintenance' ||
    newCategory === 'Others' ||
    newCategory === 'Other';

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotalExpense(data.totalExpense || 0);
      setByCategory(data.byCategory || {});
      if (data.buildings && data.buildings.length > 0) {
        setBuildings(data.buildings);
      } else {
        // Fallback fetch buildings from rooms API
        const roomsRes = await fetch('/api/rooms');
        const roomsData = await roomsRes.json();
        setBuildings(roomsData.buildings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // When category switches to Building Rent, Electricity, Internet, Maintenance, or Others, auto-select first building. Clear on other categories.
  useEffect(() => {
    if (isBuildingRelated) {
      if (!selectedBuildingId && buildings.length > 0) {
        setSelectedBuildingId(buildings[0].id);
      }
    } else {
      if (selectedBuildingId) {
        setSelectedBuildingId('');
      }
    }
  }, [newCategory, isBuildingRelated, buildings, selectedBuildingId]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBuildingRelated && !selectedBuildingId) {
      alert(`Please select the building for ${newCategory}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          amount: Number(newAmount),
          expenseDate: newDate,
          description: newDescription,
          paymentMethod: newPaymentMethod,
          buildingId: selectedBuildingId || undefined,
          addedBy: 'Hostel Owner',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewAmount('');
        setNewDescription('');
        setSelectedBuildingId('');
        fetchExpenses();
      } else {
        alert(data.error || 'Failed to add expense');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.buildingName && e.buildingName.toLowerCase().includes(search.toLowerCase())) ||
      e.addedBy.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All'
        ? true
        : e.category === categoryFilter ||
          (categoryFilter === 'Salaries' && e.category === 'Staff Salary') ||
          (categoryFilter === 'Mineral Water' && e.category === 'Water') ||
          (categoryFilter === 'Others' && (e.category === 'Gas' || e.category === 'Other'));
    const matchesBuilding = buildingFilter === 'All' ? true : e.buildingId === buildingFilter;
    return matchesSearch && matchesCategory && matchesBuilding;
  });

  const getCategoryBadge = (category: string) => {
    const map: Record<string, { symbol: string; bg: string; text: string; border: string; label?: string }> = {
      'Grocery': { symbol: '🛒', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
      'Market': { symbol: '🥬', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
      'Rice': { symbol: '🍚', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
      'Mineral Water': { symbol: '💧', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
      'Salaries': { symbol: '👥', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
      'Building Rent': { symbol: '🏢', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
      'Electricity': { symbol: '⚡', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300' },
      'Internet': { symbol: '🌐', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
      'Maintenance': { symbol: '🔧', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
      'Others': { symbol: '📦', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
      'Staff Salary': { symbol: '👥', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', label: 'Salaries' },
      'Water': { symbol: '💧', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', label: 'Mineral Water' },
      'Gas': { symbol: '📦', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', label: 'Others' },
      'Other': { symbol: '📦', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', label: 'Others' },
    };

    const c = map[category] || { symbol: '📦', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
    const label = c.label || category;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
        <span className="text-xs">{c.symbol}</span>
        <span>{label}</span>
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Operational Outflows & Campus Allocations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Hostel Expense Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Categorized expenditures covering building lease/rent, maintenance repairs, fiber internet, mess groceries, and salaries.
            </p>
          </div>

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              if (isBuildingRelated && buildings.length > 0 && !selectedBuildingId) {
                setSelectedBuildingId(buildings[0].id);
              }
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense Voucher
          </button>
        </div>

        {/* Category Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-slate-400">Total Outlay</span>
            <div className="text-2xl font-black text-rose-400 font-display">
              ₹{totalExpense.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">{expenses.length} entries recorded</div>
          </div>

          {[
            { name: 'Building Rent', symbol: '🏢', highlight: true },
            { name: 'Electricity', symbol: '⚡', highlight: true },
            { name: 'Internet', symbol: '🌐', highlight: true },
            { name: 'Maintenance', symbol: '🔧', highlight: true },
            { name: 'Others', symbol: '📦', highlight: true },
            { name: 'Grocery', symbol: '🛒', highlight: false },
            { name: 'Salaries', symbol: '👥', highlight: false },
          ].map((cat) => (
            <div
              key={cat.name}
              className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                cat.highlight
                  ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">{cat.symbol}</span>
                  <span>{cat.name}</span>
                </span>
                {cat.highlight && <Building className="w-3 h-3 text-indigo-500" />}
              </div>
              <div className="text-lg font-bold text-slate-900 font-display">
                ₹{(
                  byCategory[cat.name] ||
                  (cat.name === 'Salaries' ? byCategory['Staff Salary'] : 0) ||
                  (cat.name === 'Others' ? (byCategory['Other'] || 0) + (byCategory['Gas'] || 0) : 0) ||
                  0
                ).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400">
                {cat.highlight ? 'Building allocated' : 'Operational'}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search expenses by vendor, description, building, or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white outline-none w-full sm:w-auto"
            >
              <option value="All">All Categories</option>
              <option value="Grocery">🛒 Grocery</option>
              <option value="Market">🥬 Market</option>
              <option value="Rice">🍚 Rice</option>
              <option value="Mineral Water">💧 Mineral Water</option>
              <option value="Salaries">👥 Salaries</option>
              <option value="Building Rent">🏢 Building Rent</option>
              <option value="Electricity">⚡ Electricity</option>
              <option value="Internet">🌐 Internet</option>
              <option value="Maintenance">🔧 Maintenance</option>
              <option value="Others">📦 Others</option>
            </select>

            {/* Building Filter */}
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white outline-none w-full sm:w-auto"
            >
              <option value="All">All Buildings</option>
              {buildings.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.genderType || 'Co-Living'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Building / Property</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Added By</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">{formatDateDMY(exp.expenseDate)}</td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getCategoryBadge(exp.category)}
                    </td>

                    {/* Building / Property Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {exp.buildingName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                          <Building className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{exp.buildingName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Campus-Wide</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-sm">
                      {exp.description}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-xs">
                        {exp.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">{exp.addedBy}</td>

                    <td className="py-3.5 px-4 text-right font-black text-rose-600 font-display whitespace-nowrap">
                      -₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= ADD EXPENSE MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Add Operating Expense</h3>
                <p className="text-[11px] text-slate-500">Record payments for supplies, rent, maintenance, and utilities.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expense Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="Grocery">🛒 Grocery</option>
                    <option value="Market">🥬 Market</option>
                    <option value="Rice">🍚 Rice</option>
                    <option value="Mineral Water">💧 Mineral Water</option>
                    <option value="Salaries">👥 Salaries</option>
                    <option value="Building Rent">🏢 Building Rent</option>
                    <option value="Electricity">⚡ Electricity</option>
                    <option value="Internet">🌐 Internet</option>
                    <option value="Maintenance">🔧 Maintenance</option>
                    <option value="Others">📦 Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 45000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-rose-600"
                  />
                </div>
              </div>

              {/* ================= AUTOMATIC BUILDING SELECTION OPTION ================= */}
              {/* Show ONLY when selecting Building Rent, Electricity, Internet, Maintenance, or Others */}
              {isBuildingRelated && (
                <div className="p-3.5 rounded-2xl border bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <span>Select Building / Property</span>
                      <span className="text-rose-500">*</span>
                    </label>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Auto-Prompted for {newCategory}
                    </span>
                  </div>

                  <select
                    value={selectedBuildingId}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                  >
                    <option value="">-- Select Affected Building * --</option>
                    {buildings.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.genderType || 'Co-Living'})
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-indigo-700 mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong>{newCategory}</strong> is linked to hostel building property. Expense is automatically charged to this building.
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newPaymentMethod === 'UPI' ? 'UPI/Online' : newPaymentMethod}
                    onChange={(e: any) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI/Online">UPI/Online</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Itemized Breakdown <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    isBuildingRelated
                      ? `e.g. Monthly payment for ${newCategory.toLowerCase()} covering all floors & rooms`
                      : 'e.g. Fresh vegetables, dairy & cooking oil for hostel mess dining'
                  }
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
