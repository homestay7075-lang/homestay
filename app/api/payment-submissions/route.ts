import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/db/store';
import { PaymentSubmission, NotificationItem, AuditLog } from '@/lib/db/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentDbId = searchParams.get('studentDbId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const db = getDatabase();
    let list = db.paymentSubmissions || [];

    if (studentDbId) {
      list = list.filter((s) => s.studentDbId === studentDbId);
    } else if (studentId) {
      list = list.filter((s) => s.studentId === studentId);
    }

    if (status) {
      list = list.filter((s) => s.status === status);
    }

    // Sort newest first
    list = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ success: true, submissions: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentDbId,
      studentId,
      studentName,
      studentPhone,
      roomNumber,
      bedNumber,
      amount,
      paymentDate,
      upiApp,
      transactionRef,
      receiptImageUrl,
      notes,
    } = body;

    if (!studentDbId || !amount || !transactionRef) {
      return NextResponse.json(
        { success: false, error: 'Student, amount, and UTR/reference number are required.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    if (!db.paymentSubmissions) {
      db.paymentSubmissions = [];
    }

    // Check if this transactionRef has already been submitted
    const cleanRef = String(transactionRef).trim();
    const existing = db.paymentSubmissions.find(
      (s) => s.transactionRef.toLowerCase() === cleanRef.toLowerCase() && s.status !== 'REJECTED'
    );
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `This UTR/Reference number (${cleanRef}) has already been submitted and is currently ${existing.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    const newSubmission: PaymentSubmission = {
      id: `sub-${Date.now()}`,
      studentDbId,
      studentId: studentId || '',
      studentName: studentName || 'Resident',
      studentPhone: studentPhone || '',
      roomNumber: roomNumber || '',
      bedNumber: bedNumber || '',
      amount: Number(amount),
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      upiApp: upiApp || 'PhonePe',
      transactionRef: cleanRef,
      receiptImageUrl: receiptImageUrl || undefined,
      notes: notes || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Owner notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New UPI Payment Submitted',
      message: `${newSubmission.studentName} (Room ${newSubmission.roomNumber}) submitted ₹${newSubmission.amount.toLocaleString(
        'en-IN'
      )} via ${newSubmission.upiApp} (UTR: ${cleanRef}). Please review & approve.`,
      type: 'Due Reminder',
      targetAudience: 'ALL',
      isEnabled: true,
      createdBy: newSubmission.studentName,
      createdAt: new Date().toISOString(),
    };

    // Audit log
    const audit: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: studentDbId,
      userName: newSubmission.studentName,
      userRole: 'STUDENT',
      action: 'UPI_RECEIPT_SUBMITTED',
      details: `Student ${newSubmission.studentName} submitted ₹${newSubmission.amount.toLocaleString(
        'en-IN'
      )} payment receipt via ${newSubmission.upiApp} (UTR: ${cleanRef}). Awaiting owner approval.`,
    };

    db.paymentSubmissions.unshift(newSubmission);
    db.notifications.unshift(newNotif);
    db.auditLogs.unshift(audit);

    saveDatabase(db);

    return NextResponse.json({
      success: true,
      submission: newSubmission,
      message: 'Receipt submitted successfully. Awaiting owner verification.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
