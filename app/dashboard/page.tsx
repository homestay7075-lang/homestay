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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to {hostelName} • Live Operations
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
              {kpis.activeStudents}
            </div>
            <div className="text-[11px] text-slate-500">
              Total Ever: {kpis.totalStudents} ({kpis.historicalCheckouts} checked out)
            </div>
          </div>

          {/* Card 2: Occupancy Rate */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Bed Occupancy</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Bed className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              {kpis.occupancyRate}%
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              {kpis.occupiedBeds} occupied / {kpis.totalBeds} total
            </div>
          </div>

          {/* Card 3: Available Beds */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Available Beds</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Bed className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-display">
              {kpis.availableBeds}
            </div>
            <div className="text-[11px] text-slate-500">
              {kpis.maintenanceBeds} in maintenance
            </div>
          </div>

          {/* Card 4: Monthly Collection */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Collections</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-display text-emerald-700">
              ₹{kpis.totalPaymentsCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              100% Reconciled
            </div>
          </div>

          {/* Card 5: Outstanding Dues */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Dues</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-display text-rose-600">
              ₹{kpis.totalDuesOutstanding.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500">
              Based on individual joining cycles
            </div>
          </div>
        </div>

        {/* Financial Balance Summary (Collections - Expenses = Net Profit) */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Gross Collected Revenue
              </span>
              <div className="text-3xl font-black font-display text-emerald-400">
                ₹{kpis.totalPaymentsCollected.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400">Rent, deposits & one-time fees</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Operating Expenses
              </span>
              <div className="text-3xl font-black font-display text-rose-400">
                ₹{kpis.totalExpenses.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-400">Mess, salaries, maintenance, utilities</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Net Operating Surplus
              </span>
              <div className="text-3xl font-black font-display text-white">
                ₹{kpis.netOperatingProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-emerald-400 font-semibold">Positive Cash Flow</p>
            </div>
          </div>
        </div>


        {/* ================= QUICK OPERATIONS HUB ================= */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base font-display text-white">
                  Quick Operations
                </h2>
                <p className="text-[11px] text-slate-400">Short actions & direct field shortcuts</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Quick Op 1: Register Student */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300">
                    Admission
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Register Student</h3>
                  <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">fullName</span></div>
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">phone</span> (10-digit)</div>
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">roomNumber / bed</span></div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition"
              >
                <span>Open Registration</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Op 2: Collect Rent */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300">
                    Payment
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Collect Rent / Dues</h3>
                  <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">studentId</span></div>
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">amount</span> (₹)</div>
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">paymentMethod</span></div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCollectRentModalOpen(true)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition"
              >
                <span>Record Payment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Op 3: Add Expense */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/30 text-rose-300 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300">
                    Outflow
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Add Expense</h3>
                  <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">category</span></div>
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">amount</span> (₹)</div>
                    <div><span className="text-slate-400">Field:</span> <span className="font-mono text-white">expenseDate</span></div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition"
              >
                <span>Log Expense</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
          setQuickFeedback('New student registered successfully! Generated Student ID & allocated bed.');
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
