'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  Smartphone,
  CreditCard,
  Receipt,
  Bell,
  MessageSquare,
  User,
  Bed,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Send,
  Printer,
  Shield,
  QrCode,
  Sparkles,
  LogOut,
  ChevronRight,
  X,
  Loader2,
  FileText,
  Trash2,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Info,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import VoucherModal from '@/components/payments/VoucherModal';
import { formatDateDMY } from '@/lib/utils/dateFormatter';
import InstallPwaButton from '@/components/common/InstallPwaButton';

export default function StudentMobileApp() {
  const router = useRouter();
  const { currentUser, logout, switchRoleQuick, isLoading } = useAuth();
  const { hostelName, settings } = useHostelSettings();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/login');
    }
  }, [isLoading, currentUser, router]);

  const hostelInitials = hostelName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase() || 'H';

  const [activeTab, setActiveTab] = useState<'HOME' | 'DUES' | 'RECEIPTS' | 'NOTICES' | 'CHAT'>('HOME');
  const [docFilter, setDocFilter] = useState<'INVOICES' | 'RECEIPTS'>('INVOICES');
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [voucherModalState, setVoucherModalState] = useState<{
    isOpen: boolean;
    type: 'INVOICE' | 'RECEIPT';
    data: any;
  }>({
    isOpen: false,
    type: 'INVOICE',
    data: null,
  });

  // Owner Contact & UPI Configuration
  const cleanOwnerPhone = (settings?.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';
  const ownerUpiId = settings?.upiId || `${cleanOwnerPhone}@upi`;

  // Real UPI & Receipt submission state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [selectedUpiApp, setSelectedUpiApp] = useState('PhonePe');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Quick UPI simulation
  const [upiPaying, setUpiPaying] = useState(false);
  const [upiSuccess, setUpiSuccess] = useState(false);

  // Student phone: use logged in student phone or default to Devika Nair (9123456783)
  const studentPhone = currentUser?.role === 'STUDENT' ? currentUser.phone : '9123456783';

  const fetchStudentInfo = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      const allStudents = data.students || [];
      const current = allStudents.find((s: any) => s.phone === studentPhone) || allStudents[3] || allStudents[0];
      setStudentData(current);

      if (current) {
        if (current.finances?.totalOutstanding) {
          setPaidAmount(current.finances.totalOutstanding);
        } else if (current.monthlyRent) {
          setPaidAmount(current.monthlyRent);
        }

        // Fetch notifications relevant to student
        const notifRes = await fetch(`/api/notifications?audience=STUDENT&blockId=${current.blockId}&studentId=${current.studentId}`);
        const notifData = await notifRes.json();
        setNotices(notifData.notifications || []);

        // Fetch messages
        const msgRes = await fetch(`/api/messages?studentDbId=${current.id}&role=STUDENT`);
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);

        // Fetch payment submissions
        const subRes = await fetch(`/api/payment-submissions?studentDbId=${current.id}`);
        const subData = await subRes.json();
        if (subData.success) {
          setSubmissions(subData.submissions || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentInfo();
  }, [studentPhone]);

  // Construct UPI URL to launch any UPI app
  const getUpiPaymentUrl = () => {
    if (!studentData) return '';
    const amount = Number(paidAmount) || studentData.finances?.totalOutstanding || studentData.monthlyRent || 0;
    const note = `Rent Dues - ${studentData.fullName} (${studentData.studentId})`;
    return `upi://pay?pa=${encodeURIComponent(ownerUpiId)}&pn=${encodeURIComponent(hostelName || 'Hostel Management')}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  // Launch native UPI intent
  const handleLaunchUpi = () => {
    const url = getUpiPaymentUrl();
    if (!url) return;
    window.location.href = url;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(ownerUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(cleanOwnerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleReceiptImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Receipt image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate direct WhatsApp link to send receipt to owner
  const getWhatsAppReceiptUrl = (sub?: any) => {
    const amt = sub ? sub.amount : (paidAmount || studentData?.finances?.totalOutstanding || 9000);
    const utr = sub ? sub.transactionRef : (utrNumber.trim() || 'PENDING_UTR');
    const app = sub ? sub.upiApp : selectedUpiApp;
    const date = sub ? sub.paymentDate : paymentDate;

    const message = `*HOSTEL RENT PAYMENT RECEIPT*
--------------------------------
*Hostel:* ${hostelName}
*Student:* ${studentData?.fullName} (${studentData?.studentId})
*Room / Bed:* Room ${studentData?.roomNumber || 'N/A'}, ${studentData?.bedNumber || 'N/A'}
*Amount Paid:* ₹${Number(amt).toLocaleString('en-IN')}
*Payment App:* ${app}
*UTR / Reference ID:* ${utr}
*Payment Date:* ${date}

Dear Owner, I have completed the rent dues payment via UPI. Please verify this receipt in the hostel management portal and update my account dues to cleared. Thank you!`;

    return `https://wa.me/91${cleanOwnerPhone}?text=${encodeURIComponent(message)}`;
  };

  // Submit payment receipt for owner verification
  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      alert('Please enter the 12-digit UPI Reference / UTR Number from your payment app.');
      return;
    }
    if (!studentData) return;

    setSubmittingReceipt(true);
    setSubmissionFeedback(null);

    try {
      const res = await fetch('/api/payment-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDbId: studentData.id,
          studentId: studentData.studentId,
          studentName: studentData.fullName,
          studentPhone: studentData.phone,
          roomNumber: studentData.roomNumber,
          bedNumber: studentData.bedNumber,
          amount: Number(paidAmount) || studentData.finances?.totalOutstanding || 9000,
          paymentDate,
          upiApp: selectedUpiApp,
          transactionRef: utrNumber.trim(),
          receiptImageUrl: receiptImage || undefined,
          notes: receiptNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 80, spread: 70 });
        setSubmissionFeedback('Receipt submitted successfully! Sent to owner for verification.');
        setUtrNumber('');
        setReceiptImage('');
        setReceiptNotes('');
        // Refresh submissions
        const subRes = await fetch(`/api/payment-submissions?studentDbId=${studentData.id}`);
        const subData = await subRes.json();
        if (subData.success) {
          setSubmissions(subData.submissions || []);
        }
      } else {
        alert(data.error || 'Failed to submit receipt');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting payment receipt');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const handleSimulateUpiPayment = async () => {
    if (!studentData) return;
    setUpiPaying(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDbId: studentData.id,
          amount: studentData.finances?.totalOutstanding || studentData.monthlyRent || 9000,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'UPI',
          billingPeriod: 'Current Due Period',
          transactionRef: `UPI/APP/${Date.now().toString().slice(-6)}`,
          receivedBy: 'Automated Resident UPI Gateway',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUpiSuccess(true);
        confetti({ particleCount: 70, spread: 60 });
        setTimeout(() => {
          setUpiSuccess(false);
          fetchStudentInfo();
          setActiveTab('RECEIPTS');
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpiPaying(false);
    }
  };

  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);

  const handleDeleteSentMessage = async (messageId: string) => {
    if (!messageId || deletingMsgId) return;
    try {
      setDeletingMsgId(messageId);
      const res = await fetch(`/api/messages?messageId=${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (e) {
      console.error('Failed to delete message:', e);
    } finally {
      setDeletingMsgId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !studentData) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDbId: studentData.id,
          studentId: studentData.studentId,
          studentName: studentData.fullName,
          senderRole: 'STUDENT',
          senderName: studentData.fullName,
          senderUserId: studentData.userId,
          content: chatInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatInput('');
        fetchStudentInfo();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !currentUser || loading || !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading Resident Mobile App...</p>
        </div>
      </div>
    );
  }

  const fin = studentData.finances;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-indigo-600 selection:text-white">
      {/* Mobile Frame Container (Max width 440px for native mobile fidelity on desktop) */}
      <div className="w-full max-w-md min-h-screen bg-slate-900 flex flex-col shadow-2xl relative pb-20 border-x border-slate-800">
        {/* ================= TOP MOBILE HEADER ================= */}
        <header className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-[31px] z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {studentData.photoUrl ? (
              <img
                src={studentData.photoUrl}
                alt={studentData.fullName}
                className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs border-2 border-indigo-400">
                {studentData.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-bold text-sm text-white">{studentData.fullName}</div>
              <div className="text-[10px] text-indigo-400 font-mono font-semibold">
                {studentData.studentId} • Room {studentData.roomNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <InstallPwaButton variant="compact" label="Install" className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50 text-[10px] px-2 py-1" />
            {currentUser && currentUser.role !== 'STUDENT' && (
              <Link
                href="/dashboard"
                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition"
                title="Switch to Management View"
              >
                {currentUser.role === 'OWNER' ? 'Owner View' : 'Staff View'}
              </Link>
            )}
            <button
              onClick={() => {
                logout();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition"
              title="Sign Out to Universal Login"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Management Preview Mode Notice if non-student is viewing */}
        {currentUser && currentUser.role !== 'STUDENT' && (
          <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-amber-200">
            <span>Management Preview ({currentUser.role === 'OWNER' ? 'Owner' : currentUser.staffTitle || currentUser.role})</span>
            <Link href="/dashboard" className="underline font-bold hover:text-white">
              Exit to Dashboard &rarr;
            </Link>
          </div>
        )}

        {/* ================= MAIN SCROLLABLE APP BODY ================= */}
        <main className="flex-1 p-5 space-y-5 overflow-y-auto">
          {/* ================= TAB: HOME ================= */}
          {activeTab === 'HOME' && (
            <div className="space-y-5">
              {/* Digital Resident ID Pass Card (Rule 9 & 25) */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-[10px] text-white">
                      {hostelInitials}
                    </div>
                    <span className="font-bold text-xs tracking-wider uppercase text-indigo-300 font-display truncate max-w-[200px]">
                      {hostelName} Resident Pass
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition no-print"
                      title="Print or Save PDF Pass"
                    >
                      <Printer className="w-3 h-3 text-indigo-300" />
                      <span>Print Pass</span>
                    </button>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      ACTIVE PASS
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h2 className="text-xl font-bold text-white font-display">
                      {studentData.fullName}
                    </h2>
                    <div className="font-mono text-xs font-bold text-indigo-300 mt-0.5">
                      Student ID: {studentData.studentId}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-xl text-slate-950 shrink-0">
                    <QrCode className="w-9 h-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-indigo-800/40 text-slate-300">
                  <div>
                    <span className="text-[10px] text-indigo-400 block">Room & Bed</span>
                    <span className="font-bold text-white">
                      Room {studentData.roomNumber} ({studentData.bedNumber})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-indigo-400 block">Joining Date</span>
                    <span className="font-bold text-white">{formatDateDMY(studentData.joiningDate)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-indigo-400 block">Monthly Rent</span>
                    <span className="font-bold text-white">₹{studentData.monthlyRent}/mo</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-indigo-400 block">Hostel Wing</span>
                    <span className="font-bold text-white">{studentData.blockName}</span>
                  </div>
                </div>
              </div>

              {/* Dues Quick Status Banner (Rule 12: Anchored on joining date) */}
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Individual Due Cycle
                    </span>
                    <div className="text-sm font-bold text-white">
                      Joined: {formatDateDMY(studentData.joiningDate)}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${fin?.totalOutstanding > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                  >
                    {fin?.totalOutstanding > 0 ? `₹${fin.totalOutstanding} Due` : 'Cleared'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your billing begins strictly on <strong>{formatDateDMY(studentData.joiningDate)}</strong> and recurs on day {new Date(studentData.joiningDate).getDate()} of every month.
                </p>

                {fin?.totalOutstanding > 0 ? (
                  <button
                    onClick={() => setActiveTab('DUES')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay Dues Online via UPI
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    All rent and charges paid to date.
                  </div>
                )}
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('RECEIPTS')}
                  className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition space-y-1"
                >
                  <Receipt className="w-4 h-4 text-indigo-400" />
                  <div className="font-bold text-[11px] text-white">Invoices</div>
                  <div className="text-[9px] text-slate-400">Bills & receipts</div>
                </button>

                <button
                  onClick={() => setActiveTab('CHAT')}
                  className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition space-y-1"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <div className="font-bold text-[11px] text-white">Helpdesk</div>
                  <div className="text-[9px] text-slate-400">Chat support</div>
                </button>

                <a
                  href={`tel:${settings.phone || '+919876543210'}`}
                  className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition space-y-1 block"
                  title="Call Warden / Desk Directly"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <div className="font-bold text-[11px] text-white">Call Desk</div>
                  <div className="text-[9px] text-slate-400 truncate">{settings.phone || 'Direct Call'}</div>
                </a>
              </div>

              {/* Recent Official Notice */}
              {notices.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Bell className="w-3.5 h-3.5" />
                      Hostel Announcement
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatDateDMY(notices[0].createdAt)}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{notices[0].title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{notices[0].message}</p>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB: DUES & PAYMENT ================= */}
          {activeTab === 'DUES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-display">Resident Billing & Dues</h3>
                <span className="text-xs text-indigo-400 font-semibold font-mono">
                  {studentData.studentId}
                </span>
              </div>

              {/* Balance Card */}
              <div className="p-5 rounded-3xl bg-slate-800 border border-slate-700 space-y-3">
                <span className="text-xs text-slate-400 block font-semibold">Total Outstanding Balance</span>
                <div className="text-3xl font-black text-rose-400 font-display">
                  ₹{(fin?.totalOutstanding || 0).toLocaleString('en-IN')}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Total Billed</span>
                    <span className="font-bold text-white">₹{fin?.totalBilled.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Total Cleared</span>
                    <span className="font-bold text-emerald-400">₹{fin?.totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Real UPI Fast Pay Card */}
              {fin?.totalOutstanding > 0 ? (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-indigo-950/40 border border-emerald-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Instant UPI Payment Gateway</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                      Zero Surcharge
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clicking below will launch any installed UPI app on your phone with the owner's details and exact dues amount pre-filled.
                  </p>

                  {/* Primary 1-Tap UPI Launch Button */}
                  <button
                    type="button"
                    onClick={handleLaunchUpi}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <CreditCard className="w-4 h-4 text-slate-950" />
                    <span>Pay Dues Online via UPI (₹{fin.totalOutstanding.toLocaleString('en-IN')})</span>
                    <ExternalLink className="w-4 h-4 text-slate-950" />
                  </button>

                  {/* Quick App Badges */}
                  <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span> PhonePe
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span> Google Pay
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Paytm
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400"></span> BHIM / CRED
                    </span>
                  </div>

                  {/* Owner UPI & Number Details with 1-Click Copy */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Owner UPI VPA:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400 text-[11px]">{ownerUpiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Owner Contact Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200 text-[11px]">{cleanOwnerPhone}</span>
                        <button
                          type="button"
                          onClick={handleCopyPhone}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Copy Phone Number"
                        >
                          {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowQrCode(!showQrCode)}
                        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{showQrCode ? 'Hide QR Code' : 'Show UPI QR Code'}</span>
                      </button>

                      <a
                        href={getWhatsAppReceiptUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with Host</span>
                      </a>
                    </div>

                    {/* QR Code Container */}
                    {showQrCode && (
                      <div className="pt-2 text-center p-3 rounded-xl bg-white/95 border border-slate-300 flex flex-col items-center gap-2 animate-in fade-in duration-200">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(getUpiPaymentUrl())}`}
                          alt="Hostel UPI QR Code"
                          className="w-36 h-36 rounded-lg shadow-sm"
                        />
                        <span className="text-[11px] text-slate-800 font-semibold font-mono">
                          Scan to pay ₹{fin.totalOutstanding.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          Scan using PhonePe, Google Pay or Paytm scanner
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center bg-slate-800/40 border border-slate-700 rounded-3xl space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-sm">No Outstanding Dues!</h4>
                  <p className="text-xs text-slate-400">
                    All monthly cycles have been cleared. Next billing begins on your joining date cycle.
                  </p>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SUBMIT RECEIPT / REFERENCE FOR OWNER VERIFICATION                         */}
              {/* ========================================================================= */}
              <div className="p-5 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-cyan-400" />
                      <span>Submit Payment Receipt / Reference</span>
                    </h4>
                    <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                      Step 2: Verification
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    After completing the transfer in your UPI app, submit the 12-digit UTR number and receipt screenshot so the owner can verify and update your dues.
                  </p>
                </div>

                {submissionFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{submissionFeedback}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReceipt} className="space-y-3.5 text-xs">
                  {/* UTR Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      UPI Reference / UTR Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 428912345678 (12-digit UTR)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/30 outline-none text-xs"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Found in your PhonePe / GPay / Paytm transaction details under "UPI Ref No." or "UTR".
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Amount */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Amount Paid (₹) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/30 outline-none text-xs"
                      />
                    </div>

                    {/* App Used */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        UPI App Used
                      </label>
                      <select
                        value={selectedUpiApp}
                        onChange={(e) => setSelectedUpiApp(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-cyan-500/30 outline-none text-xs"
                      >
                        <option value="PhonePe">PhonePe</option>
                        <option value="Google Pay">Google Pay</option>
                        <option value="Paytm">Paytm</option>
                        <option value="BHIM">BHIM UPI</option>
                        <option value="CRED">CRED</option>
                        <option value="Other">Other Bank UPI</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-cyan-500/30 outline-none text-xs"
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Payment Screenshot / Receipt (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer transition text-xs font-semibold">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Upload Screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptImageUpload}
                          className="hidden"
                        />
                      </label>
                      {receiptImage && (
                        <div className="flex items-center gap-2">
                          <img
                            src={receiptImage}
                            alt="Receipt Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => setReceiptImage('')}
                            className="text-[11px] text-rose-400 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    {/* Submit for Owner Approval */}
                    <button
                      type="submit"
                      disabled={submittingReceipt}
                      className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                    >
                      {submittingReceipt ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting Receipt...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit for Owner Approval</span>
                        </>
                      )}
                    </button>

                    {/* Send Receipt to Owner on WhatsApp */}
                    <a
                      href={getWhatsAppReceiptUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-md text-center"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send to Owner on WhatsApp</span>
                    </a>
                  </div>
                </form>
              </div>

              {/* ========================================================================= */}
              {/* SUBMISSION HISTORY & LIVE STATUS TRACKER                                  */}
              {/* ========================================================================= */}
              {submissions.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Your UPI Submissions & Verification Status
                  </span>

                  <div className="space-y-2">
                    {submissions.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col gap-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">
                              ₹{sub.amount.toLocaleString('en-IN')} via {sub.upiApp}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              UTR: {sub.transactionRef} • {formatDateDMY(sub.paymentDate)}
                            </div>
                          </div>

                          <div className="text-right">
                            {sub.status === 'APPROVED' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Cleared ({sub.receiptNumber || 'Approved'})
                              </span>
                            ) : sub.status === 'REJECTED' ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" />
                                Pending Verification
                              </span>
                            )}
                          </div>
                        </div>

                        {sub.status === 'PENDING' && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-[10px]">
                            <span className="text-amber-300/80">
                              Waiting for owner to review and clear dues
                            </span>
                            <a
                              href={getWhatsAppReceiptUrl(sub)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Send Receipt on WhatsApp
                            </a>
                          </div>
                        )}

                        {sub.status === 'REJECTED' && sub.rejectionReason && (
                          <div className="pt-1 text-[10px] text-rose-300 border-t border-slate-700/60">
                            Reason: {sub.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Cycles Ledger */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Recurring Billing Cycles (Anchored on Joining Date)
                </span>

                <div className="space-y-2">
                  {(fin?.reconciledCycles || []).map((cycle: any) => (
                    <div
                      key={cycle.id}
                      className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{cycle.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Period: {cycle.cycleStartDate} to {cycle.cycleEndDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">₹{cycle.amount.toLocaleString('en-IN')}</div>
                        <span
                          className={`text-[10px] font-bold ${cycle.status === 'Paid' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                          {cycle.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: INVOICES & RECEIPTS ================= */}
          {activeTab === 'RECEIPTS' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-display">Invoices & Receipts</h3>
                <p className="text-xs text-slate-400">
                  Official tax invoices and verified payment vouchers.
                </p>
              </div>

              {/* Sub-tabs: Invoices vs Receipts */}
              <div className="flex rounded-2xl bg-slate-800 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setDocFilter('INVOICES')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${docFilter === 'INVOICES'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>My Invoices ({studentData.cycles?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocFilter('RECEIPTS')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${docFilter === 'RECEIPTS'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>My Receipts ({studentData.payments?.length || 0})</span>
                </button>
              </div>

              {/* SUB-VIEW 1: INVOICES */}
              {docFilter === 'INVOICES' && (
                <div className="space-y-3">
                  {studentData.cycles && studentData.cycles.length > 0 ? (
                    studentData.cycles.map((c: any) => {
                      const isPaid = c.balanceAmount === 0;
                      return (
                        <div
                          key={c.id}
                          className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-400">
                                BILL-{studentData.studentId}-M{c.cycleNumber}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                                Month {c.cycleNumber}
                              </span>
                            </div>
                            <div className="font-bold text-sm text-white mt-1">
                              ₹{c.amount?.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Due: {formatDateDMY(c.dueDate)} • {c.description}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isPaid
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                            >
                              {isPaid ? 'Paid' : `Due ₹${c.balanceAmount?.toLocaleString('en-IN')}`}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setVoucherModalState({
                                  isOpen: true,
                                  type: 'INVOICE',
                                  data: {
                                    ...c,
                                    billNumber: `BILL-${studentData.studentId}-M${c.cycleNumber}`,
                                  },
                                });
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Printer className="w-3 h-3" />
                              <span>View Invoice</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-800/40 rounded-2xl">
                      No invoices generated yet.
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 2: RECEIPTS */}
              {docFilter === 'RECEIPTS' && (
                <div className="space-y-3">
                  {studentData.payments && studentData.payments.length > 0 ? (
                    studentData.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-emerald-400">{p.receiptNumber}</div>
                          <div className="font-bold text-sm text-white mt-1">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatDateDMY(p.paymentDate)} • {p.paymentMethod}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setVoucherModalState({
                              isOpen: true,
                              type: 'RECEIPT',
                              data: p,
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Receipt</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs bg-slate-800/40 rounded-2xl">
                      No receipts recorded yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB: NOTICES ================= */}
          {activeTab === 'NOTICES' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white font-display">Hostel Announcements</h3>
              <p className="text-xs text-slate-400">
                Official notices authorized by the Hostel Owner.
              </p>

              <div className="space-y-3">
                {notices.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-400">{n.type}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{n.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB: CHAT ================= */}
          {activeTab === 'CHAT' && (
            <div className="flex flex-col h-[520px] bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    HD
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Hostel Helpdesk</div>
                    <div className="text-[10px] text-emerald-400">Owner & Warden Support</div>
                  </div>
                </div>

                <a
                  href={`tel:${settings.phone || '+919876543210'}`}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Direct Phone Call to Hostel Helpdesk"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Desk</span>
                </a>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((m) => {
                  const isMe = m.senderRole === 'STUDENT';
                  return (
                    <div key={m.id} className={`flex items-center gap-1.5 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSentMessage(m.id)}
                          disabled={deletingMsgId === m.id}
                          title="Delete sent message"
                          className="opacity-70 sm:opacity-0 group-hover:opacity-100 transition p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg shrink-0"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${deletingMsgId === m.id ? 'animate-spin text-red-400' : ''}`} />
                        </button>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700'
                          }`}
                      >
                        <div className="text-[10px] opacity-75">{m.senderName}</div>
                        <p>{m.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2 bg-slate-850">
                <input
                  type="text"
                  placeholder="Message the Warden / Owner..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </main>

        {/* ================= NATIVE TOUCH BOTTOM NAVIGATION (RULE 25) ================= */}
        <nav className="fixed bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 py-2 px-3 z-40 flex justify-around items-center text-[10px]">
          <button
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'HOME' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Pass</span>
          </button>

          <button
            onClick={() => setActiveTab('DUES')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'DUES' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Dues</span>
          </button>

          <button
            onClick={() => setActiveTab('RECEIPTS')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'RECEIPTS' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTICES')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'NOTICES' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notices</span>
          </button>

          <button
            onClick={() => setActiveTab('CHAT')}
            className={`flex flex-col items-center gap-1 transition ${activeTab === 'CHAT' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>
        </nav>

        {/* Printable Voucher Modal (Invoices & Receipts) */}
        {voucherModalState.isOpen && (
          <VoucherModal
            isOpen={voucherModalState.isOpen}
            onClose={() => setVoucherModalState((prev) => ({ ...prev, isOpen: false }))}
            type={voucherModalState.type}
            data={voucherModalState.data}
            student={studentData}
            settings={settings}
          />
        )}
      </div>
    </div>
  );
}
