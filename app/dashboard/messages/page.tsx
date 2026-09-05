'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  MessageSquare,
  Send,
  User,
  Shield,
  Search,
  CheckCheck,
  Sparkles,
  Lock,
  Trash2,
  Phone,
} from 'lucide-react';
import { MessageThreadItem, Student } from '@/lib/db/types';

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageThreadItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentDbId, setSelectedStudentDbId] = useState<string>('');
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessagesAndStudents = async () => {
    try {
      const [msgRes, stuRes] = await Promise.all([
        fetch('/api/messages'),
        fetch('/api/students?status=Active'),
      ]);
      const msgData = await msgRes.json();
      const stuData = await stuRes.json();
      setMessages(msgData.messages || []);
      const activeStudents = stuData.students || [];
      setStudents(activeStudents);
      if (!selectedStudentDbId && activeStudents.length > 0) {
        setSelectedStudentDbId(activeStudents[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagesAndStudents();
  }, []);

  const currentStudent = students.find((s) => s.id === selectedStudentDbId);
  const activeThread = messages.filter((m) => m.studentDbId === selectedStudentDbId);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this sent message?')) return;
    setDeletingMessageId(messageId);
    try {
      const res = await fetch(`/api/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else {
        alert(data.error || 'Failed to delete message.');
      }
    } catch (e) {
      console.error('Error deleting message', e);
      alert('Error deleting message.');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentStudent) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentDbId: currentStudent.id,
          studentId: currentStudent.studentId,
          studentName: currentStudent.fullName,
          senderRole: 'OWNER',
          senderName: 'Hostel Owner',
          senderUserId: 'usr-owner-1',
          content: replyContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyContent('');
        fetchMessagesAndStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            Authenticated Private Threads (Rule 18)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Resident Communications Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Secure, end-to-end authenticated messaging between management and individual residents.
          </p>
        </div>

        {/* 2-Column Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden h-[640px]">
          {/* Left Resident Threads Roster */}
          <div className="lg:col-span-4 border-r border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 font-display flex items-center justify-between">
              <span>Resident Conversations</span>
              <span className="text-xs text-indigo-600 font-semibold">{students.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {students.map((stu) => {
                const isSelected = selectedStudentDbId === stu.id;
                const studentMsgs = messages.filter((m) => m.studentDbId === stu.id);
                const lastMsg = studentMsgs[studentMsgs.length - 1];

                return (
                  <button
                    key={stu.id}
                    onClick={() => setSelectedStudentDbId(stu.id)}
                    className={`w-full p-4 text-left transition flex items-center gap-3 ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={stu.photoUrl}
                      alt={stu.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-sm text-slate-900 truncate">{stu.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{stu.studentId}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {lastMsg ? lastMsg.content : `Room ${stu.roomNumber} (${stu.bedNumber})`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Chat History & Input */}
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-50/40">
            {currentStudent ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentStudent.photoUrl}
                      alt={currentStudent.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{currentStudent.fullName}</div>
                      <div className="text-xs text-indigo-600 font-semibold">
                        {currentStudent.studentId} • Room {currentStudent.roomNumber} ({currentStudent.bedNumber})
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${currentStudent.phone}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center gap-1.5 shadow-2xs group"
                    title={`Direct Call: ${currentStudent.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span>Call {currentStudent.phone}</span>
                  </a>
                </div>

                {/* Message Bubble Feed */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {activeThread.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 text-xs">
                      No message history with {currentStudent.fullName} yet. Send a direct notice or payment confirmation below.
                    </div>
                  ) : (
                    activeThread.map((msg) => {
                      const isOwner = msg.senderRole === 'OWNER' || msg.senderRole === 'WARDEN';
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-center gap-2 group ${isOwner ? 'justify-end' : 'justify-start'}`}
                        >
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              disabled={deletingMessageId === msg.id}
                              title="Delete sent message"
                              className="opacity-0 group-hover:opacity-100 transition p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl shrink-0"
                            >
                              <Trash2 className={`w-3.5 h-3.5 ${deletingMessageId === msg.id ? 'animate-spin text-red-500' : ''}`} />
                            </button>
                          )}
                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                              isOwner
                                ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-80">
                              <span className="font-bold">{msg.senderName}</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={`Reply to ${currentStudent.fullName} as Hostel Owner...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select a resident to open conversation thread.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
