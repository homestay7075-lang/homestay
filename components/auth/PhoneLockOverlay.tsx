'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import {
  Fingerprint,
  Lock,
  KeyRound,
  Shield,
  AlertCircle,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export default function PhoneLockOverlay() {
  const { currentUser, isAppLocked, isBiometricEnabled, verifyBiometrics, unlockWithPassword, logout } = useAuth();
  const { hostelName, settings } = useHostelSettings();

  const [verifyingBio, setVerifyingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [showPasswordUnlock, setShowPasswordUnlock] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Auto-attempt biometric verification once when locked overlay mounts
  useEffect(() => {
    if (isAppLocked && isBiometricEnabled) {
      let timer = setTimeout(() => {
        handleTriggerBiometrics();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAppLocked, isBiometricEnabled]);

  const handleTriggerBiometrics = async () => {
    if (verifyingBio) return;
    setVerifyingBio(true);
    setBioError(null);
    try {
      const success = await verifyBiometrics();
      if (!success) {
        setBioError('Biometric verification not completed. Tap to retry or use password.');
      }
    } catch (err: any) {
      setBioError(err?.message || 'Biometric authentication failed.');
    } finally {
      setVerifyingBio(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim() || verifyingPassword) return;
    setVerifyingPassword(true);
    setPasswordError(null);

    const success = await unlockWithPassword(passwordInput.trim());
    setVerifyingPassword(false);
    if (!success) {
      setPasswordError('Incorrect password. Please try again.');
    } else {
      setPasswordInput('');
      setShowPasswordUnlock(false);
    }
  };

  if (!isAppLocked || !currentUser) {
    return null;
  }

  const isResident = currentUser.role === 'STUDENT';
  const displayName = currentUser.fullName || currentUser.username || currentUser.phone || 'Resident';
  const roleLabel = isResident ? 'Resident Digital Pass' : 'Hostel Administration';

  return (
    <div className="fixed inset-0 z-[99999] bg-[#060814]/95 backdrop-blur-3xl flex flex-col justify-between items-center p-6 sm:p-8 text-white select-none overflow-y-auto">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-br from-purple-700/25 via-indigo-600/20 to-cyan-500/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(99, 102, 241, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.4) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between relative z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-sm shadow-purple-500/30">
            <Shield className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h1 className="text-xs font-bold font-display text-white tracking-wide">
              {hostelName || 'Home Stay Hostel'}
            </h1>
            <p className="text-[10px] text-purple-400 font-mono tracking-wider uppercase">
              Security Gate Locked
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Protected</span>
        </span>
      </div>

      {/* Main Lock Interactive Center */}
      <div className="w-full max-w-sm my-auto py-8 relative z-10 flex flex-col items-center text-center space-y-6">
        {/* User Identity Preview */}
        <div className="space-y-2">
          <div className="relative inline-block">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/60 shadow-xl shadow-purple-500/20 mx-auto"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-purple-400/50 flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-purple-500/25 mx-auto">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#060814] flex items-center justify-center text-white" title="Active Session">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white tracking-wide font-display">
              {displayName}
            </h2>
            <p className="text-xs text-purple-300 font-mono">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Biometric Fingerprint Pulse Button */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulse Rings */}
            <div className="absolute w-28 h-28 rounded-full border border-purple-500/30 animate-ping pointer-events-none opacity-40" />
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20 pointer-events-none opacity-50" />

            <button
              type="button"
              onClick={handleTriggerBiometrics}
              disabled={verifyingBio}
              className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/90 via-indigo-600/90 to-purple-800/90 hover:from-purple-500 hover:to-indigo-500 border-2 border-purple-400/70 shadow-[0_0_40px_rgba(168,85,247,0.45)] flex items-center justify-center text-white transition transform active:scale-95 disabled:opacity-80 cursor-pointer group"
              title="Unlock with Fingerprint or Phone Lock"
              aria-label="Unlock with Fingerprint or Phone Lock"
            >
              {verifyingBio ? (
                <Loader2 className="w-10 h-10 animate-spin text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              ) : (
                <Fingerprint className="w-12 h-12 text-white group-hover:scale-110 transition drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={handleTriggerBiometrics}
              disabled={verifyingBio}
              className="text-sm font-bold text-white hover:text-purple-300 transition flex items-center justify-center gap-1.5 mx-auto"
            >
              <span>Unlock with Fingerprint / Phone Lock</span>
            </button>
            <p className="text-xs text-slate-400 font-mono">
              Touch phone sensor, Face ID, or enter screen PIN
            </p>
          </div>

          {bioError && (
            <div className="w-full p-2.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="text-[11px] leading-snug text-left">{bioError}</span>
            </div>
          )}
        </div>

        {/* Fallback Option: Password Unlock */}
        <div className="w-full pt-2">
          {!showPasswordUnlock ? (
            <button
              type="button"
              onClick={() => {
                setShowPasswordUnlock(true);
                setPasswordError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition font-medium underline-offset-4 hover:underline"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Or unlock with Account Password</span>
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="w-full space-y-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 animate-in fade-in text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300">
                  Account Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswordUnlock(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              {passwordError && (
                <div className="p-2 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  autoFocus
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-3.5 pr-20 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 px-1.5 py-1 rounded"
                >
                  {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPasswordText ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={verifyingPassword || !passwordInput.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {verifyingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlock Application</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Footer Action */}
      <div className="w-full max-w-sm pt-4 pb-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
        <span className="font-mono text-[10px] text-slate-500">
          Auto-locks after 6 days inactivity
        </span>

        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-medium transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
