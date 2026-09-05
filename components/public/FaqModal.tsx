'use client';

import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp, Sparkles, Phone } from 'lucide-react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Billing & Pricing',
    question: 'How does joining-date billing work?',
    answer: 'Unlike traditional hostels that charge strictly from the 1st of the calendar month, our digital hostel system calculates your billing cycle starting from your actual Joining Date (e.g. if you join Sept 9th, your monthly due cycle runs 9th to 8th of each month). You never pay for unstayed days before your arrival.',
  },
  {
    category: 'Admissions & Check-in',
    question: 'What documents are required during student check-in?',
    answer: 'You will need a government-issued photo ID (Aadhaar Card, Passport, Driving License, or Voter ID), college/work ID proof, and parent/guardian contact numbers. Photo IDs and resident profile snapshots are compressed and stored securely in our encrypted records.',
  },
  {
    category: 'Deposits & Checkout',
    question: 'What is the security deposit and checkout policy?',
    answer: 'The security deposit is fully refundable upon completion of your stay and advance notice period. During checkout, room fixtures are inspected, dues reconciled with digital ledger receipts, and an official checkout summary statement is issued.',
  },
  {
    category: 'Dining & Food Mess',
    question: 'What are the food mess timings and meal plans included?',
    answer: 'All residents enjoy 4 daily hygienic meals: nutritious Breakfast with tea/coffee, balanced Lunch, Evening Snacks with chai, and hot Dinner. The hostel mess follows strict hygiene protocols with filtered RO drinking water on every floor.',
  },
  {
    category: 'Security & Facilities',
    question: 'What security measures and power backups are provided?',
    answer: 'We provide 3-tier security comprising biometric turnstile access, 24/7 CCTV surveillance across all corridors and common spaces, and a full-time security guard. Automated diesel generators ensure 100% uninterrupted electricity for Wi-Fi, fans, lights, and study workstations.',
  },
];

export default function FaqModal({ isOpen, onClose }: FaqModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredFaqs = FAQS.filter(
    f =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Frequently Asked Questions</h2>
              <p className="text-xs text-indigo-200">Quick answers regarding hostel admissions, billing & rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <input
            type="text"
            placeholder="Search questions (e.g., billing, documents, wifi, deposit)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* FAQ List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No matching questions found. Please contact the hostel desk directly.
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpenItem = openIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenIndex(isOpenItem ? null : index)}
                    className="w-full p-4 text-left font-semibold text-slate-900 text-sm flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <span className="flex-1 font-display">{faq.question}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium shrink-0">
                      {faq.category}
                    </span>
                    {isOpenItem ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isOpenItem && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Have a custom query? Contact our admissions warden anytime.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
