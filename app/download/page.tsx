'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import {
  Download,
  CheckCircle2,
  ArrowLeft,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import InstallPwaButton from '@/components/common/InstallPwaButton';

export default function DownloadAppPage() {
  const { hostelName } = useHostelSettings();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const appUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : 'https://homestay-alpha.vercel.app/login';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadClick = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 3500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Header Back & Verified Status */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Safe Download
            </span>
          </div>

          {/* Main Download Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 text-center">
            {/* App Brand Header */}
            <div className="flex flex-col items-center space-y-3">
              <img
                src="/logo.png"
                alt="Home Stay Logo"
                className="w-20 h-20 rounded-2xl shadow-lg border border-slate-100 object-cover"
              />
              <div>
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                    Home Stay
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold font-mono">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Official Mobile App for Students, Wardens &amp; Owners
                </p>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Package: <span className="font-semibold text-indigo-600">com.homestay.app</span>
                </div>
              </div>
            </div>

            {/* Direct Download Button */}
            <div className="space-y-3 pt-2">
              <a
                href="/downloads/homestay-app.apk"
                download="homestay-app.apk"
                onClick={handleDownloadClick}
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30 transition text-sm sm:text-base font-bold"
              >
                <Download className="w-5 h-5 animate-bounce" />
                <span>{isDownloading ? 'Starting Download...' : 'Download App (Android APK)'}</span>
                <span className="text-xs font-normal opacity-80">(~860 KB)</span>
              </a>

              {/* Instant Web PWA Install option */}
              <div className="pt-1">
                <InstallPwaButton label="Or Install Web App to Device" className="w-full justify-center py-2.5 text-xs" />
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600 text-left">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Single All-in-One App</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Digital Pass &amp; Dues</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Instant Offline Install</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Owner &amp; Staff Desk</span>
              </div>
            </div>

            {/* Quick Actions: Open Login / Copy Link */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedUrl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{copiedUrl ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <Link
                href="/login"
                className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Open Login</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
