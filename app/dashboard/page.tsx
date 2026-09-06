'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  Users,
  Bed,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Receipt,
  UserPlus,
  PlusCircle,
  Zap,
  BarChart3,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import MultiStepStudentRegistrationModal from '@/components/students/MultiStepStudentRegistrationModal';
import RecordPaymentModal from '@/components/payments/RecordPaymentModal';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import { useAuth } from '@/lib/context/AuthContext';

export default function DashboardOverview() {
  const { hostelName, settings } = useHostelSettings();
  const { currentUser, currentRole } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick Operations Modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCollectRentModalOpen, setIsCollectRentModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/reports');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-medium">Loading Real-Time Hostel Command Center...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { kpis, students, beds, payments, expenses, bookings, auditLogs } = data;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Title & Instant Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Welcome to {hostelName} • Live Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {hostelName} Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Live census, joining-date collections, occupancy rate, and automated audit tracking for {hostelName}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              Live System • {currentUser?.fullName || 'Administrator'} ({currentRole === 'OWNER' ? 'Owner' : currentUser?.staffTitle || currentRole || 'Staff'})
            </span>
          </div>
        </div>

        {/* Feedback Alert for Quick Actions */}
        {quickFeedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{quickFeedback}</span>
          </div>
        )}

        {/* 10+ KPI Summary Cards (Rule 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1: Active Residents */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Students</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              {kpis?.activeStudents ?? 0}
            </div>
            <div className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
              <span>{kpis?.totalBeds ?? 0} total beds capacity</span>
            </div>
          </div>

          {/* Card 2: Vacant Beds */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Vacant Beds</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Bed className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-display">
              {kpis?.availableBeds ?? 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">
              Ready for immediate allocation
            </div>
          </div>

          {/* Card 3: Occupancy Rate */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Occupancy</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              {kpis?.occupancyRate ?? 0}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpis?.occupancyRate ?? 0)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 4: Monthly Dues Pending */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Dues Pending</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 font-display">
              ₹{(kpis?.pendingDuesAmount ?? kpis?.totalDuesOutstanding ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-rose-600 font-medium">
              Across uncollected monthly rent
            </div>
          </div>

          {/* Card 5: Net Profit Surplus */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Net Surplus</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              ₹{(kpis?.netOperatingProfit ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">
              Revenue minus expenses
            </div>
          </div>
        </div>

        {/* Financial Balance Summary */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-sm sm:text-base font-display">
                Real-Time Financial Overview
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Ledger Sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gross Collected Revenue
              </span>
              <div className="text-3xl font-black font-display text-emerald-400">
                ₹{(kpis?.totalPaymentsCollected ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400">Rent, deposits & one-time fees</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Operating Expenses
              </span>
              <div className="text-3xl font-black font-display text-rose-400">
                ₹{(kpis?.totalExpenses ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400">Mess, salaries, maintenance, utilities</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Net Operating Surplus
              </span>
              <div className="text-3xl font-black font-display text-white">
                ₹{(kpis?.netOperatingProfit ?? 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-400 font-semibold">Positive Cash Flow</p>
            </div>
          </div>
        </div>

        {/* ================= QUICK OPERATIONS HUB (SINGLE ROW AT BOTTOM) ================= */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h2 className="font-bold text-xs sm:text-sm font-display text-white">
                Quick Actions
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">1-Tap Shortcuts</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Quick Action 1: Register Student */}
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-indigo-400/40 text-left transition space-y-1.5 sm:space-y-2 group cursor-pointer active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center group-hover:scale-110 transition">
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300">
                  Admission
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">Register Student</h3>
                <p className="text-[10px] text-slate-300 hidden sm:block mt-0.5">New admission & ID</p>
              </div>
            </button>

            {/* Quick Action 2: Collect Rent */}
            <button
              type="button"
              onClick={() => setIsCollectRentModalOpen(true)}
              className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-emerald-400/40 text-left transition space-y-1.5 sm:space-y-2 group cursor-pointer active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300">
                  Payment
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">Collect Rent</h3>
                <p className="text-[10px] text-slate-300 hidden sm:block mt-0.5">Record dues receipt</p>
              </div>
            </button>

            {/* Quick Action 3: Add Expense */}
            <button
              type="button"
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-rose-400/40 text-left transition space-y-1.5 sm:space-y-2 group cursor-pointer active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/30 text-rose-300 flex items-center justify-center group-hover:scale-110 transition">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300">
                  Outflow
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">Add Expense</h3>
                <p className="text-[10px] text-slate-300 hidden sm:block mt-0.5">Log hostel expense</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Operation: Multi-Step Student Admission Modal */}
      <MultiStepStudentRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          setIsRegisterModalOpen(false);
          fetchDashboardData();
          setQuickFeedback('New student registered successfully! Generated Student ID.');
          setTimeout(() => setQuickFeedback(null), 4000);
        }}
      />

      {/* Quick Operation: Collect Rent / Payment Modal */}
      <RecordPaymentModal
        isOpen={isCollectRentModalOpen}
        onClose={() => setIsCollectRentModalOpen(false)}
        onSuccess={() => {
          setIsCollectRentModalOpen(false);
          fetchDashboardData();
          setQuickFeedback('Rent collected successfully! Generated official receipt and updated ledger balance.');
          setTimeout(() => setQuickFeedback(null), 4000);
        }}
      />

      {/* Quick Operation: Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onSuccess={() => {
          setIsAddExpenseModalOpen(false);
          fetchDashboardData();
          setQuickFeedback('Operating expense voucher recorded successfully!');
          setTimeout(() => setQuickFeedback(null), 4000);
        }}
      />
    </DashboardLayout>
  );
}
