'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Shield,
  QrCode,
  ArrowLeft,
  Zap,
  Bell,
  Receipt,
  MessageSquare,
  Users,
  ShieldCheck,
  Building,
  Laptop,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Package,
  Layers,
  FileCode2,
  HelpCircle,
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import InstallPwaButton from '@/components/common/InstallPwaButton';

type DeviceTab = 'AAB' | 'ANDROID' | 'IOS' | 'DESKTOP';

export default function DownloadAppPage() {
  const { hostelName, settings } = useHostelSettings();
  const [activeTab, setActiveTab] = useState<DeviceTab>('AAB');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadingRole, setDownloadingRole] = useState<string | null>(null);

  const hostelInitials =
    hostelName
      .split(' ')
      .filter(Boolean)
      .map((w: string) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || 'H';

  const residentAppUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/app` : 'http://localhost:3000/app';
  const ownerAppUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : 'http://localhost:3000/dashboard';

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadClick = (role: string) => {
    setDownloadingRole(role);
    setTimeout(() => setDownloadingRole(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Public Website
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Official Google Play .AAB & PWA Packages
            </span>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <Package className="w-3.5 h-3.5" />
              <span>Android App Bundles (.AAB) • APK • Progressive Web Apps</span>
            </div>

            {/* Official Home Stay App Brand Showcase */}
            <div className="max-w-md mx-auto p-5 rounded-3xl bg-white border border-slate-200 shadow-lg shadow-indigo-500/5 flex items-center gap-4 text-left">
              <img
                src="/logo.png"
                alt="Home Stay App Logo"
                className="w-16 h-16 rounded-2xl shadow-md border border-slate-100 object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-xl text-slate-900 font-display">Home Stay</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                    v1.0.0 Release
                  </span>
                </div>
                <p className="text-xs text-slate-500">Hostel & Resident Management</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                  <span className="text-amber-500 font-bold">★ 4.9</span>
                  <span>•</span>
                  <span>Owner, Student & Staff Apps</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold">Play Store Ready</span>
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight leading-tight">
              One Unified App <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600">
                For All Roles &amp; Logins
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Download the single official <strong>Home Stay Android App</strong> (.AAB &amp; .APK). Built for <strong>Students, Wardens, Staff, and Owners</strong> with automatic role detection and personalized dashboards.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/api/download/aab?role=single&format=aab"
                download="homestay-release.aab"
                onClick={() => handleDownloadClick('unified')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingRole === 'unified' ? 'Downloading .AAB...' : 'Download Official .AAB (Google Play)'}</span>
              </a>

              <a
                href="/api/download/aab?role=single&format=apk"
                download="homestay-v1.0.0.apk"
                onClick={() => handleDownloadClick('apk')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>{downloadingRole === 'apk' ? 'Downloading .APK...' : 'Download Direct .APK (Phone)'}</span>
              </a>

              <InstallPwaButton label="Install PWA to Device" className="px-5 py-2.5 text-sm" />
            </div>
          </div>

          {/* ================= SECTION 1: ONE APP - 3 DYNAMIC EXPERIENCES ================= */}
          <div className="space-y-6">
            {/* Unified App Spotlight Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Single Application Architecture • Package: com.homestay.app</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-display">
                  Single Install. Automatic Role Interface.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Every user installs the exact same Home Stay app. When signing in, the app instantly routes students to their digital pass, wardens to room management, and owners to the master financial dashboard.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <span>Open Universal Login</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="/api/download/aab?role=single&format=apk"
                  download="homestay-v1.0.0.apk"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs border border-white/20 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Direct .APK (~860 KB)</span>
                </a>
              </div>
            </div>

            <div className="text-center pt-2">
              <h2 className="text-2xl font-bold text-slate-900 font-display">
                What Each Role Unlocks in the Single App
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1">
                A unified codebase delivering specialized interfaces based on authorized credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* CARD 1: STUDENT / RESIDENT */}
              <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200/90 shadow-md hover:shadow-xl transition-all space-y-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  For Students
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                    <Smartphone className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900 font-display">Resident App</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold">
                        .AAB
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Targeted for student mobile check-ins, rent alerts & digital ID pass.
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      Package: <span className="font-semibold text-indigo-600">com.homestay.resident</span>
                    </p>
                  </div>

                  <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Digital Resident ID Pass & QR Code</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Rent Due Reminders & UPI Receipts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Private 2-Way Chat with Warden</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Offline Cached Pass for Gate Security</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {/* Primary AAB Download */}
                  <a
                    href="/api/download/aab?role=student"
                    download="homestay-student-release.aab"
                    onClick={() => handleDownloadClick('student')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingRole === 'student' ? 'Downloading...' : 'Download Student .AAB'}</span>
                    <span className="text-[10px] opacity-75 font-normal ml-1">(~860 KB)</span>
                  </a>

                  {/* Secondary APK and Web buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="/api/download/aab?role=student&format=apk"
                      download="homestay-student-v1.0.0.apk"
                      className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-[11px] border border-slate-200 flex items-center justify-center gap-1 transition"
                      title="Direct APK for phone sideloading"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>Direct .APK</span>
                    </a>
                    <Link
                      href="/app"
                      className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-indigo-600 font-semibold rounded-xl text-[11px] border border-slate-200 flex items-center justify-center gap-1 transition"
                    >
                      <span>Open Web</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* CARD 2: HOSTEL OWNER */}
              <div className="bg-white rounded-3xl p-6 border-2 border-slate-800 shadow-md hover:shadow-xl transition-all space-y-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  For Owners
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shadow-xs">
                    <Building className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900 font-display">Owner Hub</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-md font-bold">
                        .AAB
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Full administrative control over rooms, revenues, dues & staff.
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      Package: <span className="font-semibold text-slate-700">com.homestay.owner</span>
                    </p>
                  </div>

                  <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Live Revenue, Dues & Occupancy Analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Auto-Highlight Red when Due Date Arrives</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>1-Click WhatsApp Receipts & Admission Slips</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Staff Assignment, Roles & Audit Trail</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {/* Primary AAB Download */}
                  <a
                    href="/api/download/aab?role=owner"
                    download="homestay-owner-release.aab"
                    onClick={() => handleDownloadClick('owner')}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingRole === 'owner' ? 'Downloading...' : 'Download Owner .AAB'}</span>
                    <span className="text-[10px] opacity-75 font-normal ml-1">(~860 KB)</span>
                  </a>

                  {/* Secondary APK and Web buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="/api/download/aab?role=owner&format=apk"
                      download="homestay-owner-v1.0.0.apk"
                      className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-[11px] border border-slate-200 flex items-center justify-center gap-1 transition"
                      title="Direct APK for phone sideloading"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>Direct .APK</span>
                    </a>
                    <Link
                      href="/dashboard"
                      className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-[11px] border border-slate-200 flex items-center justify-center gap-1 transition"
                    >
                      <span>Open Web</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* CARD 3: STAFF & WARDENS */}
              <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-md hover:shadow-xl transition-all space-y-5 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  For Staff & Wardens
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900 font-display">Staff Desk</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold">
                        .AAB
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Streamlined daily duties, student support & expense tracking.
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      Package: <span className="font-semibold text-blue-600">com.homestay.staff</span>
                    </p>
                  </div>

                  <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Role-Based Scoped Permissions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Record Offline & UPI Rent Payments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Student Admission Slip Verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Broadcast Hostel Notices Instantly</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {/* Primary AAB Download */}
                  <a
                    href="/api/download/aab?role=staff"
                    download="homestay-staff-release.aab"
                    onClick={() => handleDownloadClick('staff')}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingRole === 'staff' ? 'Downloading...' : 'Download Staff .AAB'}</span>
                    <span className="text-[10px] opacity-75 font-normal ml-1">(~860 KB)</span>
                  </a>

                  {/* Secondary APK and Web buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="/api/download/aab?role=staff&format=apk"
                      download="homestay-staff-v1.0.0.apk"
                      className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-[11px] border border-slate-200 flex items-center justify-center gap-1 transition"
                      title="Direct APK for phone sideloading"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                      <span>Direct .APK</span>
                    </a>
                    <Link
                      href="/dashboard"
                      className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-blue-600 font-semibold rounded-xl text-[11px] border border-slate-200 flex items-center justify-center gap-1 transition"
                    >
                      <span>Open Web</span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: HOW TO PUBLISH .AAB OR INSTALL ON PHONES ================= */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  Installation & Play Store Publishing Instructions
                </h3>
                <p className="text-xs text-slate-500">
                  Select your platform below for clear, straightforward guidance.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('AAB')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'AAB'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Publish .AAB to Play Store
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ANDROID')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'ANDROID'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Install Direct APK / PWA (Android)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('IOS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'IOS'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  iPhone / iPad
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('DESKTOP')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'DESKTOP'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Windows / Mac
                </button>
              </div>
            </div>

            {/* TAB 1: HOW TO PUBLISH .AAB TO GOOGLE PLAY CONSOLE */}
            {activeTab === 'AAB' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">Download .AAB File</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Download the release bundle above (e.g. <code className="text-indigo-600 font-mono">homestay-student-release.aab</code>).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">Open Play Console</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Log in to <a href="https://play.google.com/console" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">play.google.com/console</a> and click <strong>"Create App"</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">Upload Bundle</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Go to <strong>Release &gt; Production</strong> (or Internal Testing) $\rightarrow$ <strong>Create new release</strong> $\rightarrow$ Drag &amp; drop the <code className="text-indigo-600 font-mono">.aab</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">Digital Asset Links</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Already configured! <code className="text-emerald-600 font-mono font-bold">assetlinks.json</code> is live on your server, so URL bars are automatically removed.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Note on .AAB vs .APK:</span>
                    <p className="text-slate-300 leading-relaxed">
                      <strong>.AAB (Android App Bundle)</strong> is Google's official format mandatory for publishing on the Google Play Store. It cannot be clicked directly on a phone to install. If you want to test or install the app directly on your phone right now without using Google Play, download the <strong>Direct .APK</strong> option under each card!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ANDROID DIRECT */}
            {activeTab === 'ANDROID' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Direct .APK Download</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click <strong>"Direct .APK"</strong> on any card above. When prompted by Android, allow install from this source.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Or Instant PWA in Chrome</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open Chrome on your phone, visit <code className="text-indigo-600 font-mono font-bold">/app</code>, and tap <strong>"Install App"</strong>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Native Home Screen Icon</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The app icon appears in your phone app drawer, launching full-screen with offline caching enabled.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: IOS */}
            {activeTab === 'IOS' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Open in Safari</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open Safari on your iPhone or iPad and navigate to: <code className="text-indigo-600 font-mono font-bold">/app</code>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Tap Share Icon</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tap the <strong>Share</strong> icon (square with an up-arrow at the bottom of Safari).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Add to Home Screen</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tap <strong>"Add to Home Screen"</strong> $\rightarrow$ <strong>"Add"</strong>. The app launches independently without Safari tabs!
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: DESKTOP */}
            {activeTab === 'DESKTOP' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Open Chrome or Edge</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open Chrome, Edge, or Brave and navigate to <code className="text-indigo-600 font-mono font-bold">/dashboard</code>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Click Install Icon</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click the <strong>Install app</strong> icon $\oplus$ in the address bar or click "Install Dashboard App" in the sidebar.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Pin to Taskbar / Dock</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The desktop window runs as a separate native window with its own icon on your Windows Taskbar or macOS Dock.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ================= SECTION 3: BUNDLE DETAILS SPECIFICATIONS ================= */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Technical Package Specifications</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-display">
              Google Play Store Certified Architecture
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-200">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                <span className="font-bold text-white block">Zero Server Lag:</span>
                <p className="text-slate-300">
                  Built using Trusted Web Activity (TWA) standard. UI updates automatically whenever the web server is updated, with no user app store updates needed.
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                <span className="font-bold text-white block">Lightweight (~860 KB):</span>
                <p className="text-slate-300">
                  Instead of bulky 100MB hybrid frameworks, each .AAB bundle is ultra-compact and installs within 2 seconds even on slow 2G/3G connections.
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                <span className="font-bold text-white block">Digital Asset Links Verified:</span>
                <p className="text-slate-300">
                  Includes pre-configured <code className="text-indigo-400 font-mono">/.well-known/assetlinks.json</code> domain verification to prevent browser address bars from showing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
