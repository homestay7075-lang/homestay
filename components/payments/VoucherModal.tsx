'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Bed,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Download,
  Share2,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

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

  const voucherSummaryText = `🏢 *${hostelName} - ${isInvoice ? 'Official Invoice' : 'Verified Payment Receipt'}*
🧾 *Doc #:* ${docNumber}
📅 *Date:* ${formatDateDMY(docDate)}

👤 *Resident:* ${student.fullName} (${student.studentId})
🛏️ *Bed:* ${student.bedNumber || 'N/A'} (${student.blockName || 'Campus'})

💰 *Financial Details:*
• Amount: *₹${amount.toLocaleString('en-IN')}*
• Paid: *₹${paidAmount.toLocaleString('en-IN')}*
${isInvoice ? `• Balance Due: *₹${balanceDue.toLocaleString('en-IN')}*` : `• Payment Mode: ${data.paymentMethod || 'UPI / Online'}`}
${data.transactionRef ? `• UTR / Ref: ${data.transactionRef}\n` : ''}✅ *Status:* ${isPaid ? 'PAID & SETTLED' : 'PAYMENT DUE'}

Hostel Administration: ${hostelPhone}
${hostelName}`;

  const handlePrint = () => {
    // 1. If running inside Android WebView native APK shell
    if (typeof window !== 'undefined' && (window as any).AndroidApp?.printPage) {
      try {
        (window as any).AndroidApp.printPage();
        return;
      } catch (e) {
        console.warn('Native AndroidApp.printPage call error:', e);
      }
    }

    // 2. Cross-browser printing using isolated printable iframe
    try {
      const voucherEl = document.querySelector('.printable-voucher');
      if (voucherEl) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${isInvoice ? 'Invoice' : 'Receipt'}_${docNumber}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
                  body { padding: 24px; color: #0f172a; background: #fff; font-size: 13px; line-height: 1.5; }
                  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                  th, td { padding: 10px 14px; text-align: left; }
                  th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
                  td { border-bottom: 1px solid #f1f5f9; }
                  .text-right { text-align: right; }
                  .font-bold { font-weight: 700; }
                  .font-mono { font-family: monospace; }
                  @media print {
                    body { padding: 0; }
                    @page { margin: 10mm; size: auto; }
                  }
                </style>
              </head>
              <body>
                ${voucherEl.innerHTML}
              </body>
            </html>
          `);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch (e) {}
            }, 1000);
          }, 300);
          return;
        }
      }
    } catch (e) {
      console.warn('Iframe print fallback to window.print():', e);
    }

    // 3. Fallback
    window.print();
  };

  const handleShareWhatsApp = () => {
    const studentPhoneClean = student.phone ? student.phone.replace(/\D/g, '') : '';
    const normalized = studentPhoneClean.length === 10 ? `91${studentPhoneClean}` : studentPhoneClean;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(voucherSummaryText)}${normalized ? `&phone=${normalized}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(voucherSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="voucher-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:max-w-none print:shadow-none print:border-none print:rounded-none flex flex-col max-h-[92vh]">
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Share Receipt on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Print Receipt or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="p-6 sm:p-8 space-y-5 text-xs bg-white printable-voucher overflow-y-auto flex-1">
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

          {/* Resident Details Box (No Room) */}
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
                Bed: <span className="font-semibold">{student.bedNumber}</span> ({student.blockName || 'Residence Block'})
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
                        : `Payment for Hostel Stay & Services`)}
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
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                System verified voucher by <strong>{hostelName}</strong>. Valid digital proof of settlement.
              </span>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Mobile Bottom Quick Action Bar */}
          <div className="no-print pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-300" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
