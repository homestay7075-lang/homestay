'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bed,
  Download,
  LogIn,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Smartphone,
  Building,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import BookBedModal from './BookBedModal';

export default function PublicNavbar() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { hostelName } = useHostelSettings();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDownloadDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifyDownload = (name: string) => {
    setDownloadToast(`Starting download for ${name}...`);
    setDownloadDropdownOpen(false);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-800 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
                <Bed className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <span
                  className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight block leading-tight"
                  suppressHydrationWarning
                >
                  {hostelName}
                </span>
                <span className="text-[10px] font-medium tracking-wider uppercase text-indigo-600 block">
                  Luxury Student Residence
                </span>
              </div>
            </Link>

            {/* Top Side Navigation: Home, About, Contact */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-slate-600">
              <Link href="/#home" className="hover:text-indigo-600 transition">
                Home
              </Link>
              <Link href="/#about" className="hover:text-indigo-600 transition">
                About
              </Link>
              <Link href="/#contact" className="hover:text-indigo-600 transition">
                Contact
              </Link>
            </nav>

            {/* Desktop Action Buttons: Book a Bed, Direct Download Dropdown, Login */}
            <div className="hidden lg:flex items-center gap-3">
              {/* 1. Book a Bed */}
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
                Book a Bed
              </button>

              {/* 2. Direct Download Button & Dropdown (No page opening) */}
              <div className="relative" ref={dropdownRef}>
                <div className="inline-flex items-center rounded-xl bg-slate-100 hover:bg-slate-200/80 transition p-0.5 border border-slate-200">
                  {/* Direct 1-click Download */}
                  <a
                    href="/api/download/aab?role=single&format=aab"
                    download="homestay-release.aab"
                    onClick={() => notifyDownload('Home Stay App (.AAB)')}
                    className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 flex items-center gap-1.5"
                    title="Direct Download Official Home Stay App"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>Download App (.AAB)</span>
                  </a>

                  {/* Dropdown toggle */}
                  <button
                    type="button"
                    onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition"
                    title="Select format to download"
                    aria-label="Select format download"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${downloadDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Direct Download Dropdown Menu */}
                {downloadDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Single Unified App
                      </span>
                      <span className="text-[11px] text-slate-500">
                        For Students, Wardens &amp; Owners
                      </span>
                    </div>

                    <div className="space-y-1">
                      {/* Unified AAB */}
                      <a
                        href="/api/download/aab?role=single&format=aab"
                        download="homestay-release.aab"
                        onClick={() => notifyDownload('Home Stay Official .AAB')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition"
                      >
                        <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="flex-1 text-left">
                          <div>Official App (.AAB)</div>
                          <div className="text-[10px] font-normal text-slate-400">Google Play Store Bundle</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold">.AAB</span>
                      </a>

                      {/* Direct Phone APK */}
                      <a
                        href="/api/download/aab?role=single&format=apk"
                        download="homestay-v1.0.0.apk"
                        onClick={() => notifyDownload('Direct APK')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition"
                      >
                        <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1 text-left">
                          <div>Direct Phone APK</div>
                          <div className="text-[10px] font-normal text-slate-400">Instant Android sideload</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold">APK</span>
                      </a>

                      {/* All Bundles ZIP */}
                      <a
                        href="/api/download/aab?role=all"
                        download="homestay-all-aab-bundles.zip"
                        onClick={() => notifyDownload('Complete App ZIP')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition"
                      >
                        <Download className="w-4 h-4 text-slate-600 shrink-0" />
                        <div className="flex-1 text-left">
                          <div>Complete Bundles (.ZIP)</div>
                          <div className="text-[10px] font-normal text-slate-400">All packages &amp; publishing guide</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">ZIP</span>
                      </a>

                      {/* Link to /download page */}
                      <div className="pt-1.5 border-t border-slate-100 mt-1">
                        <Link
                          href="/download"
                          onClick={() => setDownloadDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <span>View Installation Hub &rarr;</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Login */}
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                Login
              </Link>
            </div>

            {/* Mobile Actions: Book Bed + Menu Drawer */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-indigo-200" />
                Book Bed
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2">
            <Link
              href="/#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              Home
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              About
            </Link>
            <Link
              href="/#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              Contact
            </Link>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {/* Direct Download .AAB without opening page */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Direct .AAB Downloads
              </div>

              <a
                href="/api/download/aab?role=all"
                download="homestay-all-aab-bundles.zip"
                onClick={() => {
                  notifyDownload('All .AAB Bundles');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download All .AAB Bundles (.ZIP)</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/api/download/aab?role=student"
                  download="homestay-student-release.aab"
                  onClick={() => {
                    notifyDownload('Student .AAB');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Student .AAB</span>
                </a>

                <a
                  href="/api/download/aab?role=owner"
                  download="homestay-owner-release.aab"
                  onClick={() => {
                    notifyDownload('Owner .AAB');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Building className="w-3.5 h-3.5 text-slate-800" />
                  <span>Owner .AAB</span>
                </a>
              </div>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 text-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center gap-2 mt-1"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                Resident &amp; Staff Login
              </Link>
            </div>
          </div>
        )}

        {/* Download Toast Notification */}
        {downloadToast && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white animate-bounce" />
            </div>
            <div className="text-xs font-medium pr-2">
              <div className="font-bold text-white">Direct Download Started</div>
              <div className="text-slate-300 text-[11px]">{downloadToast}</div>
            </div>
          </div>
        )}
      </header>

      {/* Book a Bed Modal */}
      <BookBedModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}
