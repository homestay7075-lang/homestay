'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import {
  Key,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  MessageCircle,
  Clock,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060814] text-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoading: authLoading, loginWithCredentials } = useAuth();
  const { settings, hostelName } = useHostelSettings();

  const isExpired = searchParams.get('reason') === 'expired' || searchParams.get('expired') === '1';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const supportPhone = settings?.phone || '9876543210';

  // Stay logged in: If user session is active and not expired, redirect to app directly
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role === 'STUDENT') {
        router.replace('/app');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [currentUser, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const result = await loginWithCredentials(identifier.trim(), password);
    setIsLoading(false);

    if (result.success && result.user) {
      if (result.user.role === 'STUDENT') {
        router.push('/app');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg(result.error || 'Invalid credentials. Please verify phone/password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Background Ambient Neon Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-br from-purple-700/20 via-indigo-600/15 to-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern at Bottom matching screenshot */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(99, 102, 241, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, transparent 30%, black 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 30%, black 85%)',
        }}
      />

      <div className="w-full max-w-[420px] relative z-10 space-y-4">
        {/* Top Right 'Get Support ↗' Button matching screenshot */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition shadow-sm backdrop-blur-md"
          >
            <span>Get Support</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Main Authentication Card */}
        <div className="w-full bg-[#0a0d20]/85 backdrop-blur-2xl border border-indigo-500/25 rounded-[32px] p-6 sm:p-8 shadow-[0_10px_50px_-10px_rgba(99,102,241,0.25)] relative overflow-hidden space-y-6">
          {/* Subtle neon gradient border highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

          {/* Logo & Hostel Name Header */}
          <div className="text-center space-y-2.5">
            {/* Cyan HS House Logo Icon matching screenshot */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#131b38] to-[#090d1f] border border-cyan-500/40 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20 relative group">
              <div className="absolute inset-0 rounded-2xl bg-cyan-400/10 blur-sm pointer-events-none" />
              <svg
                className="w-9 h-9 text-cyan-400 relative z-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10L12 3l9 7" />
                <path d="M5 9.5v10.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
                <text
                  x="12"
                  y="17.5"
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="900"
                  fill="#22d3ee"
                  stroke="none"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="-0.5px"
                >
                  HS
                </text>
              </svg>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide font-display">
                {hostelName || 'Home Stay Hostel'}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-purple-400/90 uppercase tracking-[0.2em] mt-0.5">
                {settings?.tagline || 'PREMIUM ACCOMMODATION STAY'}
              </p>
            </div>
          </div>

          {/* Key Icon & System Sign In Title matching screenshot */}
          <div className="text-center space-y-1 pt-1">
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-bold text-white">
              <Key className="w-4 h-4 text-purple-400 -rotate-45" />
              <span>System Sign In</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Single-tenant authentication gateway.
            </p>
          </div>

          {/* 6-Day Inactivity Session Expiration Alert */}
          {isExpired && (
            <div className="p-3 bg-amber-950/80 border border-amber-600/70 rounded-2xl text-amber-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 shadow-md">
              <Clock className="w-4 h-4 shrink-0 text-amber-400" />
              <div className="leading-snug text-left">
                <strong className="block font-bold text-amber-300">Session Expired (6 Days Inactive)</strong>
                <span>You were automatically signed out after 6 days of inactivity. Please sign in again.</span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone Number Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-slate-400 tracking-wide">
                  Registered Mobile Number (Student ID)
                </label>
                <span className="text-[10px] text-purple-400 font-mono">10 Digits</span>
              </div>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter 10-digit registered number"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#050713]/90 border border-slate-800/90 focus:border-purple-500/80 rounded-2xl text-white text-sm font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Residents log in using only their registered mobile number & password.
              </span>
            </div>

            {/* Password Input with Eye reveal */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-slate-400 tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition font-medium"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-24 py-3.5 bg-[#050713]/90 border border-slate-800/90 focus:border-purple-500/80 rounded-2xl text-white text-sm font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 px-2.5 py-1.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 z-10 select-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-purple-300">Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-200">Show</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Authenticate Session Button matching screenshot */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-sm tracking-wide shadow-[0_8px_25px_-5px_rgba(147,51,234,0.45)] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Emergency Support? Call Host matching screenshot */}
          <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
            <div>
              <span>Emergency Support? </span>
              <a
                href={`tel:${supportPhone}`}
                className="text-purple-400 hover:text-purple-300 font-semibold transition hover:underline"
              >
                Call Host
              </a>
            </div>

            {/* Quick Demo Credentials Autofill */}
            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>Demo Logins:</span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('9876543210');
                  setPassword('admin123');
                  setErrorMsg('');
                }}
                className="px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 hover:border-purple-400 text-purple-300 text-[11px] font-semibold transition"
              >
                Owner (admin123)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('9123456780');
                  setPassword('student123');
                  setErrorMsg('');
                }}
                className="px-2.5 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-[11px] font-semibold transition"
              >
                Student (student123)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Dialog Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Hostel Desk Support</h3>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              For emergency gate entry, admission status, or login assistance, reach out directly:
            </p>

            <div className="space-y-2 pt-2">
              <a
                href={`tel:${supportPhone}`}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call Warden / Host ({supportPhone})</span>
              </a>

              <a
                href={`https://wa.me/91${supportPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Desk Support</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password / Default Credentials Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Default Access Credentials</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Use these standard system credentials or select one below to autofill and sign in:
            </p>

            <div className="space-y-2 pt-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('9876543210');
                  setPassword('admin123');
                  setShowForgotModal(false);
                  setErrorMsg('');
                }}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-purple-500/40 text-left flex items-center justify-between transition"
              >
                <div>
                  <div className="text-purple-300 font-bold">Owner / Admin</div>
                  <div className="text-slate-400 text-[11px]">Phone: 9876543210 | Pass: admin123</div>
                </div>
                <span className="text-[11px] text-purple-400 font-sans font-semibold">Autofill ➔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('9123456780');
                  setPassword('student123');
                  setShowForgotModal(false);
                  setErrorMsg('');
                }}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/40 text-left flex items-center justify-between transition"
              >
                <div>
                  <div className="text-cyan-300 font-bold">Student Resident</div>
                  <div className="text-slate-400 text-[11px]">Phone: 9123456780 | Pass: student123</div>
                </div>
                <span className="text-[11px] text-cyan-400 font-sans font-semibold">Autofill ➔</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('9876543211');
                  setPassword('warden123');
                  setShowForgotModal(false);
                  setErrorMsg('');
                }}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/40 text-left flex items-center justify-between transition"
              >
                <div>
                  <div className="text-emerald-300 font-bold">Chief Warden</div>
                  <div className="text-slate-400 text-[11px]">Phone: 9876543211 | Pass: warden123</div>
                </div>
                <span className="text-[11px] text-emerald-400 font-sans font-semibold">Autofill ➔</span>
              </button>
            </div>

            <div className="pt-2">
              <a
                href={`tel:${supportPhone}`}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Host Desk ({supportPhone})</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
