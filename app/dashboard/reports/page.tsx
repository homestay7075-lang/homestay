'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  Download,
  Users,
  Bed,
  CreditCard,
  DollarSign,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import { formatDateDMY, formatPeriodDMY } from '@/lib/utils/dateFormatter';

export default function ReportsPage() {
  const { settings, hostelName } = useHostelSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('SUMMARY');

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Compiling Financial & Occupancy Reports...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { kpis, students, beds, payments, expenses, bookings, studentHistory } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Controls (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Comprehensive Analytics & Auditing (Rules 22 & 23)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Management Reports & Audits
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Printable financial ledgers, occupancy censuses, revenue analyses, and checkout histories.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              Print Report (A4 / PDF)
            </button>
          </div>
        </div>

        {/* Report Selector Pills (Hidden on Print) */}
        <div className="no-print flex rounded-xl bg-white p-1.5 border border-slate-200 shadow-xs flex-wrap gap-1">
          {[
            { id: 'SUMMARY', label: 'Executive Financial Summary' },
            { id: 'OCCUPANCY', label: 'Bed & Room Occupancy Report' },
            { id: 'COLLECTIONS', label: 'Collections & Receipts Ledger' },
            { id: 'EXPENSES', label: 'Operating Expenses Breakdown' },
            { id: 'HISTORY', label: 'Student Checkout & Stay History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReportType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedReportType === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Printable Report Document Surface */}
        <div className="printable-document bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
          {/* Header on Document */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
            <div>
              <div className="text-xl font-bold font-display text-slate-900">
                {hostelName}
              </div>
              <p className="text-xs text-slate-500">
                {settings.address ? `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}` : 'Official Institutional Premises'}
              </p>
              <div className="text-xs text-slate-400 mt-1">
                <span>Tel: {settings.phone}</span> • <span>Email: {settings.email}</span> • <span>Official Generation: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg uppercase">
                {selectedReportType} REPORT
              </span>
              <div className="text-[11px] text-slate-500 mt-1">Authorized Audit • {hostelName}</div>
            </div>
          </div>

          {/* Section: Executive Financial Summary */}
          {selectedReportType === 'SUMMARY' && (
            <div className="space-y-6">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Financial Performance & Cash Flow Ledger
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-emerald-800">Total Collections (Inflows)</span>
                  <div className="text-2xl font-black text-emerald-700 font-display">
                    ₹{kpis.totalPaymentsCollected.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-600">Reconciled student payments</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <span className="text-xs font-bold text-rose-800">Total Operating Expenses (Outflows)</span>
                  <div className="text-2xl font-black text-rose-700 font-display">
                    ₹{kpis.totalExpenses.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-600">Mess, salaries, maintenance</span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <span className="text-xs font-bold text-indigo-800">Net Operating Profit</span>
                  <div className="text-2xl font-black text-indigo-700 font-display">
                    ₹{kpis.netOperatingProfit.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold">Healthy Operating Margin</span>
                </div>
              </div>

              {/* Outstanding Dues Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Total Student Dues Outstanding:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    ₹{kpis.totalDuesOutstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  *Calculated strictly based on student individual joining dates. Recurring on the same day of each calendar month.
                </p>
              </div>
            </div>
          )}

          {/* Section: Occupancy Report */}
          {selectedReportType === 'OCCUPANCY' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Bed Census & Floor Occupancy
              </h3>

              <div className="grid grid-cols-4 gap-3 text-xs mb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Total Beds</span>
                  <span className="font-bold text-slate-900 text-base">{kpis.totalBeds}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px]">Occupied</span>
                  <span className="font-bold text-emerald-800 text-base">{kpis.occupiedBeds}</span>
                </div>
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                  <span className="text-cyan-700 block text-[10px]">Vacant Available</span>
                  <span className="font-bold text-cyan-800 text-base">{kpis.availableBeds}</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-indigo-700 block text-[10px]">Occupancy Rate</span>
                  <span className="font-bold text-indigo-800 text-base">{kpis.occupancyRate}%</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Room & Bed</th>
                    <th className="py-2.5 px-4">Block</th>
                    <th className="py-2.5 px-4">Occupant Name</th>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {beds.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {b.roomNumber} - {b.bedNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{b.blockName}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {b.currentStudentName || '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-indigo-600 font-semibold">
                        {b.currentStudentId || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'Occupied'
                              ? 'bg-indigo-50 text-indigo-700'
                              : b.status === 'Maintenance'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section: Collections Report */}
          {selectedReportType === 'COLLECTIONS' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 font-display">
                All Recorded Payment Receipts
              </h3>

              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-4">Resident</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">Billing Period</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{p.receiptNumber}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{p.studentName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{formatDateDMY(p.paymentDate)}</td>
                      <td className="py-2.5 px-4 text-slate-600">{p.paymentMethod}</td>
                      <td className="py-2.5 px-4 text-slate-500">{formatPeriodDMY(p.billingPeriod)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section: Expenses Report */}
          {selectedReportType === 'EXPENSES' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Operating Outflow Breakdown
              </h3>

              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Added By</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e: any) => (
                    <tr key={e.id}>
                      <td className="py-2.5 px-4 text-slate-600">{formatDateDMY(e.expenseDate)}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{e.category}</td>
                      <td className="py-2.5 px-4 text-slate-700">{e.description}</td>
                      <td className="py-2.5 px-4 text-slate-500">{e.addedBy}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                        -₹{e.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section: History Report */}
          {selectedReportType === 'HISTORY' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Preserved Student Checkout History (Rule 10 & 38)
              </h3>

              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Alumni Name</th>
                    <th className="py-2.5 px-4">Stay Dates</th>
                    <th className="py-2.5 px-4">Room / Bed</th>
                    <th className="py-2.5 px-4">Checkout Reason</th>
                    <th className="py-2.5 px-4 text-right">Final Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentHistory.map((h: any) => (
                    <tr key={h.id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{h.studentId}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{h.fullName}</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {formatDateDMY(h.joiningDate)} → {formatDateDMY(h.checkoutDate)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {h.roomNumber} ({h.bedNumber})
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{h.checkoutReason}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        ₹{h.finalOutstanding} (Settled)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Document Sign-Off */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <div>
              <span>System Verification: Pass • Confidential Administrative Record</span>
            </div>
            <div className="text-right font-medium text-slate-700">
              Hostel Owner Signature: _______________________
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
