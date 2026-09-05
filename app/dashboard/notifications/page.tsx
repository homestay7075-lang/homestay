'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  Bell,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  Building,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import { NotificationItem } from '@/lib/db/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<any>('Payment Reminder');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'BLOCK' | 'STUDENT'>('ALL');
  const [targetBlockId, setTargetBlockId] = useState('blk-a');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications?forOwner=true');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleToggle = async (id: string, currentVal: boolean) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isEnabled: !currentVal }),
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this notification?')) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'DELETE' }),
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          targetAudience,
          targetBlockId: targetAudience === 'BLOCK' ? targetBlockId : undefined,
          actorName: 'Hostel Owner',
          actorRole: 'OWNER',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setTitle('');
        setMessage('');
        fetchNotifs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Owner-Controlled Dispatch (Rule 17)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Broadcasts & Notice Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Notifications appear to residents only when created and explicitly enabled by the Hostel Owner.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Official Notice
          </button>
        </div>

        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border shadow-xs transition space-y-3 ${
                n.isEnabled
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-indigo-600">{n.type}</span>
                      <span>•</span>
                      <span>Audience: {n.targetAudience}</span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(n.id, n.isEnabled)}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {n.isEnabled ? (
                      <>
                        <span className="text-emerald-600 text-[11px]">Enabled</span>
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 text-[11px]">Disabled</span>
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {n.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Notification Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-900 font-display">Create Official Notice</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="Payment Reminder">Payment Reminder</option>
                  <option value="Due Reminder">Due Reminder</option>
                  <option value="Hostel Announcement">Hostel Announcement</option>
                  <option value="Maintenance Notice">Maintenance Notice</option>
                  <option value="Booking Confirmation">Booking Confirmation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e: any) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="ALL">All Residents & Wings</option>
                  <option value="BLOCK">Specific Block (e.g. Block A or Block B)</option>
                  <option value="STUDENT">Single Student</option>
                </select>
              </div>

              {targetAudience === 'BLOCK' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Block
                  </label>
                  <select
                    value={targetBlockId}
                    onChange={(e) => setTargetBlockId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="blk-a">Block A (Men Wing)</option>
                    <option value="blk-b">Block B (Women Wing)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Headline / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi Router Upgrades on 2nd Floor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Body Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write clear instructions or notice information..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dispatch Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
