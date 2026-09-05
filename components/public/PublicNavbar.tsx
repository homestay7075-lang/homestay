'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bed, Download, LogIn, Sparkles, Menu, X } from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import BookBedModal from './BookBedModal';

export default function PublicNavbar() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hostelName } = useHostelSettings();

  return (
    <>
      <header className="sticky top-[31px] z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
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
              <Link
                href="/#home"
                className="hover:text-indigo-600 transition"
              >
                Home
              </Link>
              <Link
                href="/#about"
                className="hover:text-indigo-600 transition"
              >
                About
              </Link>
              <Link
                href="/#contact"
                className="hover:text-indigo-600 transition"
              >
                Contact
              </Link>
            </nav>

            {/* Desktop Action Buttons: Book a Bed, Download App, Login */}
            <div className="hidden lg:flex items-center gap-3">
              {/* 1. Book a Bed */}
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/25 hover:shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
                Book a Bed
              </button>

              {/* 2. Download App */}
              <Link
                href="/download"
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Download App
              </Link>

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

        {/* Mobile Dropdown Menu (Home, About, Contact, Download App, Login) */}
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

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Download App
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 text-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                Resident & Staff Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Book a Bed Modal */}
      <BookBedModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}

