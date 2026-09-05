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
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-800 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition shrink-0">
                <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-100" />
              </div>
              <div className="hidden xs:block min-w-0">
                <span
                  className="font-display font-bold text-sm sm:text-lg text-slate-900 tracking-tight block leading-tight truncate max-w-[100px] sm:max-w-none"
                  suppressHydrationWarning
                >
                  {hostelName}
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium tracking-wider uppercase text-indigo-600 hidden sm:block">
                  Luxury Student Residence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links: Home, About, Contact */}
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

            {/* Desktop Top Action Buttons: Book a Bed, Download App, Login */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* 1. Book a Bed */}
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
                <span>Book a Bed</span>
              </button>

              {/* 2. Download App */}
              <a
                href="/downloads/homestay-app.apk"
                download="homestay-app.apk"
                onClick={() => notifyDownload('Home Stay App')}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs"
                title="Direct Download Official Home Stay App"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download App</span>
              </a>

              {/* 3. Login */}
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span>Login</span>
              </Link>
            </div>

            {/* Mobile Top Action Buttons: Book Bed, Download, Login (All visible at top!) + 3-line Menu */}
            <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
              {/* 1. Book Bed */}
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Book Bed</span>
              </button>

              {/* 2. Download App */}
              <a
                href="/downloads/homestay-app.apk"
                download="homestay-app.apk"
                onClick={() => notifyDownload('Home Stay App')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 shrink-0"
                title="Direct Download App"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download</span>
              </a>

              {/* 3. Login */}
              <Link
                href="/login"
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                title="Sign In"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                <span>Login</span>
              </Link>

              {/* 4. Three-line Menu Toggle (Navigation only: Home, About, Contact) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu: Navigation only (Home, About, Contact) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1 animate-in slide-in-from-top-2">
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
