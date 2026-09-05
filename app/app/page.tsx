'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import VoucherModal from '@/components/payments/VoucherModal';
import { formatDateDMY } from '@/lib/utils/dateFormatter';
import InstallPwaButton from '@/components/common/InstallPwaButton';

export default function StudentMobileApp() {
  const { currentUser, logout, switchRoleQuick } = useAuth();
  const { hostelName, settings } = useHostelSettings();

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
        // Fetch notifications relevant to student
        const notifRes = await fetch(`/api/notifications?audience=STUDENT&blockId=${current.blockId}&studentId=${current.studentId}`);
        const notifData = await notifRes.json();
        setNotices(notifData.notifications || []);

        // Fetch messages
        const msgRes = await fetch(`/api/messages?studentDbId=${current.id}&role=STUDENT`);
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
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

  if (loading || !studentData) {
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

          <div className="flex items-center gap-2">
            <InstallPwaButton variant="compact" label="Install App" className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50" />
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold"
              title="Switch to Management View"
            >
              Owner View
            </Link>
          </div>
        </header>

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

              {/* UPI Fast Pay Simulator */}
              {fin?.totalOutstanding > 0 ? (
                <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-800/40 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    Simulated Instant UPI Payment
                  </div>

                  <p className="text-xs text-slate-300">
                    Pay rent dues directly using your UPI apps (GPay, PhonePe, Paytm).
                  </p>

                  <button
                    onClick={handleSimulateUpiPayment}
                    disabled={upiPaying || upiSuccess}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    {upiPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authorizing Payment...
                      </>
                    ) : upiSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Paid! Generating Receipt...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Simulate UPI Pay (₹{fin.totalOutstanding.toLocaleString('en-IN')})
                      </>
                    )}
                  </button>
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
