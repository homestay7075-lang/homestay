'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MultiStepStudentRegistrationModal from '@/components/students/MultiStepStudentRegistrationModal';
import {
  CalendarCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Bed,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { formatDateDMY } from '@/lib/utils/dateFormatter';

export default function BookingsManagementPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingForApproval, setBookingForApproval] = useState<any | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId: string, status: string) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBookings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to reject this booking inquiry? It will be removed permanently.')) {
      return;
    }
    try {
      // Instantly remove from view
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));

      const res = await fetch(`/api/bookings?bookingId=${bookingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        fetchBookings();
      }
    } catch (e) {
      console.error('Failed to reject and delete booking:', e);
      fetchBookings();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Direct Website Inquiries (Rule 5)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Inbound Bed Booking Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Prospects who submitted bed reservation requests via the public website's Book a Bed feature.
          </p>
        </div>

        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              No pending booking inquiries currently.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{b.fullName}</span>
                      <span className="font-mono text-xs text-slate-400">#{b.id}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <a
                        href={`tel:${b.phone}`}
                        className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline font-semibold"
                        title={`Call applicant ${b.fullName} (${b.phone})`}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{b.phone}</span>
                      </a>
                      {b.email && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-cyan-600" />
                          {b.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      b.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className={`grid grid-cols-1 ${b.preferredRoomType ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 text-xs`}>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Expected Joining Date</span>
                    <span className="font-bold text-indigo-700">{formatDateDMY(b.joiningDate)}</span>
                  </div>

                  {b.preferredRoomType && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Preferred Room Type</span>
                      <span className="font-semibold text-slate-800">{b.preferredRoomType}</span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Home / Permanent Address</span>
                    <span className="font-medium text-slate-700 truncate block">{b.address}</span>
                  </div>
                </div>

                {b.notes && (
                  <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                    <span className="font-bold text-slate-700">Applicant Notes: </span>
                    {b.notes}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-400">
                    Received: {new Date(b.createdAt).toLocaleString()}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${b.phone}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                      title={`Direct phone call to ${b.fullName} (${b.phone})`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    {b.status === 'Allocated' ? (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bed Allocated</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (b.status === 'Pending') {
                            handleStatusChange(b.id, 'Approved');
                          }
                          setBookingForApproval(b);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        title="Approve Bed & Register Resident"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Approve Bed</span>
                      </button>
                    )}

                    {b.status !== 'Allocated' && (
                      <button
                        type="button"
                        onClick={() => handleRejectBooking(b.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                        title="Reject and permanently remove booking inquiry"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approve Bed -> Step 1 Registration Modal */}
      {bookingForApproval && (
        <MultiStepStudentRegistrationModal
          isOpen={!!bookingForApproval}
          onClose={() => setBookingForApproval(null)}
          onSuccess={() => {
            setBookingForApproval(null);
            fetchBookings();
          }}
          prefillData={{
            fullName: bookingForApproval.fullName,
            phone: bookingForApproval.phone,
            address: bookingForApproval.address,
            joiningDate: bookingForApproval.joiningDate,
            email: bookingForApproval.email || '',
            bookingId: bookingForApproval.id,
          }}
        />
      )}
    </DashboardLayout>
  );
}
