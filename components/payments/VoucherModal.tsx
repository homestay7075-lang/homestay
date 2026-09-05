'use client';

import React from 'react';
import { X, Printer, Bed, CheckCircle2, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { formatDateDMY } from '@/lib/utils/dateFormatter';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'INVOICE' | 'RECEIPT';
  data: any; // invoice/cycle or payment
  student: any;
  settings?: any;
}

export default function VoucherModal({
  isOpen,
  onClose,
  type,
  data,
  student,
  settings,
}: VoucherModalProps) {
  if (!isOpen || !data || !student) return null;

  const hostelName = settings?.name || 'Homestay Residency';
  const hostelAddress = settings?.address || 'Knowledge Corridor Road';
  const hostelCity = settings?.city || 'Pune, Maharashtra';
  const hostelPhone = settings?.phone || '+91 98765 43210';
  const hostelEmail = settings?.email || 'admin@homestay.com';

  const isInvoice = type === 'INVOICE';
  const docNumber = isInvoice
    ? data.billNumber || data.id || 'INV-001'
    : data.receiptNumber || 'REC-001';

  const docDate = isInvoice
    ? data.cycleStartDate || data.createdAt || new Date().toISOString().split('T')[0]
    : data.paymentDate || new Date().toISOString().split('T')[0];

  const amount = Number(data.amount || 0);
  const paidAmount = Number(data.paidAmount || (isInvoice ? 0 : amount));
  const balanceDue = Number(data.balanceAmount ?? (isInvoice ? amount - paidAmount : 0));
  const isPaid = isInvoice ? balanceDue === 0 : true;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="voucher-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:max-w-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isInvoice
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isInvoice ? 'Official Tax Invoice' : 'Verified Payment Receipt'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-600">{docNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="p-6 sm:p-10 space-y-6 text-xs bg-white printable-voucher">
          {/* Header: Hostel Information */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Bed className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
                  {hostelName}
                </h2>
              </div>
              <p className="text-slate-600 max-w-sm leading-relaxed text-[11px]">
                {hostelAddress}, {hostelCity}
              </p>
              <div className="text-[11px] text-slate-500 pt-0.5">
                <span>Tel: {hostelPhone}</span> • <span>Email: {hostelEmail}</span>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-block ${
                  isInvoice
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isInvoice ? 'Hostel Invoice' : 'Payment Receipt'}
              </span>
              <div className="font-mono text-base font-bold text-indigo-700">{docNumber}</div>
              <div className="text-[11px] text-slate-500">Date: {formatDateDMY(docDate)}</div>
              {isInvoice && data.dueDate && (
                <div className="text-[11px] font-bold text-rose-600">
                  Due Date: {formatDateDMY(data.dueDate)}
                </div>
              )}
            </div>
          </div>

          {/* Resident Details Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Billed Resident:
              </span>
              <div className="font-bold text-sm text-slate-900">{student.fullName}</div>
              <div className="font-mono font-semibold text-indigo-600 text-xs mt-0.5">
                Student ID: {student.studentId}
              </div>
              <div className="text-slate-600 mt-1">
                Room: <span className="font-semibold">{student.roomNumber}</span> • Bed:{' '}
                <span className="font-semibold">{student.bedNumber}</span> ({student.blockName})
              </div>
              <div className="text-slate-500 mt-0.5">Contact: {student.phone}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                {isInvoice ? 'Billing Parameters:' : 'Payment Settlement:'}
              </span>
              {isInvoice ? (
                <div className="space-y-1 text-slate-700">
                  <div>
                    Cycle: <strong className="text-slate-900">Month {data.cycleNumber || 1}</strong>
                  </div>
                  <div>
                    Monthly Rent: <strong className="text-slate-900">₹{student.monthlyRent}/mo</strong>
                  </div>
                  <div>
                    Due Anchor: <strong className="text-indigo-600">Day {new Date(student.joiningDate).getDate()} of month</strong>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-slate-700">
                  <div>
                    Method: <strong className="text-slate-900">{data.paymentMethod || 'UPI / Online'}</strong>
                  </div>
                  {data.transactionRef && (
                    <div className="font-mono text-[11px]">
                      UTR / Ref: <strong className="text-slate-900">{data.transactionRef}</strong>
                    </div>
                  )}
                  <div>
                    Authorized By: <strong className="text-slate-900">{data.receivedBy || 'Hostel Owner'}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {data.description ||
                      (isInvoice
                        ? `Hostel Accommodation & Services (Month ${data.cycleNumber || 1})`
                        : `Payment for Hostel Stay & Utilities`)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ₹{amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                <tr>
                  <td className="py-2 px-4 text-right text-slate-600">Total Billed:</td>
                  <td className="py-2 px-4 text-right text-slate-900 font-display">
                    ₹{amount.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-right text-emerald-700">Amount Paid:</td>
                  <td className="py-2 px-4 text-right text-emerald-700 font-display">
                    ₹{paidAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                {isInvoice && (
                  <tr>
                    <td className="py-2.5 px-4 text-right text-slate-900 text-sm">Balance Due:</td>
                    <td
                      className={`py-2.5 px-4 text-right text-sm font-black font-display ${
                        balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      ₹{balanceDue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Verification & Stamp */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                System generated voucher by <strong>{hostelName}</strong>. Valid proof of accommodation & settlement.
              </span>
            </div>

            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isPaid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PAID & SETTLED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>PAYMENT DUE</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
