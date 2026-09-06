'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  History,
  Bed,
  CalendarCheck,
  CreditCard,
  Receipt,
  FileText,
  Wallet,
  UserCheck,
  Bell,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
  Smartphone,
  MoreHorizontal,
} from 'lucide-react';
import InstallPwaButton from '@/components/common/InstallPwaButton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentRole, isLoading, logout } = useAuth();
  const { hostelName } = useHostelSettings();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/login');
    } else if (currentUser?.role === 'STUDENT') {
      router.replace('/app');
    }
  }, [isLoading, currentUser, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-slate-400 font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (currentUser?.role === 'STUDENT') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto text-white">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Redirecting to Resident Portal...</h2>
          <p className="text-xs text-slate-400">
            You are logged in as a resident student. Redirecting to your personal digital pass and dues center.
          </p>
          <Link href="/app" className="inline-block px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white">
            Go to Resident App
          </Link>
        </div>
      </div>
    );
  }

  // RBAC Navigation filtering
  const canAccess = (module: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'OWNER') return true;
    if (currentUser.role === 'STUDENT') return false;

    // Staff / Warden permission check
    const perms = currentUser.permissions as any;
    if (!perms) return true; // Default to allow if not explicitly restricted
    if (perms[module]) {
      return perms[module].view !== false;
    }
    return true;
  };

  const isOwner = currentRole === 'OWNER';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, visible: true },
    { name: 'Students', href: '/dashboard/students', icon: Users, visible: canAccess('students') },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Wallet, visible: canAccess('expenses') },
    { name: 'Payments & Dues', href: '/dashboard/payments', icon: CreditCard, visible: canAccess('payments') },
    { name: 'Rooms & Beds', href: '/dashboard/rooms', icon: Bed, visible: canAccess('rooms') },
    { name: 'Web Bookings', href: '/dashboard/bookings', icon: CalendarCheck, visible: canAccess('bookings') },
    { name: 'Staff & Roles', href: '/dashboard/staff', icon: UserCheck, visible: isOwner },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, visible: canAccess('notifications') },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare, visible: canAccess('messages') },
    { name: 'Reports & Print', href: '/dashboard/reports', icon: BarChart3, visible: canAccess('reports') },
    { name: isOwner ? 'Owner Profile & Settings' : 'My Profile & Account', href: '/dashboard/profile', icon: isOwner ? Settings : Shield, visible: true },
  ].filter(item => item.visible);

  const profileCardTitle = isOwner ? 'Open Owner Profile & Settings' : 'Open My Profile & Account';

  return (
    <div className="min-h-screen flex bg-slate-100/90 text-slate-800">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="no-print hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/25">
            <Bed className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base font-display leading-tight tracking-tight truncate max-w-[160px]" title={hostelName}>
              {hostelName}
            </h1>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block">
              Hostel Command Center
            </span>
          </div>
        </div>

        {/* Current Active Role Card */}
        <Link
          href="/dashboard/profile"
          className="p-3 m-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition block group"
          title={profileCardTitle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="font-semibold text-white text-xs truncate">
                  {currentUser?.fullName || 'Hostel Staff'}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{currentUser?.username ? `@${currentUser.username} • ` : ''}{isOwner ? 'Hostel Owner' : currentUser?.staffTitle || currentRole || 'Staff Member'}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition shrink-0 ml-1" />
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Install Dashboard App & Logout */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="px-1">
            <InstallPwaButton
              label="Install Dashboard App"
              className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
            />
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header Bar */}
        <header className="no-print lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-slate-800 shadow-sm">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm font-display truncate max-w-[160px]" title={hostelName}>{hostelName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold">
              {currentRole}
            </span>
          </div>
        </header>

        {/* Mobile Slide-over Drawer */}
        {mobileSidebarOpen && (
          <div className="no-print lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] bg-slate-900 text-slate-300 flex flex-col h-full z-10 shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="font-bold text-white text-sm font-display truncate max-w-[180px]" title={hostelName}>{hostelName}</div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    logout();
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-950/40 text-xs font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="flex-1 px-4 py-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {children}
        </main>

        {/* ================= MOBILE BOTTOM NAVIGATION (MATCHING SCREENSHOT) ================= */}
        <nav aria-label="Mobile navigation" className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-lg">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              pathname === '/dashboard' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            href="/dashboard/students"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              pathname === '/dashboard/students' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Students</span>
          </Link>

          <Link
            href="/dashboard/expenses"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              pathname === '/dashboard/expenses' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Expenses</span>
          </Link>

          <Link
            href="/dashboard/payments"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              pathname === '/dashboard/payments' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Payments</span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex flex-col items-center justify-center py-0.5 px-2 transition group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              pathname === '/dashboard/profile' || pathname === '/dashboard/more'
                ? 'bg-blue-100 text-blue-700 font-bold ring-2 ring-blue-600/30 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}>
              <MoreHorizontal className="w-4 h-4" />
            </div>
            <span className={`text-[10px] mt-0.5 ${
              pathname === '/dashboard/profile' || pathname === '/dashboard/more' ? 'text-blue-700 font-bold' : 'text-slate-500'
            }`}>More</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
