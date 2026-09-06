'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiStepStudentRegistrationModal from '@/components/students/MultiStepStudentRegistrationModal';
import StudentCheckoutModal from '@/components/students/StudentCheckoutModal';
import EditStudentModal from '@/components/students/EditStudentModal';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Bed,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Sparkles,
  Receipt,
  FileText,
  X,
  Printer,
  User,
  Edit2,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Download,
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import VoucherModal from '@/components/payments/VoucherModal';
import { formatDateDMY } from '@/lib/utils/dateFormatter';
import { printElement } from '@/lib/utils/printManager';

export default function StudentsPage() {
  const { settings, hostelName } = useHostelSettings();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [blockFilter, setBlockFilter] = useState('All');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<any>(null);
  const [checkoutTargetStudent, setCheckoutTargetStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<any>(null);
  const [viewingIdPhotoUrl, setViewingIdPhotoUrl] = useState<string | null>(null);
  const [studentDataTab, setStudentDataTab] = useState<'INVOICES' | 'RECEIPTS'>('INVOICES');
  const [voucherModalState, setVoucherModalState] = useState<{
    isOpen: boolean;
    type: 'INVOICE' | 'RECEIPT';
    data: any;
    student: any;
  }>({
    isOpen: false,
    type: 'INVOICE',
    data: null,
    student: null,
  });

  // Password reset modal state for students
  const [passwordModalStudent, setPasswordModalStudent] = useState<any | null>(null);
  const [studentNewPassword, setStudentNewPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentPasswordSaving, setStudentPasswordSaving] = useState(false);
  const [studentPasswordError, setStudentPasswordError] = useState<string | null>(null);
  const [studentToastMessage, setStudentToastMessage] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    // Check if redirected from Bookings page with booking details
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const name = params.get('name');
      const phone = params.get('phone');
      const address = params.get('address');
      const joiningDate = params.get('joiningDate');
      const bookingId = params.get('bookingId');

      if (action === 'new' || action === 'register' || name || phone) {
        setBookingPrefill({
          fullName: name || '',
          phone: phone || '',
          address: address || '',
          joiningDate: joiningDate || '',
          bookingId: bookingId || '',
        });
        setIsRegisterModalOpen(true);
      }
    }
  }, []);

  const handleOpenPasswordModal = (stu: any) => {
    setPasswordModalStudent(stu);
    setStudentNewPassword('');
    setShowStudentPassword(false);
    setStudentPasswordError(null);
  };

  const handleSaveStudentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalStudent) return;
    setStudentPasswordError(null);

    const trimmed = studentNewPassword.trim();
    if (!trimmed || trimmed.length < 4) {
      setStudentPasswordError('Password must be at least 4 characters long.');
      return;
    }

    setStudentPasswordSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: passwordModalStudent.id,
          newPassword: trimmed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStudentToastMessage(`Password changed successfully for resident ${passwordModalStudent.fullName}!`);
        setTimeout(() => setStudentToastMessage(null), 3500);
        setPasswordModalStudent(null);
        fetchStudents();
      } else {
        setStudentPasswordError(data.error || 'Failed to update student password.');
      }
    } catch (err: any) {
      setStudentPasswordError(err.message || 'Error occurred while updating password.');
    } finally {
      setStudentPasswordSaving(false);
    }
  };

  // Helper to determine if a student's rent due date has arrived / is overdue
  const getStudentDueStatus = (stu: any) => {
    if (stu.status !== 'Active') {
      return { isDue: false, isOverdue: false, dueDate: null, overdueDays: 0, cycleNumber: null };
    }

    const fin = stu.finances;
    if (!fin || (fin.totalOutstanding || 0) <= 0) {
      return { isDue: false, isOverdue: false, dueDate: null, overdueDays: 0, cycleNumber: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find earliest cycle with balanceAmount > 0
    const unpaidCycle = stu.cycles?.find((c: any) => (c.balanceAmount || 0) > 0);

    if (unpaidCycle && unpaidCycle.dueDate) {
      const dueDate = new Date(unpaidCycle.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const cycleStart = new Date(unpaidCycle.cycleStartDate);
      cycleStart.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Due date has arrived if today >= dueDate OR cycle status is Overdue OR cycle has started with unpaid balance
      const isDue =
        today.getTime() >= dueDate.getTime() ||
        unpaidCycle.status === 'Overdue' ||
        fin.overallStatus === 'Overdue' ||
        today.getTime() >= cycleStart.getTime();

      return {
        isDue,
        isOverdue: overdueDays > 0 || unpaidCycle.status === 'Overdue',
        dueDate: unpaidCycle.dueDate,
        overdueDays: Math.max(0, overdueDays),
        cycleNumber: unpaidCycle.cycleNumber,
      };
    }

    return {
      isDue: fin.totalOutstanding > 0,
      isOverdue: fin.overallStatus === 'Overdue',
      dueDate: null,
      overdueDays: 0,
      cycleNumber: null,
    };
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bedNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const dueInfo = getStudentDueStatus(s);
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'DueNow'
        ? s.status === 'Active' && dueInfo.isDue
        : s.status === statusFilter;

    const matchesBlock = blockFilter === 'All' ? true : s.blockId === blockFilter;

    return matchesSearch && matchesStatus && matchesBlock;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Resident Roster & Allocations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Student Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage residents, automatic STU sequences, joining-date cycles, and checkout history.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register New Student
          </button>
        </div>

        {/* Search and Filters Bar (Rule 21) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student name, Student ID (STU26...), phone, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white outline-none"
            >
              <option value="Active">Active Residents</option>
              <option value="DueNow">⚠️ Due Date Arrived / Overdue</option>
              <option value="CheckedOut">Checked Out</option>
              <option value="All">All Statuses</option>
            </select>

            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white outline-none"
            >
              <option value="All">All Blocks</option>
              <option value="blk-a">Block A (Men Wing)</option>
              <option value="blk-b">Block B (Women Wing)</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View (Rule 26: transforms gracefully on mobile) */}
        <div className="hidden md:block rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student & ID</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Room & Bed</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Monthly Rent</th>
                <th className="py-3 px-4">Dues Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No students found matching the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const fin = stu.finances;
                  const dueInfo = getStudentDueStatus(stu);

                  return (
                    <tr
                      key={stu.id}
                      className={`transition ${
                        dueInfo.isDue
                          ? 'bg-rose-50/75 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {stu.photoUrl ? (
                            <img
                              src={stu.photoUrl}
                              alt={stu.fullName}
                              className={`w-10 h-10 rounded-xl object-cover shrink-0 border ${
                                dueInfo.isDue ? 'border-rose-400 ring-2 ring-rose-400/30' : 'border-slate-200'
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs border ${
                                dueInfo.isDue
                                  ? 'bg-rose-100 text-rose-700 border-rose-300 ring-2 ring-rose-400/30'
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              }`}
                            >
                              {stu.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{stu.fullName}</span>
                              {dueInfo.isDue && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 shadow-2xs">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                  Due Date Arrived
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs font-bold text-indigo-600">
                              {stu.studentId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <a
                          href={`tel:${stu.phone}`}
                          className="text-slate-900 font-semibold hover:text-emerald-700 inline-flex items-center gap-1.5 group"
                          title={`Call resident: ${stu.phone}`}
                        >
                          <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Phone className="w-3 h-3" />
                          </span>
                          <span>{stu.phone}</span>
                        </a>
                        <div className="text-slate-400 text-xs truncate max-w-[140px] mt-0.5">
                          {stu.guardianName} ({stu.guardianRelation})
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">Room {stu.roomNumber}</div>
                        <div className="text-slate-500 text-xs">
                          {stu.bedNumber} • {stu.blockName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{formatDateDMY(stu.joiningDate)}</div>
                        <div className="text-[10px] text-indigo-600 font-semibold">
                          Cycle day {new Date(stu.joiningDate).getDate()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{(stu.monthlyRent || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        {dueInfo.isDue ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Due: ₹{(fin?.totalOutstanding || 0).toLocaleString('en-IN')}
                            </span>
                            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                              {dueInfo.overdueDays > 0
                                ? `Overdue by ${dueInfo.overdueDays} day${dueInfo.overdueDays > 1 ? 's' : ''}`
                                : dueInfo.dueDate
                                ? `Due Date: ${formatDateDMY(dueInfo.dueDate)}`
                                : 'Due Immediately'}
                            </div>
                          </div>
                        ) : (fin?.totalOutstanding || 0) > 0 ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              Due: ₹{(fin?.totalOutstanding || 0).toLocaleString('en-IN')}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Status: {fin?.overallStatus || 'Pending'}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            All Cleared
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${stu.phone}`}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition"
                            title={`Call ${stu.fullName} (${stu.phone})`}
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => setSelectedStudentForDrawer(stu)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition"
                            title="View Full Profile"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenPasswordModal(stu)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition"
                            title={`Change Password for ${stu.fullName}`}
                          >
                            <KeyRound className="w-4 h-4 text-amber-600" />
                          </button>

                          <button
                            onClick={() => setEditingStudent(stu)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                            title="Edit Student Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {stu.status === 'Active' && (
                            <button
                              onClick={() => setCheckoutTargetStudent(stu)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition flex items-center gap-1"
                              title="Checkout Student"
                            >
                              <LogOut className="w-3 h-3" />
                              Checkout
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

        {/* Mobile-Friendly Cards (Rule 25 & 26: No ugly horizontal scroll!) */}
        <div className="md:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              No students found.
            </div>
          ) : (
            filteredStudents.map((stu) => {
              const fin = stu.finances;
              const dueInfo = getStudentDueStatus(stu);

              return (
                <div
                  key={stu.id}
                  className={`p-4 rounded-2xl border shadow-xs space-y-3 transition ${
                    dueInfo.isDue
                      ? 'bg-rose-50/85 border-rose-300 ring-2 ring-rose-400/20'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Light Red Due Date Banner */}
                  {dueInfo.isDue && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Due Date Arrived {dueInfo.overdueDays > 0 ? `(${dueInfo.overdueDays}d overdue)` : ''}</span>
                      </span>
                      <span className="font-extrabold font-mono text-rose-900">
                        ₹{(fin?.totalOutstanding || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={stu.photoUrl}
                        alt={stu.fullName}
                        className={`w-12 h-12 rounded-xl object-cover border ${
                          dueInfo.isDue ? 'border-rose-400 ring-2 ring-rose-400/30' : 'border-slate-200'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{stu.fullName}</span>
                          {dueInfo.isDue && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-200 text-rose-800">
                              Due
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-xs font-bold text-indigo-600">
                          {stu.studentId}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dueInfo.isDue
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : stu.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {dueInfo.isDue ? 'Rent Due' : stu.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Room / Bed</span>
                      <span className="font-bold text-slate-800">
                        {stu.roomNumber} ({stu.bedNumber})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Joining Date</span>
                      <span className="font-semibold text-slate-800">{formatDateDMY(stu.joiningDate)}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Monthly Rent</span>
                      <span className="font-semibold text-slate-800">₹{stu.monthlyRent}/mo</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Outstanding</span>
                      <span
                        className={`font-bold ${
                          fin?.totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        ₹{(fin?.totalOutstanding || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setSelectedStudentForDrawer(stu)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${stu.phone}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition flex items-center gap-1 border border-emerald-200"
                        title={`Call ${stu.fullName}`}
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>Call</span>
                      </a>

                      <button
                        onClick={() => handleOpenPasswordModal(stu)}
                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition flex items-center gap-1 border border-amber-200"
                        title={`Change password for ${stu.fullName}`}
                      >
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Pass</span>
                      </button>

                      <button
                        onClick={() => setEditingStudent(stu)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {stu.status === 'Active' && (
                        <button
                          onClick={() => setCheckoutTargetStudent(stu)}
                          className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
                        >
                          Checkout
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Multi-Step Registration Modal */}
      <MultiStepStudentRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setBookingPrefill(null);
        }}
        onSuccess={() => {
          setBookingPrefill(null);
          fetchStudents();
        }}
        prefillData={bookingPrefill}
      />

      {/* Checkout Modal */}
      <StudentCheckoutModal
        isOpen={!!checkoutTargetStudent}
        student={checkoutTargetStudent}
        onClose={() => setCheckoutTargetStudent(null)}
        onSuccess={fetchStudents}
      />

      {/* Edit Student Data Modal */}
      <EditStudentModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={(updatedStudent) => {
          fetchStudents();
          if (
            selectedStudentForDrawer &&
            (selectedStudentForDrawer.id === updatedStudent.id ||
              selectedStudentForDrawer.studentId === updatedStudent.studentId)
          ) {
            setSelectedStudentForDrawer((prev: any) => ({ ...prev, ...updatedStudent }));
          }
        }}
      />

      {/* Student Profile Drawer / Modal */}
      {selectedStudentForDrawer && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="font-bold text-slate-900 text-base font-display">Student Record Profile</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(selectedStudentForDrawer)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
                  title="Edit Student Data"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => setSelectedStudentForDrawer(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                {selectedStudentForDrawer.photoUrl ? (
                  <img
                    src={selectedStudentForDrawer.photoUrl}
                    alt={selectedStudentForDrawer.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm shrink-0">
                    {selectedStudentForDrawer.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    {selectedStudentForDrawer.fullName}
                  </h3>
                  <div className="font-mono text-sm font-bold text-indigo-600">
                    {selectedStudentForDrawer.studentId}
                  </div>
                  <div className="text-xs text-slate-500">
                    Status: <span className="font-semibold text-emerald-600">{selectedStudentForDrawer.status}</span>
                  </div>
                </div>
              </div>

              {/* Light Red Due Date Alert Banner in Drawer */}
              {(() => {
                const drawerDueInfo = getStudentDueStatus(selectedStudentForDrawer);
                if (!drawerDueInfo.isDue) return null;
                return (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs flex items-start gap-3 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-extrabold text-rose-950 text-sm">Rent Payment Due Date Arrived!</span>
                        <span className="font-extrabold text-sm font-mono text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
                          ₹{selectedStudentForDrawer.finances?.totalOutstanding?.toLocaleString('en-IN')} Due
                        </span>
                      </div>
                      <p className="text-rose-800 leading-relaxed text-[11px]">
                        {drawerDueInfo.overdueDays > 0
                          ? `This resident is currently overdue by ${drawerDueInfo.overdueDays} day${drawerDueInfo.overdueDays > 1 ? 's' : ''}. Official due date was ${formatDateDMY(drawerDueInfo.dueDate, 'immediate')}.`
                          : `The rent due date (${formatDateDMY(drawerDueInfo.dueDate, 'immediate')}) has arrived for Month ${drawerDueInfo.cycleNumber || 1}.`}
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <Link
                          href={`/dashboard/payments?studentId=${selectedStudentForDrawer.studentId}`}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-xs"
                        >
                          <span>Record Payment in Payments Module</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone (Login)</span>
                  <a
                    href={`tel:${selectedStudentForDrawer.phone}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 text-xs mt-0.5"
                    title="Click to call resident"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{selectedStudentForDrawer.phone}</span>
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Room / Bed</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudentForDrawer.roomNumber} ({selectedStudentForDrawer.bedNumber})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Joining Date</span>
                  <span className="font-semibold text-indigo-600">{formatDateDMY(selectedStudentForDrawer.joiningDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Monthly Rent</span>
                  <span className="font-semibold text-slate-800">₹{selectedStudentForDrawer.monthlyRent}/mo</span>
                </div>
                {selectedStudentForDrawer.dob && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{formatDateDMY(selectedStudentForDrawer.dob)}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block text-[11px]">Guardian Contact</span>
                  <div className="font-semibold text-slate-800">
                    {selectedStudentForDrawer.guardianName}
                  </div>
                  {selectedStudentForDrawer.guardianPhone && (
                    <a
                      href={`tel:${selectedStudentForDrawer.guardianPhone}`}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:underline text-[11px] font-semibold mt-0.5"
                      title="Call guardian"
                    >
                      <Phone className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{selectedStudentForDrawer.guardianPhone}</span>
                    </a>
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">ID Proof</span>
                      <span className="font-semibold text-slate-800">
                        {selectedStudentForDrawer.idProofType} - {selectedStudentForDrawer.idProofNumber}
                      </span>
                    </div>
                    {selectedStudentForDrawer.idProofDocumentUrl && (
                      <button
                        type="button"
                        onClick={() => setViewingIdPhotoUrl(selectedStudentForDrawer.idProofDocumentUrl)}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition border border-indigo-200"
                        title="View Full ID Photo"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Photo</span>
                      </button>
                    )}
                  </div>
                  {selectedStudentForDrawer.idProofDocumentUrl && (
                    <div className="mt-2 p-2 bg-white rounded-xl border border-indigo-100 flex items-center gap-2.5 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setViewingIdPhotoUrl(selectedStudentForDrawer.idProofDocumentUrl)}
                        className="relative w-12 h-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group cursor-pointer"
                        title="Click to zoom ID photo"
                      >
                        <img
                          src={selectedStudentForDrawer.idProofDocumentUrl}
                          alt="Resident ID Photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-700 block truncate">ID Photo Attached</span>
                        <button
                          type="button"
                          onClick={() => setViewingIdPhotoUrl(selectedStudentForDrawer.idProofDocumentUrl)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 hover:underline"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          <span>Expand full photo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-xs mb-1">Permanent Home Address</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedStudentForDrawer.address}
                </p>
              </div>

              {/* Invoices & Receipts Section in Student Data View */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm font-display">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>Invoices & Receipts</span>
                  </div>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStudentDataTab('INVOICES')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        studentDataTab === 'INVOICES' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Invoices ({selectedStudentForDrawer.cycles?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentDataTab('RECEIPTS')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        studentDataTab === 'RECEIPTS' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Receipts ({selectedStudentForDrawer.payments?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Sub-view: Invoices */}
                {studentDataTab === 'INVOICES' && (
                  <div className="space-y-2">
                    {selectedStudentForDrawer.cycles && selectedStudentForDrawer.cycles.length > 0 ? (
                      selectedStudentForDrawer.cycles.map((c: any) => (
                        <div
                          key={c.id}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-indigo-700">
                              BILL-{selectedStudentForDrawer.studentId}-M{c.cycleNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Due: {formatDateDMY(c.dueDate)} • Month {c.cycleNumber}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold text-slate-900 font-display">
                                ₹{(c?.amount || 0).toLocaleString('en-IN')}
                              </div>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  c.balanceAmount === 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {c.balanceAmount === 0 ? 'Paid' : `Due ₹${(c?.balanceAmount || 0).toLocaleString('en-IN')}`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setVoucherModalState({
                                  isOpen: true,
                                  type: 'INVOICE',
                                  data: {
                                    ...c,
                                    billNumber: `BILL-${selectedStudentForDrawer.studentId}-M${c.cycleNumber}`,
                                  },
                                  student: selectedStudentForDrawer,
                                });
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                            >
                              <Printer className="w-3 h-3" />
                              <span>View / Print</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                        No bills/invoices generated yet for this resident.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-view: Receipts */}
                {studentDataTab === 'RECEIPTS' && (
                  <div className="space-y-2">
                    {selectedStudentForDrawer.payments && selectedStudentForDrawer.payments.length > 0 ? (
                      selectedStudentForDrawer.payments.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-emerald-700">{p.receiptNumber}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {formatDateDMY(p.paymentDate)} • {p.paymentMethod}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold text-emerald-600 font-display text-sm">
                                ₹{(p?.amount || 0).toLocaleString('en-IN')}
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                Settled
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setVoucherModalState({
                                  isOpen: true,
                                  type: 'RECEIPT',
                                  data: p,
                                  student: selectedStudentForDrawer,
                                });
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                            >
                              <Printer className="w-3 h-3" />
                              <span>View / Print</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                        No payment receipts issued yet for this resident.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      printElement('.printable-admission-slip', {
                        title: `Admission_Slip_${selectedStudentForDrawer.studentId}`,
                      })
                    }
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Admission Slip
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPasswordModal(selectedStudentForDrawer)}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    Reset Password
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForDrawer(null)}
                  className="px-5 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Voucher Modal for Invoices & Receipts */}
      <VoucherModal
        isOpen={voucherModalState.isOpen}
        onClose={() => setVoucherModalState(prev => ({ ...prev, isOpen: false }))}
        type={voucherModalState.type}
        data={voucherModalState.data}
        student={voucherModalState.student}
        settings={settings}
      />

      {/* Print-Only Official Resident Admission Slip */}
      {selectedStudentForDrawer && (
        <div className="printable-admission-slip print-only hidden p-4 sm:p-8 bg-white border-2 border-slate-900 rounded-3xl max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 sm:pb-6 border-b-2 border-slate-900">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">{hostelName}</h2>
              <p className="text-xs text-slate-600 max-w-sm mt-0.5">
                {settings.address ? `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}` : 'Official Resident Facility'}
              </p>
              <div className="text-xs text-slate-500 pt-1">
                <span>Tel: {settings.phone}</span> • <span>Email: {settings.email}</span>
              </div>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-md inline-block">
                Admission Slip
              </span>
              <div className="font-mono text-base font-bold text-indigo-700">
                {selectedStudentForDrawer.studentId}
              </div>
              <div className="text-xs text-slate-500">Date: {formatDateDMY(selectedStudentForDrawer.joiningDate)}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {selectedStudentForDrawer.photoUrl ? (
              <img
                src={selectedStudentForDrawer.photoUrl}
                alt={selectedStudentForDrawer.fullName}
                className="w-20 h-20 rounded-xl object-cover border border-slate-300 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-xl shrink-0">
                {selectedStudentForDrawer.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            <div className="space-y-1 text-xs text-center sm:text-left">
              <div className="text-base sm:text-lg font-bold text-slate-900">{selectedStudentForDrawer.fullName}</div>
              <div className="text-slate-600">Gender: <span className="font-semibold text-slate-900">{selectedStudentForDrawer.gender}</span> • Phone: <span className="font-semibold text-slate-900">{selectedStudentForDrawer.phone}</span></div>
              <div className="text-slate-600">Allocated Bed: <span className="font-bold text-indigo-700">{selectedStudentForDrawer.bedNumber}</span> in Room <span className="font-bold text-indigo-700">{selectedStudentForDrawer.roomNumber}</span> ({selectedStudentForDrawer.blockName})</div>
              <div className="text-slate-600">Monthly Rent: <span className="font-bold text-slate-900">₹{selectedStudentForDrawer.monthlyRent}/month</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-700">Emergency & Guardian:</div>
              <div className="text-slate-600">{selectedStudentForDrawer.guardianName} ({selectedStudentForDrawer.guardianRelation})</div>
              <div className="text-slate-600">Contact: {selectedStudentForDrawer.guardianPhone}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-700">Verified ID Proof:</div>
              <div className="text-slate-600">{selectedStudentForDrawer.idProofType}: {selectedStudentForDrawer.idProofNumber}</div>
              <div className="text-slate-600 truncate">Permanent: {selectedStudentForDrawer.address}</div>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div className="space-y-1 text-[11px] text-slate-500">
              <p className="font-semibold text-slate-700">Official Resident Credential • {hostelName}</p>
              <p>Digital signature verified under institutional admissions charter.</p>
            </div>
            <div className="text-left sm:text-right space-y-2">
              <div className="font-signature text-lg italic text-slate-800 font-bold">Authorized Warden / Owner</div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Official Stamp & Seal
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {studentToastMessage && (
        <div className="no-print fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>{studentToastMessage}</span>
        </div>
      )}

      {/* Modal: Change Student Password */}
      {passwordModalStudent && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                    Change Student Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Reset resident app login credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{passwordModalStudent.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono font-bold text-indigo-600">{passwordModalStudent.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Room / Bed:</span>
                <span className="font-semibold text-slate-700">Room {passwordModalStudent.roomNumber} ({passwordModalStudent.bedNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Login Mobile:</span>
                <span className="font-mono font-bold text-emerald-700">{passwordModalStudent.phone}</span>
              </div>
            </div>

            {studentPasswordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{studentPasswordError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudentPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={studentNewPassword}
                    onChange={(e) => setStudentNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Quick set:</span>
                <button
                  type="button"
                  onClick={() => setStudentNewPassword('student123')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono transition"
                >
                  student123
                </button>
                <button
                  type="button"
                  onClick={() => setStudentNewPassword(passwordModalStudent.phone)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono transition"
                >
                  Mobile Number
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={studentPasswordSaving}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {studentPasswordSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resident ID Document Photo Lightbox Viewer */}
      {viewingIdPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewingIdPhotoUrl(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">Resident ID Document Photo</h3>
                  <p className="text-[11px] text-slate-500">Live captured or uploaded identity proof document</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingIdPhotoUrl(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center flex-1 max-h-[70vh] border border-slate-800 p-2">
              <img
                src={viewingIdPhotoUrl}
                alt="Resident ID Full Preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="mt-4 flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Official resident identity proof document</span>
              <div className="flex items-center gap-2">
                <a
                  href={viewingIdPhotoUrl}
                  download="resident-id-document.jpg"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Photo</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewingIdPhotoUrl(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
