'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Printer, Download, Receipt, ArrowLeft, Shield, Bed, CheckCircle2, Sparkles } from 'lucide-react';
import { HostelSettings, Payment, Student } from '@/lib/db/types';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import { formatDateDMY } from '@/lib/utils/dateFormatter';

function InvoicesContent() {
  const searchParams = useSearchParams();
  const receiptIdParam = searchParams.get('receiptId');
  const { settings } = useHostelSettings();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/payments').then(r => r.json()),
      fetch('/api/students').then(r => r.json()),
    ])
      .then(([payData, stuData]) => {
        const payList = payData.payments || [];
        setPayments(payList);
        setStudents(stuData.students || []);

        if (receiptIdParam) {
          const match = payList.find((p: any) => p.id === receiptIdParam);
          if (match) setSelectedReceipt(match);
        } else if (payList.length > 0) {
          setSelectedReceipt(payList[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [receiptIdParam]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !settings) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Loading Official Invoices & Receipts...</p>
        </div>
      </DashboardLayout>
    );
  }

  const studentDetail = selectedReceipt
    ? students.find(s => s.id === selectedReceipt.studentDbId || s.studentId === selectedReceipt.studentId)
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Official Documentation (Rules 15 & 23)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Invoices & Payment Receipts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Tax-compliant, printable resident receipts with hostel branding and transaction proofs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              Print Receipt (A4 / PDF)
            </button>
          </div>
        </div>

        {/* 2-Column Interface: Receipt Selector on Left, Printable Voucher on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Receipt List (Hidden on Print) */}
          <div className="no-print lg:col-span-4 space-y-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 font-display mb-3">
                Issued Receipts ({payments.length})
              </h3>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {payments.map((p) => {
                  const isSelected = selectedReceipt?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedReceipt(p)}
                      className={`w-full p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {p.receiptNumber}
                        </span>
                        <span className="font-bold text-xs text-slate-900 font-display">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800">{p.studentName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateDMY(p.paymentDate)} • {p.paymentMethod}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Printable High-Fidelity Receipt Document */}
          <div className="lg:col-span-8">
            {selectedReceipt ? (
              <div className="printable-document bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-md relative overflow-hidden">
                {/* Top Watermark Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/60 rounded-bl-[80px] pointer-events-none -z-0"></div>

                <div className="relative z-10 space-y-8">
                  {/* Header: Hostel Information (Rule 6: Dynamically populated from Settings) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                          <Bed className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xl font-display text-slate-900 tracking-tight">
                          {settings.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                        {settings.address}, {settings.city}, {settings.state} - {settings.pincode}
                      </p>
                      <div className="text-xs text-slate-500 pt-1">
                        <span>Tel: {settings.phone}</span> • <span>Email: {settings.email}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-1">
                      <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-block">
                        Payment Receipt
                      </span>
                      <div className="font-mono text-base font-bold text-indigo-700">
                        {selectedReceipt.receiptNumber}
                      </div>
                      <div className="text-xs text-slate-500">Date: {formatDateDMY(selectedReceipt.paymentDate)}</div>
                    </div>
                  </div>

                  {/* Resident / Billed To Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Resident Information:
                      </span>
                      <div className="font-bold text-sm text-slate-900">{selectedReceipt.studentName}</div>
                      <div className="font-mono font-semibold text-indigo-600 mt-0.5">
                        Student ID: {selectedReceipt.studentId}
                      </div>
                      {studentDetail && (
                        <div className="text-slate-600 mt-1">
                          Room: <span className="font-semibold">{studentDetail.roomNumber}</span> • Bed:{' '}
                          <span className="font-semibold">{studentDetail.bedNumber}</span> ({studentDetail.blockName})
                        </div>
                      )}
                      {studentDetail && (
                        <div className="text-slate-500 mt-0.5">
                          Phone: {studentDetail.phone}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Transaction & Settlement Details:
                      </span>
                      <div className="text-slate-700">
                        Payment Method: <span className="font-bold text-slate-900">{selectedReceipt.paymentMethod}</span>
                      </div>
                      {selectedReceipt.transactionRef && (
                        <div className="text-slate-700 font-mono text-[11px] mt-0.5">
                          UTR / Ref: <span className="text-slate-900">{selectedReceipt.transactionRef}</span>
                        </div>
                      )}
                      <div className="text-slate-700 mt-0.5">
                        Billing Period: <span className="font-semibold text-slate-900">{selectedReceipt.billingPeriod}</span>
                      </div>
                      <div className="text-slate-700 mt-0.5">
                        Authorized Cashier: <span className="font-semibold">{selectedReceipt.receivedBy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-hidden border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4">Period / Cycle</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            Hostel Accommodation, Utilities & Meal Services
                            {selectedReceipt.notes && (
                              <div className="text-[11px] text-slate-500 italic mt-0.5">
                                Remarks: {selectedReceipt.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{selectedReceipt.billingPeriod}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                        <tr>
                          <td colSpan={2} className="py-3 px-4 text-right text-slate-700">
                            Total Amount Paid:
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-700 text-sm font-black font-display">
                            ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Seal & Signatures */}
                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
                    <div className="space-y-1 text-slate-500 text-[11px]">
                      <p className="flex items-center gap-1 font-semibold text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Official System-Generated Voucher • {settings.name}
                      </p>
                      <p>Subject to realization of digital / bank payments. Valid without physical stamp.</p>
                      <p className="text-indigo-600 font-semibold pt-0.5">Thank you for staying at {settings.name}!</p>
                    </div>

                    <div className="text-center sm:text-right space-y-3">
                      <div className="font-signature text-xl text-slate-700 italic font-semibold">
                        Rajesh Kumar Singhania
                      </div>
                      <div className="border-t border-slate-300 pt-1 text-[11px] text-slate-600 font-medium">
                        Hostel Owner / Authorized Signatory
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                Select a receipt to view and print.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function InvoicesAndReceiptsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Loading Invoices...</p>
          </div>
        </DashboardLayout>
      }
    >
      <InvoicesContent />
    </Suspense>
  );
}
