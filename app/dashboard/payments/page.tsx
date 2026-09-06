'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import { formatDateDMY } from '@/lib/utils/dateFormatter';
import { useAuth } from '@/lib/context/AuthContext';
import {
  CreditCard,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  FileText,
  User,
  X,
  Loader2,
  Phone,
  ShieldAlert,
  Trash2,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Eye,
  Bell,
  Image as ImageIcon,
} from 'lucide-react';

export default function PaymentsAndDuesPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'BILLS' | 'PAYMENTS' | 'SUBMISSIONS'>('BILLS');
  const [billFilter, setBillFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'RESIDENTS'>('ALL');
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  
  const [duesData, setDuesData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  
  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [preselectedStudent, setPreselectedStudent] = useState<any>(null);
  const [isGenerateBillModalOpen, setIsGenerateBillModalOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // New Bill Form State
  const [selectedStudentForBill, setSelectedStudentForBill] = useState('');
  const [billStartDate, setBillStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [billEndDate, setBillEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [billDueDate, setBillDueDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [billRentAmount, setBillRentAmount] = useState<number>(9000);
  const [billDepositAmount, setBillDepositAmount] = useState<number>(0);
  const [billOtherCharges, setBillOtherCharges] = useState<number>(0);
  const [billDescription, setBillDescription] = useState('');

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const fetchData = async () => {
    try {
      const [duesRes, payRes, stuRes, subRes] = await Promise.all([
        fetch('/api/billing'),
        fetch('/api/payments'),
        fetch('/api/students?status=Active'),
        fetch('/api/payment-submissions'),
      ]);
      const duesJson = await duesRes.json();
      const payJson = await payRes.json();
      const stuJson = await stuRes.json();
      const subJson = await subRes.json();
      setDuesData(duesJson);
      setPayments(payJson.payments || []);
      setStudents(stuJson.students || []);
      setSubmissions(subJson.submissions || []);

      if (!selectedStudentForBill && stuJson.students && stuJson.students.length > 0) {
        setSelectedStudentForBill(stuJson.students[0].id);
        setBillRentAmount(stuJson.students[0].monthlyRent || 9000);
      }
    } catch (e) {
      console.error('Failed to load ledger data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApproveSubmission = async (submissionId: string) => {
    if (!confirm('Approve this student UPI payment? This will record the official receipt and clear the student dues immediately.')) {
      return;
    }
    setReviewingId(submissionId);
    try {
      const res = await fetch('/api/payment-submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action: 'APPROVE',
          actorName: currentUser?.fullName || 'Hostel Owner',
          actorRole: currentUser?.role || 'OWNER',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message || 'Payment approved and dues cleared!');
        fetchData();
      } else {
        alert(data.error || 'Failed to approve payment');
      }
    } catch (err: any) {
      alert(err.message || 'Error approving payment');
    } finally {
      setReviewingId(null);
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    const reason = prompt('Please enter the rejection reason (e.g. UTR not found in bank statement, incorrect amount):');
    if (reason === null) return;
    setReviewingId(submissionId);
    try {
      const res = await fetch('/api/payment-submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action: 'REJECT',
          rejectionReason: reason || 'Transaction could not be verified.',
          actorName: currentUser?.fullName || 'Hostel Owner',
          actorRole: currentUser?.role || 'OWNER',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Payment submission rejected.');
        fetchData();
      } else {
        alert(data.error || 'Failed to reject payment');
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting payment');
    } finally {
      setReviewingId(null);
    }
  };

  const generatedBills: any[] = duesData?.generatedBills || [];
  const duesList: any[] = duesData?.dues || []; // Only students with generated bills!
  const summary = duesData?.summary;

  // Filter generated bills
  const filteredBills = generatedBills.filter((bill: any) => {
    const matchesSearch =
      bill.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      bill.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      bill.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
      bill.roomNumber?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (billFilter === 'PENDING') return bill.balanceAmount > 0;
    if (billFilter === 'PAID') return bill.balanceAmount === 0;
    return true;
  });

  // Filter dues by student (residents with generated bills only)
  const filteredResidentDues = duesList.filter((d: any) =>
    d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    d.roomNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter payments
  const filteredPayments = payments.filter((p: any) =>
    p.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    p.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentMethod?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter UPI submissions
  const filteredSubmissions = (submissions || []).filter((s: any) => {
    const matchesSearch =
      s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.transactionRef?.toLowerCase().includes(search.toLowerCase()) ||
      s.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.upiApp?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (submissionFilter === 'PENDING') return s.status === 'PENDING';
    if (submissionFilter === 'APPROVED') return s.status === 'APPROVED';
    if (submissionFilter === 'REJECTED') return s.status === 'REJECTED';
    return true;
  });

  // Handle Generate Bill Submission
  const handleGenerateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateLoading(true);

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDbId: selectedStudentForBill,
          cycleStartDate: billStartDate,
          cycleEndDate: billEndDate,
          dueDate: billDueDate,
          rentAmount: billRentAmount,
          depositAmount: billDepositAmount,
          otherCharges: billOtherCharges,
          description: billDescription,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback(data.message || 'New bill generated successfully!');
        setIsGenerateBillModalOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to generate bill');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating bill');
    } finally {
      setGenerateLoading(false);
    }
  };

  // Handle Deleting an Unpaid Generated Bill
  const handleDeleteBill = async (billId: string, billNumber: string) => {
    if (!confirm(`Are you sure you want to delete bill ${billNumber}? This can only be done if no payments have been applied to this bill.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/billing?id=${billId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message || 'Bill deleted successfully.');
        fetchData();
      } else {
        alert(data.error || 'Failed to delete bill');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting bill');
    }
  };

  return (
    <DashboardLayout>
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Institutional Payments & Generated Bills Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Payments & Dues Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Official ledger showing strictly generated resident bills, cycle dues, and verified payment receipts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsGenerateBillModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Generate Bill
            </button>

            <button
              type="button"
              onClick={() => {
                setPreselectedStudent(null);
                setIsRecordModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Row */}
        {summary && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              {/* Card 1: Total Billed */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-semibold text-slate-500">Total Billed to Date</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                  ₹{summary.totalBilledHostel.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {summary.totalGeneratedBills} generated bills
                </span>
              </div>

              {/* Card 2: Total Paid */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-semibold text-emerald-700">Total Paid (Collected)</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 font-display">
                  ₹{summary.totalPaidHostel.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium block">
                  {summary.collectionEfficiency}% rate ({payments.length} receipts)
                </span>
              </div>

              {/* Card 3: Old Balance */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Old Balance</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Prior Cycles
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 font-display">
                  ₹{(summary.totalOldBalanceHostel || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-amber-700 font-medium block">
                  Arrears from earlier months
                </span>
              </div>

              {/* Card 4: New Balance */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800">New Balance</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Current Cycle
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-indigo-700 font-display">
                  ₹{(summary.totalNewBalanceHostel || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-indigo-700 font-medium block">
                  Latest active cycle dues
                </span>
              </div>

              {/* Card 5: Total Outstanding Due */}
              <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-rose-50/80 border-2 border-rose-300 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900">Total Exact Due</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                    Old + New
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-600 font-display">
                  ₹{summary.totalOutstandingHostel.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-rose-700 font-medium block">
                  {summary.pendingBillsCount} bill(s) pending payment
                </span>
              </div>
            </div>

            {/* Exact Balance Formula Banner */}
            <div className="px-4 py-2.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
              <div className="flex items-center gap-2 flex-wrap font-mono">
                <span className="text-slate-400 font-sans font-bold">Exact Dues Formula:</span>
                <span className="text-amber-400 font-bold">Old Balance (₹{(summary.totalOldBalanceHostel || 0).toLocaleString('en-IN')})</span>
                <span className="text-slate-500">+</span>
                <span className="text-indigo-400 font-bold">New Balance (₹{(summary.totalNewBalanceHostel || 0).toLocaleString('en-IN')})</span>
                <span className="text-slate-500">=</span>
                <span className="text-rose-400 font-black">Total Outstanding (₹{summary.totalOutstandingHostel.toLocaleString('en-IN')})</span>
              </div>
              <span className="text-[11px] text-slate-300 font-sans">
                Strictly calculated from actual generated bills
              </span>
            </div>
          </div>
        )}

        {/* Notice Badge */}
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Generated Bills Only:</strong> This ledger shows strictly generated monthly invoices and residents with active billing cycles. Residents with 0 generated bills are excluded from this ledger.
            </span>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
            {generatedBills.length} Active Bills
          </span>
        </div>

        {/* Pending UPI Verifications Banner */}
        {submissions.filter((s: any) => s.status === 'PENDING').length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-indigo-500/10 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  {submissions.filter((s: any) => s.status === 'PENDING').length} Student UPI Payment Receipt(s) Awaiting Your Verification
                </h4>
                <p className="text-[11px] text-amber-800">
                  Students have submitted UTR reference numbers via PhonePe / GPay. Review and approve to clear their dues immediately.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('SUBMISSIONS');
                setSubmissionFilter('PENDING');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>Review Submissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Tab Switcher & Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setActiveTab('BILLS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'BILLS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generated Bills ({generatedBills.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PAYMENTS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Payment Receipts ({payments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SUBMISSIONS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'SUBMISSIONS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI Submissions</span>
              {submissions.filter((s: any) => s.status === 'PENDING').length > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                  {submissions.filter((s: any) => s.status === 'PENDING').length} pending
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">({submissions.length})</span>
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Bill #, Resident, ID, or UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* ================= TAB 1: GENERATED BILLS ONLY ================= */}
        {activeTab === 'BILLS' && (
          <div className="space-y-4">
            {/* Sub-Filter Controls for Bills */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setBillFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    billFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Generated Bills ({generatedBills.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    billFilter === 'PENDING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  Pending / Unpaid ({generatedBills.filter(b => b.balanceAmount > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillFilter('PAID')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    billFilter === 'PAID'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Fully Settled ({generatedBills.filter(b => b.balanceAmount === 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setBillFilter('RESIDENTS')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    billFilter === 'RESIDENTS'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  By Resident Summary ({duesList.length})
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium shrink-0">
                {billFilter === 'RESIDENTS'
                  ? `Showing ${filteredResidentDues.length} resident(s) with bills`
                  : `Showing ${filteredBills.length} generated bill(s)`}
              </div>
            </div>

            {/* VIEW A: ITEM-BY-ITEM GENERATED BILLS LEDGER */}
            {billFilter !== 'RESIDENTS' && (
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Bill Number</th>
                        <th className="py-3 px-4">Resident</th>
                        <th className="py-3 px-4">Bill Amount</th>
                        <th className="py-3 px-4">Paid Amount</th>
                        <th className="py-3 px-4">Balance Due</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBills.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                              <FileText className="w-6 h-6" />
                            </div>
                            <p className="font-semibold text-slate-600 text-sm">No generated bills found</p>
                            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or click "Generate Bill" to issue an invoice.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredBills.map((bill: any) => {
                          const isPaid = bill.balanceAmount === 0;
                          const isOverdue = bill.status === 'Overdue';

                          return (
                            <tr key={bill.id} className="hover:bg-slate-50/80 transition">
                              {/* Bill Number */}
                              <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                                <div className="flex items-center gap-1.5">
                                  <span>{bill.billNumber}</span>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 inline-block mt-0.5">
                                  Month {bill.cycleNumber}
                                </span>
                              </td>

                              {/* Resident */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{bill.studentName}</div>
                                <div className="text-xs text-indigo-600 font-mono font-medium">
                                  {bill.studentId}
                                </div>
                                {bill.phone && (
                                  <a
                                    href={`tel:${bill.phone}`}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline mt-0.5"
                                    title={`Call ${bill.studentName} (${bill.phone})`}
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{bill.phone}</span>
                                  </a>
                                )}
                              </td>

                              {/* Bill Amount */}
                              <td className="py-3.5 px-4 font-bold text-slate-900 font-display">
                                ₹{bill.amount.toLocaleString('en-IN')}
                              </td>

                              {/* Paid Amount */}
                              <td className="py-3.5 px-4 font-semibold text-emerald-600">
                                ₹{bill.paidAmount.toLocaleString('en-IN')}
                              </td>

                              {/* Balance Due */}
                              <td className="py-3.5 px-4 font-bold">
                                <span className={bill.balanceAmount > 0 ? 'text-rose-600 font-display text-sm font-black' : 'text-slate-400 font-mono'}>
                                  ₹{bill.balanceAmount.toLocaleString('en-IN')}
                                </span>
                              </td>

                              {/* Due Date */}
                              <td className="py-3.5 px-4 text-slate-700 text-xs">
                                <div className="flex items-center gap-1 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{formatDateDMY(bill.dueDate)}</span>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                    isPaid
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isOverdue
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {isPaid ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : isOverdue ? (
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-amber-600" />
                                  )}
                                  <span>{isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending Due'}</span>
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {bill.balanceAmount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreselectedStudent({
                                          id: bill.studentDbId,
                                          monthlyRent: bill.amount,
                                          finances: {
                                            oldBalance: bill.studentOldBalance || 0,
                                            newBalance: bill.studentNewBalance || 0,
                                            totalOutstanding: bill.studentTotalOutstanding || bill.balanceAmount,
                                          },
                                        });
                                        setIsRecordModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Collect Payment</span>
                                    </button>
                                  )}
                                  <Link
                                    href={`/dashboard/invoices`}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1"
                                    title="View printable voucher"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Voucher</span>
                                  </Link>
                                  {bill.paidAmount === 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBill(bill.id, bill.billNumber)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition border border-rose-200"
                                      title="Delete unpaid bill"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW B: RESIDENT SUMMARY (ONLY STUDENTS WITH GENERATED BILLS) */}
            {billFilter === 'RESIDENTS' && (
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                  <span className="font-semibold">
                    Displaying active residents with system-generated bills only ({filteredResidentDues.length}). Residents with 0 generated bills have 0 dues and are not listed here.
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Resident</th>
                        <th className="py-3 px-4">Joining Cycle</th>
                        <th className="py-3 px-4">Generated Bills</th>
                        <th className="py-3 px-4">Total Billed</th>
                        <th className="py-3 px-4">Total Paid</th>
                        <th className="py-3 px-4">Old Balance</th>
                        <th className="py-3 px-4">New Balance</th>
                        <th className="py-3 px-4">Total Exact Due</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredResidentDues.map((stu: any) => (
                        <tr key={stu.studentId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{stu.fullName}</div>
                            <div className="text-xs text-indigo-600 font-mono font-semibold">
                              {stu.studentId}
                            </div>
                            {stu.phone && (
                              <a
                                href={`tel:${stu.phone}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline mt-0.5"
                                title={`Call resident ${stu.fullName} (${stu.phone})`}
                              >
                                <Phone className="w-3 h-3" />
                                <span>{stu.phone}</span>
                              </a>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{formatDateDMY(stu.joiningDate)}</div>
                            <div className="text-[10px] text-indigo-600">
                              Cycle begins day {new Date(stu.joiningDate).getDate()}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-indigo-700">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono">
                              {stu.cycles?.length || 0} bill(s)
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            ₹{stu.totalBilled.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-emerald-600">
                            ₹{stu.totalPaid.toLocaleString('en-IN')}
                          </td>

                          {/* Old Balance (Arrears from prior cycles) */}
                          <td className="py-3.5 px-4 font-bold">
                            <span className={(stu.oldBalance || 0) > 0 ? 'text-amber-700 font-display' : 'text-slate-400 font-mono'}>
                              ₹{(stu.oldBalance || 0).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* New Balance (Current month cycle) */}
                          <td className="py-3.5 px-4 font-bold">
                            <span className={(stu.newBalance || 0) > 0 ? 'text-indigo-700 font-display' : 'text-slate-400 font-mono'}>
                              ₹{(stu.newBalance || 0).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Total Exact Due (Old + New) */}
                          <td className="py-3.5 px-4 font-bold">
                            <div>
                              <span
                                className={
                                  stu.totalOutstanding > 0 ? 'text-rose-600 font-display text-sm font-black' : 'text-emerald-600'
                                }
                              >
                                ₹{stu.totalOutstanding.toLocaleString('en-IN')}
                              </span>
                              {stu.totalOutstanding > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ₹{stu.oldBalance || 0} + ₹{stu.newBalance || 0}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                stu.overallStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : stu.overallStatus === 'Overdue'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {stu.overallStatus}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {stu.phone && (
                                <a
                                  href={`tel:${stu.phone}`}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg transition"
                                  title={`Call resident: ${stu.phone}`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {stu.totalOutstanding > 0 ? (
                                <button
                                  onClick={() => {
                                    setPreselectedStudent({
                                      id: stu.studentDbId,
                                      monthlyRent: stu.monthlyRent,
                                      finances: {
                                        oldBalance: stu.oldBalance || 0,
                                        newBalance: stu.newBalance || 0,
                                        totalOutstanding: stu.totalOutstanding,
                                      },
                                    });
                                    setIsRecordModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs"
                                >
                                  Collect Payment
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-semibold px-2">Settled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PAYMENTS & RECEIPTS ================= */}
        {activeTab === 'PAYMENTS' && (
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Received By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {p.receiptNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.studentName}</div>
                        <div className="text-xs text-slate-400 font-mono">{p.studentId}</div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-emerald-600 font-display">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {p.paymentMethod}
                        </span>
                        {p.transactionRef && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.transactionRef}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">{formatDateDMY(p.paymentDate)}</td>

                      <td className="py-3.5 px-4 text-slate-600 text-xs">{p.receivedBy}</td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/invoices?receiptId=${p.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                        >
                          Print Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: STUDENT UPI SUBMISSIONS ================= */}
        {activeTab === 'SUBMISSIONS' && (
          <div className="space-y-4">
            {/* Sub-filter bar */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    submissionFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All ({submissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    submissionFilter === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <span>Pending Verification</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                    {submissions.filter((s: any) => s.status === 'PENDING').length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    submissionFilter === 'APPROVED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  Approved ({submissions.filter((s: any) => s.status === 'APPROVED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    submissionFilter === 'REJECTED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  Rejected ({submissions.filter((s: any) => s.status === 'REJECTED').length})
                </button>
              </div>

              <div className="text-slate-500 font-medium text-[11px] shrink-0">
                Showing {filteredSubmissions.length} of {submissions.length} submissions
              </div>
            </div>

            {/* Submissions List / Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {filteredSubmissions.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800 font-display">
                    No UPI Payment Submissions Found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {submissionFilter === 'PENDING'
                      ? 'Great job! There are no pending student UPI receipts waiting for approval.'
                      : 'When residents pay via PhonePe, GPay, or Paytm in their student portal and submit their UTR, their receipts will appear here for verification.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Resident / ID</th>
                        <th className="py-3 px-4">Amount Paid</th>
                        <th className="py-3 px-4">App & UTR Ref</th>
                        <th className="py-3 px-4">Receipt Screenshot</th>
                        <th className="py-3 px-4">Submitted Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map((sub: any) => {
                        const cleanStuPhone = (sub.studentPhone || '').replace(/\D/g, '').slice(-10);
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                            {/* Resident */}
                            <td className="py-3.5 px-4 font-medium text-slate-900">
                              <div className="font-bold text-slate-900">{sub.studentName}</div>
                              <div className="text-[10px] text-indigo-600 font-mono font-bold">
                                {sub.studentId}
                              </div>
                              <div className="text-[10px] text-slate-400">{sub.studentPhone}</div>
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 font-display text-sm">
                                ₹{sub.amount.toLocaleString('en-IN')}
                              </div>
                            </td>

                            {/* Mode & UTR */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-200">
                                {sub.upiApp || 'UPI'}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-800 font-bold">
                                <span>{sub.transactionRef}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUtr(sub.transactionRef)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                                  title="Copy UTR"
                                >
                                  {copiedUtr === sub.transactionRef ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Screenshot */}
                            <td className="py-3.5 px-4">
                              {sub.receiptImageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(sub.receiptImageUrl)}
                                  className="group flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-semibold text-slate-700 transition"
                                >
                                  <img
                                    src={sub.receiptImageUrl}
                                    alt="Receipt"
                                    className="w-7 h-7 object-cover rounded-lg"
                                  />
                                  <span>View Proof</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px]">No image</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                              {formatDateDMY(sub.paymentDate)}
                              <div className="text-[9px] text-slate-400">
                                {formatDateDMY(sub.createdAt)}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {sub.status === 'APPROVED' ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Verified ({sub.receiptNumber || 'Approved'})
                                </span>
                              ) : sub.status === 'REJECTED' ? (
                                <div>
                                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] inline-flex items-center gap-1">
                                    <X className="w-3 h-3 text-rose-600" />
                                    Rejected
                                  </span>
                                  {sub.rejectionReason && (
                                    <div className="text-[9px] text-rose-600 mt-0.5 truncate max-w-xs" title={sub.rejectionReason}>
                                      {sub.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Pending Verification
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {sub.status === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={reviewingId === sub.id}
                                      onClick={() => handleApproveSubmission(sub.id)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                                      title="Approve & Clear Dues"
                                    >
                                      {reviewingId === sub.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>Approve & Clear Dues</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={reviewingId === sub.id}
                                      onClick={() => handleRejectSubmission(sub.id)}
                                      className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition flex items-center gap-1"
                                      title="Reject Submission"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                )}

                                {cleanStuPhone && (
                                  <a
                                    href={`https://wa.me/91${cleanStuPhone}?text=${encodeURIComponent(
                                      `Hello ${sub.studentName}, regarding your UPI payment submission of ₹${sub.amount} (UTR: ${sub.transactionRef})...`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition"
                                    title="Message Student on WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: GENERATE NEW BILL ================= */}
      {isGenerateBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-display">
                    Generate New Resident Bill
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create and issue a bill to the active ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateBillModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBillSubmit} className="p-6 space-y-4 text-xs">
              {/* Select Resident */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Active Resident:
                </label>
                <select
                  required
                  value={selectedStudentForBill}
                  onChange={(e) => {
                    setSelectedStudentForBill(e.target.value);
                    const stu = students.find((s) => s.id === e.target.value);
                    if (stu) {
                      setBillRentAmount(stu.monthlyRent || 9000);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.fullName} ({stu.studentId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cycle Start Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={billStartDate}
                    onChange={(e) => setBillStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cycle End Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={billEndDate}
                    onChange={(e) => setBillEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Due Date:
                </label>
                <input
                  type="date"
                  required
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Financial amounts */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rent Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={billRentAmount}
                    onChange={(e) => setBillRentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deposit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={billDepositAmount}
                    onChange={(e) => setBillDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Other (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={billOtherCharges}
                    onChange={(e) => setBillOtherCharges(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bill Memo / Description:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular Monthly Hostel Rent & Maintenance"
                  value={billDescription}
                  onChange={(e) => setBillDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Resident Prior Dues & Projected Total Breakdown */}
              {(() => {
                const targetStudent = duesList.find((d: any) => d.studentDbId === selectedStudentForBill) || students.find((s: any) => s.id === selectedStudentForBill);
                const residentOldBalance = targetStudent?.finances?.totalOutstanding || targetStudent?.totalOutstanding || 0;
                const newBillTotal = Number(billRentAmount || 0) + Number(billDepositAmount || 0) + Number(billOtherCharges || 0);
                const projectedTotal = residentOldBalance + newBillTotal;

                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Resident Current Unpaid Dues:</span>
                      <span className={`font-bold ${residentOldBalance > 0 ? 'text-amber-700 font-mono' : 'text-slate-600'}`}>
                        ₹{residentOldBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">New Bill Being Issued:</span>
                      <span className="font-bold text-indigo-700 font-mono">
                        + ₹{newBillTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Total Due After Issuing Bill:</span>
                      <span className="font-black text-rose-600 text-sm font-display">
                        ₹{projectedTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsGenerateBillModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-2"
                >
                  {generateLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm & Generate Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={fetchData}
        preselectedStudent={preselectedStudent}
      />

      {/* Receipt Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl p-4 border border-slate-700 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-white text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Student Payment Receipt Screenshot</span>
              </h4>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/40 rounded-2xl p-2">
              <img
                src={previewImageUrl}
                alt="Receipt Proof"
                className="max-h-[65vh] w-auto rounded-xl object-contain shadow-md"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
