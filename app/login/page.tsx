'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import {
  Shield,
  Loader2,
  ArrowLeft,
  Bed,
  AlertCircle,
  Smartphone,
  Building,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  LogOut,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

type DemoRole = 'STUDENT' | 'OWNER' | 'WARDEN' | 'STAFF';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loginWithCredentials, logout } = useAuth();
  const { settings, hostelName } = useHostelSettings();

  const [identifier, setIdentifier] = useState('9123456783');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleType, setSelectedRoleType] = useState<DemoRole>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const result = await loginWithCredentials(identifier, password);
    setIsLoading(false);

    if (result.success && result.user) {
      if (result.user.role === 'STUDENT') {
        router.push('/app');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg(result.error || 'Failed to login. Please verify your credentials.');
    }
  };

  const fillDemo = (role: DemoRole) => {
    setSelectedRoleType(role);
    setErrorMsg('');
    if (role === 'STUDENT') {
      setIdentifier('9123456783');
      setPassword('student123');
    } else if (role === 'OWNER') {
      setIdentifier(settings?.email || 'owner@serenityliving.com');
      setPassword('admin123');
    } else if (role === 'WARDEN') {
      setIdentifier('warden@serenityliving.com');
      setPassword('warden123');
    } else if (role === 'STAFF') {
      setIdentifier('staff.ramesh@serenityliving.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-r from-indigo-600/20 via-blue-600/15 to-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="max-w-xl w-full mx-auto relative z-10 space-y-6">
        {/* Top Back Link & Badge */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Website</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Single App • All Logins</span>
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-600/25 border border-indigo-400/30">
            <Bed className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold block mb-1">
              {hostelName} Universal Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              Sign In to Home Stay
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              One unified app for everyone. Log in to automatically access your student pass, warden desk, or owner hub.
            </p>
          </div>
        </div>

        {/* Already Logged In Quick Resume Card */}
        {currentUser && (
          <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Currently Signed In
              </span>
              <div className="font-bold text-sm text-white truncate">
                {currentUser.fullName}
              </div>
              <div className="text-xs text-indigo-400 font-medium">
                Role: {currentUser.role}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={currentUser.role === 'STUDENT' ? '/app' : '/dashboard'}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Resume Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Unified Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email, Registered Mobile Number, or Student ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9123456783, STU-2026-0004, or owner@serenityliving.com"
                  className="w-full px-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder:text-slate-600"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Supports all account types with automatic destination routing.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-500">
                  Default demo passwords provided below
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Account & Role...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Sign In to Home Stay</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Profiles for all 4 roles */}
          <div className="pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
                1-Click Universal Demo Logins:
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">
                Click any profile to pre-fill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Profile 1: STUDENT / RESIDENT */}
              <button
                type="button"
                onClick={() => fillDemo('STUDENT')}
                className={`p-3 rounded-xl text-left border transition relative flex items-start gap-3 ${
                  selectedRoleType === 'STUDENT'
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <span>Resident Student</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-indigo-900/80 border border-indigo-700 text-indigo-300 rounded font-mono">
                      /app
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Devika Nair • Room 202</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: 9123456783</div>
                </div>
              </button>

              {/* Profile 2: HOSTEL OWNER */}
              <button
                type="button"
                onClick={() => fillDemo('OWNER')}
                className={`p-3 rounded-xl text-left border transition relative flex items-start gap-3 ${
                  selectedRoleType === 'OWNER'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Building className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>Hostel Owner</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-900/60 border border-amber-700 text-amber-300 rounded font-mono">
                      /dashboard
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Rajesh Singhania</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Full Master Controls</div>
                </div>
              </button>

              {/* Profile 3: CHIEF WARDEN */}
              <button
                type="button"
                onClick={() => fillDemo('WARDEN')}
                className={`p-3 rounded-xl text-left border transition relative flex items-start gap-3 ${
                  selectedRoleType === 'WARDEN'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>Chief Warden</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-900/60 border border-emerald-700 text-emerald-300 rounded font-mono">
                      /dashboard
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Col. Vikram Rathore</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Block A & B Admin</div>
                </div>
              </button>

              {/* Profile 4: STAFF ASSISTANT */}
              <button
                type="button"
                onClick={() => fillDemo('STAFF')}
                className={`p-3 rounded-xl text-left border transition relative flex items-start gap-3 ${
                  selectedRoleType === 'STAFF'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>Block Staff</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-cyan-900/60 border border-cyan-700 text-cyan-300 rounded font-mono">
                      /dashboard
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Ramesh Patel</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Block A Operations</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Encrypted Session • Automatic Dynamic Role Interface</span>
        </div>
      </div>
    </div>
  );
}
