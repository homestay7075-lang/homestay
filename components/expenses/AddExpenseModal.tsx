'use client';

import React, { useState, useEffect } from 'react';
import { X, Wallet, Loader2, CheckCircle2, Calendar, CreditCard, Building, Sparkles, Info } from 'lucide-react';
import { ExpenseCategory, PaymentMethod } from '@/lib/db/types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>('Grocery');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Building related check (auto-prompts & requires building)
  const isBuildingRelated =
    category === 'Building Rent' ||
    category === 'Electricity' ||
    category === 'Internet' ||
    category === 'Maintenance' ||
    category === 'Others' ||
    category === 'Other';

  useEffect(() => {
    if (isOpen) {
      fetch('/api/expenses')
        .then((res) => res.json())
        .then((data) => {
          if (data.buildings && data.buildings.length > 0) {
            setBuildings(data.buildings);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

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
  }, [category, isBuildingRelated, buildings, selectedBuildingId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBuildingRelated && !selectedBuildingId) {
      setErrorMsg(`Please select a building for ${category}.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          expenseDate,
          description,
          paymentMethod,
          buildingId: selectedBuildingId || undefined,
          addedBy: 'Hostel Owner',
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to record expense');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">Record Operating Expense</h3>
              <p className="text-xs text-slate-500">Quick Outflow Voucher</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white font-medium text-sm"
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
              <label className="block font-semibold text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 3500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-sm text-slate-900"
              />
            </div>
          </div>

          {/* Building Selection Option - Show ONLY for Building Rent, Electricity, Internet, Maintenance, and Others */}
          {isBuildingRelated && (
            <div className="p-3 rounded-2xl border bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Select Building / Property</span>
                  <span className="text-rose-500">*</span>
                </label>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Auto-Prompted for {category}
                </span>
              </div>

              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white font-semibold"
              >
                <option value="">-- Select Affected Building * --</option>
                {buildings.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.genderType || 'Co-Living'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod === 'UPI' ? 'UPI/Online' : paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white font-medium text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="UPI/Online">UPI/Online</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">
              Description / Vendor Details <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Specific breakdown or notes (optional, leave empty if none)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Record Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
