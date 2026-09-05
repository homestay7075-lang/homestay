'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import {
  Smartphone,
  Download,
  CheckCircle2,
  ArrowLeft,
  Package,
  Copy,
  Check,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import InstallPwaButton from '@/components/common/InstallPwaButton';

export default function DownloadAppPage() {
  const { hostelName } = useHostelSettings();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const appUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : 'https://homestay-alpha.vercel.app/login';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownload = (format: string) => {
    setDownloadingFormat(format);
    setTimeout(() => setDownloadingFormat(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Header Back & Verification */}
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
              Official Verified Release
            </span>
          </div>

          {/* Main Download Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
            {/* App Brand Header */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <img
                src="/logo.png"
                alt="Home Stay Logo"
                className="w-16 h-16 rounded-2xl shadow-md border border-slate-100 object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 font-display">Home Stay</h1>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold font-mono">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single Unified App for Students, Wardens &amp; Owners
                </p>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Package: <span className="font-semibold text-indigo-600">com.homestay.app</span>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Choose Download Option:
              </span>

              {/* Option 1: Official .AAB (Google Play Store) */}
              <a
                href="/api/download/aab?role=single&format=aab"
                download="homestay-release.aab"
                onClick={() => handleDownload('aab')}
                className="w-full p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-between shadow-md shadow-indigo-600/25 transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm sm:text-base">Download Official .AAB</div>
                    <div className="text-[11px] text-indigo-200">Google Play Console Package (~860 KB)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-white/20 font-mono">
                    {downloadingFormat === 'aab' ? 'Downloading...' : '.AAB'}
                  </span>
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
                </div>
              </a>

              {/* Option 2: Direct Phone Install (.APK) */}
              <a
                href="/api/download/aab?role=single&format=apk"
                download="homestay-v1.0.0.apk"
                onClick={() => handleDownload('apk')}
                className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-between shadow-md transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm sm:text-base">Download Direct .APK</div>
                    <div className="text-[11px] text-slate-400">Direct phone install / sideload (~860 KB)</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-white/10 text-emerald-400 font-mono">
                    {downloadingFormat === 'apk' ? 'Downloading...' : '.APK'}
                  </span>
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition" />
                </div>
              </a>

              {/* Option 3: Instant Progressive Web App */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-900">Install Progressive Web App</div>
                    <div className="text-[11px] text-slate-500">Instant home screen app • Zero download</div>
                  </div>
                </div>
                <InstallPwaButton label="Install PWA" className="px-3 py-2 text-xs shrink-0" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedUrl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{copiedUrl ? 'Copied Web Link!' : 'Copy App Link'}</span>
              </button>

              <Link
                href="/login"
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Open Universal Login</span>
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
