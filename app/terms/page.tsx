'use client';

import React from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import { FileCheck, ArrowLeft, Bed, Calendar } from 'lucide-react';

export default function TermsPage() {
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-display">Terms of Admission & Hostel Rules</h1>
              <p className="text-xs text-slate-400">Rules, joining-date cycles, and checkout guidelines</p>
            </div>
          </div>

          <h3 className="font-bold text-slate-900 text-base">1. Joining Date Anchored Billing (Rule 12)</h3>
          <p>
            Monthly rent billing is strictly anchored to the resident's actual joining date. Subsequent recurring dues fall due on the corresponding date of each calendar month. Payments must be remitted within 5 days of cycle issuance.
          </p>

          <h3 className="font-bold text-slate-900 text-base">2. Non-Transferable Bed Allocations</h3>
          <p>
            Allocated beds and rooms cannot be swapped or transferred without written endorsement from the Chief Warden or Hostel Owner. Unregistered occupants are strictly barred from overnight residence.
          </p>

          <h3 className="font-bold text-slate-900 text-base">3. Checkout Protocol & Deposit Settlement (Rule 38)</h3>
          <p>
            A 30-day notice is required prior to vacating. Upon checkout, room fixtures are inspected, bed is released, and full history and settlement receipts are permanently archived.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
