import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, recordPaymentTransaction } from '@/lib/db/store';
import { NotificationItem, AuditLog } from '@/lib/db/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { submissionId, action, rejectionReason, actorId, actorName, actorRole } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { success: false, error: 'submissionId and action (APPROVE or REJECT) are required.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    if (!db.paymentSubmissions) {
      db.paymentSubmissions = [];
    }

    const submissionIndex = db.paymentSubmissions.findIndex((s) => s.id === submissionId);
    if (submissionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Payment submission not found.' },
        { status: 404 }
      );
    }

    const submission = db.paymentSubmissions[submissionIndex];
    const reviewerName = actorName || 'Hostel Owner';
    const reviewerId = actorId || 'usr-owner-1';
    const reviewerRole = actorRole || 'OWNER';

    if (action === 'APPROVE') {
      // 1. Record official payment transaction in db.payments to reduce dues immediately
      const recordResult = recordPaymentTransaction({
        studentDbId: submission.studentDbId,
        amount: Number(submission.amount),
        paymentDate: submission.paymentDate,
        paymentMethod: 'UPI',
        billingPeriod: 'Current Due Period',
        transactionRef: submission.transactionRef,
        receivedBy: reviewerName,
        notes: `Verified UPI payment via ${submission.upiApp} (UTR: ${submission.transactionRef}). ${submission.notes || ''}`.trim(),
        actorId: reviewerId,
        actorName: reviewerName,
        actorRole: reviewerRole,
      });

      if (!recordResult.success || !recordResult.payment) {
        return NextResponse.json(
          { success: false, error: recordResult.error || 'Failed to record official payment.' },
          { status: 500 }
        );
      }

      // 2. Mark submission as APPROVED with issued receipt number
      submission.status = 'APPROVED';
      submission.receiptNumber = recordResult.payment.receiptNumber;
      submission.reviewedBy = reviewerName;
      submission.reviewedAt = new Date().toISOString();

      // 3. Notify student that payment is verified and dues are cleared
      const studentNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'UPI Payment Verified & Cleared!',
        message: `Your payment of ₹${submission.amount.toLocaleString(
          'en-IN'
        )} (UTR: ${submission.transactionRef}) has been approved by ${reviewerName}. Official Receipt: ${
          recordResult.payment.receiptNumber
        }. Dues cleared!`,
        type: 'Payment Reminder',
        targetAudience: 'STUDENT',
        targetStudentId: submission.studentId,
        isEnabled: true,
        createdBy: reviewerName,
        createdAt: new Date().toISOString(),
      };

      // 4. Audit log
      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: reviewerId,
        userName: reviewerName,
        userRole: reviewerRole,
        action: 'UPI_RECEIPT_APPROVED',
        details: `Approved UPI payment of ₹${submission.amount.toLocaleString(
          'en-IN'
        )} from ${submission.studentName} (${submission.studentId}, Room ${
          submission.roomNumber
        }). Issued receipt: ${recordResult.payment.receiptNumber}. Dues cleared.`,
      };

      db.notifications.unshift(studentNotif);
      db.auditLogs.unshift(audit);
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        submission,
        payment: recordResult.payment,
        message: `Payment verified successfully! Official receipt ${recordResult.payment.receiptNumber} generated and student dues cleared.`,
      });
    } else if (action === 'REJECT') {
      submission.status = 'REJECTED';
      submission.rejectionReason = rejectionReason || 'Transaction could not be verified in bank statement';
      submission.reviewedBy = reviewerName;
      submission.reviewedAt = new Date().toISOString();

      const studentNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'UPI Payment Not Verified',
        message: `Your payment submission of ₹${submission.amount.toLocaleString(
          'en-IN'
        )} (UTR: ${submission.transactionRef}) could not be verified: ${submission.rejectionReason}. Please contact management.`,
        type: 'Payment Reminder',
        targetAudience: 'STUDENT',
        targetStudentId: submission.studentId,
        isEnabled: true,
        createdBy: reviewerName,
        createdAt: new Date().toISOString(),
      };

      const audit: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: reviewerId,
        userName: reviewerName,
        userRole: reviewerRole,
        action: 'UPI_RECEIPT_REJECTED',
        details: `Rejected UPI payment submission of ₹${submission.amount.toLocaleString(
          'en-IN'
        )} from ${submission.studentName} (${submission.studentId}). Reason: ${submission.rejectionReason}`,
      };

      db.notifications.unshift(studentNotif);
      db.auditLogs.unshift(audit);
      saveDatabase(db);

      return NextResponse.json({
        success: true,
        submission,
        message: 'Payment submission marked as rejected.',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be APPROVE or REJECT.' },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
