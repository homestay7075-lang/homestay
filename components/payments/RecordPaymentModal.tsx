'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import {
  X,
  CreditCard,
  User,
  Calendar,
  CheckCircle2,
  Loader2,
  Sparkles,
  MessageCircle,
  LayoutDashboard,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Receipt,
  Building,
  ArrowRight,
} from 'lucide-react';
import { PaymentMethod } from '@/lib/db/types';
import { formatDateDMY, formatPeriodDMY } from '@/lib/utils/dateFormatter';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedStudent?: any;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedStudent,
}: RecordPaymentModalProps) {
  const router = useRouter();
  const { settings, hostelName } = useHostelSettings();

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentDbId, setSelectedStudentDbId] = useState(preselectedStudent?.id || '');
  const [amount, setAmount] = useState<number>(preselectedStudent?.finances?.totalOutstanding || 9000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [billingPeriod, setBillingPeriod] = useState('Current Due Cycle');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptResult, setReceiptResult] = useState<any>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/students?status=Active').then((res) => res.json()),
        fetch('/api/billing').then((res) => res.json()),
      ])
        .then(([stuData, billingData]) => {
          const activeList = stuData.students || [];
          const duesList = billingData.dues || [];

          // Merge exact billing dues onto students
          const merged = activeList.map((stu: any) => {
            const dueItem = duesList.find((d: any) => d.studentDbId === stu.id || d.studentId === stu.studentId);
            if (dueItem) {
              return {
                ...stu,
                finances: {
                  ...stu.finances,
                  oldBalance: dueItem.oldBalance || 0,
                  newBalance: dueItem.newBalance || 0,
                  totalOutstanding: dueItem.totalOutstanding || 0,
                  totalBilled: dueItem.totalBilled || 0,
                  totalPaid: dueItem.totalPaid || 0,
                  billsCount: dueItem.billsCount || 0,
                },
              };
            }
            return stu;
          });

          setStudents(merged);
          if (!selectedStudentDbId && merged.length > 0) {
            setSelectedStudentDbId(merged[0].id);
            setAmount(merged[0].finances?.totalOutstanding || merged[0].monthlyRent || 9000);
          } else if (selectedStudentDbId) {
            const found = merged.find((s: any) => s.id === selectedStudentDbId);
            if (found) {
              setAmount(found.finances?.totalOutstanding || found.monthlyRent || 9000);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen, selectedStudentDbId]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentDbId) || preselectedStudent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDbId: selectedStudentDbId,
          amount: Number(amount),
          paymentDate,
          paymentMethod,
          billingPeriod,
          transactionRef,
          notes,
          receivedBy: 'Hostel Owner',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReceiptResult(data.payment);
        onSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDone = () => {
    setReceiptResult(null);
    onClose();
  };

  const handleDoneGotoDashboard = () => {
    handleCloseDone();
    router.push('/dashboard');
  };

  // WhatsApp Messaging Helpers
  const residentPortalUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/app` : 'http://localhost:3000/app';

  const studentPhoneClean = currentStudent?.phone ? currentStudent.phone.replace(/\D/g, '') : '';
  const guardianPhoneClean = currentStudent?.guardianPhone ? currentStudent.guardianPhone.replace(/\D/g, '') : '';

  const studentWhatsAppText = receiptResult
    ? `🏢 *${hostelName} - Official Payment Receipt*
🧾 *Receipt Number:* ${receiptResult.receiptNumber}
📅 *Payment Date:* ${formatDateDMY(receiptResult.paymentDate)}

👤 *Resident Details:*
• Name: *${currentStudent?.fullName || receiptResult.studentName}* (${currentStudent?.studentId || ''})
• Bed Allocation: ${currentStudent?.bedNumber || 'N/A'}
• Wing / Block: ${currentStudent?.blockName || 'Campus Residence'}

💰 *Payment Particulars:*
• Amount Paid: *₹${receiptResult.amount?.toLocaleString('en-IN')}*
• Payment Mode: ${receiptResult.paymentMethod}
• Billing Period: ${formatPeriodDMY(receiptResult.billingPeriod)}
${receiptResult.transactionRef ? `• Ref / UTR: ${receiptResult.transactionRef}\n` : ''}• Received By: ${receiptResult.receivedBy || 'Hostel Administration'}

✅ *Status:* PAID & RECONCILED

📱 *View & Download PDF Voucher:*
Access your resident mobile portal anytime to view or print your official stamped receipt:
👉 ${residentPortalUrl}
*Login Phone:* ${currentStudent?.phone || ''}

Hostel Administration Contact: ${settings.phone || '9876543210'}
${hostelName}`
    : '';

  const guardianWhatsAppText = receiptResult
    ? `🏢 *${hostelName} - Payment Acknowledgment*

Dear Parent / Guardian,
Payment of *₹${receiptResult.amount?.toLocaleString('en-IN')}* for resident *${currentStudent?.fullName || receiptResult.studentName}* has been successfully received and reconciled.

🧾 *Receipt:* ${receiptResult.receiptNumber}
📅 *Date:* ${formatDateDMY(receiptResult.paymentDate)}
💳 *Mode:* ${receiptResult.paymentMethod}
🛏️ *Bed:* ${currentStudent?.bedNumber || 'N/A'}

Hostel Administration Contact: ${settings.phone || '9876543210'}
${hostelName}`
    : '';

  const handleSendWhatsApp = (phoneDigits: string, text: string) => {
    const normalized = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
    const url = `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyReceipt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {receiptResult ? 'Payment Completed' : 'Record Student Payment'}
              </h3>
              <p className="text-xs text-slate-500">
                {receiptResult
                  ? 'Official receipt issued & reconciled'
                  : 'Auto-reconciliation & official receipt issuance'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseDone}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post-Payment Completion View */}
        {receiptResult ? (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Success Summary Hero */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                Payment Reconciled & Cleared
              </span>
              <h4 className="text-xl font-bold text-slate-900 font-display">
                ₹{receiptResult.amount.toLocaleString('en-IN')} Received
              </h4>
              <p className="text-xs text-slate-500">
                Official voucher <span className="font-mono font-bold text-indigo-600">{receiptResult.receiptNumber}</span> generated for {currentStudent?.fullName || receiptResult.studentName}
              </p>
            </div>

            {/* Receipt Particulars Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Receipt Number:</span>
                <span className="font-mono font-bold text-indigo-700">{receiptResult.receiptNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Resident Student:</span>
                <span className="font-semibold text-slate-900">
                  {currentStudent?.fullName} ({currentStudent?.studentId})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Bed:</span>
                <span className="font-semibold text-slate-800">
                  {currentStudent?.bedNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {receiptResult.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Payment Date:</span>
                <span className="font-semibold text-slate-800">{formatDateDMY(receiptResult.paymentDate)}</span>
              </div>
              {receiptResult.transactionRef && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Ref / UTR:</span>
                  <span className="font-mono text-slate-700">{receiptResult.transactionRef}</span>
                </div>
              )}
            </div>

            {/* WhatsApp Share Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-teal-50 border border-emerald-200 space-y-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Send Receipt on WhatsApp
                  </h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    Instantly share this verified payment voucher with the resident student or parent on WhatsApp.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {/* Send to Student WhatsApp */}
                {studentPhoneClean ? (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(studentPhoneClean, studentWhatsAppText)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Send Receipt to Student WhatsApp ({currentStudent?.phone})</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const inputPhone = prompt('Enter 10-digit student WhatsApp number:');
                      if (inputPhone) handleSendWhatsApp(inputPhone.replace(/\D/g, ''), studentWhatsAppText);
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Send Receipt to WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                )}

                {/* Send to Guardian WhatsApp if available */}
                {guardianPhoneClean && (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(guardianPhoneClean, guardianWhatsAppText)}
                    className="w-full py-2 px-3.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send to Guardian WhatsApp ({currentStudent?.guardianPhone})</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                )}

                {/* Copy Receipt Text Button */}
                <button
                  type="button"
                  onClick={() => handleCopyReceipt(studentWhatsAppText)}
                  className="w-full py-1.5 px-3 rounded-xl bg-white/80 border border-slate-200 hover:bg-white text-slate-700 text-[11px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Receipt Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Receipt Details Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Actions: Done & Go to Dashboard vs Stay on Page */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseDone}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Stay on Payments
              </button>

              <button
                type="button"
                onClick={handleDoneGotoDashboard}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Done & Go to Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          /* Payment Submission Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Resident Student <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedStudentDbId}
                onChange={(e) => {
                  setSelectedStudentDbId(e.target.value);
                  const stu = students.find((s) => s.id === e.target.value);
                  if (stu) {
                    setAmount(stu.finances?.totalOutstanding || stu.monthlyRent);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.fullName} ({stu.studentId} • Bed {stu.bedNumber}) — Due: ₹{stu.finances?.totalOutstanding || 0}
                  </option>
                ))}
              </select>
            </div>

            {currentStudent && (
              <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-2xl text-xs space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                    Exact Ledger Dues Breakdown
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Bed {currentStudent.bedNumber}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* 1. Old Balance (Previous Cycles) */}
                  <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/80">
                    <span className="text-amber-800 font-semibold block text-[10px] uppercase tracking-wide">
                      Old Balance
                    </span>
                    <span
                      className={`text-sm font-extrabold font-display ${
                        (currentStudent.finances?.oldBalance || 0) > 0 ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    >
                      ₹{(currentStudent.finances?.oldBalance || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-amber-600/90 block">Past Unpaid Cycles</span>
                  </div>

                  {/* 2. New Balance (Current Cycle) */}
                  <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-200/80">
                    <span className="text-indigo-800 font-semibold block text-[10px] uppercase tracking-wide">
                      New Balance
                    </span>
                    <span
                      className={`text-sm font-extrabold font-display ${
                        (currentStudent.finances?.newBalance || 0) > 0 ? 'text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      ₹{(currentStudent.finances?.newBalance || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-indigo-600/90 block">Current Cycle Bill</span>
                  </div>

                  {/* 3. Exact Total Due */}
                  <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200/80">
                    <span className="text-rose-800 font-bold block text-[10px] uppercase tracking-wide">
                      Total Exact Due
                    </span>
                    <span
                      className={`text-sm font-black font-display ${
                        (currentStudent.finances?.totalOutstanding || 0) > 0
                          ? 'text-rose-700'
                          : 'text-emerald-600'
                      }`}
                    >
                      ₹{(currentStudent.finances?.totalOutstanding || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-rose-600/90 block font-medium">Old + New Balance</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod === 'UPI' ? 'UPI/Online' : paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI/Online">UPI/Online</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/12839218 or Cash"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
                />
              </div>
            </div>

            {/* Live Payment Allocation & Dues Settlement Calculator */}
            {currentStudent?.finances && amount > 0 && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs space-y-2 animate-in fade-in duration-200">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Live Settlement Allocation:
                  </span>
                  <span className="font-mono text-emerald-700 font-extrabold text-sm">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
                  <div className="flex justify-between">
                    <span>1. Applied to Old Balance (Arrears):</span>
                    <span className="font-bold font-mono text-amber-800">
                      ₹{Math.min(amount, currentStudent.finances.oldBalance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>2. Applied to New Balance (Current Cycle):</span>
                    <span className="font-bold font-mono text-indigo-800">
                      ₹{Math.min(
                        Math.max(0, amount - (currentStudent.finances.oldBalance || 0)),
                        currentStudent.finances.newBalance || 0
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {amount > (currentStudent.finances.totalOutstanding || 0) && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>3. Advance Credit Carry Forward:</span>
                      <span className="font-bold font-mono">
                        ₹{(amount - (currentStudent.finances.totalOutstanding || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-800">Remaining Due Balance after this payment:</span>
                  <span
                    className={`font-mono text-sm font-black ${
                      Math.max(0, (currentStudent.finances.totalOutstanding || 0) - amount) > 0
                        ? 'text-rose-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    ₹{Math.max(0, (currentStudent.finances.totalOutstanding || 0) - amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Remarks / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Cleared Month 2 rent"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseDone}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording & Generating Receipt...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Record & Issue Official Receipt
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
