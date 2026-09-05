'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Shield, User, GraduationCap, Globe, LogOut, ChevronDown, Sparkles } from 'lucide-react';

export default function TopDemoBar() {
  const { currentUser, currentRole, switchRoleQuick, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside aria-label="Demo role selector" className="no-print bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-1.5 px-3 md:px-6 transition-all duration-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Active Role:
          </span>
          <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700" suppressHydrationWarning>
            {currentRole ? `${currentRole} (${currentUser?.fullName || 'User'})` : 'Public Visitor'}
          </span>
          {currentUser?.staffTitle && (
            <span className="hidden sm:inline text-slate-400 text-[11px]" suppressHydrationWarning>
              • {currentUser.staffTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 mr-1 hidden md:inline">Quick Switch:</span>

          <Link
            href="/"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition"
          >
            <Globe className="w-3 h-3 text-blue-400" />
            Website
          </Link>

          <button
            onClick={() => switchRoleQuick('OWNER')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition font-medium ${
              currentRole === 'OWNER'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Shield className="w-3 h-3 text-amber-400" />
            Owner
          </button>

          <button
            onClick={() => switchRoleQuick('WARDEN')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition font-medium ${
              currentRole === 'WARDEN'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <User className="w-3 h-3 text-emerald-400" />
            Warden
          </button>

          <button
            onClick={() => switchRoleQuick('STUDENT')}
            className={`px-2 py-1 rounded flex items-center gap-1 transition font-medium ${
              currentRole === 'STUDENT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <GraduationCap className="w-3 h-3 text-cyan-400" />
            Student App
          </button>

          {currentUser ? (
            <button
              onClick={logout}
              title="Logout"
              className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 transition ml-1"
            >
              <LogOut className="w-3 h-3" />
            </button>
          ) : (
            <Link
              href="/login"
              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
