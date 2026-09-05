'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import { Shield, ArrowLeft, Lock, FileCheck } from 'lucide-react';
import { useHostelSettings } from '@/lib/context/SettingsContext';

export default function PrivacyPolicyPage() {
  const { hostelName } = useHostelSettings();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />
      <main className="flex-1 py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-display">Privacy Policy & Resident Data Safety</h1>
              <p className="text-xs text-slate-400">Last updated: September 2026 • {hostelName} Institutional Policy</p>
            </div>
          </div>

          <h3 className="font-bold text-slate-900 text-base">1. Single-Owner Data Governance</h3>
          <p>
            {hostelName} enforces strict Role-Based Access Control (RBAC). All student personal data, identification proofs, guardian contacts, and payment histories are maintained confidentially under the sole administrative jurisdiction of the Hostel Owner.
          </p>

          <h3 className="font-bold text-slate-900 text-base">2. Image & Document Optimization & Storage</h3>
          <p>
            Uploaded resident photographs and government ID proofs are client-side optimized and compressed to ensure secure, minimal-bandwidth storage. Images are stored securely and never accessible via public, unauthenticated URLs.
          </p>

          <h3 className="font-bold text-slate-900 text-base">3. Private Student Account Isolation</h3>
          <p>
            Students can strictly access only their own individual stay records, invoices, dues, and private communications through their verified mobile phone credentials. Cross-student data exposure is strictly prohibited by server-side authorization guards.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
