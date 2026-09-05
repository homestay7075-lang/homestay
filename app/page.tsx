'use client';

// Verified hydration match with deterministic server & client settings
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import BookBedModal from '@/components/public/BookBedModal';
import {
  Bed,
  Wifi,
  Utensils,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Download,
  ArrowRight,
  Star,
  Users,
  Zap,
  Coffee,
  BookOpen,
} from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';

export default function HomePage() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('AC Double Sharing');
  const { settings, hostelName } = useHostelSettings();

  const openBookModal = (roomType?: string) => {
    if (roomType) {
      setSelectedRoomType(roomType);
    }
    setIsBookModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section id="home" className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-20 lg:py-28">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md mx-auto" suppressHydrationWarning>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Official Resident & Guest Portal • {hostelName}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-tight max-w-4xl mx-auto" suppressHydrationWarning>
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-300" suppressHydrationWarning>
                {hostelName}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed" suppressHydrationWarning>
              {settings.tagline || 'Modern, Safe & Premium Living for Students & Professionals'}. Designed for focused students and young professionals seeking pristine hygiene, high-speed fiber internet, biometric security, and transparent joining-date billing.
            </p>

            {/* Key Highlights row */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-2xl sm:text-3xl font-black text-white font-display">100%</div>
                <div className="text-xs text-slate-400 mt-1">Power & Water Backup</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-2xl sm:text-3xl font-black text-white font-display">1 Gbps</div>
                <div className="text-xs text-slate-400 mt-1">Dedicated Fiber Wi-Fi</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-2xl sm:text-3xl font-black text-white font-display">24/7</div>
                <div className="text-xs text-slate-400 mt-1">Biometric Guarding</div>
              </div>
            </div>
          </div>
        </section>


        {/* ================= ABOUT US (STORY & VALUES) ================= */}
        <section id="about" className="py-20 lg:py-28 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Mission & Story */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  About Our Residence
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display tracking-tight leading-tight" suppressHydrationWarning>
                  A Home Away From Home Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Ambitious Minds</span>
                </h2>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed" suppressHydrationWarning>
                  Founded with a vision to redefine student and young professional accommodation, <strong className="text-slate-900 font-semibold">{hostelName}</strong> blends the warmth of home with the standards of a premium boutique hotel. We believe that your living space should empower your dreams, not distract from them.
                </p>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Every aspect of our facility—from high-speed fiber routers on each floor to ergonomically planned study desks and nutrition-focused meal plans—has been designed around the real everyday needs of focused students, exam aspirants, and working professionals.
                </p>

                {/* 4 Core Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Uncompromised Safety
                    </div>
                    <p className="text-xs text-slate-500">
                      24/7 CCTV surveillance, biometric entry turnstiles, and trained residential wardens always on campus.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm mb-1">
                      <Utensils className="w-4 h-4 text-amber-600" />
                      Hygienic 4-Meal Dining
                    </div>
                    <p className="text-xs text-slate-500">
                      Nutritious, home-cooked food prepared in stainless-steel commercial kitchens with purified water.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm mb-1">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Quiet Study Culture
                    </div>
                    <p className="text-xs text-slate-500">
                      Strict quiet hours from 11 PM to 6 AM, dedicated silent lounges, and lag-free fiber internet.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm mb-1">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Transparent Management
                    </div>
                    <p className="text-xs text-slate-500">
                      Fair monthly billing calculated from your joining date with digital receipts and zero hidden charges.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Stats Card & Warden Message */}
              <div className="lg:col-span-5 space-y-6">
                {/* Stats Showcase Box */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>

                  <h3 className="text-lg font-bold font-display text-white mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    Residence at a Glance
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-black font-display text-indigo-300">500+</div>
                      <div className="text-xs text-slate-400 font-medium">Residents Hosted</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-black font-display text-emerald-400">99.9%</div>
                      <div className="text-xs text-slate-400 font-medium">Power & Wi-Fi Uptime</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-black font-display text-purple-300">4.9/5</div>
                      <div className="text-xs text-slate-400 font-medium">Resident Rating</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-black font-display text-rose-300">24/7</div>
                      <div className="text-xs text-slate-400 font-medium">Support</div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" suppressHydrationWarning>
                    <span>
                      Located in {settings.city || 'Bengaluru'}, {settings.state || 'Karnataka'}. Conveniently connected to major educational institutes, IT parks, and transit hubs.
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${settings.name ? settings.name + ', ' : ''}${settings.address || ''}, ${settings.city || ''}, ${settings.state || ''} - ${settings.pincode || ''}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold transition shrink-0 hover:underline"
                      title="Open location in Google Maps"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View on Google Maps &rarr;</span>
                    </a>
                  </div>
                </div>

                {/* Management Note Card */}
                <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-slate-800 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Resident-First Philosophy</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      "We treat every resident like family. Prompt maintenance resolution, nutritious meals, and disciplined security are non-negotiable promises at our hostel."
                    </p>
                    <div className="text-[11px] font-semibold text-indigo-700 mt-2">
                      — Management & Residential Wardens
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />

      {/* Book a Bed Modal */}
      <BookBedModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        defaultRoomType={selectedRoomType}
      />
    </div>
  );
}
