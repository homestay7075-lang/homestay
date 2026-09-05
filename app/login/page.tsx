'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import { Shield, Loader2, ArrowLeft, Bed, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials } = useAuth();
  const { settings, hostelName } = useHostelSettings();

  const [identifier, setIdentifier] = useState('owner@serenityliving.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update default identifier if settings.email is present
  useEffect(() => {
    if (settings?.email) {
      setIdentifier(settings.email);
    }
  }, [settings?.email]);

  const handleManagementLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const result = await loginWithCredentials(identifier, password);
    setIsLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setErrorMsg(result.error || 'Failed to login');
    }
  };

  const fillDemo = (role: 'OWNER' | 'WARDEN' | 'STAFF') => {
    if (role === 'OWNER') {
      setIdentifier(settings.email || 'owner@serenityliving.com');
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
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public Website
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Bed className="w-6 h-6" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold block mb-1">
            Hostel Management Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Welcome to {hostelName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Single-Owner Hostel Management & Administrative Access
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleManagementLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email or Registered Phone
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="owner@serenityliving.com or 9876543210"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Pre-Fill buttons */}
          <div className="pt-4 border-t border-slate-700/80 space-y-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              1-Click Demo Profiles:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('OWNER')}
                className="p-2.5 bg-slate-900/90 hover:bg-slate-700 rounded-lg text-left border border-slate-700 transition"
              >
                <div className="font-semibold text-amber-400">Hostel Owner</div>
                <div className="text-[10px] text-slate-400">Full Master Control</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('WARDEN')}
                className="p-2.5 bg-slate-900/90 hover:bg-slate-700 rounded-lg text-left border border-slate-700 transition"
              >
                <div className="font-semibold text-emerald-400">Chief Warden</div>
                <div className="text-[10px] text-slate-400">Block A & B Admin</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('STAFF')}
                className="p-2.5 bg-slate-900/90 hover:bg-slate-700 rounded-lg text-left border border-slate-700 transition"
              >
                <div className="font-semibold text-cyan-400">Block A Staff</div>
                <div className="text-[10px] text-slate-400">Restricted to Block A</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
