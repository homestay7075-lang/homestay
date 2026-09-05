'use client';

import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle2, Loader2, Bed } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  student: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentCheckoutModal({
  isOpen,
  student,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Course completed / relocated');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !student) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECKOUT',
          checkoutDate,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to complete checkout');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Student Checkout Workflow</h3>
              <p className="text-xs text-slate-500">Permanent preservation of records (Rule 38)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCheckout} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <img
              src={student.photoUrl}
              alt={student.fullName}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <div className="font-bold text-slate-900 text-sm">{student.fullName}</div>
              <div className="text-xs text-indigo-600 font-mono font-semibold">{student.studentId}</div>
              <div className="text-xs text-slate-500">
                Allocated: Room {student.roomNumber} ({student.bedNumber}) • Joined: {student.joiningDate}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Checkout Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={checkoutDate}
              onChange={(e) => setCheckoutDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Checkout Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Relocating, College completed, etc."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Room Inspection / Clearance Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Keys returned, fixtures intact, security deposit status..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              Automatic Operations Upon Confirmation:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 pl-1">
              <li>Bed {student.bedNumber} in {student.roomNumber} is immediately released to Available.</li>
              <li>Future billing is stopped as of {checkoutDate}.</li>
              <li>Complete payment, invoice, and stay history is permanently preserved.</li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Releasing Bed...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Checkout
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
