'use client';

import React from 'react';
import Link from 'next/link';
import { Bed, Phone, Mail, MapPin, Shield, Heart, ArrowRight, ExternalLink } from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';

export default function PublicFooter() {
  const { settings } = useHostelSettings();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white block" suppressHydrationWarning>
                  {settings.name}
                </span>
                <span className="text-[10px] text-indigo-400 uppercase tracking-wider block">
                  Verified Residence
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed" suppressHydrationWarning>
              {settings.description}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>24/7 CCTV & Biometric Security</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">
              Explore Hostel
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#about" className="hover:text-white transition">
                  About & Living Standards
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition">
                  Hostel Life & Management
                </Link>
              </li>
              <li>
                <Link href="/download" className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
                  <span>Resident Mobile App</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details (Dynamic from Owner Settings) */}
          <div id="contact">
            <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">
              Contact & Location
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 group">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-1 group-hover:text-indigo-300 transition" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${settings.name ? settings.name + ', ' : ''}${settings.address || ''}, ${settings.city || ''}, ${settings.state || ''} - ${settings.pincode || ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition group-hover:text-indigo-200"
                  title="Click to view address on Google Maps"
                  suppressHydrationWarning
                >
                  <span className="block leading-relaxed hover:underline underline-offset-2">
                    {settings.address}, {settings.city}, {settings.state} - {settings.pincode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-semibold mt-1 group-hover:text-indigo-300">
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white transition font-medium" suppressHydrationWarning>
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white transition font-medium" suppressHydrationWarning>
                  {settings.email}
                </a>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-slate-500">
              *Hostel contact information is directly maintained and verified by the Hostel Owner.
            </p>
          </div>

          {/* Management & Policies */}
          <div>
            <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">
              Hostel Policies & Portal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy & Data Protection
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Hostel Terms & Resident Rules
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Student Portal Login
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Owner / Staff Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p suppressHydrationWarning>© {new Date().getFullYear()} {settings.name}. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Powered by Premium Hostel Management System</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
