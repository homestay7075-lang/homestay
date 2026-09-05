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
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import InstallPwaButton from '@/components/common/InstallPwaButton';

type DeviceTab = 'ANDROID' | 'IOS' | 'DESKTOP';

export default function DownloadAppPage() {
  const { hostelName, settings } = useHostelSettings();
  const [deviceTab, setDeviceTab] = useState<DeviceTab>('ANDROID');
  const [copiedUrl, setCopiedUrl] = useState(false);

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
              100% Multi-Platform Compatible
            </span>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              Progressive Web App (PWA) • No App Store Account Required
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
                    Official App
                  </span>
                </div>
                <p className="text-xs text-slate-500">Hostel & Resident Management</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                  <span className="text-amber-500 font-bold">★ 4.9</span>
                  <span>•</span>
                  <span>500+ Active Users</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold">Verified PWA</span>
                </div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight leading-tight">
              Download & Install <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600">
                Home Stay App
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Install the official <strong>Home Stay</strong> application directly to your home screen or desktop. Enjoy native-grade speed, instant offline access, and automatic updates across all your devices.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <InstallPwaButton label="Install Home Stay App" className="px-5 py-2.5 text-sm" />
              <button
                type="button"
                onClick={() => handleCopyLink(residentAppUrl)}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedUrl ? 'Copied App Link!' : 'Copy Mobile App Link'}</span>
              </button>
            </div>
          </div>

          {/* ================= SECTION 1: 3 TAILORED ROLE EXPERIENCES ================= */}
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 font-display">
                Dedicated Workspaces for Every Role
              </h2>
              <p className="text-xs text-slate-500">
                Each user role gets a specialized, secure interface tailored to their exact workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CARD 1: STUDENT / RESIDENT */}
              <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200/80 shadow-md hover:shadow-lg transition space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  For Residents
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Smartphone className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 font-display">Resident Mobile Portal</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Designed for students & residents staying at {hostelName}.
                    </p>
                  </div>

                  <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Digital Resident ID Pass & QR Code</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Joining-Date Rent Due Alerts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Download Stamped Tax Invoices & Receipts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Private Messaging with Hostel Warden</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Link
                    href="/app"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <span>Launch Resident App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <p className="text-[11px] text-center text-slate-400">
                    Residents log in using their 10-digit mobile number
                  </p>
                </div>
              </div>

              {/* CARD 2: HOSTEL OWNER */}
              <div className="bg-white rounded-3xl p-6 border-2 border-slate-800 shadow-md hover:shadow-lg transition space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  For Owners
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
                    <Building className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 font-display">Owner Executive Hub</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Full administrative control over rooms, revenues, and staff.
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

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Link
                    href="/dashboard"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <span>Launch Owner Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <p className="text-[11px] text-center text-slate-400">
                    Available as desktop app or mobile app
                  </p>
                </div>
              </div>

              {/* CARD 3: STAFF & WARDENS */}
              <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-md hover:shadow-lg transition space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  For Staff & Wardens
                </div>

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 font-display">Staff Operations Desk</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Streamlined daily duties, student support, and maintenance.
                    </p>
                  </div>

                  <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Role-Based Permissions (Warden/Accountant/Manager)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Record Payments & Log Daily Expenses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Resolve Resident Queries & Broadcast Notices</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Student Admission Slip Verification</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <Link
                    href="/dashboard"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <span>Staff Portal Login</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <p className="text-[11px] text-center text-slate-400">
                    Accessible on mobile phones during room inspection rounds
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: HOW TO INSTALL ON EACH DEVICE ================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  Step-by-Step Installation Guide
                </h3>
                <p className="text-xs text-slate-500">
                  Choose your device to see exact 10-second installation instructions.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDeviceTab('ANDROID')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    deviceTab === 'ANDROID'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('IOS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    deviceTab === 'IOS'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  iPhone / iPad
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('DESKTOP')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    deviceTab === 'DESKTOP'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Windows / Mac
                </button>
              </div>
            </div>

            {/* TAB CONTENT: ANDROID */}
            {deviceTab === 'ANDROID' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Open in Chrome</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open Google Chrome on your Android phone and visit your hostel website or resident portal: <code className="text-indigo-600 font-mono font-bold">/app</code>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Tap "Install App"</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tap the <strong>"Install App"</strong> button banner on the page, or tap the Chrome menu <strong>(⋮)</strong> $\rightarrow$ <strong>"Install app"</strong> / <strong>"Add to Home screen"</strong>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Launch from Home Screen</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The app icon appears on your Android app drawer and home screen. It opens full-screen without any browser borders, exactly like a Play Store app!
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: IOS */}
            {deviceTab === 'IOS' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Open in Safari</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open Safari on your iPhone or iPad and navigate to your hostel website or resident portal: <code className="text-indigo-600 font-mono font-bold">/app</code>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Tap Share Button</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tap the <strong>Share</strong> icon (the square with an arrow pointing up at the bottom of Safari).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Tap "Add to Home Screen"</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Scroll down and select <strong>"Add to Home Screen"</strong>, then tap <strong>"Add"</strong> in the top right. The app will be placed directly on your iPhone home screen.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DESKTOP */}
            {deviceTab === 'DESKTOP' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Open in Chrome or Edge</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Open Google Chrome, Microsoft Edge, or Brave on your PC or Mac and navigate to <code className="text-indigo-600 font-mono font-bold">/dashboard</code>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Click Address Bar Icon</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click the <strong>Install app</strong> icon $\oplus$ on the right edge of your browser URL bar, or click <strong>"Install Dashboard App"</strong> in the sidebar.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Pin to Taskbar</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The dashboard opens in a dedicated window with its own desktop shortcut. You can pin it to your Windows Taskbar or macOS Dock!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ================= SECTION 3: FAQ & STORE PACKAGING ================= */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Native APK & Play Store Packaging</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-display">
              Need a Standalone Android APK File or Google Play Store Release?
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              Because this application follows official PWA specifications, you can package this exact web app into a signed Android <strong>.apk</strong> or <strong>.aab</strong> bundle in under 5 minutes using <strong>Google Bubblewrap (TWA)</strong> or <strong>Microsoft PWABuilder</strong>, with zero code modifications.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-200">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-1">Instant Distribution:</span>
                Send your link via WhatsApp; students install in 1 tap without downloading heavy 100MB files.
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-1">Zero Store Fees:</span>
                Avoid Google/Apple 30% developer cuts and lengthy store approval delays.
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="font-bold text-white block mb-1">Always Up-to-Date:</span>
                When you update rates or features on your server, users automatically get the latest version.
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
